import { Routes } from '@angular/router';
import { SplashComponent } from './splash/splash.component';
import { LoginComponent } from './login/login.component';
import { VerifyOtpComponent } from './verify-otp/verify-otp.component';
import { InformationComponent } from './information/information.component';
import { HomeDashboardComponent } from './dashboard/home-dashboard.component';
import { ShopDashboardComponent } from './dashboard/shop-dashboard.component';

import { CustomerProfileComponent } from './dashboard/customer-profile.component';
import { DriverProfileComponent } from './dashboard/driver-profile.component';
import { StaffProfileComponent } from './dashboard/staff-profile.component';
import { CreateBillComponent } from './dashboard/create-bill.component';
import { authGuard } from './guards/auth.guard';
import { noAuthGuard } from './guards/no-auth.guard';

import { InsightsComponent } from './dashboard/insights/insights';
import { BillingComponent } from './dashboard/billing/billing';
import { RoomsComponent } from './dashboard/rooms/rooms';
import { DriversComponent } from './dashboard/drivers/drivers';
import { StaffComponent } from './dashboard/staff/staff';
import { ItemManagementComponent } from './dashboard/item-management.component';
import { ProfileComponent } from './dashboard/profile.component';

export const routes: Routes = [
  { path: '', component: SplashComponent },
  { path: 'login', component: LoginComponent, canActivate: [noAuthGuard] },
  { path: 'verify-otp', component: VerifyOtpComponent, canActivate: [noAuthGuard] },
  { path: 'information', component: InformationComponent, canActivate: [authGuard] },
  { 
    path: 'home', 
    component: HomeDashboardComponent, 
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'insights', pathMatch: 'full' },
      { path: 'insights', component: InsightsComponent },
      { path: 'billing', component: BillingComponent },
      { path: 'rooms', component: RoomsComponent },
      { path: 'drivers', component: DriversComponent },
      { path: 'staff', component: StaffComponent },
      { path: 'items', component: ItemManagementComponent },
      { path: 'profile', component: ProfileComponent },
    ]
  },
  { path: 'shop', component: ShopDashboardComponent, canActivate: [authGuard] },
  { path: 'customer-profile', component: CustomerProfileComponent, canActivate: [authGuard] },
  { path: 'driver-profile', component: DriverProfileComponent, canActivate: [authGuard] },
  { path: 'staff-profile', component: StaffProfileComponent, canActivate: [authGuard] },
  { path: 'create-bill', component: CreateBillComponent, canActivate: [authGuard] },
  { path: '**', redirectTo: '' }
];
