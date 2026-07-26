import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-staff-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './staff-profile.component.html',
  styleUrl: './dashboard.shared.css'
})
export class StaffProfileComponent implements OnInit {
  staffId: string = '';
  staff: any = null;
  attendanceList: any[] = [];
  loading: boolean = false;
  loadingAttendance: boolean = false;

  // Month & Year Filter
  selectedMonth: number = new Date().getMonth() + 1;
  selectedYear: number = new Date().getFullYear();
  months = [
    { value: 1, name: 'January' },
    { value: 2, name: 'February' },
    { value: 3, name: 'March' },
    { value: 4, name: 'April' },
    { value: 5, name: 'May' },
    { value: 6, name: 'June' },
    { value: 7, name: 'July' },
    { value: 8, name: 'August' },
    { value: 9, name: 'September' },
    { value: 10, name: 'October' },
    { value: 11, name: 'November' },
    { value: 12, name: 'December' }
  ];
  years: number[] = [];

  // Stats
  daysPresent: number = 0;
  daysHalfDay: number = 0;
  daysPaidLeave: number = 0;
  daysAbsent: number = 0;
  daysUnmarked: number = 0;
  earnedSalary: number = 0;

  // Calendar Days
  calendarDays: any[] = [];

  // Edit Profile Modal States
  showEditStaffModal: boolean = false;
  editStaffName: string = '';
  editStaffMobile: string = '';
  editStaffAddress: string = '';
  editStaffSalary: number = 0;
  submittingStaffEdit: boolean = false;

