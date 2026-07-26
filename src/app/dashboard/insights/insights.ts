import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-insights',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './insights.html',
})
export class InsightsComponent implements OnInit {
  user: any = null;
  billingCustomers: any[] = [];
  stayCustomers: any[] = [];
  staffList: any[] = [];

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    this.authService.getProfile().subscribe(res => {
      this.user = res?.user;
    });
    this.authService.getBillingCustomers().subscribe(res => {
      this.billingCustomers = res?.data || [];
    });
    this.authService.getStayCustomers().subscribe(res => {
      this.stayCustomers = res?.data || [];
    });
    this.authService.getStaff().subscribe(res => {
      this.staffList = res?.data || [];
    });
  }
}
