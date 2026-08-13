import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { BuilderService } from '../../services/builder.service';

@Component({
  selector: 'app-builder-mason',
  standalone: true,
  imports: [CommonModule, FormsModule],
  styles: [`
    .mason-card { background: white; border: 1px solid #e9ecef; border-radius: 12px; padding: 1.5rem; transition: all 0.3s; box-shadow: 0 4px 6px rgba(0,0,0,0.02); display: flex; flex-direction: column; cursor: pointer; }
    .mason-card:hover { transform: translateY(-3px); box-shadow: 0 10px 20px rgba(255, 102, 0, 0.08); border-color: #ff6600; }
    .floating-btn { position: fixed; bottom: 30px; right: 30px; background: #ff6600; color: white; border: none; width: 60px; height: 60px; border-radius: 50%; font-size: 30px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 15px rgba(255,102,0,0.4); cursor: pointer; transition: 0.3s; z-index: 1000; }
    .floating-btn:hover { transform: scale(1.1); background: #e85d00; }
    
    /* Modal Styles */
    .modal-backdrop { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; }
    .modal-content { background: white; width: 450px; border-radius: 12px; padding: 2rem; box-shadow: 0 10px 30px rgba(0,0,0,0.2); }
    .modal-header { background: #ff6600; color: white; padding: 1.5rem; margin: -2rem -2rem 1.5rem -2rem; border-radius: 12px 12px 0 0; }
    .form-group { margin-bottom: 1.2rem; }
    .form-group label { display: block; margin-bottom: 0.5rem; color: #495057; font-weight: 600; font-size: 0.9rem; }
    .orange-input { width: 100%; padding: 10px 12px; border: 1.5px solid #ced4da; border-radius: 6px; box-sizing: border-box; transition: all 0.3s; font-family: inherit; }
    .orange-input:focus, .orange-input:hover { border-color: #ff6600; outline: none; box-shadow: 0 0 0 3px rgba(255, 102, 0, 0.1); }
    .submit-btn { width: 100%; background: #ff6600; color: white; border: none; padding: 12px; border-radius: 6px; font-weight: bold; cursor: pointer; font-size: 1rem; margin-top: 10px; transition: background 0.3s; }
    .submit-btn:hover { background: #e85d00; }
    .cancel-btn { width: 100%; background: white; color: #495057; border: 1px solid #ced4da; padding: 12px; border-radius: 6px; font-weight: bold; cursor: pointer; font-size: 1rem; margin-top: 10px; transition: background 0.3s; }
    .cancel-btn:hover { background: #f8f9fa; }
    
    @keyframes popIn { 0% { transform: translate(-50%, -50%) scale(0.5); opacity: 0; } 100% { transform: translate(-50%, -50%) scale(1); opacity: 1; } }
  `],
  template: `
    <div style="padding-bottom: 80px;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem;">
        <div>
          <h2 style="margin: 0; color: #343a40; font-size: 1.8rem; font-weight: 700;">Mason & Labour Management</h2>
          <p style="color: #868e96; margin: 5px 0 0 0;">Manage your site workers, masons, and their attendance</p>
        </div>
      </div>

      <!-- Loading State -->
      <div *ngIf="loading" style="text-align: center; padding: 3rem; color: #868e96;">
        <p>Loading masons...</p>
      </div>

      <!-- Grid Layout for Masons -->
      <div *ngIf="!loading && masons.length > 0" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 1.5rem;">
        <div class="mason-card" *ngFor="let mason of masons" (click)="openProfile(mason)">
          <div style="display: flex; align-items: center; margin-bottom: 1rem;">
            <div style="width: 50px; height: 50px; background: #fff4ed; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 1.5rem; color: #ff6600; font-weight: bold; margin-right: 15px;">
              {{ mason.name ? mason.name.charAt(0).toUpperCase() : 'M' }}
            </div>
            <div>
              <h3 style="margin: 0; color: #343a40; font-size: 1.2rem;">{{ mason.name }}</h3>
              <p style="margin: 3px 0 0 0; color: #868e96; font-size: 0.9rem;">
                <span [style.color]="mason.status === 'inactive' ? '#e03131' : '#2b8a3e'">●</span> 
                {{ mason.status === 'inactive' ? 'Inactive' : 'Active' }}
              </p>
            </div>
          </div>
          
          <div style="flex-grow: 1;">
            <p style="margin: 8px 0; color: #495057; font-size: 0.95rem; display: flex; align-items: center;">
              <i class="fa-solid fa-phone" style="width: 25px; color: #adb5bd;"></i> {{ mason.mobile || 'N/A' }}
            </p>
            <p style="margin: 8px 0; color: #495057; font-size: 0.95rem; display: flex; align-items: center;">
              <i class="fa-solid fa-location-dot" style="width: 25px; color: #adb5bd;"></i> {{ mason.address || 'N/A' }}
            </p>
          </div>
          
          <div style="border-top: 1px solid #e9ecef; padding-top: 12px; margin-top: 15px; display: flex; justify-content: space-between; align-items: center;">
            <span style="color: #ff6600; font-size: 0.9rem; font-weight: 600;">View Profile & Attendance →</span>
            
            <button (click)="editMason(mason); $event.stopPropagation()" style="background: none; border: none; color: #495057; cursor: pointer; padding: 5px;">
              <i class="fa-solid fa-pen-to-square"></i>
            </button>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div *ngIf="!loading && masons.length === 0" style="text-align: center; padding: 4rem 2rem; background: white; border-radius: 12px; border: 1px dashed #ced4da;">
        <div style="font-size: 3rem; color: #dee2e6; margin-bottom: 1rem;"><i class="fa-solid fa-users-gear"></i></div>
        <h3 style="color: #495057; margin-bottom: 0.5rem;">No Masons Found</h3>
        <p style="color: #868e96; margin-bottom: 1.5rem;">Add masons/labours to track their daily attendance.</p>
        <button (click)="openAddModal()" style="background: #ff6600; color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer; font-weight: 600;">Add First Mason</button>
      </div>
      
      <!-- Floating Action Button -->
      <button class="floating-btn" (click)="openAddModal()" *ngIf="masons.length > 0">
        <i class="fa-solid fa-plus"></i>
      </button>

      <!-- Add/Edit Modal -->
      <div class="modal-backdrop" *ngIf="showModal">
        <div class="modal-content">
          <h3 class="modal-header">{{ isEditing ? 'Edit' : 'Add' }} Mason & Labour</h3>
          
          <div class="form-group">
            <label>Name *</label>
            <input type="text" class="orange-input" [(ngModel)]="currentMason.name" placeholder="E.g. Ramesh Kumar">
          </div>
          
          <div class="form-group">
            <label>Mobile Number *</label>
            <input type="text" class="orange-input" [(ngModel)]="currentMason.mobile" placeholder="E.g. 9876543210">
          </div>
          
          <div class="form-group">
            <label>Address</label>
            <textarea class="orange-input" [(ngModel)]="currentMason.address" placeholder="E.g. Sector 12" rows="2"></textarea>
          </div>

          <div class="form-group" *ngIf="isEditing">
            <label>Status</label>
            <select class="orange-input" [(ngModel)]="currentMason.status">
              <option value="active">Active</option>
              <option value="inactive">Inactive (Left Work)</option>
            </select>
          </div>

          <button class="submit-btn" (click)="saveMason()" [disabled]="saving">
            {{ saving ? 'Saving...' : (isEditing ? 'Update Mason' : 'Add Mason') }}
          </button>
          <button class="cancel-btn" (click)="showModal = false">Cancel</button>
          
          <div style="text-align: center; margin-top: 15px;" *ngIf="isEditing">
             <a href="javascript:void(0)" (click)="deleteMason(currentMason._id)" style="color: #e03131; font-size: 0.9rem; text-decoration: none;">Delete this Mason</a>
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
export class BuilderMasonComponent implements OnInit {
  masons: any[] = [];
  loading = true;
  showModal = false;
  saving = false;
  isEditing = false;
  
  showSuccessPopup = false;
  successMessage = '';

  currentMason: any = {
    name: '',
    mobile: '',
    address: '',
    status: 'active'
  };

  private builderService = inject(BuilderService);
  private cdr = inject(ChangeDetectorRef);
  private router = inject(Router);

  ngOnInit() {
    this.fetchMasons();
  }

  fetchMasons() {
    this.loading = true;
    this.builderService.getMasons().subscribe({
      next: (res) => {
        this.masons = res?.data || [];
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  openAddModal() {
    this.isEditing = false;
    this.currentMason = { name: '', mobile: '', address: '', status: 'active' };
    this.showModal = true;
  }

  editMason(mason: any) {
    this.isEditing = true;
    this.currentMason = { ...mason };
    if (!this.currentMason.status) this.currentMason.status = 'active';
    this.showModal = true;
  }

  saveMason() {
    if (!this.currentMason.name || !this.currentMason.mobile) {
      alert("Name and Mobile are required.");
      return;
    }

    this.saving = true;

    if (this.isEditing) {
      this.builderService.editMason(this.currentMason._id, this.currentMason).subscribe({
        next: () => {
          this.handleSuccess('Mason Updated Successfully!');
        },
        error: () => {
          alert("Error updating mason");
          this.saving = false;
        }
      });
    } else {
      this.builderService.createMason(this.currentMason).subscribe({
        next: () => {
          this.handleSuccess('Mason Added Successfully!');
        },
        error: () => {
          alert("Error adding mason");
          this.saving = false;
        }
      });
    }
  }

  deleteMason(id: string) {
    if (confirm("Are you sure you want to delete this mason?")) {
      this.builderService.deleteMason(id).subscribe({
        next: () => {
          this.showModal = false;
          this.fetchMasons();
        }
      });
    }
  }

  handleSuccess(msg: string) {
    this.saving = false;
    this.showModal = false;
    this.fetchMasons();
    
    this.successMessage = msg;
    this.showSuccessPopup = true;
    this.cdr.detectChanges();
    
    setTimeout(() => {
      this.showSuccessPopup = false;
      this.cdr.detectChanges();
    }, 1000);
  }

  openProfile(mason: any) {
    this.router.navigate(['/builder/mason-profile'], { queryParams: { masonId: mason._id } });
  }
}
