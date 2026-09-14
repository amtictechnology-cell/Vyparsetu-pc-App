import { Component, OnInit, OnDestroy, inject, PLATFORM_ID, ChangeDetectorRef } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { RoomService, Room } from '../rooms/room.service';
import { CustomerService } from '../../customers/customer.service';
import { StaffService } from '../../staff/staff.service';

@Component({
  selector: 'app-insights',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './insights.html',
  styleUrl: './insights.css'
})
export class Insights implements OnInit, OnDestroy {
  private authService = inject(AuthService);
  private roomService = inject(RoomService);
  private customerService = inject(CustomerService);
  private staffService = inject(StaffService);
  private router = inject(Router);
  private platformId = inject(PLATFORM_ID);
  private cdr = inject(ChangeDetectorRef);

  // Business & Metric States
  businessName: string = 'VyparSetu Business';
  userName: string = 'Partner';
  totalCustomers: number = 0;
  totalRooms: number = 0;

  // Staff & Attendance Summary
  staffSummary = {
    totalStaff: 0,
    activeStaff: 0,
    present: 0,
    absent: 0,
    halfDay: 0,
    paidLeave: 0
  };

  // Room Status Arrays
  cleaningRooms: Room[] = [];
  availableRooms: Room[] = [];
  occupiedRooms: Room[] = [];
  maintenanceRooms: Room[] = [];

  isLoading: boolean = true;
  actionLoadingId: string | null = null;
  actionSuccessMessage: string | null = null;

  // Auto-Rotating Carousel State (Now 5 slides)
  currentSlide: number = 0;
  readonly totalSlides: number = 5;
  private autoSlideTimer: any = null;

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.loadBusinessProfile();
      this.loadCustomersData();
      this.loadRoomsData();
      this.loadStaffAttendanceData();
      this.startAutoSlide();
    }
  }

  ngOnDestroy(): void {
    this.stopAutoSlide();
  }

  loadBusinessProfile(): void {
    const user = this.authService.getUser();
    if (user) {
      this.businessName = user.businessName || 'VyparSetu Business';
      this.userName = user.userName || 'Partner';
    }

    this.authService.getProfile().subscribe({
      next: (res) => {
        if (res && res.user) {
          this.businessName = res.user.businessName || this.businessName;
          this.userName = res.user.userName || this.userName;
          this.cdr.detectChanges();
        }
      }
    });
  }

  loadCustomersData(): void {
    this.customerService.getCustomers(1, 1).subscribe({
      next: (res) => {
        if (res && res.pagination) {
          this.totalCustomers = res.pagination.totalCount || 0;
        } else if (res && res.data) {
          this.totalCustomers = res.data.length || 0;
        }
        this.cdr.detectChanges();
      },
      error: () => {
        this.totalCustomers = 0;
      }
    });
  }

  loadRoomsData(): void {
    this.isLoading = true;
    this.roomService.getRooms(1, 100).subscribe({
      next: (res) => {
        this.isLoading = false;
        const allRooms = res.data || [];
        this.totalRooms = allRooms.length;

        this.cleaningRooms = allRooms.filter(
          (r) => r.status && r.status.toUpperCase() === 'CLEANING'
        );
        this.availableRooms = allRooms.filter(
          (r) => r.status && r.status.toUpperCase() === 'AVAILABLE'
        );
        this.occupiedRooms = allRooms.filter(
          (r) => r.status && r.status.toUpperCase() === 'OCCUPIED'
        );
        this.maintenanceRooms = allRooms.filter(
          (r) =>
            r.status &&
            (r.status.toUpperCase() === 'MAINTENANCE' ||
              r.status.toUpperCase() === 'BLOCKED' ||
              r.status.toUpperCase() === 'RESERVED')
        );

        this.cdr.detectChanges();
      },
      error: () => {
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  loadStaffAttendanceData(): void {
    this.staffService.getTodayAttendanceSummary().subscribe({
      next: (res) => {
        if (res && res.data) {
          this.staffSummary = {
            totalStaff: res.data.totalStaff || 0,
            activeStaff: res.data.activeStaff || 0,
            present: res.data.present || 0,
            absent: res.data.absent || 0,
            halfDay: res.data.halfDay || 0,
            paidLeave: res.data.paidLeave || 0
          };
          this.cdr.detectChanges();
        }
      },
      error: () => {
        // Fallback gracefully without breaking UI
      }
    });
  }

  // Carousel Controls
  startAutoSlide(): void {
    this.stopAutoSlide();
    this.autoSlideTimer = setInterval(() => {
      this.nextSlide();
    }, 4500);
  }

  stopAutoSlide(): void {
    if (this.autoSlideTimer) {
      clearInterval(this.autoSlideTimer);
      this.autoSlideTimer = null;
    }
  }

  goToSlide(index: number): void {
    this.currentSlide = index;
    this.startAutoSlide(); // Reset timer on manual navigation
    this.cdr.detectChanges();
  }

  nextSlide(): void {
    this.currentSlide = (this.currentSlide + 1) % this.totalSlides;
    this.cdr.detectChanges();
  }

  prevSlide(): void {
    this.currentSlide = (this.currentSlide - 1 + this.totalSlides) % this.totalSlides;
    this.cdr.detectChanges();
  }

  // Quick Action: Mark a cleaning room as clean & available
  markRoomClean(room: Room): void {
    if (!room._id) return;
    this.actionLoadingId = room._id;

    this.roomService.updateRoom(room._id, { status: 'AVAILABLE' }).subscribe({
      next: () => {
        this.actionLoadingId = null;
        this.actionSuccessMessage = `Room ${room.roomNumber} is now marked Clean & Available!`;
        this.loadRoomsData();
        setTimeout(() => {
          this.actionSuccessMessage = null;
          this.cdr.detectChanges();
        }, 4000);
      },
      error: () => {
        this.actionLoadingId = null;
        this.cdr.detectChanges();
      }
    });
  }

  scrollToCleaning(): void {
    if (isPlatformBrowser(this.platformId)) {
      const el = document.getElementById('cleaningSection');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  }

  navigateTo(path: string): void {
    this.router.navigate([path]);
  }
}
