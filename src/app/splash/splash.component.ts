import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-splash',
  standalone: true,
  templateUrl: './splash.component.html',
  styleUrl: './splash.component.css'
})
export class SplashComponent implements OnInit {
  private authService = inject(AuthService);
  private router = inject(Router);

  ngOnInit(): void {
    if (typeof window !== 'undefined') {
      // Small timeout for visual appeal
      setTimeout(() => {
        this.checkLogin();
      }, 1200);
    }
  }

  private checkLogin(): void {
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/login']);
      return;
    }

    this.authService.getProfile().subscribe({
      next: (res) => {
        const user = res?.user;
        if (user) {
          const category = (user.businessCategory || '').toLowerCase();
          if (category === 'shop') {
            this.router.navigate(['/shop']);
          } else if (category === 'supplier' || category === 'suppliers') {
            this.router.navigate(['/supplier']);
          } else if (category) {
            this.router.navigate(['/home']);
          } else {
            this.router.navigate(['/information'], { queryParams: { userId: user.userId } });
          }
        } else {
          this.authService.logout();
          this.router.navigate(['/login']);
        }
      },
      error: (err) => {
        console.error('Auto-login profile check failed:', err);
        // Clear corrupt token and send to login
        this.authService.logout();
        this.router.navigate(['/login']);
      }
    });
  }
}
