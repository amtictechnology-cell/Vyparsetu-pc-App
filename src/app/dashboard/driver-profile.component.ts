import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-driver-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './driver-profile.component.html',
  styleUrl: './dashboard.shared.css'
})
export class DriverProfileComponent implements OnInit {
  driverId: string = '';
  driver: any = null;
  entries: any[] = [];
  loading: boolean = false;
  loadingEntries: boolean = false;

  // Add / Edit Entry Modal States
  showAddEntryModal: boolean = false;
  isEditingEntry: boolean = false;
  editingEntry: any = null;

  // Edit Driver Profile Modal States
  showEditDriverModal: boolean = false;
  editDriverSRnumber: string = '';
  editDriverName: string = '';
  editDriverCarNumber: string = '';
  editDriverMobileNumber: string = '';
  editDriverCity: string = '';
  editDriverState: string = '';
  editDriverPincode: string = '';
  editDriverStatus: string = 'active';
  submittingDriverEdit: boolean = false;

  driverCommisionAmount: number = 0;
  partyAmount: number = 0;
  description: string = '';
  foodTaken: boolean = false;
  entryStatus: string = 'pending';
  entryDate: string = '';
  submittingEntry: boolean = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.driverId = params['driverId'];
      if (this.driverId) {
        this.fetchDriverAndEntries();
      } else {
        alert('Driver ID is missing in request.');
        this.goBack();
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/home/drivers']);
  }

  fetchDriverAndEntries(): void {
    this.loading = true;
    this.loadingEntries = true;
    this.cdr.detectChanges();

    this.authService.getDrivers().subscribe({
      next: (res) => {
        const list = res?.drivers || [];
        this.driver = list.find((d: any) => d.driverId === this.driverId);
        if (!this.driver) {
          console.warn('Driver profile not found');
        }
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Failed to fetch driver:', err);
        this.loading = false;
        this.cdr.detectChanges();
      }
    });

    // 2. Fetch Entries
    this.fetchEntriesOnly();
  }

  fetchEntriesOnly(): void {
    this.loadingEntries = true;
    this.cdr.detectChanges();

    this.authService.getDriverEntries({ driverId: this.driverId }).subscribe({
      next: (res) => {
        this.entries = res?.drivers || [];
        this.loadingEntries = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Failed to fetch driver entries:', err);
        this.loadingEntries = false;
        this.cdr.detectChanges();
      }
    });
  }

  openAddEntry(): void {
    this.isEditingEntry = false;
    this.editingEntry = null;
    this.driverCommisionAmount = 0;
    this.partyAmount = 0;
    this.description = '';
    this.foodTaken = false;
    this.entryStatus = 'pending';
    
    // Set local entryDate to current time local ISO string (yyyy-MM-ddTHH:mm)
    const now = new Date();
    const tzoffset = now.getTimezoneOffset() * 60000;
    this.entryDate = (new Date(now.getTime() - tzoffset)).toISOString().slice(0, 16);

    this.showAddEntryModal = true;
    this.cdr.detectChanges();
  }

  openEditEntry(entry: any): void {
    this.isEditingEntry = true;
    this.editingEntry = entry;
    this.driverCommisionAmount = entry.driverCommisionAmount || 0;
    this.partyAmount = entry.partyAmount || 0;
    this.description = entry.description || '';
    this.foodTaken = entry.foodTaken || false;
    this.entryStatus = entry.status || 'pending';

    // Parse date if valid, convert to ISO timezone local
    if (entry.entryDate) {
      try {
        const d = new Date(entry.entryDate);
        if (!isNaN(d.getTime())) {
          const tzoffset = d.getTimezoneOffset() * 60000;
          this.entryDate = (new Date(d.getTime() - tzoffset)).toISOString().slice(0, 16);
        } else {
          this.entryDate = '';
        }
      } catch (e) {
        this.entryDate = '';
      }
    } else {
      this.entryDate = '';
    }

    this.showAddEntryModal = true;
    this.cdr.detectChanges();
  }

  closeAddEntryModal(): void {
    this.showAddEntryModal = false;
    this.cdr.detectChanges();
  }

