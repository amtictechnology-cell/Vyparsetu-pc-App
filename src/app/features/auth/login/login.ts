import { Component, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class Login {
  private authService = inject(AuthService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  credentials = {
    email: '',
    password: ''
  };

  loading = false;
  errorMessage = '';

  onSubmit(form: NgForm): void {
    if (form.invalid) {
      this.errorMessage = 'Please enter both email and password.';
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    this.authService.login(this.credentials).subscribe({
      next: (res) => {
        this.loading = false;
        if (res.success === true || res.status === true || res.token || (res.data && res.data.token)) {
          this.router.navigate(['/home']);
        } else {
          this.errorMessage = res.message || 'Login failed.';
          this.cdr.detectChanges();
        }
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = err.error?.message || 'Server error during login. Please try again.';
        console.error('Login error:', err);
        this.cdr.detectChanges();
      }
    });
  }
}
