import { Routes } from '@angular/router';
import { Welcome } from './welcome/welcome';
import { Signup } from './features/auth/signup/signup';
import { Login } from './features/auth/login/login';
import { authGuard } from './core/guards/auth.guard';
import { guestGuard } from './core/guards/guest.guard';
import { Dashboard } from './features/dashboard/dashboard';
import { Profile } from './features/dashboard/profile/profile';

export const routes: Routes = [
  { path: '', component: Welcome, canActivate: [guestGuard] },
  { path: 'signup', component: Signup, canActivate: [guestGuard] },
  { path: 'login', component: Login, canActivate: [guestGuard] },
  { 
    path: 'forgot-password', 
    loadComponent: () => import('./features/auth/forgot-password/forgot-password').then(m => m.ForgotPassword), 
    canActivate: [guestGuard] 
  },
  { 
    path: 'verify-otp', 
    loadComponent: () => import('./features/auth/verify-otp/verify-otp').then(m => m.VerifyOtp), 
    canActivate: [guestGuard] 
  },
  { 
    path: 'reset-password', 
    loadComponent: () => import('./features/auth/reset-password/reset-password').then(m => m.ResetPassword), 
    canActivate: [guestGuard] 
  },
  {
    path: 'home',
    component: Dashboard,
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'insights', pathMatch: 'full' },
      { 
        path: 'insights', 
        loadComponent: () => import('./features/dashboard/insights/insights').then(m => m.Insights) 
      },
      { path: 'profile', component: Profile },
      { 
        path: 'rooms', 
        loadComponent: () => import('./features/dashboard/rooms/rooms').then(m => m.Rooms) 
      },
      {
        path: 'customers',
        loadComponent: () => import('./features/customers/customer-management/customer-management').then(m => m.CustomerManagement)
      },
      {
        path: 'customers/:id',
        loadComponent: () => import('./features/customers/customer-profile/customer-profile').then(m => m.CustomerProfile)
      },
      {
        path: 'menu-items',
        loadComponent: () => import('./features/menu-items/menu-item-management/menu-item-management').then(m => m.MenuItemManagement)
      },
      {
        path: 'billing',
        loadComponent: () => import('./features/billing/food-billing/food-billing').then(m => m.FoodBilling)
      },
      {
        path: 'staff',
        loadComponent: () => import('./features/staff/staff-management/staff-management').then(m => m.StaffManagement)
      },
      {
        path: 'staff/:id',
        loadComponent: () => import('./features/staff/staff-profile/staff-profile').then(m => m.StaffProfile)
      }
    ]
  },
  { path: 'staff', redirectTo: 'home/staff', pathMatch: 'full' },
  { path: '**', redirectTo: '' }
];
