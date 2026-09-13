import { Component, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './forgot-password.html',
  styleUrl: './forgot-password.css'
})
export class ForgotPassword {
  private authService = inject(AuthService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  email = '';
  loading = false;
  errorMessage = '';
  successMessage = '';

  onSubmit(form: NgForm): void {
    if (form.invalid) {
      this.errorMessage = 'Please enter a valid email address.';
      return;
    }

    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';

    const targetEmail = this.email.trim();

    this.authService.forgotPassword(targetEmail).subscribe({
      next: (res) => {
        this.loading = false;
        this.successMessage = res.message || 'If an account exists, a 6-digit OTP has been sent to your email.';
        this.cdr.detectChanges();

        // Redirect to verify-otp passing the email
        setTimeout(() => {
          this.router.navigate(['/verify-otp'], {
            queryParams: { email: targetEmail }
          });
        }, 1200);
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = err.error?.message || 'Failed to send OTP. Please check your network and try again.';
        this.cdr.detectChanges();
      }
    });
  }
}
