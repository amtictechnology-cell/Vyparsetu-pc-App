import { Component, OnInit, inject, ViewChildren, QueryList, ElementRef, AfterViewInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-verify-otp',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './verify-otp.component.html',
  styleUrl: './verify-otp.component.css'
})
export class VerifyOtpComponent implements OnInit, AfterViewInit {
  mobileNo: string = '';
  otp: string[] = ['', '', '', ''];
  loading: boolean = false;
  errorMessage: string = '';
  resendCountdown: number = 30;
  resendInterval: any;
  isSupplierRestricted: boolean = false;

  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private authService = inject(AuthService);

  @ViewChildren('otpInput') inputs!: QueryList<ElementRef>;

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.mobileNo = params['mobile'] || '';
      if (!this.mobileNo) {
        this.router.navigate(['/login']);
      }
    });
    this.startCountdown();
  }

  ngAfterViewInit(): void {
    // Focus first input box
    setTimeout(() => {
      this.focusInput(0);
    }, 300);
  }

  startCountdown(): void {
    this.resendCountdown = 30;
    if (this.resendInterval) {
      clearInterval(this.resendInterval);
    }
    this.resendInterval = setInterval(() => {
      if (this.resendCountdown > 0) {
        this.resendCountdown--;
      } else {
        clearInterval(this.resendInterval);
      }
    }, 1000);
  }

  onInput(event: any, index: number): void {
    const val = event.target.value;
    const cleaned = val.replace(/[^0-9]/g, '');
    this.otp[index] = cleaned.slice(-1);

    if (cleaned && index < 3) {
      this.focusInput(index + 1);
    }
  }

  onKeyDown(event: KeyboardEvent, index: number): void {
    if (event.key === 'Backspace' && !this.otp[index] && index > 0) {
      this.focusInput(index - 1);
    }
  }

  focusInput(index: number): void {
    const inputElements = this.inputs.toArray();
    if (inputElements[index]) {
      inputElements[index].nativeElement.focus();
      inputElements[index].nativeElement.select();
    }
  }

  resendOtp(): void {
    if (this.resendCountdown > 0) return;

    this.errorMessage = '';
    this.authService.sendOtp(this.mobileNo).subscribe({
      next: (res) => {
        if (res && res.success) {
          this.startCountdown();
          this.otp = ['', '', '', ''];
          this.focusInput(0);
        } else {
          this.errorMessage = res?.message || 'Failed to resend OTP. Please try again.';
        }
      },
      error: (err) => {
        console.error('Resend OTP error:', err);
        this.errorMessage = err?.error?.message || 'Verification failed.';
      }
    });
  }

  closeRestriction(): void {
    this.router.navigate(['/login']);
  }

  onSubmit(): void {
    const otpCode = this.otp.join('');
    if (otpCode.length !== 4) {
      this.errorMessage = 'Please enter a 4-digit OTP.';
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    this.authService.verifyOtp(this.mobileNo, otpCode).subscribe({
      next: (res) => {
        if (res && res.success) {
          // Token is set inside AuthService.tap
          // Now fetch profile to find redirect path
          this.authService.getProfile().subscribe({
            next: (profileRes) => {
              this.loading = false;
              const user = profileRes?.user;
              if (user) {
                const category = (user.businessCategory || '').toLowerCase();
                if (category === 'shop') {
                  this.router.navigate(['/shop']);
                } else if (category === 'supplier' || category === 'suppliers') {
                  this.isSupplierRestricted = true;
                  this.authService.logout();
                } else if (category) {
                  this.router.navigate(['/home']);
                } else {
                  this.router.navigate(['/information'], { queryParams: { userId: user.userId } });
                }
              } else {
                const vUser = res.user;
                if (vUser && vUser.businessCategory) {
                  const cat = vUser.businessCategory.toLowerCase();
                  if (cat === 'shop') this.router.navigate(['/shop']);
                  else if (cat === 'supplier' || cat === 'suppliers') {
                    this.isSupplierRestricted = true;
                    this.authService.logout();
                  }
                  else this.router.navigate(['/home']);
                } else {
                  this.router.navigate(['/information'], { queryParams: { userId: vUser?.userId } });
                }
              }
            },
            error: (err) => {
              this.loading = false;
              console.error('Profile fetch after OTP verify failed:', err);
              const vUser = res.user;
              if (vUser && vUser.businessCategory) {
                const cat = vUser.businessCategory.toLowerCase();
                if (cat === 'shop') this.router.navigate(['/shop']);
                else if (cat === 'supplier' || cat === 'suppliers') {
                  this.isSupplierRestricted = true;
                  this.authService.logout();
                }
                else this.router.navigate(['/home']);
              } else {
                this.router.navigate(['/information'], { queryParams: { userId: vUser?.userId } });
              }
            }
          });
        } else {
          this.loading = false;
          this.errorMessage = res?.message || 'Invalid OTP. Please enter the correct code.';
        }
      },
      error: (err) => {
        this.loading = false;
        console.error('Verify OTP error:', err);
        this.errorMessage = err?.error?.message || 'Incorrect OTP code. Please try again. (Mock OTP is 8888)';
      }
    });
  }
}
