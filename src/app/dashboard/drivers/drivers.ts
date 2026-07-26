import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

interface Driver {
  driverId?: string;
  SRnumber: string;
  driverName: string;
  carNumber: string;
  mobileNumber: string;
  address: {
    city: string;
    state: string;
    pincode: string;
  };
  status?: string;
}

@Component({
  selector: 'app-drivers',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './drivers.html',
})
export class DriversComponent implements OnInit {
  drivers: Driver[] = [];
  loadingDrivers: boolean = false;
  showAddDriverModal: boolean = false;
  successMessage: string = '';
  errorMessage: string = '';

  newDriverSRnumber: string = '';
  newDriverName: string = '';
  newDriverCarNumber: string = '';
  newDriverMobileNumber: string = '';
  newDriverCity: string = '';
  newDriverState: string = '';
  newDriverPincode: string = '';

  constructor(
    private authService: AuthService,
    private router: Router,
    public cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.fetchDrivers();
  }

  fetchDrivers(): void {
    this.loadingDrivers = true;
    this.authService.getDrivers().subscribe({
      next: (res) => {
        this.drivers = res?.drivers || [];
        this.loadingDrivers = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Failed to fetch drivers:', err);
        this.loadingDrivers = false;
        this.cdr.detectChanges();
      }
    });
  }

  addDriver(): void {
    if (!this.newDriverSRnumber || !this.newDriverName || !this.newDriverCarNumber || !this.newDriverMobileNumber) {
      this.errorMessage = 'SR number, Name, Vehicle number, and Mobile number are required.';
      return;
    }
    const driverPayload = {
      SRnumber: this.newDriverSRnumber.trim(),
      driverName: this.newDriverName.trim(),
      carNumber: this.newDriverCarNumber.trim(),
      mobileNumber: this.newDriverMobileNumber.trim(),
      address: {
        city: this.newDriverCity.trim(),
        state: this.newDriverState.trim(),
        pincode: this.newDriverPincode.trim()
      }
    };

    this.authService.addDriver(driverPayload).subscribe({
      next: (res) => {
        this.successMessage = `Driver ${this.newDriverName} added successfully.`;
        this.showAddDriverModal = false;
        this.resetForm();
        this.fetchDrivers();
        setTimeout(() => { this.successMessage = ''; this.cdr.detectChanges(); }, 3000);
      },
      error: (err) => {
        this.errorMessage = err?.error?.message || 'Failed to register driver.';
        this.cdr.detectChanges();
        setTimeout(() => { this.errorMessage = ''; this.cdr.detectChanges(); }, 3000);
      }
    });
  }

  resetForm(): void {
    this.newDriverSRnumber = '';
    this.newDriverName = '';
    this.newDriverCarNumber = '';
    this.newDriverMobileNumber = '';
    this.newDriverCity = '';
    this.newDriverState = '';
    this.newDriverPincode = '';
  }

  toggleDriverStatus(driver: any): void {
    const newStatus = driver.status === 'active' ? 'inactive' : 'active';
    const payload = { driverId: driver.driverId, status: newStatus };
    this.authService.editDriver(payload).subscribe({
      next: (res) => this.fetchDrivers(),
      error: (err) => console.error('Failed to toggle status:', err)
    });
  }

  deleteDriver(driverId: string | undefined): void {
    if (!driverId) return;
    if (confirm('Are you sure you want to delete this driver?')) {
      this.authService.deleteDriver(driverId).subscribe({
        next: (res) => {
          alert('Driver deleted successfully');
          this.fetchDrivers();
        },
        error: (err) => alert(err?.error?.message || 'Failed to delete driver.')
      });
    }
  }

  openDriverProfile(driver: any): void {
    this.router.navigate(['/driver-profile'], { queryParams: { driverId: driver.driverId } });
  }
}
