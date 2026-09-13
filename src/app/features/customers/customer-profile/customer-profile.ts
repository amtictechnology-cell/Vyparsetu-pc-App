import { Component, OnInit, Inject, PLATFORM_ID, ChangeDetectorRef } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ActivatedRoute, RouterModule, Router } from '@angular/router';
import { CustomerService, Customer } from '../customer.service';
import { BookingForm } from '../../bookings/booking-form/booking-form';
import { BookingService } from '../../bookings/booking.service';
import { BillService, Bill } from '../../billing/bill.service';
import { CreateBill } from '../../billing/create-bill/create-bill';

@Component({
  selector: 'app-customer-profile',
  standalone: true,
  imports: [CommonModule, RouterModule, BookingForm, CreateBill],
  templateUrl: './customer-profile.html',
  styleUrls: ['./customer-profile.css']
})
export class CustomerProfile implements OnInit {
  customer: Customer | null = null;
  activeStay: any = null;
  bookingHistory: any[] = [];
  customerBills: Bill[] = [];
  isLoading = true;
  isLoadingBookings = false;
  isLoadingBills = false;
  error = '';
  showBookingForm = false;
  showCreateBillModal = false;
  selectedBillForEdit: Bill | null = null;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly customerService: CustomerService,
    private readonly bookingService: BookingService,
    private readonly billService: BillService,
    private readonly cdr: ChangeDetectorRef,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.route.paramMap.subscribe(params => {
        const id = params.get('id');
        if (id) {
          this.loadCustomer(id);
        } else {
          this.error = 'Customer ID not found';
          this.isLoading = false;
        }
      });
    } else {
      this.isLoading = false;
    }
  }

  loadCustomer(id: string): void {
    this.isLoading = true;
    this.cdr.detectChanges();
    this.customerService.getCustomerById(id).subscribe({
      next: (res) => {
        this.customer = res.data;
        this.isLoading = false;
        this.cdr.detectChanges();
        this.loadBookings(id);
        this.loadCustomerBills(id);
      },
      error: (err) => {
        this.error = 'Failed to load customer profile';
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  loadBookings(customerId: string): void {
    this.isLoadingBookings = true;
    this.cdr.detectChanges();
    
    (this.bookingService as any).getBookings(1, 50, '', '', customerId).subscribe({
      next: (res: any) => {
        console.log('Bookings loaded:', res);
        const bookings = res.data || [];
        this.activeStay = bookings.find((b: any) => ['RESERVED', 'CONFIRMED', 'CHECKED_IN'].includes(b.status)) || null;
        this.bookingHistory = bookings.filter((b: any) => b._id !== this.activeStay?._id);
        console.log('Active stay:', this.activeStay);
        console.log('Booking history:', this.bookingHistory);
        this.isLoadingBookings = false;
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        console.error('Error loading bookings:', err);
        this.isLoadingBookings = false;
        this.cdr.detectChanges();
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/home/customers']);
  }

  openBookingForm(): void {
    this.showBookingForm = true;
  }

  closeBookingForm(): void {
    this.showBookingForm = false;
  }

  onBookingCreated(booking: any): void {
    this.showBookingForm = false;
    alert('Booking created successfully! Booking No: ' + booking.bookingNumber);
    // Refresh customer profile to show new stay/booking
    if (this.customer && this.customer._id) {
      this.loadCustomer(this.customer._id);
    }
  }

  checkIn(bookingId: string): void {
    if (confirm('Are you sure you want to check-in this guest?')) {
      this.bookingService.checkIn(bookingId).subscribe({
        next: () => {
          alert('Check-in successful!');
          if (this.customer && this.customer._id) {
            this.loadCustomer(this.customer._id);
          }
        },
        error: (err) => {
          alert('Failed to check-in: ' + (err.error?.message || err.message));
        }
      });
    }
  }

  checkOut(bookingId: string): void {
    if (confirm('Are you sure you want to check-out this guest? Room will be sent to cleaning.')) {
      this.bookingService.checkOut(bookingId).subscribe({
        next: () => {
          alert('Check-out successful!');
          if (this.customer && this.customer._id) {
            this.loadCustomer(this.customer._id);
          }
        },
        error: (err) => {
          alert('Failed to check-out: ' + (err.error?.message || err.message));
        }
      });
    }
  }

  addPayment(bookingId: string): void {
    const amountStr = prompt('Enter payment amount (₹):');
    if (amountStr) {
      const amount = Number(amountStr);
      if (isNaN(amount) || amount <= 0) {
        alert('Please enter a valid positive number');
        return;
      }
      this.bookingService.addPayment(bookingId, amount).subscribe({
        next: () => {
          alert('Payment added successfully!');
          if (this.customer && this.customer._id) {
            this.loadCustomer(this.customer._id);
          }
        },
        error: (err) => {
          alert('Failed to add payment: ' + (err.error?.message || err.message));
        }
      });
    }
  }

  // ─── Food & Restaurant Billing ─────────────────────────────────────

  loadCustomerBills(customerId: string): void {
    this.isLoadingBills = true;
    this.cdr.detectChanges();

    this.billService.getBills(1, 50, '', customerId).subscribe({
      next: (res) => {
        this.customerBills = res.data || [];
        this.isLoadingBills = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error loading customer bills:', err);
        this.isLoadingBills = false;
        this.cdr.detectChanges();
      }
    });
  }

  openCreateBill(): void {
    this.selectedBillForEdit = null;
    this.showCreateBillModal = true;
    this.cdr.detectChanges();
  }

  openEditBill(bill: Bill): void {
    this.selectedBillForEdit = bill;
    this.showCreateBillModal = true;
    this.cdr.detectChanges();
  }

  deleteBill(bill: Bill): void {
    if (!bill._id) return;
    if (confirm(`Are you sure you want to delete bill ${bill.billNumber} (₹${bill.finalAmount})?`)) {
      this.billService.deleteBill(bill._id).subscribe({
        next: () => {
          alert(`Bill ${bill.billNumber} deleted successfully.`);
          if (this.customer && this.customer._id) {
            this.loadCustomerBills(this.customer._id);
          }
        },
        error: (err) => {
          alert('Failed to delete bill: ' + (err.error?.message || err.message));
        }
      });
    }
  }

  closeCreateBill(): void {
    this.showCreateBillModal = false;
    this.selectedBillForEdit = null;
    this.cdr.detectChanges();
  }

  onBillGenerated(bill: Bill): void {
    alert(`Food Bill ${bill.billNumber} ${this.selectedBillForEdit ? 'updated' : 'generated'} successfully!`);
    if (this.customer && this.customer._id) {
      this.loadCustomerBills(this.customer._id);
    }
  }
}
