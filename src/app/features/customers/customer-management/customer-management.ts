import { Component, OnInit, Inject, PLATFORM_ID, ChangeDetectorRef } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { CustomerService, Customer } from '../customer.service';

@Component({
  selector: 'app-customer-management',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './customer-management.html',
  styleUrls: ['./customer-management.css']
})
export class CustomerManagement implements OnInit {
  customers: Customer[] = [];
  
  // Pagination & Filtering
  currentPage = 1;
  totalPages = 1;
  totalCount = 0;
  limit = 20;
  searchQuery = '';

  // UI States
  isLoading = false;
  isSubmitting = false;
  error = '';
  successMessage = '';
  
  // Modal state
  showModal = false;
  isEditing = false;
  currentCustomerId: string | null = null;
  
  customerForm: FormGroup;

  constructor(
    private readonly customerService: CustomerService,
    private readonly fb: FormBuilder,
    private readonly cdr: ChangeDetectorRef,
    private readonly router: Router,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.customerForm = this.fb.group({
      name: ['', Validators.required],
      mobile: ['', [Validators.required, Validators.pattern('^[0-9]{10}$')]],
      idType: [''],
      idNumber: [''],
      address: ['']
    });
  }

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.loadCustomers();
    } else {
      this.isLoading = false;
    }
  }

  loadCustomers(): void {
    this.isLoading = true;
    this.error = '';
    this.customerService.getCustomers(this.currentPage, this.limit, this.searchQuery)
      .subscribe({
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
          this.error = 'Failed to load customers. ' + (err.error?.message || err.message);
          this.isLoading = false;
          this.cdr.detectChanges();
        }
      });
  }

  onSearch(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.searchQuery = target.value;
    this.currentPage = 1;
    this.loadCustomers();
  }

  changePage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.loadCustomers();
    }
  }

  openAddModal(): void {
    this.isEditing = false;
    this.currentCustomerId = null;
    this.customerForm.reset();
    this.showModal = true;
  }

  openEditModal(customer: Customer, event: Event): void {
    event.stopPropagation();
    this.isEditing = true;
    this.currentCustomerId = customer._id || null;
    this.customerForm.patchValue({
      name: customer.name,
      mobile: customer.mobile,
      idType: customer.idType || '',
      idNumber: customer.idNumber || '',
      address: customer.address || ''
    });
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.customerForm.reset();
  }

  onSubmit(): void {
    if (this.customerForm.invalid) {
      this.customerForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    this.error = '';
    this.successMessage = '';

    const customerData = this.customerForm.value;

    if (this.isEditing && this.currentCustomerId) {
      this.customerService.updateCustomer(this.currentCustomerId, customerData).subscribe({
        next: () => {
          this.successMessage = 'Customer updated successfully';
          this.isSubmitting = false;
          this.closeModal();
          this.loadCustomers();
        },
        error: (err) => {
          this.error = err.error?.message || 'Failed to update customer';
          this.isSubmitting = false;
          this.cdr.detectChanges();
        }
      });
    } else {
      this.customerService.addCustomer(customerData).subscribe({
        next: () => {
          this.successMessage = 'Customer added successfully';
          this.isSubmitting = false;
          this.closeModal();
          this.loadCustomers();
        },
        error: (err) => {
          this.error = err.error?.message || 'Failed to add customer';
          this.isSubmitting = false;
          this.cdr.detectChanges();
        }
      });
    }
  }

  deleteCustomer(id: string | undefined, event: Event): void {
    event.stopPropagation();
    if (!id) return;
    if (confirm('Are you sure you want to delete this customer?')) {
      this.error = '';
      this.customerService.deleteCustomer(id).subscribe({
        next: () => {
          this.successMessage = 'Customer deleted successfully';
          this.loadCustomers();
        },
        error: (err) => {
          this.error = err.error?.message || 'Failed to delete customer';
          this.cdr.detectChanges();
        }
      });
    }
  }

  viewProfile(id: string | undefined): void {
    if (id) {
      this.router.navigate(['/home/customers', id]);
    }
  }
}
