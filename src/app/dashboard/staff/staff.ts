import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-staff',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './staff.html',
})
export class StaffComponent implements OnInit {
  staffList: any[] = [];
  loadingStaff: boolean = false;
  showAddStaffModal: boolean = false;
  staffSearchQuery: string = '';
  successMessage: string = '';
  errorMessage: string = '';

  newStaffName: string = '';
  newStaffMobile: string = '';
  newStaffAddress: string = '';
  newStaffSalary: number = 0;

  constructor(
    private authService: AuthService,
    private router: Router,
    public cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.fetchStaff();
  }

  fetchStaff(): void {
    this.loadingStaff = true;
    this.authService.getStaff().subscribe({
      next: (res) => {
        this.staffList = res?.data || [];
        this.loadingStaff = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Failed to fetch staff:', err);
        this.loadingStaff = false;
        this.cdr.detectChanges();
      }
    });
  }

  addStaff(): void {
    if (!this.newStaffName || !this.newStaffMobile || !this.newStaffAddress || !this.newStaffSalary) {
      this.errorMessage = 'Name, Mobile, Address, and Salary are required.';
      return;
    }
    const payload = {
      name: this.newStaffName.trim(),
      mobile: this.newStaffMobile.trim(),
      address: this.newStaffAddress.trim(),
      salary: Number(this.newStaffSalary)
    };

    this.authService.addStaff(payload).subscribe({
      next: (res) => {
        this.successMessage = `Staff ${this.newStaffName} registered successfully.`;
        this.showAddStaffModal = false;
        this.resetForm();
        this.fetchStaff();
        setTimeout(() => { this.successMessage = ''; this.cdr.detectChanges(); }, 3000);
      },
      error: (err) => {
        this.errorMessage = err?.error?.message || 'Failed to add staff.';
        this.cdr.detectChanges();
        setTimeout(() => { this.errorMessage = ''; this.cdr.detectChanges(); }, 3000);
      }
    });
  }

  resetForm(): void {
    this.newStaffName = '';
    this.newStaffMobile = '';
    this.newStaffAddress = '';
    this.newStaffSalary = 0;
  }

  get filteredStaffList(): any[] {
    const q = this.staffSearchQuery.trim().toLowerCase();
    if (!q) return this.staffList;
    return this.staffList.filter(s => {
      const name = s.name ? String(s.name).toLowerCase() : '';
      const mobile = s.mobile ? String(s.mobile).toLowerCase() : '';
      const addr = s.address ? String(s.address).toLowerCase() : '';
      return name.includes(q) || mobile.includes(q) || addr.includes(q);
    });
  }

  deleteStaff(staffId: string | undefined): void {
    if (!staffId) return;
    if (confirm('Are you sure you want to delete this staff member?')) {
      this.authService.deleteStaff(staffId).subscribe({
        next: (res) => {
          alert('Staff member deleted successfully');
          this.fetchStaff();
        },
        error: (err) => alert(err?.error?.message || 'Failed to delete staff.')
      });
    }
  }

  openStaffProfile(staff: any): void {
    this.router.navigate(['/staff-profile'], { queryParams: { staffId: staff.staffId } });
  }
}
