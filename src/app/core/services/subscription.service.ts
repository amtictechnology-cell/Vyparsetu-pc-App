import { Injectable, inject, signal, PLATFORM_ID } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { isPlatformBrowser } from '@angular/common';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  ActivePlan,
  ActivePlansResponse,
  CreateOrderResponse,
  SubscriptionMeResponse,
  UserSubscription,
  VerifyPaymentDto
} from '../models/subscription.model';

@Injectable({
  providedIn: 'root'
})
export class SubscriptionService {
  private http = inject(HttpClient);
  private platformId = inject(PLATFORM_ID);
  private apiUrl = environment.apiUrl;

  // Global State Signals
  readonly subscription = signal<UserSubscription | null>(null);
  readonly availablePlans = signal<ActivePlan[]>([]);
  readonly isLoading = signal(false);

  // Modal Visibility Signals
  readonly showWelcomeTrialModal = signal(false);
  readonly showExpiredPaywallModal = signal(false);
  readonly showPlansModal = signal(false);

  // Payment State Signals
  readonly isProcessingPayment = signal(false);
  readonly paymentStatusMessage = signal<string | null>(null);
  readonly paymentErrorMessage = signal<string | null>(null);

  /**
   * Fetch user's current subscription from backend
   */
  fetchMySubscription(): Observable<SubscriptionMeResponse> {
    this.isLoading.set(true);
    return this.http.get<SubscriptionMeResponse>(`${this.apiUrl}/api/subscriptions/me`).pipe(
      tap({
        next: (res) => {
          this.isLoading.set(false);
          if (res && res.data) {
            const data = res.data;
            const isExpired = data.isExpired || data.status === 'EXPIRED' || (data.daysRemaining !== undefined && data.daysRemaining <= 0);
            const isExpiringSoon = data.isExpiringSoon || (data.daysRemaining !== undefined && data.daysRemaining > 0 && data.daysRemaining <= 2);

            const userSub: UserSubscription = {
              planName: data.currentPlan?.name || data.subscription?.planNameSnapshot || (data.status === 'TRIAL' ? '7-Day Free Trial' : 'Subscription'),
              status: data.status,
              daysRemaining: data.daysRemaining ?? 0,
              startDate: data.startDate,
              endDate: data.endDate,
              price: data.currentPlan?.price ?? data.subscription?.priceSnapshot ?? 0,
              currency: data.currentPlan?.currency || 'INR',
              isExpired,
              isExpiringSoon,
              planId: data.currentPlan?.planId || data.subscription?.planId,
              durationMonths: data.currentPlan?.durationMonths || 1,
              isTrial: data.status === 'TRIAL'
            };

            this.subscription.set(userSub);

            // Trigger non-dismissible paywall if subscription has expired
            if (isExpired) {
              this.showExpiredPaywallModal.set(true);
            } else {
              this.showExpiredPaywallModal.set(false);
            }
          }
        },
        error: (err) => {
          this.isLoading.set(false);
          console.error('Failed to load subscription info:', err);
        }
      })
    );
  }

  /**
   * Fetch active subscription plans available for purchase
   */
  fetchActivePlans(): Observable<ActivePlansResponse> {
    return this.http.get<ActivePlansResponse>(`${this.apiUrl}/api/subscriptions/plans`).pipe(
      tap((res) => {
        if (res && res.data) {
          this.availablePlans.set(res.data);
        }
      })
    );
  }

  /**
   * Check if Free Trial welcome popup should be shown for this user
   */
  checkWelcomeTrial(userId?: string): void {
    if (!isPlatformBrowser(this.platformId)) return;

    const key = `vypar_trial_welcomed_${userId || 'current'}`;
    const welcomed = localStorage.getItem(key);
    if (!welcomed) {
      this.showWelcomeTrialModal.set(true);
    }
  }

