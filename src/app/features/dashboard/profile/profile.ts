import { Component, OnInit, inject, ChangeDetectorRef, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './profile.html',
  styleUrl: './profile.css'
})
export class Profile implements OnInit {
  private authService = inject(AuthService);
  private cdr = inject(ChangeDetectorRef);
  private platformId = inject(PLATFORM_ID);
  
  profileData: any = null;
  loading = true;
  error = '';

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.fetchProfile();
    }
  }

  fetchProfile(): void {
    this.authService.getProfile().subscribe({
      next: (res) => {
        this.loading = false;
        if (res.success && res.user) {
          this.profileData = res.user;
        } else {
          this.error = res.message || 'Failed to load profile data';
        }
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.loading = false;
        this.error = 'Failed to load profile data. Please try again.';
        this.cdr.detectChanges();
        console.error(err);
      }
    });
  }
}