  onSubmitEntry(): void {
    if (!this.entryDate) {
      alert('Please select an entry date.');
      return;
    }

    this.submittingEntry = true;
    this.cdr.detectChanges();

    // Create entryDate string with timezone offset info
    const entryDateStr = new Date(this.entryDate).toISOString();

    const payload: any = {
      driverId: this.driverId,
      driverCommisionAmount: Number(this.driverCommisionAmount) || 0,
      partyAmount: Number(this.partyAmount) || 0,
      description: this.description.trim(),
      foodTaken: this.foodTaken,
      status: this.entryStatus,
      entryDate: entryDateStr
    };

    if (this.isEditingEntry && this.editingEntry) {
      payload.entryId = this.editingEntry.entryId;
      this.authService.editDriverEntry(payload).subscribe({
        next: (res) => {
          this.submittingEntry = false;
          this.closeAddEntryModal();
          alert('Driver entry updated successfully!');
          this.fetchEntriesOnly();
        },
        error: (err) => {
          console.error('Failed to update entry:', err);
          alert(err?.error?.message || 'Failed to update entry.');
          this.submittingEntry = false;
          this.cdr.detectChanges();
        }
      });
    } else {
      this.authService.addDriverEntry(payload).subscribe({
        next: (res) => {
          this.submittingEntry = false;
          this.closeAddEntryModal();
          alert('Driver entry added successfully!');
          this.fetchEntriesOnly();
        },
        error: (err) => {
          console.error('Failed to add entry:', err);
          alert(err?.error?.message || 'Failed to add entry.');
          this.submittingEntry = false;
          this.cdr.detectChanges();
        }
      });
    }
  }

  deleteEntry(entryId: string): void {
    if (confirm('Are you sure you want to delete this commission entry?')) {
      this.authService.deleteDriverEntry(entryId, this.driverId).subscribe({
        next: (res) => {
          alert('Driver entry deleted successfully!');
          this.fetchEntriesOnly();
        },
        error: (err) => {
          console.error('Failed to delete entry:', err);
          alert(err?.error?.message || 'Failed to delete entry.');
        }
      });
    }
  }

  formatBillDate(dateStr: any): string {
    if (!dateStr) return '';
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return dateStr;
      return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return dateStr;
    }
  }

  openEditDriver(): void {
    if (!this.driver) return;
    this.editDriverSRnumber = this.driver.SRnumber || '';
    this.editDriverName = this.driver.driverName || '';
    this.editDriverCarNumber = this.driver.carNumber || '';
    this.editDriverMobileNumber = this.driver.mobileNumber || '';
    this.editDriverCity = this.driver.address?.city || '';
    this.editDriverState = this.driver.address?.state || '';
    this.editDriverPincode = this.driver.address?.pincode || '';
    this.editDriverStatus = this.driver.status || 'active';
    this.showEditDriverModal = true;
    this.cdr.detectChanges();
  }

  closeEditDriverModal(): void {
    this.showEditDriverModal = false;
    this.cdr.detectChanges();
  }

  onSubmitDriverEdit(): void {
    if (!this.editDriverSRnumber || !this.editDriverName || !this.editDriverCarNumber || !this.editDriverMobileNumber) {
      alert('Name, Mobile, Vehicle number and SR number are required.');
      return;
    }

    this.submittingDriverEdit = true;
    this.cdr.detectChanges();

    const payload = {
      driverId: this.driverId,
      driverName: this.editDriverName.trim(),
      SRnumber: this.editDriverSRnumber.trim(),
      carNumber: this.editDriverCarNumber.trim(),
      mobileNumber: this.editDriverMobileNumber.trim(),
      address: {
        city: this.editDriverCity.trim(),
        state: this.editDriverState.trim(),
        pincode: this.editDriverPincode.trim()
      },
      status: this.editDriverStatus,
      isProfileUpdated: true
    };

    this.authService.editDriver(payload).subscribe({
      next: (res) => {
        this.submittingDriverEdit = false;
        this.closeEditDriverModal();
        alert('Driver profile updated successfully!');
        this.fetchDriverAndEntries();
      },
      error: (err) => {
        console.error('Failed to update driver profile:', err);
        alert(err?.error?.message || 'Failed to update driver details.');
        this.submittingDriverEdit = false;
        this.cdr.detectChanges();
      }
    });
  }

  get totalEntries(): number {
    return this.entries.length;
  }

  get totalCommission(): number {
    return this.entries.reduce((sum, e) => sum + (Number(e.driverCommisionAmount) || 0), 0);
  }

  get totalPartyAmount(): number {
    return this.entries.reduce((sum, e) => sum + (Number(e.partyAmount) || 0), 0);
  }
}
