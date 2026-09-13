import { CanActivateFn, Router } from '@angular/router';
import { inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const platformId = inject(PLATFORM_ID);

  // If we are on the server side (SSR), let the route activate.
  // The actual authentication check will happen on the client side.
  if (!isPlatformBrowser(platformId)) {
    return true;
  }

  if (authService.isLoggedIn()) {
    return true;
  }

  // Not logged in, redirect to login page
  router.navigate(['/login']);
  return false;
};