  // Attendance Modal States
  showAttendanceModal: boolean = false;
  attendanceDate: string = '';
  attendanceStatus: string = 'P';
  isExistingRecord: boolean = false;
  submittingAttendance: boolean = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService,
    public cdr: ChangeDetectorRef
  ) {
    const currentYear = new Date().getFullYear();
    for (let y = currentYear - 2; y <= currentYear + 2; y++) {
      this.years.push(y);
    }
  }

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.staffId = params['staffId'];
      if (this.staffId) {
        this.fetchStaffAndAttendance();
      } else {
        alert('Staff ID is missing in request.');
        this.goBack();
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/home/staff']);
  }

  fetchStaffAndAttendance(): void {
    this.loading = true;
    this.loadingAttendance = true;
    this.cdr.detectChanges();

    // 1. Fetch Staff details
    this.authService.getStaff().subscribe({
      next: (res) => {
        const list = res?.data || [];
        this.staff = list.find((s: any) => s.staffId === this.staffId);
        if (!this.staff) {
          console.warn('Staff profile not found');
        }
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Failed to fetch staff:', err);
        this.loading = false;
        this.cdr.detectChanges();
      }
    });

    // 2. Fetch Attendance
    this.fetchAttendanceOnly();
  }

  fetchAttendanceOnly(): void {
    this.loadingAttendance = true;
    this.cdr.detectChanges();

    this.authService.getAttendance({
      staffId: this.staffId,
      month: this.selectedMonth,
      year: this.selectedYear
    }).subscribe({
      next: (res) => {
        this.attendanceList = res?.data || [];
        this.generateCalendarDays();
        this.loadingAttendance = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Failed to fetch attendance:', err);
        this.loadingAttendance = false;
        this.cdr.detectChanges();
      }
    });
  }

  generateCalendarDays(): void {
    const daysInMonth = new Date(this.selectedYear, this.selectedMonth, 0).getDate();
    const days: any[] = [];
    
    let presentCount = 0;
    let halfDayCount = 0;
    let paidLeaveCount = 0;
    let absentCount = 0;
    let unmarkedCount = 0;
    let totalSalary = 0;

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(this.selectedYear, this.selectedMonth - 1, day);
      // Format as Local Date String (yyyy-MM-dd)
      const dateStr = this.getLocalDateString(date);

      // Find attendance record for this date
      const record = this.attendanceList.find(r => {
        const rDate = new Date(r.date);
        return rDate.getDate() === day && rDate.getMonth() === (this.selectedMonth - 1) && rDate.getFullYear() === this.selectedYear;
      });

      if (record) {
        if (record.status === 'P') presentCount++;
        else if (record.status === 'HD') halfDayCount++;
        else if (record.status === 'PL') paidLeaveCount++;
        else if (record.status === 'A') absentCount++;
        totalSalary += record.dailySalaryAmount || 0;
      } else {
        unmarkedCount++;
      }

      days.push({
        day,
        dateStr,
        record
      });
    }

    this.calendarDays = days;
    this.daysPresent = presentCount;
    this.daysHalfDay = halfDayCount;
    this.daysPaidLeave = paidLeaveCount;
    this.daysAbsent = absentCount;
    this.daysUnmarked = unmarkedCount;
    this.earnedSalary = Math.round(totalSalary);
  }

  getLocalDateString(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  openEditStaff(): void {
    if (!this.staff) return;
    this.editStaffName = this.staff.name || '';
    this.editStaffMobile = this.staff.mobile || '';
    this.editStaffAddress = this.staff.address || '';
    this.editStaffSalary = this.staff.salary || 0;
    this.showEditStaffModal = true;
    this.cdr.detectChanges();
  }

  closeEditStaffModal(): void {
    this.showEditStaffModal = false;
    this.cdr.detectChanges();
  }

  onSubmitStaffEdit(): void {
    if (!this.editStaffName || !this.editStaffMobile || !this.editStaffAddress || !this.editStaffSalary) {
      alert('All details are required.');
      return;
    }

    this.submittingStaffEdit = true;
    this.cdr.detectChanges();

    const payload = {
      staffId: this.staffId,
      name: this.editStaffName.trim(),
      mobile: this.editStaffMobile.trim(),
      address: this.editStaffAddress.trim(),
      salary: Number(this.editStaffSalary)
    };

    this.authService.editStaff(payload).subscribe({
      next: (res) => {
        this.submittingStaffEdit = false;
        this.closeEditStaffModal();
        alert('Staff profile updated successfully!');
        this.fetchStaffAndAttendance();
      },
      error: (err) => {
        console.error('Failed to update staff:', err);
        alert(err?.error?.message || 'Failed to update details.');
        this.submittingStaffEdit = false;
        this.cdr.detectChanges();
      }
    });
  }

  openMarkAttendance(dayObj: any): void {
    this.attendanceDate = dayObj.dateStr;
    if (dayObj.record) {
      this.isExistingRecord = true;
      this.attendanceStatus = dayObj.record.status;
    } else {
      this.isExistingRecord = false;
      this.attendanceStatus = 'P';
    }
    this.showAttendanceModal = true;
    this.cdr.detectChanges();
  }

  closeAttendanceModal(): void {
    this.showAttendanceModal = false;
    this.cdr.detectChanges();
  }

  onSubmitAttendance(): void {
    this.submittingAttendance = true;
    this.cdr.detectChanges();

    const payload = {
      staffId: this.staffId,
      date: this.attendanceDate,
      status: this.attendanceStatus
    };

    if (this.isExistingRecord) {
      this.authService.editAttendance(payload).subscribe({
        next: (res) => {
          this.submittingAttendance = false;
          this.closeAttendanceModal();
          this.fetchAttendanceOnly();
        },
        error: (err) => {
          console.error('Failed to edit attendance:', err);
          alert(err?.error?.message || 'Failed to update attendance.');
          this.submittingAttendance = false;
          this.cdr.detectChanges();
        }
      });
    } else {
      this.authService.markAttendance(payload).subscribe({
        next: (res) => {
          this.submittingAttendance = false;
          this.closeAttendanceModal();
          this.fetchAttendanceOnly();
        },
        error: (err) => {
          console.error('Failed to mark attendance:', err);
          alert(err?.error?.message || 'Failed to mark attendance.');
          this.submittingAttendance = false;
          this.cdr.detectChanges();
        }
      });
    }
  }

  formatShortDate(dateStr: string): string {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString([], { day: 'numeric', month: 'short' });
    } catch (e) {
      return dateStr;
    }
  }
}
