import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { CommonModule } from '@angular/common';
import { PlanModalComponent } from './plan-modal.component';

@Component({
  selector: 'app-shop-dashboard',
  standalone: true,
  imports: [CommonModule, PlanModalComponent],
  templateUrl: './shop-dashboard.component.html',
  styleUrl: './dashboard.shared.css'
})
export class ShopDashboardComponent implements OnInit {
  user: any = null;
  loading: boolean = true;

  private authService = inject(AuthService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  ngOnInit(): void {
    this.authService.getProfile().subscribe({
      next: (res) => {
        this.user = res?.user;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Failed to load profile in shop dashboard component:', err);
        this.authService.logout();
        this.router.navigate(['/login']);
        this.cdr.detectChanges();
      }
    });
  }

  onSubscribed(): void {
    this.loading = true;
    this.authService.getProfile().subscribe({
      next: (res) => {
        this.user = res?.user;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Failed to refresh profile after subscription:', err);
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
