import { Component, OnInit, OnDestroy, inject, ChangeDetectorRef, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { StaffService, Staff } from '../staff.service';

@Component({
  selector: 'app-staff-management',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule],
  templateUrl: './staff-management.html',
  styleUrl: './staff-management.css'
})
export class StaffManagement implements OnInit, OnDestroy {
  private readonly staffService = inject(StaffService);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly platformId = inject(PLATFORM_ID);

  staffList: Staff[] = [];
  isLoading: boolean = false;
  isSubmitting: boolean = false;
  isDeleting: boolean = false;

  // Pagination & Filters
  currentPage: number = 1;
  totalPages: number = 1;
  totalCount: number = 0;
  pageSize: number = 12;
  searchTerm: string = '';
  statusFilter: string = 'all'; // 'all' | 'active' | 'inactive'

  // Debounced search
  private searchSubject = new Subject<string>();
  private searchSubscription?: Subscription;

  // Modals
  showAddEditModal: boolean = false;
  isEditing: boolean = false;
  editingStaffId: string | null = null;
  staffForm!: FormGroup;

  showDeleteModal: boolean = false;
  staffToDelete: Staff | null = null;

  // Feedback notifications
  successMessage: string | null = null;
  errorMessage: string | null = null;

  ngOnInit(): void {
    this.initForm();
    this.setupDebouncedSearch();
    if (isPlatformBrowser(this.platformId)) {
      this.loadStaff();
    } else {
      this.isLoading = false;
    }
  }

  ngOnDestroy(): void {
    if (this.searchSubscription) {
      this.searchSubscription.unsubscribe();
    }
  }

  private initForm(): void {
    this.staffForm = this.fb.group({
      staffName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
      mobileNumber: [
        '',
        [
          Validators.required,
          Validators.pattern('^[6-9]\\d{9}$') // 10-digit Indian mobile format
        ]
      ],
      address: ['', [Validators.maxLength(150)]]
    });
  }

  private setupDebouncedSearch(): void {
    this.searchSubscription = this.searchSubject
      .pipe(debounceTime(350), distinctUntilChanged())
      .subscribe((term) => {
        this.searchTerm = term;
        this.currentPage = 1;
        this.loadStaff();
      });
  }

  onSearchInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchSubject.next(input.value);
  }

  clearSearch(): void {
    this.searchTerm = '';
    this.searchSubject.next('');
  }

  onFilterStatus(status: string): void {
    if (this.statusFilter === status) return;
    this.statusFilter = status;
    this.currentPage = 1;
    this.loadStaff();
  }

  loadStaff(): void {
    this.isLoading = true;
    this.errorMessage = null;

    this.staffService
      .getStaff(this.currentPage, this.pageSize, this.searchTerm, this.statusFilter)
      .subscribe({
        next: (res) => {
          this.staffList = res?.data || [];
          if (res?.pagination) {
            this.totalCount = res.pagination.totalCount;
            this.currentPage = res.pagination.currentPage;
            this.totalPages = res.pagination.totalPages;
          }
          this.isLoading = false;
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.isLoading = false;
          this.errorMessage = err?.error?.message || 'Failed to load staff list. Please try again.';
          this.cdr.detectChanges();
        }
      });
  }

  changePage(page: number): void {
    if (page < 1 || page > this.totalPages || page === this.currentPage) return;
    this.currentPage = page;
    this.loadStaff();
  }

  // Add Staff Modal
  openAddModal(): void {
    this.isEditing = false;
    this.editingStaffId = null;
    this.staffForm.reset({
      staffName: '',
      mobileNumber: '',
      address: ''
    });
    this.showAddEditModal = true;
  }

  // Edit Staff Modal
  openEditModal(staff: Staff, event?: Event): void {
    if (event) event.stopPropagation();
    this.isEditing = true;
    this.editingStaffId = staff._id;
    this.staffForm.patchValue({
      staffName: staff.staffName,
      mobileNumber: staff.mobileNumber,
      address: staff.address || ''
    });
    this.showAddEditModal = true;
  }

  closeAddEditModal(): void {
    if (this.isSubmitting) return;
    this.showAddEditModal = false;
    this.isEditing = false;
    this.editingStaffId = null;
    this.staffForm.reset();
  }

  saveStaff(): void {
    if (this.staffForm.invalid) {
      this.staffForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = null;

    const payload = {
      staffName: this.staffForm.value.staffName.trim(),
      mobileNumber: this.staffForm.value.mobileNumber.toString().trim(),
      address: this.staffForm.value.address ? this.staffForm.value.address.trim() : ''
    };

    if (this.isEditing && this.editingStaffId) {
      // Update Staff
      this.staffService.updateStaff(this.editingStaffId, payload).subscribe({
        next: (res) => {
          this.isSubmitting = false;
          this.closeAddEditModal();
          this.showToast(res.message || 'Staff member updated successfully!');
          this.loadStaff();
        },
        error: (err) => {
          this.isSubmitting = false;
          this.errorMessage = err?.error?.message || 'Failed to update staff member. Please check details.';
        }
      });
    } else {
      // Create Staff
      this.staffService.createStaff(payload).subscribe({
        next: (res) => {
          this.isSubmitting = false;
          this.closeAddEditModal();
          this.showToast(res.message || 'Staff member added successfully with today\'s attendance!');
          this.loadStaff();
        },
        error: (err) => {
          this.isSubmitting = false;
          this.errorMessage = err?.error?.message || 'Failed to create staff member. Please check details.';
        }
      });
    }
  }

  // Toggle Staff Active / Inactive Status
  toggleStaffStatus(staff: Staff, event?: Event): void {
    if (event) event.stopPropagation();
    const newStatus = !staff.isActive;

    this.staffService.updateStaffStatus(staff._id, newStatus).subscribe({
      next: (res) => {
        staff.isActive = newStatus;
        this.showToast(`Staff marked as ${newStatus ? 'Active' : 'Inactive'}.`);
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.showToast(err?.error?.message || 'Failed to update staff status.', true);
        this.cdr.detectChanges();
      }
    });
  }

  // Soft Delete Modal
  openDeleteModal(staff: Staff, event?: Event): void {
    if (event) event.stopPropagation();
    this.staffToDelete = staff;
    this.showDeleteModal = true;
    this.cdr.detectChanges();
  }

  closeDeleteModal(): void {
    if (this.isDeleting) return;
    this.showDeleteModal = false;
    this.staffToDelete = null;
    this.cdr.detectChanges();
  }

  confirmDelete(): void {
    if (!this.staffToDelete) return;
    this.isDeleting = true;

    this.staffService.deleteStaff(this.staffToDelete._id).subscribe({
      next: (res) => {
        this.isDeleting = false;
        this.closeDeleteModal();
        this.showToast(res.message || 'Staff member deleted successfully. Historical attendance is preserved.');
        this.loadStaff();
      },
      error: (err) => {
        this.isDeleting = false;
        this.showToast(err?.error?.message || 'Failed to delete staff member.', true);
        this.cdr.detectChanges();
      }
    });
  }

  // View Staff Profile and Attendance Calendar
  viewProfile(staffId: string): void {
    this.router.navigate(['/home/staff', staffId]);
  }

  private showToast(message: string, isError: boolean = false): void {
    if (isError) {
      this.errorMessage = message;
      this.cdr.detectChanges();
      setTimeout(() => {
        this.errorMessage = null;
        this.cdr.detectChanges();
      }, 5000);
    } else {
      this.successMessage = message;
      this.cdr.detectChanges();
      setTimeout(() => {
        this.successMessage = null;
        this.cdr.detectChanges();
      }, 4000);
    }
  }
}
