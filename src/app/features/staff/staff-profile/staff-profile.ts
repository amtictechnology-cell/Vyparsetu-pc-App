import { Component, OnInit, inject, ChangeDetectorRef, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { StaffService, Staff, AttendanceRecord, AttendanceSummary, AttendanceStatus } from '../staff.service';

interface CalendarDay {
  date: string; // YYYY-MM-DD
  dayNumber: number;
  status: AttendanceStatus | null;
  isFuture: boolean;
  isToday: boolean;
}

@Component({
  selector: 'app-staff-profile',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './staff-profile.html',
  styleUrl: './staff-profile.css'
})
export class StaffProfile implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly staffService = inject(StaffService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly platformId = inject(PLATFORM_ID);

  staffId: string = '';
  staff: Staff | null = null;
  isLoadingProfile: boolean = true;
  isLoadingAttendance: boolean = false;
  isUpdatingAttendance: boolean = false;

  // Calendar State
  currentYear: number = 2026;
  currentMonth: number = 9; // 1-12
  todayDateStr: string = '';

  calendarDays: (CalendarDay | null)[] = [];
  summary: AttendanceSummary = {
    totalDays: 0,
    markedDays: 0,
    present: 0,
    absent: 0,
    halfDay: 0,
    paidLeave: 0,
    effectivePresentDays: 0
  };

  // Edit Attendance Modal
  showAttendanceModal: boolean = false;
  selectedDay: CalendarDay | null = null;
  selectedStatus: AttendanceStatus = 'PRESENT';

  readonly statusOptions: { key: AttendanceStatus; label: string; shortCode: string; icon: string; colorClass: string }[] = [
    { key: 'PRESENT', label: 'Present', shortCode: 'P', icon: 'fa-check', colorClass: 'status-opt-present' },
    { key: 'ABSENT', label: 'Absent', shortCode: 'A', icon: 'fa-xmark', colorClass: 'status-opt-absent' },
    { key: 'HALF_DAY', label: 'Half Day', shortCode: 'H', icon: 'fa-adjust', colorClass: 'status-opt-half' },
    { key: 'PAID_LEAVE', label: 'Paid Leave', shortCode: 'PL', icon: 'fa-umbrella-beach', colorClass: 'status-opt-leave' }
  ];

  // Feedback Notifications
  successMessage: string | null = null;
  errorMessage: string | null = null;

  ngOnInit(): void {
    this.initTodayDate();
    if (isPlatformBrowser(this.platformId)) {
      this.route.paramMap.subscribe((params) => {
        const id = params.get('id');
        if (id) {
          this.staffId = id;
          this.loadStaffProfile();
        } else {
          this.router.navigate(['/home/staff']);
        }
      });
    } else {
      this.isLoadingProfile = false;
      this.isLoadingAttendance = false;
    }
  }

  private initTodayDate(): void {
    const now = new Date();
    this.currentYear = now.getFullYear();
    this.currentMonth = now.getMonth() + 1;

    // Local YYYY-MM-DD
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    this.todayDateStr = `${y}-${m}-${d}`;
  }

  loadStaffProfile(): void {
    this.isLoadingProfile = true;
    this.errorMessage = null;

    this.staffService.getStaffById(this.staffId).subscribe({
      next: (res) => {
        this.staff = res.data;
        this.isLoadingProfile = false;
        this.cdr.detectChanges();
        this.loadMonthlyAttendance();
      },
      error: (err) => {
        this.isLoadingProfile = false;
        this.errorMessage = err?.error?.message || 'Staff member not found or you are not authorized to view this profile.';
        this.cdr.detectChanges();
      }
    });
  }

  loadMonthlyAttendance(): void {
    this.isLoadingAttendance = true;

    this.staffService
      .getMonthlyAttendance(this.staffId, this.currentYear, this.currentMonth)
      .subscribe({
        next: (res) => {
          if (res.summary) {
            this.summary = res.summary;
          }
          this.buildCalendarGrid(res.attendance || []);
          this.isLoadingAttendance = false;
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.isLoadingAttendance = false;
          this.showToast(err?.error?.message || 'Failed to load attendance records.', true);
          this.cdr.detectChanges();
        }
      });
  }

  private buildCalendarGrid(attendanceRecords: AttendanceRecord[]): void {
    const grid: (CalendarDay | null)[] = [];
    
    // First day of displayed month (0 = Sun, 1 = Mon, ..., 6 = Sat)
    const firstDayIndex = new Date(this.currentYear, this.currentMonth - 1, 1).getDay();
    // Adjust to Monday-first (0 = Mon, ..., 6 = Sun)
    const emptyCellsBefore = (firstDayIndex + 6) % 7;

    for (let i = 0; i < emptyCellsBefore; i++) {
      grid.push(null);
    }

    const recordMap = new Map<string, AttendanceRecord>();
    attendanceRecords.forEach((r) => recordMap.set(r.date, r));

    const daysInMonth = new Date(this.currentYear, this.currentMonth, 0).getDate();

    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${this.currentYear}-${String(this.currentMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const rec = recordMap.get(dateStr);
      const isFuture = dateStr > this.todayDateStr;
      const isToday = dateStr === this.todayDateStr;

      grid.push({
        date: dateStr,
        dayNumber: day,
        status: rec?.status || (isFuture ? null : 'PRESENT'),
        isFuture,
        isToday
      });
    }

    this.calendarDays = grid;
  }

  // Month Navigation
  prevMonth(): void {
    if (this.currentMonth === 1) {
      this.currentMonth = 12;
      this.currentYear--;
    } else {
      this.currentMonth--;
    }
    this.loadMonthlyAttendance();
  }

  nextMonth(): void {
    if (this.isNextMonthDisabled()) return;

    if (this.currentMonth === 12) {
      this.currentMonth = 1;
      this.currentYear++;
    } else {
      this.currentMonth++;
    }
    this.loadMonthlyAttendance();
  }

  isNextMonthDisabled(): boolean {
    const now = new Date();
    const realYear = now.getFullYear();
    const realMonth = now.getMonth() + 1;

    // Disallow navigating past the current real month
    if (this.currentYear > realYear) return true;
    if (this.currentYear === realYear && this.currentMonth >= realMonth) return true;
    return false;
  }

  getMonthName(): string {
    const date = new Date(this.currentYear, this.currentMonth - 1, 1);
    return date.toLocaleString('default', { month: 'long', year: 'numeric' });
  }

  // Click date cell to edit
  onDateClick(day: CalendarDay): void {
    if (day.isFuture) {
      this.showToast('Future attendance cannot be marked.', true);
      return;
    }

    this.selectedDay = day;
    this.selectedStatus = day.status || 'PRESENT';
    this.showAttendanceModal = true;
    this.cdr.detectChanges();
  }

  selectStatus(status: AttendanceStatus): void {
    this.selectedStatus = status;
    this.cdr.detectChanges();
  }

  closeAttendanceModal(): void {
    if (this.isUpdatingAttendance) return;
    this.showAttendanceModal = false;
    this.selectedDay = null;
    this.cdr.detectChanges();
  }

  saveAttendance(): void {
    if (!this.selectedDay) return;

    this.isUpdatingAttendance = true;
    const dateStr = this.selectedDay.date;
    const newStatus = this.selectedStatus;

    this.staffService
      .updateAttendance(this.staffId, dateStr, newStatus)
      .subscribe({
        next: (res) => {
          this.isUpdatingAttendance = false;
          if (this.selectedDay) {
            this.selectedDay.status = newStatus;
          }
          this.closeAttendanceModal();
          this.showToast(`Attendance updated to ${newStatus} for ${dateStr}!`);
          // Refresh monthly attendance to keep exact summary counts updated
          this.loadMonthlyAttendance();
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.isUpdatingAttendance = false;
          this.showToast(err?.error?.message || 'Failed to update attendance.', true);
          this.cdr.detectChanges();
        }
      });
  }

  goBack(): void {
    this.router.navigate(['/home/staff']);
  }

  private showToast(message: string, isError: boolean = false): void {
    if (isError) {
      this.errorMessage = message;
      this.cdr.detectChanges();
      setTimeout(() => {
        this.errorMessage = null;
        this.cdr.detectChanges();
      }, 4000);
    } else {
      this.successMessage = message;
      this.cdr.detectChanges();
      setTimeout(() => {
        this.successMessage = null;
        this.cdr.detectChanges();
      }, 3500);
    }
  }
}
