import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { BuilderService } from '../../services/builder.service';

@Component({
  selector: 'app-builder-clients',
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
    .add-client-fab {
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
    .add-client-fab:hover {
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
    .error-text {
      color: #e03131;
      font-size: 0.85rem;
      margin-top: 5px;
      font-weight: 600;
    }
    @keyframes popIn {
      0% { transform: translate(-50%, -50%) scale(0.5); opacity: 0; }
      100% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
    }
  `],
  template: `
    <div style="padding: 1.5rem;">
      <div class="header-action-bar" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; flex-wrap: wrap; gap: 15px;">
        
        <div style="flex: 1; min-width: 200px;">
          <h2 style="margin: 0; color: #343a40; font-size: 1.8rem; font-weight: 700;">Builder Clients</h2>
        </div>
        
        <div style="flex: 2; display: flex; justify-content: center; min-width: 250px;">
          <div style="position: relative; width: 100%; max-width: 400px;">
            <i class="fa-solid fa-magnifying-glass" style="position: absolute; left: 15px; top: 50%; transform: translateY(-50%); color: #ff6600;"></i>
            <input type="text" placeholder="Search clients by name or mobile..." [(ngModel)]="searchQuery" style="width: 100%; padding: 10px 15px 10px 45px; border: 2px solid #ff6600; border-radius: 30px; outline: none; font-size: 0.95rem; box-sizing: border-box; transition: box-shadow 0.2s;" onfocus="this.style.boxShadow='0 0 0 4px rgba(255,102,0,0.1)'" onblur="this.style.boxShadow='none'">
          </div>
        </div>

        <div style="flex: 1; text-align: right; min-width: 150px;">
          <span style="background: #fff4ed; color: #ff6600; padding: 10px 20px; border-radius: 30px; font-weight: 700; font-size: 0.95rem; border: 1px solid #ffccb3;">
            Total Clients: {{ clients.length }}
          </span>
        </div>

      </div>

      <!-- Clients List -->
      <div class="table-responsive" style="background: white; border-radius: 12px; border: 1px solid #e9ecef; box-shadow: 0 4px 15px rgba(0,0,0,0.03); margin-bottom: 80px; overflow-x: auto;">
        <table class="data-table" style="width: 100%; border-collapse: collapse; font-family: 'Inter', sans-serif;">
          <thead>
            <tr style="background-color: #ff6600; color: white;">
              <th style="padding: 1.2rem 1.5rem; text-align: left; font-weight: 600; font-size: 1rem; border-top-left-radius: 10px;">Name</th>
              <th style="padding: 1.2rem 1.5rem; text-align: left; font-weight: 600; font-size: 1rem;">Mobile Number</th>
              <th style="padding: 1.2rem 1.5rem; text-align: left; font-weight: 600; font-size: 1rem;">Address</th>
              <th style="padding: 1.2rem 1.5rem; text-align: center; font-weight: 600; font-size: 1rem; border-top-right-radius: 10px;">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let client of filteredClients" style="border-bottom: 1px solid #e9ecef; transition: background 0.2s;">
              <td style="padding: 1.2rem 1.5rem; font-weight: 600; color: #343a40; font-size: 1.05rem;">{{ client.clientName || client.name }}</td>
              <td style="padding: 1.2rem 1.5rem; color: #495057; font-weight: 500;">{{ client.mobileNumber }}</td>
              <td style="padding: 1.2rem 1.5rem; color: #6c757d;">{{ client.address }}</td>
              <td style="padding: 1.2rem 1.5rem; text-align: center;">
                <button (click)="viewProfile(client._id || client.clientId)" style="background: #fff4ed; color: #ff6600; border: 1px solid #ffccb3; padding: 8px 16px; border-radius: 8px; cursor: pointer; font-weight: 600; font-size: 0.95rem; transition: 0.2s;">View Bills & Txn</button>
              </td>
            </tr>
            <tr *ngIf="filteredClients.length === 0 && !loading">
              <td colspan="4" style="text-align: center; padding: 4rem 1rem; color: #868e96;">
                <div style="font-size: 3rem; margin-bottom: 1rem; color: #dee2e6;"><i class="fa-solid fa-users"></i></div>
                <h3 style="color: #495057; margin-bottom: 0.5rem;">No clients found</h3>
                <p>Try a different search or add a new client.</p>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      
      <div *ngIf="loading" style="text-align: center; padding: 3rem; color: #868e96;">
        <p>Loading clients...</p>
      </div>
    </div>

    <!-- Static Bottom Button -->
    <button class="add-client-fab" (click)="showAddModal = true">
      <i class="fa-solid fa-plus"></i> Add Client
    </button>

    <!-- Add Client Modal -->
    <div class="modal-backdrop" *ngIf="showAddModal">
      <div class="modal-content">
        <h3 class="modal-header">Add New Client</h3>
        
        <div class="modal-body">
          <div *ngIf="validationError" style="background: #fff0f0; border-left: 4px solid #e03131; padding: 12px; margin-bottom: 15px; border-radius: 4px;">
            <p style="margin: 0; color: #e03131; font-weight: 600; font-size: 0.9rem;">
              <i class="fa-solid fa-circle-exclamation" style="margin-right: 5px;"></i> {{ validationError }}
            </p>
          </div>

          <div class="form-group" style="margin-bottom: 1.2rem;">
            <label style="display: block; margin-bottom: 0.5rem; font-weight: 600; color: #495057;">Client Name <span style="color: #e03131;">*</span></label>
            <input type="text" class="orange-input" [(ngModel)]="newClient.clientName" placeholder="Enter name" (input)="validationError = ''">
          </div>
          
          <div class="form-group" style="margin-bottom: 1.2rem;">
            <label style="display: block; margin-bottom: 0.5rem; font-weight: 600; color: #495057;">Mobile Number <span style="color: #e03131;">*</span></label>
            <input type="text" class="orange-input" [(ngModel)]="newClient.mobileNumber" placeholder="Enter mobile" (input)="validationError = ''">
          </div>

          <div class="form-group" style="margin-bottom: 2rem;">
            <label style="display: block; margin-bottom: 0.5rem; font-weight: 600; color: #495057;">Address</label>
            <textarea class="orange-input" [(ngModel)]="newClient.address" placeholder="Enter address" rows="2"></textarea>
          </div>

          <div style="display: flex; gap: 10px;">
            <button (click)="closeModal()" style="flex: 1; background: white; color: #495057; border: 1px solid #ced4da; padding: 12px; border-radius: 6px; cursor: pointer; font-weight: bold; font-size: 1rem;">Cancel</button>
            <button (click)="addClient()" [disabled]="saving" style="flex: 1; background: #ff6600; border: none; padding: 12px; border-radius: 6px; cursor: pointer; color: white; font-weight: bold; font-size: 1rem;">
              {{ saving ? 'Saving...' : 'Submit' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Success/Error Popups -->
    <div class="modal-backdrop" *ngIf="showPopup" style="background: rgba(0,0,0,0.3); z-index: 3000;">
      <div style="position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); background: white; padding: 25px 40px; border-radius: 12px; box-shadow: 0 15px 40px rgba(0,0,0,0.2); display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 15px; animation: popIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);">
        
        <div *ngIf="popupType === 'success'" style="background: #ff6600; color: white; width: 60px; height: 60px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 30px;">
          <i class="fa-solid fa-check"></i>
        </div>
        
        <div *ngIf="popupType === 'error'" style="background: #e03131; color: white; width: 60px; height: 60px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 30px;">
          <i class="fa-solid fa-xmark"></i>
        </div>

        <p style="color: #343a40; font-weight: 700; font-size: 1.2rem; margin: 0; text-align: center;">{{ popupMessage }}</p>
      </div>
    </div>
  `
})
export class BuilderClientsComponent implements OnInit {
  clients: any[] = [];
  loading = false;
  showAddModal = false;
  saving = false;
  
  newClient = { clientName: '', mobileNumber: '', address: '' };
  
  // Validation and Popups
  validationError = '';
  showPopup = false;
  popupType: 'success' | 'error' = 'success';
  popupMessage = '';

  searchQuery = '';

  get filteredClients() {
    if (!this.searchQuery) return this.clients;
    const q = this.searchQuery.toLowerCase();
    return this.clients.filter(c => 
      (c.clientName || c.name || '').toLowerCase().includes(q) ||
      (c.mobileNumber || '').includes(q)
    );
  }

  private builderService = inject(BuilderService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  ngOnInit() {
    this.loadClients();
  }

  loadClients() {
    this.loading = true;
    this.builderService.getClients().subscribe({
      next: (res) => {
        this.clients = res?.data || res?.clients || [];
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Failed to load clients', err);
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  closeModal() {
    this.showAddModal = false;
    this.validationError = '';
    this.newClient = { clientName: '', mobileNumber: '', address: '' };
  }

  addClient() {
    this.validationError = '';

    if (!this.newClient.clientName || !this.newClient.clientName.trim()) {
      this.validationError = 'Client Name is required';
      return;
    }
    
    if (!this.newClient.mobileNumber || !this.newClient.mobileNumber.trim()) {
      this.validationError = 'Mobile Number is required';
      return;
    }

    if (this.newClient.mobileNumber.length < 10) {
      this.validationError = 'Please enter a valid 10-digit mobile number';
      return;
    }
    
    this.saving = true;
    this.builderService.addClient(this.newClient).subscribe({
      next: () => {
        this.saving = false;
        this.closeModal();
        this.loadClients();
        this.showToast('Client added successfully!', 'success');
      },
      error: (err) => {
        console.error('Failed to add client', err);
        this.saving = false;
        
        let errorMsg = 'Failed to add client. Please try again.';
        if (err.error && err.error.message) {
          errorMsg = err.error.message;
        }
        
        this.showToast(errorMsg, 'error');
      }
    });
  }

  showToast(message: string, type: 'success' | 'error') {
    this.popupMessage = message;
    this.popupType = type;
    this.showPopup = true;
    this.cdr.detectChanges();
    
    setTimeout(() => {
      this.showPopup = false;
      this.cdr.detectChanges();
    }, type === 'success' ? 1200 : 2500);
  }

  viewProfile(clientId: string) {
    if (clientId) {
      this.router.navigate(['/builder/client-profile'], { queryParams: { clientId } });
    }
  }
}
