import { Component, OnInit, Inject, PLATFORM_ID, ChangeDetectorRef } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { CustomerService, Customer } from '../../customers/customer.service';
import { BillService, Bill } from '../bill.service';
import { CreateBill } from '../create-bill/create-bill';

@Component({
  selector: 'app-food-billing',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, CreateBill],
  templateUrl: './food-billing.html',
  styleUrls: ['./food-billing.css']
})
export class FoodBilling implements OnInit {
  activeTab: 'bills' | 'customers' = 'bills';

  customers: Customer[] = [];
  recentBills: Bill[] = [];
  bills: Bill[] = [];

  // Search & Pagination for Customers
  searchQuery: string = '';
  currentPage: number = 1;
  totalPages: number = 1;
  totalCount: number = 0;
  limit: number = 20;

  // Search & Pagination for Bills
  billsSearchQuery: string = '';
  billsPage: number = 1;
  billsTotalPages: number = 1;
  billsTotalCount: number = 0;
  isLoadingBills: boolean = false;

  // UI States
  isLoading: boolean = false;
  isSubmittingCustomer: boolean = false;
  error: string = '';
  successMessage: string = '';

  // Quick Customer Modal
  showQuickCustomerModal: boolean = false;
  quickCustomerForm: FormGroup;

  // POS Create / Edit Bill Modal
  showCreateBillModal: boolean = false;
  selectedCustomerForBill: Customer | null = null;
  editingBill: Bill | null = null;

  constructor(
    private readonly customerService: CustomerService,
    private readonly billService: BillService,
    private readonly fb: FormBuilder,
    private readonly cdr: ChangeDetectorRef,
    private readonly router: Router,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    // Only Name and Mobile are required for fast dining billing
    this.quickCustomerForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      mobile: ['', [Validators.required, Validators.pattern('^[0-9]{10}$')]]
    });
  }

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.loadBills();
      this.loadCustomers();
      this.loadRecentBills();
    }
  }

  loadCustomers(): void {
    this.isLoading = true;
    this.error = '';

    this.customerService.getCustomers(this.currentPage, this.limit, this.searchQuery).subscribe({
      next: (res) => {
        this.customers = res.data || [];
        if (res.pagination) {
          this.currentPage = res.pagination.currentPage;
          this.totalPages = res.pagination.totalPages;
          this.totalCount = res.pagination.totalCount;
        }
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.error = 'Failed to load customers: ' + (err.error?.message || err.message);
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  loadRecentBills(): void {
    this.billService.getBills(1, 5).subscribe({
      next: (res) => {
        this.recentBills = res.data || [];
        this.cdr.detectChanges();
      },
      error: () => {}
    });
  }

  loadBills(): void {
    this.isLoadingBills = true;
    this.error = '';

    this.billService.getBills(this.billsPage, 20, this.billsSearchQuery).subscribe({
      next: (res) => {
        this.bills = res.data || [];
        if (res.pagination) {
          this.billsPage = res.pagination.currentPage;
          this.billsTotalPages = res.pagination.totalPages;
          this.billsTotalCount = res.pagination.totalCount;
        }
        this.isLoadingBills = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.error = 'Failed to load bills: ' + (err.error?.message || err.message);
        this.isLoadingBills = false;
        this.cdr.detectChanges();
      }
    });
  }

  onBillsSearch(event: Event): void {
    const val = (event.target as HTMLInputElement).value;
    this.billsSearchQuery = val;
    this.billsPage = 1;
    this.loadBills();
  }

  changeBillsPage(page: number): void {
    if (page >= 1 && page <= this.billsTotalPages) {
      this.billsPage = page;
      this.loadBills();
    }
  }

  onSearch(event: Event): void {
    const val = (event.target as HTMLInputElement).value;
    this.searchQuery = val;
    this.currentPage = 1;
    this.loadCustomers();
  }

  changePage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.loadCustomers();
    }
  }

  // ─── Quick Add Customer ──────────────────────────────────────────

  openQuickAddModal(): void {
    this.quickCustomerForm.reset();
    this.showQuickCustomerModal = true;
    this.error = '';
    this.successMessage = '';
  }

  closeQuickAddModal(): void {
    this.showQuickCustomerModal = false;
    this.quickCustomerForm.reset();
  }

  saveCustomerAndCreateBill(): void {
    if (this.quickCustomerForm.invalid) {
      this.quickCustomerForm.markAllAsTouched();
      return;
    }

    this.isSubmittingCustomer = true;
    this.error = '';

    const payload = this.quickCustomerForm.value;

    this.customerService.addCustomer(payload).subscribe({
      next: (res) => {
        this.isSubmittingCustomer = false;
        this.closeQuickAddModal();
        this.loadCustomers();

        // Immediately open POS live bill for this newly created customer!
        this.openCreateBill(res.data);
      },
      error: (err) => {
        this.isSubmittingCustomer = false;
        this.error = err.error?.message || 'Failed to add customer';
        this.cdr.detectChanges();
      }
    });
  }

  // ─── POS Bill Modal ──────────────────────────────────────────────

  openCreateBill(customer?: Customer): void {
    this.editingBill = null;
    this.selectedCustomerForBill = customer || null;
    this.showCreateBillModal = true;
    this.cdr.detectChanges();
  }

  openEditBill(bill: Bill): void {
    this.editingBill = bill;
    this.selectedCustomerForBill = null;
    this.showCreateBillModal = true;
    this.cdr.detectChanges();
  }

  deleteBill(bill: Bill): void {
    if (!bill._id) return;
    if (confirm(`Are you sure you want to delete bill ${bill.billNumber} for ${bill.customerName} (₹${bill.finalAmount})?`)) {
      this.billService.deleteBill(bill._id).subscribe({
        next: () => {
          this.successMessage = `Bill ${bill.billNumber} deleted successfully.`;
          this.loadBills();
          this.loadRecentBills();
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.error = 'Failed to delete bill: ' + (err.error?.message || err.message);
          this.cdr.detectChanges();
        }
      });
    }
  }

  closeCreateBill(): void {
    this.showCreateBillModal = false;
    this.selectedCustomerForBill = null;
    this.editingBill = null;
    this.cdr.detectChanges();
  }

  onBillGenerated(bill: Bill): void {
    this.successMessage = this.editingBill 
      ? `Bill ${bill.billNumber} updated successfully!` 
      : `Bill ${bill.billNumber} for ₹${bill.finalAmount} generated successfully!`;
    this.loadBills();
    this.loadRecentBills();
    this.cdr.detectChanges();
  }

  viewCustomerProfile(customerId?: string): void {
    if (customerId) {
      this.router.navigate(['/home/customers', customerId]);
    }
  }
}
