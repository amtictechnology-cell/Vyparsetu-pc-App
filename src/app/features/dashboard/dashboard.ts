import { Component, inject, OnInit, PLATFORM_ID, ChangeDetectorRef, computed } from '@angular/core';
import { RouterOutlet, RouterModule, Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { SubscriptionService } from '../../core/services/subscription.service';
import { ActivePlan } from '../../core/models/subscription.model';
import { CommonModule, isPlatformBrowser } from '@angular/common';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterOutlet, RouterModule, CommonModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class Dashboard implements OnInit {
  private authService = inject(AuthService);
  private subService = inject(SubscriptionService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private platformId = inject(PLATFORM_ID);
  private cdr = inject(ChangeDetectorRef);

  businessName: string = '';
  greeting: string = 'Welcome';

  // Subscription computed signals
  readonly subscription = computed(() => this.subService.subscription());
  readonly availablePlans = computed(() => this.subService.availablePlans());
  readonly showWelcomeModal = computed(() => this.subService.showWelcomeTrialModal());
  readonly showExpiredPaywall = computed(() => this.subService.showExpiredPaywallModal());
  readonly showPlansModal = computed(() => this.subService.showPlansModal());
  readonly isProcessingPayment = computed(() => this.subService.isProcessingPayment());
  readonly paymentStatusMessage = computed(() => this.subService.paymentStatusMessage());
  readonly paymentErrorMessage = computed(() => this.subService.paymentErrorMessage());

  showLogoutModal = false;

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.setGreeting();
      const savedUser = this.authService.getUser();
      if (savedUser) {
        this.businessName = savedUser.businessName || savedUser.userName || '';
      }
      this.fetchProfileInfo();
      this.loadSubscriptionData(savedUser);
    }
  }

  setGreeting() {
    const hour = new Date().getHours();
    if (hour < 12) {
      this.greeting = 'Good Morning';
    } else if (hour < 17) {
      this.greeting = 'Good Afternoon';
    } else {
      this.greeting = 'Good Evening';
    }
  }

  fetchProfileInfo() {
    this.authService.getProfile().subscribe({
      next: (res) => {
        if (res.success && res.user) {
          const name = res.user.businessName || res.user.userName || '';
          if (this.businessName !== name) {
            this.businessName = name;
            this.cdr.detectChanges();
          }
        }
      },
      error: () => {
        console.error('Failed to load profile for dashboard header');
      }
    });
  }

  loadSubscriptionData(savedUser: any) {
    const userId = savedUser?.userId || savedUser?._id;

    // Check if user came right after signup
    this.route.queryParams.subscribe((params) => {
      if (params['isNewUser'] === 'true') {
        this.subService.showWelcomeTrialModal.set(true);
      } else {
        this.subService.checkWelcomeTrial(userId);
      }
    });

    // Fetch subscription status & plans
    this.subService.fetchMySubscription().subscribe();
    this.subService.fetchActivePlans().subscribe();
  }

  dismissWelcomeModal() {
    const savedUser = this.authService.getUser();
    const userId = savedUser?.userId || savedUser?._id;
    this.subService.dismissWelcomeModal(userId);
  }

  openPlansModal() {
    this.subService.openPlansModal();
  }

  closePlansModal() {
    this.subService.closePlansModal();
  }

  choosePlan(plan: ActivePlan) {
    const user = this.authService.getUser();
    this.subService.purchasePlan(plan, user);
  }

  openLogoutModal() {
    this.showLogoutModal = true;
  }

  closeLogoutModal() {
    this.showLogoutModal = false;
  }

  confirmLogout() {
    this.showLogoutModal = false;
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
