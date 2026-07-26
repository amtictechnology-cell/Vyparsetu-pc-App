import { Component, Input, Output, EventEmitter, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-plan-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="plan-modal-overlay" *ngIf="showModal">
      <div class="plan-modal-card">
        <div class="plan-modal-header">
          <h2>Select Your Subscription Plan</h2>
          <p>Please choose a plan to activate your account and start using VyaparSetu.</p>
        </div>
        
        <div class="plans-container">
          <div *ngIf="loadingPlans" class="spinner-container">
            <div class="plan-spinner"></div>
            <p>Loading available plans for {{ _user?.businessCategory || 'your category' }}...</p>
          </div>
          
          <div *ngIf="!loadingPlans && plans.length === 0" class="no-plans">
            <p>No plans available for this category yet.</p>
          </div>
          
          <div *ngIf="!loadingPlans && plans.length > 0" class="plans-grid">
            <div 
              *ngFor="let plan of plans" 
              class="plan-card" 
              [class.selected]="selectedPlanId === plan.planId"
              (click)="selectPlan(plan)"
            >
              <div class="plan-badge" *ngIf="plan.price > 0">Popular</div>
              <h3 class="plan-name">{{ plan.name }}</h3>
              <div class="plan-price-box">
                <span class="currency">₹</span>
                <span class="price">{{ plan.price }}</span>
                <span class="duration">/ {{ plan.durationInDays }} days</span>
              </div>
              <p class="plan-desc">{{ plan.description }}</p>
              <ul class="plan-features">
                <li *ngFor="let feat of plan.features">
                  <span class="check-icon">✓</span> {{ feat }}
                </li>
                <li *ngIf="!plan.features || plan.features.length === 0">
                  <span class="check-icon">✓</span> Full Access to {{ _user?.businessCategory | titlecase }} Features
                </li>
              </ul>
            </div>
          </div>
        </div>
        
        <div class="plan-modal-footer">
          <button 
            type="button" 
            class="cancel-btn" 
            (click)="cancelAndLogout()"
          >
            Cancel & Logout
          </button>
          <button 
            type="button" 
            class="subscribe-btn" 
            [disabled]="!selectedPlanId || subscribing"
            (click)="subscribe()"
          >
            <span *ngIf="!subscribing">Activate Selected Plan</span>
            <span *ngIf="subscribing" class="sub-spinner"></span>
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .plan-modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(15, 23, 42, 0.85);
      backdrop-filter: blur(8px);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 9999;
      padding: 1.5rem;
      box-sizing: border-box;
    }
    .plan-modal-card {
      background: #ffffff;
      border-radius: 24px;
      width: 100%;
      max-width: 900px;
      padding: 2.5rem;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
      display: flex;
      flex-direction: column;
      max-height: 90vh;
      box-sizing: border-box;
      animation: slideUp 0.4s ease-out;
    }
    @keyframes slideUp {
      from { transform: translateY(30px); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }
    .plan-modal-header {
      text-align: center;
      margin-bottom: 2rem;
    }
    .plan-modal-header h2 {
      font-family: 'Outfit', 'Inter', sans-serif;
      color: #0f172a;
      font-size: 2rem;
      font-weight: 800;
      margin: 0 0 0.5rem 0;
    }
    .plan-modal-header p {
      color: #64748b;
      font-size: 1rem;
      margin: 0;
    }
    .plans-container {
      flex: 1;
      overflow-y: auto;
      margin-bottom: 2rem;
      padding: 0.5rem;
    }
    .spinner-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 200px;
    }
    .plan-spinner {
      width: 40px;
      height: 40px;
      border: 4px solid #f1f5f9;
      border-top-color: #0c831f;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin-bottom: 1rem;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    .no-plans {
      text-align: center;
      color: #64748b;
      font-size: 1.1rem;
      padding: 3rem 0;
    }
    .plans-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 1.5rem;
    }
    .plan-card {
      background: #f8fafc;
      border: 2px solid #e2e8f0;
      border-radius: 18px;
      padding: 2rem;
      position: relative;
      cursor: pointer;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      display: flex;
      flex-direction: column;
    }
    .plan-card:hover {
      transform: translateY(-5px);
      border-color: #cbd5e1;
      box-shadow: 0 10px 20px -5px rgba(0, 0, 0, 0.05);
    }
    .plan-card.selected {
      border-color: #0c831f;
      background: #f0fdf4;
      box-shadow: 0 10px 25px -5px rgba(12, 131, 31, 0.15);
    }
    .plan-badge {
      position: absolute;
      top: 1rem;
      right: 1rem;
      background: #0c831f;
      color: white;
      font-size: 0.75rem;
      font-weight: 700;
      padding: 4px 10px;
      border-radius: 99px;
      text-transform: uppercase;
    }
    .plan-name {
      font-size: 1.25rem;
      font-weight: 700;
      color: #0f172a;
      margin: 0 0 1rem 0;
    }
    .plan-price-box {
      display: flex;
      align-items: baseline;
      margin-bottom: 1rem;
      color: #0f172a;
    }
    .plan-price-box .currency {
      font-size: 1.25rem;
      font-weight: 700;
    }
    .plan-price-box .price {
      font-size: 2.25rem;
      font-weight: 800;
      line-height: 1;
    }
    .plan-price-box .duration {
      color: #64748b;
      font-size: 0.9rem;
      margin-left: 4px;
    }
    .plan-desc {
      font-size: 0.9rem;
      color: #64748b;
      margin: 0 0 1.5rem 0;
      line-height: 1.4;
    }
    .plan-features {
      list-style: none;
      padding: 0;
      margin: 0;
      font-size: 0.9rem;
      color: #334155;
    }
    .plan-features li {
      margin-bottom: 0.5rem;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .check-icon {
      color: #0c831f;
      font-weight: bold;
    }
    .plan-modal-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-top: 1.5px solid #f1f5f9;
      padding-top: 1.5rem;
    }
    .cancel-btn {
      background: transparent;
      color: #64748b;
      border: 1.5px solid #cbd5e1;
      padding: 0.75rem 1.5rem;
      border-radius: 10px;
      font-size: 0.95rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
    }
    .cancel-btn:hover {
      background: #f8fafc;
      color: #0f172a;
      border-color: #94a3b8;
    }
    .subscribe-btn {
      background: #0c831f;
      color: white;
      border: none;
      padding: 0.75rem 2rem;
      border-radius: 10px;
      font-size: 0.95rem;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.2s;
      box-shadow: 0 4px 10px rgba(12, 131, 31, 0.2);
    }
    .subscribe-btn:hover:not(:disabled) {
      background: #096817;
      transform: translateY(-1px);
    }
    .subscribe-btn:disabled {
      background: #cbd5e1;
      color: #94a3b8;
      cursor: not-allowed;
      box-shadow: none;
    }
    .sub-spinner {
      width: 20px;
      height: 20px;
      border: 2px solid rgba(255,255,255,0.3);
      border-top-color: white;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      display: inline-block;
    }
  `]
})
export class PlanModalComponent {
  _user: any = null;
  plans: any[] = [];
  loadingPlans: boolean = false;
  selectedPlanId: string = '';
  subscribing: boolean = false;
  showModal: boolean = false;

  private authService = inject(AuthService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  @Input() set user(val: any) {
    this._user = val;
    if (val && !this.hasActivePlan(val)) {
      this.showModal = true;
      this.loadPlans();
    } else {
      this.showModal = false;
    }
  }

  @Output() subscribed = new EventEmitter<void>();

  hasActivePlan(user: any): boolean {
    if (!user || !user.activeSubscription) {
      return false;
    }
    const sub = user.activeSubscription;
    if (sub.status !== 'active') {
      return false;
    }
    if (sub.expiresAt && new Date(sub.expiresAt) < new Date()) {
      return false;
    }
    return true;
  }

  loadPlans(): void {
    this.loadingPlans = true;
    this.authService.getMyPlans().subscribe({
      next: (res) => {
        this.plans = res?.data || [];
        this.loadingPlans = false;
        if (this.plans.length > 0) {
          this.selectedPlanId = this.plans[0].planId;
        }
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Failed to load plans:', err);
        this.loadingPlans = false;
        this.cdr.detectChanges();
      }
    });
  }

  selectPlan(plan: any): void {
    this.selectedPlanId = plan.planId;
    this.cdr.detectChanges();
  }

  cancelAndLogout(): void {
    this.authService.logout();
    this.showModal = false;
    this.router.navigate(['/login']);
  }

  subscribe(): void {
    if (!this.selectedPlanId) return;
    this.subscribing = true;
    this.cdr.detectChanges();

    this.authService.subscribeToPlan(this.selectedPlanId).subscribe({
      next: () => {
        this.subscribing = false;
        this.showModal = false;
        this.subscribed.emit();
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Subscription error:', err);
        alert(err?.error?.message || 'Failed to activate plan. Please try again.');
        this.subscribing = false;
        this.cdr.detectChanges();
      }
    });
  }
}
