import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-billing',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './billing.html',
})
export class BillingComponent implements OnInit {
  billingCustomers: any[] = [];
  customerSearchQuery: string = '';
  showAddCustomerModal: boolean = false;
  newCustomerName: string = '';
  newCustomerMobile: string = '';
  addingCustomer: boolean = false;
  successMessage: string = '';

  activeCustomer: any = null;
  showHistoryModal: boolean = false;
  customerBills: any[] = [];
  loadingBills: boolean = false;
  historySelectedYear: number = new Date().getFullYear();
  historySelectedMonth: number | null = null;
  availableYears: number[] = [2026, 2025, 2024, 2023];
  monthsList: string[] = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  constructor(
    private authService: AuthService,
    private router: Router,
    public cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.fetchBillingCustomers();
  }

  fetchBillingCustomers(): void {
    this.authService.getBillingCustomers().subscribe({
      next: (res) => {
        this.billingCustomers = res?.data || [];
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Failed to fetch billing customers:', err)
    });
  }

  get filteredBillingCustomers(): any[] {
    if (!this.customerSearchQuery.trim()) return this.billingCustomers;
    const query = this.customerSearchQuery.toLowerCase().trim();
    return this.billingCustomers.filter(cust => 
      cust.customerName.toLowerCase().includes(query) ||
      cust.mobileNumber.includes(query)
    );
  }

  openAddCustomerModal(): void {
    this.newCustomerName = '';
    this.newCustomerMobile = '';
    this.showAddCustomerModal = true;
    this.cdr.detectChanges();
  }

  closeAddCustomerModal(): void {
    this.showAddCustomerModal = false;
    this.cdr.detectChanges();
  }

  submitAddCustomer(): void {
    if (!this.newCustomerName.trim() || !this.newCustomerMobile.trim()) {
      alert('Please enter name and mobile number.');
      return;
    }
    this.addingCustomer = true;
    this.authService.addBillingCustomer(this.newCustomerName.trim(), this.newCustomerMobile.trim()).subscribe({
      next: (res) => {
        this.addingCustomer = false;
        this.successMessage = 'Billing customer added successfully!';
        this.fetchBillingCustomers();
        this.closeAddCustomerModal();
        setTimeout(() => { this.successMessage = ''; this.cdr.detectChanges(); }, 3000);
      },
      error: (err) => {
        console.error('Failed to add customer:', err);
        alert(err?.error?.message || 'Failed to add customer.');
        this.addingCustomer = false;
        this.cdr.detectChanges();
      }
    });
  }

  openCreateBill(cust: any): void {
    this.router.navigate(['/create-bill'], { queryParams: { customerId: cust.customerId } });
  }

  openHistory(cust: any): void {
    this.historySelectedMonth = null;
    this.historySelectedYear = new Date().getFullYear();
    this.activeCustomer = cust;
    this.loadingBills = true;
    this.showHistoryModal = true;
    this.customerBills = [];
    this.cdr.detectChanges();
    
    if (!cust || !cust.customerId) {
      this.loadingBills = false;
      this.cdr.detectChanges();
      return;
    }
    
    this.authService.getBills(cust.customerId).subscribe({
      next: (res) => {
        this.customerBills = res?.data || [];
        this.loadingBills = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Failed to load bills history:', err);
        this.loadingBills = false;
        this.cdr.detectChanges();
      }
    });
  }

  closeHistoryModal(): void {
    this.showHistoryModal = false;
    this.activeCustomer = null;
    this.cdr.detectChanges();
  }

  getMonthTotal(monthIndex: number): number {
    if (!this.customerBills || !Array.isArray(this.customerBills)) return 0;
    return this.customerBills
      .filter(bill => {
        if (!bill.createdAt) return false;
        const date = new Date(bill.createdAt);
        return date.getFullYear() === this.historySelectedYear && date.getMonth() === monthIndex;
      })
      .reduce((sum, bill) => sum + (bill.grandTotal || 0), 0);
  }

  selectHistoryMonth(monthIndex: number): void {
    this.historySelectedMonth = this.historySelectedMonth === monthIndex ? null : monthIndex;
    this.cdr.detectChanges();
  }

  getFilteredHistoryBills(): any[] {
    if (!this.customerBills || !Array.isArray(this.customerBills)) return [];
    return this.customerBills.filter(bill => {
      if (!bill.createdAt) return false;
      const date = new Date(bill.createdAt);
      const matchesYear = date.getFullYear() === this.historySelectedYear;
      const matchesMonth = this.historySelectedMonth === null || date.getMonth() === this.historySelectedMonth;
      return matchesYear && matchesMonth;
    });
  }

  deleteBill(billId: string): void {
    if (confirm('Are you sure you want to delete this bill?')) {
      this.authService.deleteBill(billId).subscribe({
        next: (res) => {
          alert('Bill deleted successfully');
          if (this.activeCustomer) this.openHistory(this.activeCustomer);
        },
        error: (err) => alert(err?.error?.message || 'Failed to delete bill.')
      });
    }
  }

  toggleBillPaymentStatus(bill: any): void {
    const newStatus = bill.paymentStatus === 'done' ? 'pending' : 'done';
    this.authService.editBill(bill.billId, undefined, newStatus).subscribe({
      next: (res) => {
        alert(`Payment status updated to ${newStatus}`);
        if (this.activeCustomer) this.openHistory(this.activeCustomer);
      },
      error: (err) => alert(err?.error?.message || 'Failed to update payment status.')
    });
  }
}
