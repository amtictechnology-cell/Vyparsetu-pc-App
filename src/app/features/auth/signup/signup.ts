import { Component, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './signup.html',
  styleUrl: './signup.css'
})
export class Signup {
  private authService = inject(AuthService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  userData = {
    userName: '',
    email: '',
    password: '',
    confirmPassword: '',
    mobileNo: '',
    businessName: ''
  };

  loading = false;
  errorMessage = '';
  successMessage = '';

  onSubmit(form: NgForm): void {
    if (form.invalid) {
      this.errorMessage = 'Please fill out all required fields correctly.';
      return;
    }

    if (this.userData.password !== this.userData.confirmPassword) {
      this.errorMessage = 'Passwords do not match.';
      return;
    }

    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.authService.signup(this.userData).subscribe({
      next: (res) => {
        this.loading = false;
        if (res.success === true || res.status === true) {
          this.successMessage = 'Account created successfully!';
          this.cdr.detectChanges();
          setTimeout(() => {
            this.router.navigate(['/home'], { queryParams: { isNewUser: 'true' } });
          }, 1500);
        } else {
          this.errorMessage = res.message || 'Failed to create account.';
          this.cdr.detectChanges();
        }
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = err.error?.message || 'Server error during signup. Please try again.';
        console.error('Signup error:', err);
        this.cdr.detectChanges();
      }
    });
  }
}
