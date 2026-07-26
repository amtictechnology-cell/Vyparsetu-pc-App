import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  mobileNo: string = '';
  loading: boolean = false;
  errorMessage: string = '';

  private authService = inject(AuthService);
  private router = inject(Router);

  onMobileChange(event: any): void {
    const val = event.target.value;
    // Only allow digits and limit to 10 characters
    const cleaned = val.replace(/[^0-9]/g, '');
    this.mobileNo = cleaned.slice(0, 10);
  }

  onSubmit(): void {
    if (this.mobileNo.length !== 10) {
      this.errorMessage = 'Please enter a valid 10-digit mobile number.';
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    this.authService.sendOtp(this.mobileNo).subscribe({
      next: (res) => {
        this.loading = false;
        if (res && res.success) {
          this.router.navigate(['/verify-otp'], { queryParams: { mobile: this.mobileNo } });
        } else {
          this.errorMessage = res?.message || 'Failed to send OTP. Please try again.';
        }
      },
      error: (err) => {
        this.loading = false;
        console.error('Send OTP api error:', err);
        this.errorMessage = err?.error?.message || 'Network error. Please make sure the backend server is running.';
      }
    });
  }
}
