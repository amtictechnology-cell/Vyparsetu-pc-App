import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BuilderService } from '../../services/builder.service';

@Component({
  selector: 'app-builder-ratelist',
  standalone: true,
  imports: [CommonModule, FormsModule],
  styles: [`
    .orange-input {
      width: 100%;
      padding: 10px;
      border: 1.5px solid #ced4da;
      border-radius: 6px;
      box-sizing: border-box;
      transition: all 0.3s;
    }
    .orange-input:focus, .orange-input:hover {
      border-color: #ff6600;
      outline: none;
      box-shadow: 0 0 0 3px rgba(255, 102, 0, 0.1);
    }
    .add-ratelist-fab {
      position: fixed;
      bottom: 30px;
      right: 30px;
      background: #ff6600;
      color: white;
      border: none;
      padding: 15px 25px;
      border-radius: 30px;
      font-size: 1.1rem;
      font-weight: 700;
      cursor: pointer;
      box-shadow: 0 4px 15px rgba(255, 102, 0, 0.4);
      transition: transform 0.2s;
      z-index: 100;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .add-ratelist-fab:hover {
      transform: translateY(-2px);
      background: #e65c00;
    }
    .modal-backdrop {
      position: fixed;
      top: 0; left: 0; width: 100%; height: 100%;
      background: rgba(0,0,0,0.5);
      display: flex; align-items: center; justify-content: center;
      z-index: 1000;
    }
    .modal-content {
      background: white;
      width: 450px;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 10px 30px rgba(0,0,0,0.2);
    }
    .modal-header {
      background: #ff6600;
      color: white;
      padding: 1.5rem;
      margin: 0;
    }
    .modal-body {
      padding: 2rem;
    }
    .success-popup {
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: white;
      padding: 25px 40px;
      border-radius: 12px;
      box-shadow: 0 15px 40px rgba(0,0,0,0.2);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 15px;
      z-index: 2000;
      animation: popIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    }
    .success-icon {
      background: #ff6600;
      color: white;
      width: 60px;
      height: 60px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 30px;
    }
    .success-text {
      color: #343a40;
      font-weight: 700;
      font-size: 1.2rem;
      margin: 0;
    }
    @keyframes popIn {
      0% { transform: translate(-50%, -50%) scale(0.5); opacity: 0; }
      100% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
    }
  `],
  template: `
    <!-- Success Popup -->
    <div class="modal-backdrop" *ngIf="showSuccessPopup" style="background: rgba(0,0,0,0.3);">
      <div class="success-popup">
        <div class="success-icon"><i class="fa-solid fa-check"></i></div>
        <p class="success-text">Rate Added Successfully!</p>
      </div>
    </div>

    <div class="header-action-bar" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem;">
      <h2 style="margin: 0; color: #343a40;">Builder Rate List</h2>
    </div>

    <!-- Rate List Table -->
    <div class="table-responsive" style="background: white; border-radius: 12px; border: 1px solid #e9ecef; box-shadow: 0 2px 8px rgba(0,0,0,0.02); margin-bottom: 80px;">
      <table class="data-table" style="width: 100%; border-collapse: collapse;">
        <thead>
          <tr style="background-color: #f8f9fa; border-bottom: 2px solid #e9ecef;">
            <th style="padding: 1rem; text-align: left; color: #495057;">Work Name</th>
            <th style="padding: 1rem; text-align: left; color: #495057;">Unit</th>
            <th style="padding: 1rem; text-align: left; color: #495057;">Rate (₹)</th>
            <th style="padding: 1rem; text-align: center; color: #495057;">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let rate of rateList" style="border-bottom: 1px solid #e9ecef;">
            <td style="padding: 1rem; font-weight: 600;">{{ rate.workName }}</td>
            <td style="padding: 1rem; color: #6c757d;">{{ rate.unit }}</td>
            <td style="padding: 1rem; font-weight: bold; color: #2b8a3e;">₹{{ rate.rate }}</td>
            <td style="padding: 1rem; text-align: center;">
              <button (click)="openEditModal(rate)" style="background: transparent; color: #0059ff; border: none; cursor: pointer; font-size: 1.2rem; margin-right: 10px;">✏️</button>
              <button (click)="deleteRate(rate._id)" style="background: transparent; color: #e03131; border: none; cursor: pointer; font-size: 1.2rem;">🗑️</button>
            </td>
          </tr>
          <tr *ngIf="rateList.length === 0 && !loading">
            <td colspan="4" style="text-align: center; padding: 3rem 1rem; color: #868e96;">
              <div style="font-size: 2.5rem; margin-bottom: 1rem;">📋</div>
              No rates added yet. Create a standard rate list for your works.
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div *ngIf="loading" style="text-align: center; padding: 2rem;">Loading rate list...</div>

    <!-- Static Bottom Button -->
    <button class="add-ratelist-fab" (click)="openAddModal()">
      <i class="fa-solid fa-plus"></i> Add Rate List
    </button>

    <!-- Add/Edit Modal -->
    <div class="modal-backdrop" *ngIf="showModal">
      <div class="modal-content">
        <h3 class="modal-header">{{ editMode ? 'Edit Rate' : 'Add Rate List' }}</h3>
        
        <div class="modal-body">
          <div class="form-group" style="margin-bottom: 1rem;">
            <label style="display: block; margin-bottom: 0.5rem; font-weight: 600; color: #495057;">Work Name</label>
            <input type="text" class="orange-input" [(ngModel)]="currentRate.workName" [disabled]="editMode" placeholder="e.g. Brick Work">
          </div>
          
          <div class="form-group" style="margin-bottom: 1rem;">
            <label style="display: block; margin-bottom: 0.5rem; font-weight: 600; color: #495057;">Unit</label>
            <select class="orange-input" [(ngModel)]="currentRate.unit">
              <option value="" disabled>Select Unit</option>
              <option value="Inch">Inch</option>
              <option value="Feet">Feet</option>
              <option value="cm">cm</option>
              <option value="sqft">sqft</option>
              <option value="sq meter">sq meter</option>
              <option value="running ft">running ft</option>
            </select>
          </div>

          <div class="form-group" style="margin-bottom: 1.5rem;">
            <label style="display: block; margin-bottom: 0.5rem; font-weight: 600; color: #495057;">Rate (₹)</label>
            <input type="number" class="orange-input" [(ngModel)]="currentRate.rate" placeholder="e.g. 150">
          </div>

          <div style="display: flex; justify-content: flex-end; gap: 10px;">
            <button (click)="showModal = false" style="background: #0059ff; color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer; font-weight: 600;">Cancel</button>
            <button (click)="saveRate()" [disabled]="saving" style="background: #ff6600; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer; color: white; font-weight: 600;">
              {{ saving ? 'Saving...' : 'Submit' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  `
})
export class BuilderRateListComponent implements OnInit {
  rateList: any[] = [];
  loading = false;
  showModal = false;
  saving = false;
  editMode = false;
  showSuccessPopup = false;
  
