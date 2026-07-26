import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PlanModalComponent } from './plan-modal.component';

@Component({
  selector: 'app-home-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, PlanModalComponent],
  templateUrl: './home-dashboard.component.html',
  styleUrl: './dashboard.shared.css'
})
export class HomeDashboardComponent implements OnInit {
  user: any = null;
  loading: boolean = true;
  todayDate: Date = new Date();
  
  showLogoutModal: boolean = false;

  private authService = inject(AuthService);
  private router = inject(Router);
  public cdr = inject(ChangeDetectorRef);

  ngOnInit(): void {
    this.authService.getProfile().subscribe({
      next: (res) => {
        this.user = res?.user;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Failed to load profile in home dashboard component:', err);
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

  openLogoutModal(): void {
    this.showLogoutModal = true;
    this.cdr.detectChanges();
  }

  closeLogoutModal(): void {
    this.showLogoutModal = false;
    this.cdr.detectChanges();
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
