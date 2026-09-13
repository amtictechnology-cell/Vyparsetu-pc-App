import { Component, inject, OnInit, OnDestroy, ChangeDetectorRef, ViewChildren, QueryList, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-verify-otp',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './verify-otp.html',
  styleUrl: './verify-otp.css'
})
export class VerifyOtp implements OnInit, OnDestroy, AfterViewInit {
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private cdr = inject(ChangeDetectorRef);

  @ViewChildren('otpInput') otpInputs!: QueryList<ElementRef<HTMLInputElement>>;

  email = '';
  otpDigits: string[] = ['', '', '', '', '', ''];
  singleOtp = '';
  singleInputMode = false;

  loading = false;
  errorMessage = '';
  successMessage = '';

  // 10-minute expiry countdown timer
  expirySeconds = 600; // 10 minutes
  expiryInterval: any = null;

  // 60-second resend cooldown timer
  resendCooldown = 60;
  resendInterval: any = null;
  resending = false;

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.email = params['email'] || '';
      if (!this.email) {
        const state = history.state;
        if (state && state.email) {
          this.email = state.email;
        }
      }
    });

    this.startExpiryTimer();
    this.startResendTimer();
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.focusBox(0);
    }, 300);
  }

  ngOnDestroy(): void {
    this.clearTimers();
  }

  clearTimers(): void {
    if (this.expiryInterval) {
      clearInterval(this.expiryInterval);
      this.expiryInterval = null;
    }
    if (this.resendInterval) {
      clearInterval(this.resendInterval);
      this.resendInterval = null;
    }
  }

  startExpiryTimer(): void {
    if (this.expiryInterval) clearInterval(this.expiryInterval);
    this.expiryInterval = setInterval(() => {
      if (this.expirySeconds > 0) {
        this.expirySeconds--;
        this.cdr.detectChanges();
      } else {
        clearInterval(this.expiryInterval);
        this.errorMessage = 'The verification code has expired. Please request a new one.';
        this.cdr.detectChanges();
      }
    }, 1000);
  }

  startResendTimer(): void {
    this.resendCooldown = 60;
    if (this.resendInterval) clearInterval(this.resendInterval);
    this.resendInterval = setInterval(() => {
      if (this.resendCooldown > 0) {
        this.resendCooldown--;
        this.cdr.detectChanges();
      } else {
        clearInterval(this.resendInterval);
        this.cdr.detectChanges();
      }
    }, 1000);
  }

  get formattedExpiry(): string {
    const mins = Math.floor(this.expirySeconds / 60);
    const secs = this.expirySeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  get fullOtp(): string {
    return this.otpDigits.join('');
  }

  get isOtpComplete(): boolean {
    const code = this.fullOtp;
    return code.length === 6 && /^\d{6}$/.test(code);
  }

  focusBox(index: number): void {
    if (this.otpInputs) {
      const inputs = this.otpInputs.toArray();
      if (inputs[index]) {
        inputs[index].nativeElement.focus();
        inputs[index].nativeElement.select();
      }
    }
  }

  onFocus(event: FocusEvent): void {
    const target = event.target as HTMLInputElement;
    if (target) {
      target.select();
    }
  }

  onInput(event: Event, index: number): void {
    const input = event.target as HTMLInputElement;
    const rawVal = input.value;
    const digits = rawVal.replace(/\D/g, '');

    if (!digits) {
      this.otpDigits[index] = '';
      input.value = '';
      this.syncSingleOtp();
      return;
    }

    if (digits.length >= 6) {
      // Full OTP pasted or autofilled into single box
      for (let i = 0; i < 6; i++) {
        this.otpDigits[i] = digits[i] || '';
      }
      this.updateDomInputs();
      this.focusBox(5);
    } else if (digits.length > 1) {
      // User typed over an existing digit -> take the last entered character
      const lastChar = digits.slice(-1);
      this.otpDigits[index] = lastChar;
      input.value = lastChar;
      if (index < 5) {
        this.focusBox(index + 1);
      }
    } else {
      // Single digit entered
      this.otpDigits[index] = digits;
      input.value = digits;
      if (index < 5) {
        this.focusBox(index + 1);
      }
    }

    this.syncSingleOtp();
    this.cdr.detectChanges();
  }

  onKeyDown(event: KeyboardEvent, index: number): void {
    const input = event.target as HTMLInputElement;

    if (event.key === 'Backspace') {
      if (this.otpDigits[index]) {
        this.otpDigits[index] = '';
        input.value = '';
        this.syncSingleOtp();
        event.preventDefault();
      } else if (index > 0) {
        this.otpDigits[index - 1] = '';
        this.syncSingleOtp();
        this.focusBox(index - 1);
        event.preventDefault();
      }
    } else if (event.key === 'ArrowLeft' && index > 0) {
      this.focusBox(index - 1);
      event.preventDefault();
    } else if (event.key === 'ArrowRight' && index < 5) {
      this.focusBox(index + 1);
      event.preventDefault();
    }
  }

  onPaste(event: ClipboardEvent): void {
    event.preventDefault();
    const pastedData = event.clipboardData?.getData('text') || '';
    const digitsOnly = pastedData.replace(/\D/g, '').slice(0, 6);

    if (digitsOnly.length > 0) {
      for (let i = 0; i < 6; i++) {
        this.otpDigits[i] = digitsOnly[i] || '';
      }
      this.updateDomInputs();
      const focusIndex = Math.min(digitsOnly.length, 5);
      this.focusBox(focusIndex);
      this.syncSingleOtp();
      this.cdr.detectChanges();
    }
  }

  updateDomInputs(): void {
    if (this.otpInputs) {
      const inputs = this.otpInputs.toArray();
      inputs.forEach((ref, idx) => {
        if (ref && ref.nativeElement) {
          ref.nativeElement.value = this.otpDigits[idx] || '';
        }
      });
    }
  }

  syncSingleOtp(): void {
    this.singleOtp = this.otpDigits.join('');
  }

  onSingleOtpChange(val: string): void {
    const digits = (val || '').replace(/\D/g, '').slice(0, 6);
    this.singleOtp = digits;
    for (let i = 0; i < 6; i++) {
      this.otpDigits[i] = digits[i] || '';
    }
    this.updateDomInputs();
  }

  toggleInputMode(): void {
    this.singleInputMode = !this.singleInputMode;
    if (this.singleInputMode) {
      this.syncSingleOtp();
    } else {
      setTimeout(() => {
        this.updateDomInputs();
        this.focusBox(Math.min(this.fullOtp.length, 5));
      }, 50);
    }
  }

  onResendOtp(): void {
    if (this.resendCooldown > 0 || this.resending) return;

    if (!this.email) {
      this.errorMessage = 'Email address missing. Please go back and enter your email.';
      return;
    }

    this.resending = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.authService.resendOtp(this.email).subscribe({
      next: (res) => {
        this.resending = false;
        this.successMessage = res.message || 'A new 6-digit code has been sent to your email.';
        this.otpDigits = ['', '', '', '', '', ''];
        this.singleOtp = '';
        this.updateDomInputs();
        this.expirySeconds = 600; // Reset 10 minutes
        this.startExpiryTimer();
        this.startResendTimer(); // Reset 60s cooldown
        this.focusBox(0);
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.resending = false;
        this.errorMessage = err.error?.message || 'Failed to resend verification code. Please try again.';
        this.cdr.detectChanges();
      }
    });
  }

  onVerify(): void {
    if (!this.isOtpComplete) {
      this.errorMessage = 'Please enter all 6 digits of the verification code.';
      return;
    }

    if (!this.email) {
      this.errorMessage = 'Email address missing. Please restart the forgot password process.';
      return;
    }

    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';

    const code = this.fullOtp;

    this.authService.verifyOtp(this.email, code).subscribe({
      next: (res) => {
        this.loading = false;
        this.successMessage = res.message || 'Verification successful!';
        this.cdr.detectChanges();

        setTimeout(() => {
          this.router.navigate(['/reset-password'], {
            queryParams: { email: this.email, otp: code }
          });
        }, 800);
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = err.error?.message || 'Invalid or expired verification code. Please try again.';
        this.cdr.detectChanges();
      }
    });
  }
}
