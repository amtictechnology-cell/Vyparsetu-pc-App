import { Component, OnInit, Output, EventEmitter, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './profile.component.html',
  styleUrl: './dashboard.shared.css'
})
export class ProfileComponent implements OnInit {
  user: any = null;
  @Output() profileUpdated = new EventEmitter<any>();

  // Edit Modal States
  showEditModal: boolean = false;
  editName: string = '';
  editBusinessName: string = '';
  editBusinessCategory: string = 'hotel';
  editStreet: string = '';
  editCity: string = '';
  editState: string = '';
  editPincode: string = '';
  submitting: boolean = false;

  constructor(
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.authService.getProfile().subscribe({
      next: (res) => {
        this.user = res?.user;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Failed to load profile in ProfileComponent:', err);
      }
    });
  }

  openEdit(): void {
    if (!this.user) return;
    this.editName = this.user.name || '';
    this.editBusinessName = this.user.businessName || '';
    this.editBusinessCategory = this.user.businessCategory || 'hotel';
    this.editStreet = this.user.address?.street || '';
    this.editCity = this.user.address?.city || '';
    this.editState = this.user.address?.state || '';
    this.editPincode = this.user.address?.pincode || '';
    this.showEditModal = true;
    this.cdr.detectChanges();
  }

  closeEdit(): void {
    this.showEditModal = false;
    this.cdr.detectChanges();
  }

  onSubmit(): void {
    if (!this.editName || !this.editBusinessName || !this.editBusinessCategory) {
      alert('Name, Business Name, and Category are required.');
      return;
    }

    this.submitting = true;
    this.cdr.detectChanges();

    const payload = {
      userId: this.user.userId,
      name: this.editName.trim(),
      businessName: this.editBusinessName.trim(),
      businessCategory: this.editBusinessCategory,
      address: {
        street: this.editStreet.trim(),
        city: this.editCity.trim(),
        state: this.editState.trim(),
        pincode: this.editPincode.trim()
      }
    };

    this.authService.updateProfile(payload).subscribe({
      next: (res) => {
        this.submitting = false;
        this.closeEdit();
        alert('Profile updated successfully!');
        this.profileUpdated.emit(res?.user);
      },
      error: (err) => {
        console.error('Failed to update profile:', err);
        alert(err?.error?.message || 'Failed to update profile.');
        this.submitting = false;
        this.cdr.detectChanges();
      }
    });
  }

  getDaysLeft(expiresAtStr: string): number {
    if (!expiresAtStr) return 0;
    try {
      const expiresAt = new Date(expiresAtStr);
      const today = new Date();
      expiresAt.setHours(0,0,0,0);
      today.setHours(0,0,0,0);
      const diffTime = expiresAt.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays > 0 ? diffDays : 0;
    } catch (e) {
      return 0;
    }
  }

  formatDate(dateStr: any): string {
    if (!dateStr) return 'N/A';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString([], { day: 'numeric', month: 'long', year: 'numeric' });
    } catch (e) {
      return dateStr;
    }
  }
}
