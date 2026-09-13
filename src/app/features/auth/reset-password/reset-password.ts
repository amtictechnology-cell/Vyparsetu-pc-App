import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './reset-password.html',
  styleUrl: './reset-password.css'
})
export class ResetPassword implements OnInit {
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private cdr = inject(ChangeDetectorRef);

  email = '';
  otp = '';

  newPassword = '';
  confirmPassword = '';

  showPassword = false;
  showConfirmPassword = false;

  loading = false;
  errorMessage = '';
  isSuccess = false;

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.email = params['email'] || '';
      this.otp = params['otp'] || '';

      if (!this.email || !this.otp) {
        const state = history.state;
        if (state) {
          if (state.email) this.email = state.email;
          if (state.otp) this.otp = state.otp;
        }
      }
    });
  }

  // Live password validation checks
  get hasMinLength(): boolean {
    return this.newPassword.length >= 8;
  }

  get hasLetter(): boolean {
    return /[A-Za-z]/.test(this.newPassword);
  }

  get hasNumber(): boolean {
    return /\d/.test(this.newPassword);
  }

  get passwordsMatch(): boolean {
    return this.newPassword.length > 0 && this.newPassword === this.confirmPassword;
  }

  get isFormValid(): boolean {
    return this.hasMinLength && this.hasLetter && this.hasNumber && this.passwordsMatch && !!this.email && !!this.otp;
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPasswordVisibility(): void {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  onSubmit(form: NgForm): void {
    if (!this.isFormValid) {
      if (!this.email || !this.otp) {
        this.errorMessage = 'Verification session expired. Please restart the password reset process.';
      } else if (!this.hasMinLength || !this.hasLetter || !this.hasNumber) {
        this.errorMessage = 'Please meet all password security requirements.';
      } else if (!this.passwordsMatch) {
        this.errorMessage = 'Passwords do not match.';
      }
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    const payload = {
      email: this.email,
      otp: this.otp,
      newPassword: this.newPassword,
      confirmPassword: this.confirmPassword
    };

    this.authService.resetPassword(payload).subscribe({
      next: (res) => {
        this.loading = false;
        this.isSuccess = true;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = err.error?.message || 'Failed to reset password. Please try again.';
        this.cdr.detectChanges();
      }
    });
  }

  goToLogin(): void {
    this.router.navigate(['/login']);
  }
}
