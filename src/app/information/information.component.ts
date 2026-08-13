import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-information',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './information.component.html',
  styleUrl: './information.component.css'
})
export class InformationComponent implements OnInit {
  userId: string = '';
  name: string = '';
  businessName: string = '';
  category: string = ''; // Hotel, Shop, Supplier
  loading: boolean = false;
  errorMessage: string = '';

  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private authService = inject(AuthService);

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.userId = params['userId'] || '';
      if (!this.userId) {
        this.fetchProfileToGetUserId();
      }
    });
  }

  fetchProfileToGetUserId(): void {
    if (this.authService.isAuthenticated()) {
      this.authService.getProfile().subscribe({
        next: (res) => {
          this.userId = res?.user?.userId || '';
          if (!this.userId) {
            this.router.navigate(['/login']);
          }
        },
        error: (err) => {
          console.error('Failed to pre-fetch profile in information component:', err);
          this.router.navigate(['/login']);
        }
      });
    } else {
      this.router.navigate(['/login']);
    }
  }

  selectCategory(cat: string): void {
    this.category = cat;
  }

  isFormValid(): boolean {
    return !!(this.name.trim() && this.businessName.trim() && this.category);
  }

  onSubmit(): void {
    if (!this.isFormValid()) {
      this.errorMessage = 'All fields are required.';
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    const apiCategory = this.category.toLowerCase();

    this.authService.completeProfile(this.userId, this.name, this.businessName, apiCategory).subscribe({
      next: (res) => {
        this.loading = false;
        if (res && res.user) {
          const finalCategory = (res.user.businessCategory || apiCategory).toLowerCase();
          if (finalCategory === 'shop') {
            this.router.navigate(['/shop']);
          } else if (finalCategory === 'builder') {
            this.router.navigate(['/builder']);
          } else if (finalCategory === 'supplier' || finalCategory === 'suppliers') {
            this.router.navigate(['/supplier']);
          } else {
            this.router.navigate(['/home']);
          }
        } else {
          this.errorMessage = 'Profile updated, but failed to route to your dashboard.';
        }
      },
      error: (err) => {
        this.loading = false;
        console.error('Profile complete error:', err);
        this.errorMessage = err?.error?.message || 'Failed to complete profile. Please try again.';
      }
    });
  }
}
