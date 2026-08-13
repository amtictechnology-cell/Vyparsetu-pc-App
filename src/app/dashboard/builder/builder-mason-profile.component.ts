import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { BuilderService } from '../../services/builder.service';

@Component({
  selector: 'app-builder-mason-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  styles: [`
    .orange-input { width: 100%; padding: 10px; border: 1.5px solid #ced4da; border-radius: 6px; box-sizing: border-box; transition: all 0.3s; font-family: inherit; }
    .orange-input:focus, .orange-input:hover { border-color: #ff6600; outline: none; box-shadow: 0 0 0 3px rgba(255, 102, 0, 0.1); }
    .modal-backdrop { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; }
    .modal-content { background: white; width: 450px; border-radius: 12px; padding: 2rem; box-shadow: 0 10px 30px rgba(0,0,0,0.2); }
    .modal-header { background: #ff6600; color: white; padding: 1.5rem; margin: -2rem -2rem 1.5rem -2rem; border-radius: 12px 12px 0 0; }
    .status-badge { padding: 5px 12px; border-radius: 20px; font-weight: 600; font-size: 0.85rem; text-transform: capitalize; }
    .status-present { background: #eafbf1; color: #2b8a3e; border: 1px solid #b2f2bb; }
    .status-absent { background: #fff0f0; color: #e03131; border: 1px solid #ffc9c9; }
    .status-half-day { background: #fff4e6; color: #f59f00; border: 1px solid #ffe8cc; }
    
    @keyframes popIn { 0% { transform: translate(-50%, -50%) scale(0.5); opacity: 0; } 100% { transform: translate(-50%, -50%) scale(1); opacity: 1; } }
  `],
  template: `
    <div style="padding-bottom: 80px;">
      
      <div class="header-action-bar" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
        <h2 style="margin: 0; color: #343a40; display: flex; align-items: center;">
          <span style="cursor: pointer; color: #868e96; margin-right: 15px; font-size: 1.5rem;" (click)="goBack()">←</span>
          <div style="width: 45px; height: 45px; background: #fff4ed; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 1.2rem; color: #ff6600; font-weight: bold; margin-right: 15px;">
            {{ masonProfile?.name ? masonProfile.name.charAt(0).toUpperCase() : 'M' }}
          </div>
          <div>
            {{ masonProfile?.name || 'Loading...' }}
            <p style="margin: 3px 0 0 0; color: #868e96; font-size: 0.9rem; font-weight: 400;">
              Ph: {{ masonProfile?.mobile }} | {{ masonProfile?.address }}
            </p>
          </div>
        </h2>
      </div>

      <!-- Summary Banner -->
      <div style="display: flex; gap: 1rem; margin-bottom: 2rem;">
        <div style="flex: 1; background: #eafbf1; border: 1px solid #d3f9e2; border-radius: 8px; padding: 1.2rem; text-align: center;">
          <h4 style="margin: 0 0 5px 0; color: #2b8a3e; font-size: 0.9rem; text-transform: uppercase;">Total Present</h4>
          <p style="margin: 0; font-size: 1.8rem; font-weight: bold; color: #343a40;">{{ totalPresent }}</p>
        </div>
        <div style="flex: 1; background: #fff0f0; border: 1px solid #ffe3e3; border-radius: 8px; padding: 1.2rem; text-align: center;">
          <h4 style="margin: 0 0 5px 0; color: #e03131; font-size: 0.9rem; text-transform: uppercase;">Total Absent</h4>
          <p style="margin: 0; font-size: 1.8rem; font-weight: bold; color: #343a40;">{{ totalAbsent }}</p>
        </div>
        <div style="flex: 1; background: #fff9e6; border: 1px solid #ffecb3; border-radius: 8px; padding: 1.2rem; text-align: center;">
          <h4 style="margin: 0 0 5px 0; color: #f59f00; font-size: 0.9rem; text-transform: uppercase;">Total Half-Days</h4>
          <p style="margin: 0; font-size: 1.8rem; font-weight: bold; color: #343a40;">{{ totalHalfDays }}</p>
        </div>
      </div>

      <!-- Filters & Actions -->
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; background: white; padding: 15px; border-radius: 8px; border: 1px solid #dee2e6;">
        <div style="display: flex; gap: 15px; align-items: center;">
          <div>
            <label style="font-size: 0.85rem; color: #868e96; font-weight: 600; display: block; margin-bottom: 3px;">Start Date</label>
            <input type="date" class="orange-input" [(ngModel)]="filterStartDate" (change)="loadAttendance()" style="padding: 8px;">
          </div>
          <div>
            <label style="font-size: 0.85rem; color: #868e96; font-weight: 600; display: block; margin-bottom: 3px;">End Date</label>
            <input type="date" class="orange-input" [(ngModel)]="filterEndDate" (change)="loadAttendance()" style="padding: 8px;">
          </div>
          <button (click)="resetFilters()" style="background: transparent; border: 1px solid #ced4da; padding: 8px 15px; border-radius: 6px; cursor: pointer; color: #495057; font-weight: 600; margin-top: 20px;">Reset</button>
        </div>
        
        <button (click)="openAttendanceModal()" style="background: #ff6600; color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer; font-weight: 600; margin-top: 20px;">
          + Mark Attendance
        </button>
      </div>

      <!-- Attendance Table -->
      <div class="table-responsive" style="background: white; border-radius: 12px; border: 1px solid #e9ecef; box-shadow: 0 2px 8px rgba(0,0,0,0.02);">
        <table class="data-table" style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr style="background-color: #f8f9fa; border-bottom: 2px solid #e9ecef;">
              <th style="padding: 1rem; text-align: left; color: #495057;">Date</th>
              <th style="padding: 1rem; text-align: left; color: #495057;">Status</th>
              <th style="padding: 1rem; text-align: right; color: #495057;">Action</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let record of attendanceRecords" style="border-bottom: 1px solid #e9ecef;">
              <td style="padding: 1rem; font-weight: 600; color: #343a40;">{{ record.date | date:'fullDate' }}</td>
              <td style="padding: 1rem;">
                <span class="status-badge" [ngClass]="{
                  'status-present': record.status === 'present',
                  'status-absent': record.status === 'absent',
                  'status-half-day': record.status === 'half-day'
                }">
                  {{ record.status }}
                </span>
              </td>
              <td style="padding: 1rem; text-align: right;">
                <button (click)="editAttendance(record)" style="background: #f8f9fa; color: #495057; border: 1px solid #ced4da; padding: 6px 12px; border-radius: 4px; cursor: pointer; font-size: 0.85rem; font-weight: 600;">Edit</button>
              </td>
            </tr>
            <tr *ngIf="attendanceRecords.length === 0">
              <td colspan="3" style="text-align: center; padding: 3rem 1rem; color: #868e96;">No attendance records found for this period.</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Mark/Edit Attendance Modal -->
      <div class="modal-backdrop" *ngIf="showModal">
        <div class="modal-content">
          <h3 class="modal-header">{{ isEditing ? 'Edit' : 'Mark' }} Attendance</h3>
          
          <div style="margin-bottom: 1.5rem;">
            <label style="display: block; margin-bottom: 0.5rem; color: #495057; font-weight: 600;">Date *</label>
            <input type="date" class="orange-input" [(ngModel)]="currentRecord.date" [disabled]="isEditing">
            <small *ngIf="isEditing" style="color: #868e96;">Date cannot be changed while editing a record.</small>
          </div>
          
          <div style="margin-bottom: 2rem;">
            <label style="display: block; margin-bottom: 0.5rem; color: #495057; font-weight: 600;">Status *</label>
            <select class="orange-input" [(ngModel)]="currentRecord.status">
              <option value="present">Present</option>
              <option value="absent">Absent</option>
              <option value="half-day">Half Day</option>
            </select>
          </div>

          <div style="display: flex; gap: 10px;">
            <button (click)="showModal = false" style="flex: 1; background: white; color: #495057; border: 1px solid #ced4da; padding: 12px; border-radius: 6px; font-weight: bold; cursor: pointer;">Cancel</button>
            <button (click)="saveAttendance()" [disabled]="saving" style="flex: 1; background: #ff6600; color: white; border: none; padding: 12px; border-radius: 6px; font-weight: bold; cursor: pointer;">
              {{ saving ? 'Saving...' : 'Save' }}
            </button>
          </div>
        </div>
      </div>

      <!-- Success Popup -->
      <div class="modal-backdrop" *ngIf="showSuccessPopup" style="background: rgba(0,0,0,0.3); z-index: 3000;">
        <div style="position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); background: white; padding: 25px 40px; border-radius: 12px; box-shadow: 0 15px 40px rgba(0,0,0,0.2); display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 15px; animation: popIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);">
          <div style="background: #ff6600; color: white; width: 60px; height: 60px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 30px;">
            <i class="fa-solid fa-check"></i>
          </div>
          <p style="color: #343a40; font-weight: 700; font-size: 1.2rem; margin: 0;">{{ successMessage }}</p>
        </div>
      </div>
      
    </div>
  `
})
export class BuilderMasonProfileComponent implements OnInit {
  masonId: string | null = null;
  masonProfile: any = null;
  
  attendanceRecords: any[] = [];
  
  // Stats
  totalPresent = 0;
  totalAbsent = 0;
  totalHalfDays = 0;

  // Filters
  filterStartDate = '';
  filterEndDate = '';

  showModal = false;
  isEditing = false;
  saving = false;
  showSuccessPopup = false;
  successMessage = '';

  currentRecord: any = {
    date: new Date().toISOString().split('T')[0],
    status: 'present'
  };

  private route = inject(ActivatedRoute);
  private builderService = inject(BuilderService);
  private cdr = inject(ChangeDetectorRef);

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      this.masonId = params['masonId'];
      if (this.masonId) {
        this.loadProfile();
        this.setDefaultDates();
        this.loadAttendance();
      }
    });
  }

  setDefaultDates() {
    const date = new Date();
    // Default to current month
    const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
    const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    
    this.filterStartDate = firstDay.toISOString().split('T')[0];
    this.filterEndDate = lastDay.toISOString().split('T')[0];
  }

  resetFilters() {
    this.setDefaultDates();
    this.loadAttendance();
  }

  goBack() {
    window.history.back();
  }

  loadProfile() {
    this.builderService.getMasons().subscribe(res => {
      let allMasons = res?.data || [];
      this.masonProfile = allMasons.find((m: any) => m._id === this.masonId) || null;
      this.cdr.detectChanges();
    });
  }

  loadAttendance() {
    if (!this.masonId) return;
    
    this.builderService.getMasonAttendance(this.masonId, this.filterStartDate, this.filterEndDate).subscribe(res => {
      this.attendanceRecords = res?.data || [];
      
      // Sort newest first
      this.attendanceRecords.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      
      this.calculateStats();
      this.cdr.detectChanges();
    });
  }

  calculateStats() {
    this.totalPresent = this.attendanceRecords.filter(r => r.status === 'present').length;
    this.totalAbsent = this.attendanceRecords.filter(r => r.status === 'absent').length;
    this.totalHalfDays = this.attendanceRecords.filter(r => r.status === 'half-day').length;
  }

  openAttendanceModal() {
    this.isEditing = false;
    this.currentRecord = {
      date: new Date().toISOString().split('T')[0],
      status: 'present'
    };
    this.showModal = true;
  }

  editAttendance(record: any) {
    this.isEditing = true;
    this.currentRecord = {
      _id: record._id,
      date: new Date(record.date).toISOString().split('T')[0],
      status: record.status
    };
    this.showModal = true;
  }

  saveAttendance() {
    if (!this.masonId) return;
    
    if (!this.currentRecord.date || !this.currentRecord.status) {
      alert("Date and Status are required.");
      return;
    }

    this.saving = true;

    if (this.isEditing) {
      this.builderService.updateMasonAttendance(this.currentRecord._id, { status: this.currentRecord.status }).subscribe({
        next: () => {
          this.handleSuccess('Attendance Updated!');
        },
        error: () => {
          alert("Error updating attendance");
          this.saving = false;
        }
      });
    } else {
      const payload = {
        masonId: this.masonId,
        date: new Date(this.currentRecord.date).toISOString(),
        status: this.currentRecord.status
      };
      
      this.builderService.markMasonAttendance(payload).subscribe({
        next: () => {
          this.handleSuccess('Attendance Marked!');
        },
        error: () => {
          alert("Error marking attendance");
          this.saving = false;
        }
      });
    }
  }

  handleSuccess(msg: string) {
    this.saving = false;
    this.showModal = false;
    this.loadAttendance();
    
    this.successMessage = msg;
    this.showSuccessPopup = true;
    this.cdr.detectChanges();
    
    setTimeout(() => {
      this.showSuccessPopup = false;
      this.cdr.detectChanges();
    }, 1000);
  }
}
