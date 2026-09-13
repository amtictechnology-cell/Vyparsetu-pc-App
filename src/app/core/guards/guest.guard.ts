import { CanActivateFn, Router } from '@angular/router';
import { inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { AuthService } from '../services/auth.service';

export const guestGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const platformId = inject(PLATFORM_ID);

  // If on server side, let it pass to avoid SSR redirect loops
  if (!isPlatformBrowser(platformId)) {
    return true;
  }

  // If user is already logged in, redirect them to the home dashboard
  if (authService.isLoggedIn()) {
    router.navigate(['/home']);
    return false;
  }

  // Not logged in, allow access to the guest page (login/signup)
  return true;
};