  currentRate = { _id: '', workName: '', unit: '', rate: null };

  private builderService = inject(BuilderService);
  private cdr = inject(ChangeDetectorRef);

  ngOnInit() {
    this.loadRateList();
  }

  loadRateList() {
    this.loading = true;
    this.builderService.getRateList().subscribe({
      next: (res) => {
        this.rateList = res?.data || [];
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Failed to load rates', err);
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  openAddModal() {
    this.editMode = false;
    this.currentRate = { _id: '', workName: '', unit: '', rate: null };
    this.showModal = true;
  }

  openEditModal(rate: any) {
    this.editMode = true;
    this.currentRate = { ...rate };
    this.showModal = true;
  }

  saveRate() {
    if (!this.currentRate.workName || !this.currentRate.unit || !this.currentRate.rate) {
      alert('All fields are required');
      return;
    }
    
    this.saving = true;
    
    if (this.editMode) {
      const payload = { rate: this.currentRate.rate, unit: this.currentRate.unit };
      this.builderService.editRate(this.currentRate._id, payload).subscribe({
        next: () => {
          this.saving = false;
          this.showModal = false;
          this.loadRateList();
        },
        error: () => {
          alert('Failed to update rate');
          this.saving = false;
        }
      });
    } else {
      const payload = { workName: this.currentRate.workName, unit: this.currentRate.unit, rate: this.currentRate.rate };
      this.builderService.addRate(payload).subscribe({
        next: () => {
          this.saving = false;
          this.showModal = false;
          this.showSuccessPopup = true;
          this.cdr.detectChanges();
          
          setTimeout(() => {
            this.showSuccessPopup = false;
            this.cdr.detectChanges();
          }, 1000);

          this.loadRateList();
        },
        error: () => {
          alert('Failed to add rate');
          this.saving = false;
        }
      });
    }
  }

  deleteRate(id: string) {
    if (confirm('Are you sure you want to delete this rate?')) {
      this.builderService.deleteRate(id).subscribe({
        next: () => this.loadRateList(),
        error: () => alert('Failed to delete rate')
      });
    }
  }
}
