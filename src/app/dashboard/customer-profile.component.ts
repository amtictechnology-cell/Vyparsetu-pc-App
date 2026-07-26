import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-customer-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './customer-profile.component.html',
  styleUrl: './dashboard.shared.css'
})
export class CustomerProfileComponent implements OnInit {
  customerId: string = '';
  customer: any = null;
  bookings: any[] = [];
  loading: boolean = false;
  loadingBookings: boolean = false;
  backendUrl: string = '';

  // Single Booking Modal States
  showSingleBookingModal: boolean = false;
  bookingRoomNo: string = '';
  bookingTime: string = '';
  bookingMessage: string = '';
  submittingBooking: boolean = false;

  // Multiple Booking Modal States
  showMultiBookingModal: boolean = false;
  multiBookingStep: number = 1;
  multiMemberCount: number = 1;
  multiMembersList: any[] = [];
  multiBookingRoomNo: string = '';
  multiBookingTime: string = '';
  multiBookingMessage: string = '';

  // Checkout Modal States
  showCheckoutModal: boolean = false;
  selectedBookingToCheckout: any = null;
  checkoutMessage: string = '';
  checkoutTime: string = '';
  submittingCheckout: boolean = false;
  showThankYouPopup: boolean = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService,
    public cdr: ChangeDetectorRef
  ) {
    this.backendUrl = this.authService.getApiUrl();
  }

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.customerId = params['customerId'];
      if (this.customerId) {
        this.fetchCustomerAndBookings();
      } else {
        alert('Customer ID is missing in request.');
        this.goBack();
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/home/rooms']);
  }

  fetchCustomerAndBookings(): void {
    this.loading = true;
    this.loadingBookings = true;
    this.cdr.detectChanges();

    // 1. Fetch Stay Customer details
    this.authService.getStayCustomers().subscribe({
      next: (res) => {
        const list = res?.data || [];
        this.customer = list.find((c: any) => c.customerId === this.customerId);
        if (!this.customer) {
          console.warn('Customer stay profile not found');
        }
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Failed to fetch stay customer:', err);
        this.loading = false;
        this.cdr.detectChanges();
      }
    });

    // 2. Fetch bookings
    this.fetchBookingsOnly();
  }

  fetchBookingsOnly(): void {
    this.loadingBookings = true;
    this.cdr.detectChanges();

    this.authService.getAllBookings().subscribe({
      next: (res) => {
        const all = res?.data || [];
        this.bookings = all.filter((b: any) => b.customerId === this.customerId);
        this.loadingBookings = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Failed to fetch bookings:', err);
        this.bookings = [];
        this.loadingBookings = false;
        this.cdr.detectChanges();
      }
    });
  }

  formatBillDate(dateStr: string): string {
    if (!dateStr) return '—';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return dateStr;
    }
  }

  // --- Single Booking Methods ---
  openSingleBooking(): void {
    this.bookingRoomNo = '';
    this.bookingMessage = '';
    const now = new Date();
    const tzoffset = (new Date()).getTimezoneOffset() * 60000;
    this.bookingTime = (new Date(now.getTime() - tzoffset)).toISOString().slice(0, 16);
    this.showSingleBookingModal = true;
    this.cdr.detectChanges();
  }

  closeSingleBookingModal(): void {
    this.showSingleBookingModal = false;
    this.cdr.detectChanges();
  }

  confirmSingleBooking(): void {
    if (!this.bookingRoomNo.trim()) {
      alert('Please enter a room number.');
      return;
    }
    this.submittingBooking = true;
    this.cdr.detectChanges();

    const payload = {
      customerId: this.customerId,
      roomNumber: this.bookingRoomNo.trim(),
      numberOfMembers: 1,
      members: []
    };

    this.authService.addBooking(payload).subscribe({
      next: (res) => {
        this.submittingBooking = false;
        this.closeSingleBookingModal();
        this.fetchBookingsOnly();
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Booking failed:', err);
        alert(err?.error?.message || 'Booking failed.');
        this.submittingBooking = false;
        this.cdr.detectChanges();
      }
    });
  }

  // --- Multiple Booking / Add Members Methods ---
  openMultiBooking(): void {
    this.multiBookingStep = 1;
    this.multiMemberCount = 1;
    this.multiMembersList = [];
    this.multiBookingRoomNo = '';
    this.multiBookingMessage = '';
    const now = new Date();
    const tzoffset = (new Date()).getTimezoneOffset() * 60000;
    this.multiBookingTime = (new Date(now.getTime() - tzoffset)).toISOString().slice(0, 16);
    this.showMultiBookingModal = true;
    this.cdr.detectChanges();
  }

  closeMultiBookingModal(): void {
    this.showMultiBookingModal = false;
    this.cdr.detectChanges();
  }

  multiBookingNext(): void {
    if (this.multiBookingStep === 1) {
      const count = Number(this.multiMemberCount) || 1;
      this.multiMembersList = Array.from({ length: count }, () => ({ name: '', idNumber: '' }));
      this.multiBookingStep = 2;
    } else if (this.multiBookingStep === 2) {
      const invalid = this.multiMembersList.some(m => !m.name.trim() || !m.idNumber.trim());
      if (invalid) {
        alert('Please fill name and ID number for all members.');
        return;
      }
      this.multiBookingStep = 3;
    }
    this.cdr.detectChanges();
  }

  multiBookingPrev(): void {
    if (this.multiBookingStep > 1) {
      this.multiBookingStep--;
      this.cdr.detectChanges();
    }
  }

  confirmMultiBooking(): void {
    if (!this.multiBookingRoomNo.trim()) {
      alert('Please enter a room number.');
      return;
    }
    this.submittingBooking = true;
    this.cdr.detectChanges();

    const count = Number(this.multiMemberCount) || 1;

    const payload = {
      customerId: this.customerId,
      roomNumber: this.multiBookingRoomNo.trim(),
      numberOfMembers: count + 1,
      members: this.multiMembersList.map(m => ({ name: m.name.trim(), idNumber: m.idNumber.trim() }))
    };

    this.authService.addBooking(payload).subscribe({
      next: (res) => {
        this.submittingBooking = false;
        this.closeMultiBookingModal();
        this.fetchBookingsOnly();
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Multi booking failed:', err);
        alert(err?.error?.message || 'Booking failed.');
        this.submittingBooking = false;
        this.cdr.detectChanges();
      }
    });
  }

  // --- Checkout Booking Methods ---
  openCheckout(booking: any): void {
    this.selectedBookingToCheckout = booking;
    this.checkoutMessage = '';
    const now = new Date();
    const tzoffset = (new Date()).getTimezoneOffset() * 60000;
    this.checkoutTime = (new Date(now.getTime() - tzoffset)).toISOString().slice(0, 16);
    this.showCheckoutModal = true;
    this.cdr.detectChanges();
  }

  closeCheckoutModal(): void {
    this.showCheckoutModal = false;
    this.selectedBookingToCheckout = null;
    this.cdr.detectChanges();
  }

  confirmCheckout(): void {
    if (!this.selectedBookingToCheckout) return;
    this.submittingCheckout = true;
    this.cdr.detectChanges();

    this.authService.checkoutBooking(this.selectedBookingToCheckout.bookingId).subscribe({
      next: (res) => {
        this.submittingCheckout = false;
        this.closeCheckoutModal();
        this.showThankYouPopup = true;
        this.fetchBookingsOnly();
        this.cdr.detectChanges();
        setTimeout(() => {
          this.showThankYouPopup = false;
          this.cdr.detectChanges();
        }, 3500);
      },
      error: (err) => {
        console.error('Checkout failed:', err);
        alert(err?.error?.message || 'Checkout failed.');
        this.submittingCheckout = false;
        this.cdr.detectChanges();
      }
    });
  }

  deleteBooking(bookingId: string): void {
    if (confirm('Are you sure you want to delete this booking record?')) {
      this.authService.deleteBooking(bookingId).subscribe({
        next: (res) => {
          alert('Booking deleted successfully');
          this.fetchBookingsOnly();
        },
        error: (err) => {
          console.error('Delete booking failed:', err);
          alert(err?.error?.message || 'Failed to delete booking.');
        }
      });
    }
  }
}
