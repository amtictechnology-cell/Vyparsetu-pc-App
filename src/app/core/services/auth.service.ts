import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  signup(userData: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/api/v1/auth/signup`, userData).pipe(
      tap(res => {
        const token = res.token || (res.data && res.data.token);
        if (token) {
          this.setToken(token);
        }
        const user = res.user || (res.data && res.data.user);
        if (user) {
          this.setUser(user);
        }
      })
    );
  }

  login(credentials: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/api/v1/auth/login`, credentials).pipe(
      tap(res => {
        const token = res.token || (res.data && res.data.token);
        if (token) {
          this.setToken(token);
        }
        const user = res.user || (res.data && res.data.user);
        if (user) {
          this.setUser(user);
        }
      })
    );
  }

  logout(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('userToken');
      localStorage.removeItem('userData');
    }
  }

  getProfile(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/api/v1/user/profile`).pipe(
      tap(res => {
        const user = res.user || (res.data && res.data.user);
        if (user) {
          this.setUser(user);
        }
      })
    );
  }

  setUser(user: any): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem('userData', JSON.stringify(user));
    }
  }

  getUser(): any {
    if (typeof window !== 'undefined') {
      const data = localStorage.getItem('userData');
      if (data) {
        try {
          return JSON.parse(data);
        } catch {
          return null;
        }
      }
    }
    return null;
  }

  setToken(token: string): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem('userToken', token);
    }
  }

  getToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('userToken');
    }
    return null;
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  forgotPassword(email: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/api/v1/auth/forgot-password`, { email });
  }

  verifyOtp(email: string, otp: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/api/v1/auth/verify-otp`, { email, otp });
  }

  resendOtp(email: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/api/v1/auth/resend-otp`, { email });
  }

  resetPassword(payload: { email: string; otp: string; newPassword: string; confirmPassword: string }): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/api/v1/auth/reset-password`, payload);
  }
}