  /**
   * Dismiss the Welcome Free Trial Popup
   */
  dismissWelcomeModal(userId?: string): void {
    if (isPlatformBrowser(this.platformId)) {
      const key = `vypar_trial_welcomed_${userId || 'current'}`;
      localStorage.setItem(key, 'true');
    }
    this.showWelcomeTrialModal.set(false);
  }

  /**
   * Open the general Plans / Upgrade modal
   */
  openPlansModal(): void {
    this.showPlansModal.set(true);
    this.paymentErrorMessage.set(null);
  }

  /**
   * Close the general Plans modal
   */
  closePlansModal(): void {
    this.showPlansModal.set(false);
    this.paymentErrorMessage.set(null);
  }

  /**
   * Initiate purchase or free activation for selected plan
   */
  purchasePlan(plan: ActivePlan, user?: any): void {
    this.isProcessingPayment.set(true);
    this.paymentErrorMessage.set(null);
    this.paymentStatusMessage.set(null);

    this.http.post<CreateOrderResponse>(`${this.apiUrl}/api/subscriptions/create-order`, { planId: plan._id }).subscribe({
      next: (res) => {
        // If plan is free (0 INR), backend activates directly
        if (res.data?.isFree || plan.price === 0) {
          this.isProcessingPayment.set(false);
          this.paymentStatusMessage.set('Free trial activated successfully!');
          this.showExpiredPaywallModal.set(false);
          this.showPlansModal.set(false);
          this.fetchMySubscription().subscribe();
          return;
        }

        // Paid plan with Razorpay Checkout
        if (res.data?.order && isPlatformBrowser(this.platformId)) {
          const order = res.data.order;
          const keyId = res.data.key || 'rzp_test_T8cNqdaWBsi779';

          if (typeof (window as any).Razorpay === 'undefined') {
            this.isProcessingPayment.set(false);
            this.paymentErrorMessage.set('Razorpay SDK failed to load. Please check your internet connection.');
            return;
          }

          const options: any = {
            key: keyId,
            amount: order.amount,
            currency: order.currency || 'INR',
            name: 'VyparSetu',
            description: `Subscription: ${plan.name}`,
            order_id: order.id,
            prefill: {
              name: user?.userName || user?.businessName || '',
              email: user?.email || '',
              contact: user?.mobileNo || ''
            },
            theme: {
              color: '#ff6a00'
            },
            handler: (response: any) => {
              this.verifyPayment({
                razorpay_order_id: response.razorpay_order_id || order.id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature
              });
            },
            modal: {
              ondismiss: () => {
                this.isProcessingPayment.set(false);
              }
            }
          };

          try {
            const rzp = new (window as any).Razorpay(options);
            rzp.on('payment.failed', (response: any) => {
              this.isProcessingPayment.set(false);
              this.paymentErrorMessage.set(response.error?.description || 'Payment was unsuccessful.');
            });
            rzp.open();
          } catch (e: any) {
            this.isProcessingPayment.set(false);
            this.paymentErrorMessage.set('Failed to open payment window: ' + e.message);
          }
        } else {
          this.isProcessingPayment.set(false);
          this.paymentErrorMessage.set('Could not initialize payment order.');
        }
      },
      error: (err) => {
        this.isProcessingPayment.set(false);
        this.paymentErrorMessage.set(err.error?.message || 'Server error creating payment order.');
      }
    });
  }

  /**
   * Verify Razorpay cryptographic signature and unlock subscription
   */
  private verifyPayment(dto: VerifyPaymentDto): void {
    this.paymentStatusMessage.set('Verifying payment signature with server...');
    this.http.post<any>(`${this.apiUrl}/api/subscriptions/verify-payment`, dto).subscribe({
      next: () => {
        this.isProcessingPayment.set(false);
        this.paymentStatusMessage.set('Payment verified! Your subscription is now Active.');
        this.showExpiredPaywallModal.set(false);
        this.showPlansModal.set(false);
        this.fetchMySubscription().subscribe();
      },
      error: (err) => {
        this.isProcessingPayment.set(false);
        this.paymentErrorMessage.set(err.error?.message || 'Payment verification failed.');
      }
    });
  }
}
