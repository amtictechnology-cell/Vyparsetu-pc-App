import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { TrackRoom } from '../../components/track-room/track-room';

@Component({
  selector: 'app-rooms',
  standalone: true,
  imports: [CommonModule, FormsModule, TrackRoom],
  templateUrl: './rooms.html',
})
export class RoomsComponent implements OnInit {
  stayCustomers: any[] = [];
  loadingStayCustomers: boolean = false;
  stayCustomerSearchQuery: string = '';
  showAddEditStayModal: boolean = false;
  isEditingStayCustomer: boolean = false;
  editingStayCustomer: any = null;
  submittingStayCustomer: boolean = false;

  showDeleteModal: boolean = false;
  customerToDeleteId: string = '';
  deletingCustomer: boolean = false;

  showTrackRoomModal: boolean = false;

  stayCustomerName: string = '';
  stayCustomerMobile: string = '';
  stayCustomerIdNumber: string = '';
  stayCustomerAddress: string = '';
  stayCustomerFrontFile: File | null = null;
  stayCustomerBackFile: File | null = null;
  backendUrl: string = '';

  constructor(
    private authService: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.backendUrl = this.authService.getApiUrl();
    this.fetchStayCustomers();
  }

  openTrackRoomModal(): void {
    this.showTrackRoomModal = true;
    this.cdr.detectChanges();
  }

  closeTrackRoomModal(): void {
    this.showTrackRoomModal = false;
    this.cdr.detectChanges();
  }

  fetchStayCustomers(): void {
    this.loadingStayCustomers = true;
    this.authService.getStayCustomers().subscribe({
      next: (res) => {
        this.stayCustomers = res?.data || [];
        this.loadingStayCustomers = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Failed to fetch stay customers:', err);
        this.loadingStayCustomers = false;
        this.cdr.detectChanges();
      }
    });
  }

  getFilteredStayCustomers(): any[] {
    if (!this.stayCustomers || !Array.isArray(this.stayCustomers)) return [];
    const q = this.stayCustomerSearchQuery ? this.stayCustomerSearchQuery.toLowerCase().trim() : '';
    if (!q) return this.stayCustomers;
    return this.stayCustomers.filter(c => {
      if (!c) return false;
      const name = c.customerName ? String(c.customerName).toLowerCase() : '';
      const mobile = c.mobileNumber ? String(c.mobileNumber) : '';
      const idNum = c.idNumber ? String(c.idNumber).toLowerCase() : '';
      const addr = c.address ? String(c.address).toLowerCase() : '';
      return name.includes(q) || mobile.includes(q) || idNum.includes(q) || addr.includes(q);
    });
  }

  openAddStayCustomerModal(): void {
    this.isEditingStayCustomer = false;
    this.editingStayCustomer = null;
    this.resetForm();
    this.showAddEditStayModal = true;
    this.cdr.detectChanges();
  }

  openEditStayCustomerModal(cust: any): void {
    this.isEditingStayCustomer = true;
    this.editingStayCustomer = cust;
    this.stayCustomerName = cust.customerName;
    this.stayCustomerMobile = cust.mobileNumber;
    this.stayCustomerIdNumber = cust.idNumber;
    this.stayCustomerAddress = cust.address;
    this.stayCustomerFrontFile = null;
    this.stayCustomerBackFile = null;
    this.showAddEditStayModal = true;
    this.cdr.detectChanges();
  }

  closeStayCustomerModal(): void {
    this.showAddEditStayModal = false;
    this.cdr.detectChanges();
  }

  resetForm(): void {
    this.stayCustomerName = '';
    this.stayCustomerMobile = '';
    this.stayCustomerIdNumber = '';
    this.stayCustomerAddress = '';
    this.stayCustomerFrontFile = null;
    this.stayCustomerBackFile = null;
  }

  onFrontFileSelected(event: any): void {
    const file = event.target.files?.[0];
    if (file) this.stayCustomerFrontFile = file;
  }

  onBackFileSelected(event: any): void {
    const file = event.target.files?.[0];
    if (file) this.stayCustomerBackFile = file;
  }

  onSubmitStayCustomer(): void {
    if (!this.stayCustomerName.trim() || !this.stayCustomerMobile.trim() || !this.stayCustomerIdNumber.trim() || !this.stayCustomerAddress.trim()) {
      alert('Please fill in all required fields.');
      return;
    }
    this.submittingStayCustomer = true;
    this.cdr.detectChanges();

    const formData = new FormData();
    formData.append('customerName', this.stayCustomerName.trim());
    formData.append('mobileNumber', this.stayCustomerMobile.trim());
    formData.append('idNumber', this.stayCustomerIdNumber.trim());
    formData.append('address', this.stayCustomerAddress.trim());
    if (this.stayCustomerFrontFile) formData.append('frontImage', this.stayCustomerFrontFile);
    if (this.stayCustomerBackFile) formData.append('backImage', this.stayCustomerBackFile);

    if (this.isEditingStayCustomer && this.editingStayCustomer) {
      formData.append('customerId', this.editingStayCustomer.customerId);
      this.authService.editStayCustomer(formData).subscribe({
        next: (res) => {
          this.submittingStayCustomer = false;
          this.closeStayCustomerModal();
          alert('Customer stay profile updated successfully!');
          this.fetchStayCustomers();
        },
        error: (err) => {
          alert(err?.error?.message || 'Failed to update stay customer.');
          this.submittingStayCustomer = false;
          this.cdr.detectChanges();
        }
      });
    } else {
      this.authService.addStayCustomer(formData).subscribe({
        next: (res) => {
          this.submittingStayCustomer = false;
          this.closeStayCustomerModal();
          alert('Customer stay profile registered successfully!');
          this.fetchStayCustomers();
        },
        error: (err) => {
          alert(err?.error?.message || 'Failed to add stay customer.');
          this.submittingStayCustomer = false;
          this.cdr.detectChanges();
        }
      });
    }
  }

  deleteStayCustomer(customerId: string): void {
    this.customerToDeleteId = customerId;
    this.showDeleteModal = true;
    this.cdr.detectChanges();
  }

  cancelDelete(): void {
    this.showDeleteModal = false;
    this.customerToDeleteId = '';
    this.cdr.detectChanges();
  }

  confirmDeleteStayCustomer(): void {
    if (!this.customerToDeleteId) return;
    this.deletingCustomer = true;
    this.cdr.detectChanges();
    this.authService.deleteStayCustomer(this.customerToDeleteId).subscribe({
      next: (res) => {
        this.deletingCustomer = false;
        this.showDeleteModal = false;
        this.customerToDeleteId = '';
        alert('Customer deleted successfully!');
        this.fetchStayCustomers();
      },
      error: (err) => {
        this.deletingCustomer = false;
        this.cdr.detectChanges();
        alert(err?.error?.message || 'Failed to delete customer.');
      }
    });
  }

  openProfile(cust: any): void {
    this.router.navigate(['/customer-profile'], { queryParams: { customerId: cust.customerId } });
  }
}
