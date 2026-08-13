import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-builder-insights',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="welcome-banner" style="background: linear-gradient(135deg, #0059ff, #003db3); color: white; box-shadow: 0 8px 24px rgba(0, 89, 255, 0.15); border-radius: 12px; padding: 2rem; margin-bottom: 2rem;">
      <h1 style="margin: 0; font-size: 1.8rem; margin-bottom: 0.5rem;">Welcome back, {{ user?.name }}!</h1>
      <p style="margin: 0; opacity: 0.9;">Managing: <strong>{{ user?.businessName }}</strong></p>
    </div>

    <!-- Stats -->
    <div class="stats-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 1.5rem; margin-bottom: 2rem;">
      <div class="stat-card" style="background: white; border-radius: 12px; padding: 1.5rem; border: 1px solid #e9ecef; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 2px 8px rgba(0,0,0,0.02);">
        <div class="stat-info">
          <h3 style="margin: 0; color: #868e96; font-size: 0.9rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Active Projects</h3>
          <p class="value" style="margin: 0.5rem 0 0 0; font-size: 1.8rem; font-weight: 800; color: #343a40;">3</p>
        </div>
        <div class="stat-icon" style="font-size: 2.5rem; opacity: 0.2;">🏗️</div>
      </div>

      <div class="stat-card" style="background: white; border-radius: 12px; padding: 1.5rem; border: 1px solid #e9ecef; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 2px 8px rgba(0,0,0,0.02);">
        <div class="stat-info">
          <h3 style="margin: 0; color: #868e96; font-size: 0.9rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Total Clients</h3>
          <p class="value" style="margin: 0.5rem 0 0 0; font-size: 1.8rem; font-weight: 800; color: #343a40;">12</p>
        </div>
        <div class="stat-icon" style="font-size: 2.5rem; opacity: 0.2;">👥</div>
      </div>

      <div class="stat-card" style="background: white; border-radius: 12px; padding: 1.5rem; border: 1px solid #e9ecef; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 2px 8px rgba(0,0,0,0.02);">
        <div class="stat-info">
          <h3 style="margin: 0; color: #868e96; font-size: 0.9rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Pending Payments</h3>
          <p class="value" style="margin: 0.5rem 0 0 0; font-size: 1.8rem; font-weight: 800; color: #e03131;">₹25,000</p>
        </div>
        <div class="stat-icon" style="font-size: 2.5rem; opacity: 0.2;">⚠️</div>
      </div>

      <div class="stat-card" style="background: white; border-radius: 12px; padding: 1.5rem; border: 1px solid #e9ecef; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 2px 8px rgba(0,0,0,0.02);">
        <div class="stat-info">
          <h3 style="margin: 0; color: #868e96; font-size: 0.9rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Labor Attendance</h3>
          <p class="value" style="margin: 0.5rem 0 0 0; font-size: 1.8rem; font-weight: 800; color: #343a40;">42/45</p>
        </div>
        <div class="stat-icon" style="font-size: 2.5rem; opacity: 0.2;">👷</div>
      </div>
    </div>
  `
})
export class BuilderInsightsComponent implements OnInit {
  user: any = null;
  private authService = inject(AuthService);
  private cdr = inject(ChangeDetectorRef);

  ngOnInit(): void {
    this.authService.getProfile().subscribe({
      next: (res) => {
        this.user = res?.user;
        this.cdr.detectChanges();
      }
    });
  }
}
