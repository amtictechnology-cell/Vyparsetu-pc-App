import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { BuilderService } from '../../services/builder.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-builder-client-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  styles: [`
    .orange-input { width: 100%; padding: 8px; border: 1px solid #ced4da; border-radius: 4px; box-sizing: border-box; transition: all 0.3s; font-family: inherit; }
    .orange-input:focus, .orange-input:hover { border-color: #ff6600; outline: none; box-shadow: 0 0 0 3px rgba(255, 102, 0, 0.1); }
    .modal-backdrop { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); display: flex; align-items: flex-start; justify-content: center; z-index: 1000; overflow-y: auto; padding: 20px 0; }
    .modal-content { background: white; width: 850px; border-radius: 12px; padding: 2.5rem; box-shadow: 0 10px 30px rgba(0,0,0,0.2); position: relative; margin: auto; }
    .invoice-header { display: flex; justify-content: space-between; border-bottom: 2px solid #ff6600; padding-bottom: 15px; margin-bottom: 20px; }
    .invoice-title { font-size: 2rem; color: #ff6600; margin: 0; font-weight: 800; text-transform: uppercase; letter-spacing: 2px; }
    .details-row { display: flex; justify-content: space-between; margin-bottom: 30px; }
    .details-box { width: 45%; }
    .details-box h4 { margin: 0 0 10px 0; color: #495057; font-size: 1.1rem; text-transform: uppercase; font-weight: 700; border-bottom: 1px solid #dee2e6; padding-bottom: 5px; }
    .details-box p { margin: 4px 0; color: #343a40; font-size: 0.95rem; line-height: 1.4; }
    .totals-row { display: flex; justify-content: flex-end; margin-top: 20px; font-size: 1.2rem; }
    .totals-row div { background: #fff4ed; padding: 15px 30px; border-radius: 8px; border: 1px dashed #ff6600; }
    .totals-row span { font-weight: bold; color: #ff6600; font-size: 1.5rem; margin-left: 10px; }
    
    @media print {
      body * { visibility: hidden; }
      .modal-backdrop { position: absolute; top: 0; left: 0; padding: 0; background: transparent; }
      .modal-content, .modal-content * { visibility: visible; }
      .modal-content { position: absolute; left: 0; top: 0; width: 100%; box-shadow: none; border: none; padding: 10px; margin: 0; }
      .no-print { display: none !important; }
      /* Style inputs to look like normal text during print */
      .orange-input { border: none !important; background: transparent !important; box-shadow: none !important; padding: 0 !important; appearance: none; -moz-appearance: none; -webkit-appearance: none; font-weight: bold; }
    @keyframes popIn {
      0% { transform: translate(-50%, -50%) scale(0.5); opacity: 0; }
      100% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
    }
  `],
  template: `
    <!-- Success Popup -->
    <div class="modal-backdrop" *ngIf="showSuccessPopup" style="background: rgba(0,0,0,0.3); z-index: 3000;">
      <div style="position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); background: white; padding: 25px 40px; border-radius: 12px; box-shadow: 0 15px 40px rgba(0,0,0,0.2); display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 15px; animation: popIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);">
        <div style="background: #ff6600; color: white; width: 60px; height: 60px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 30px;">
          <i class="fa-solid fa-check"></i>
        </div>
        <p style="color: #343a40; font-weight: 700; font-size: 1.2rem; margin: 0;">{{ successMessage }}</p>
      </div>
    </div>

    <div class="header-action-bar no-print" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; background: #ff6600; padding: 1.2rem 1.5rem; border-radius: 10px; box-shadow: 0 4px 15px rgba(255, 102, 0, 0.15);">
      <h2 style="margin: 0; color: white; display: flex; align-items: center; font-size: 1.6rem; font-weight: 700;">
        <span style="cursor: pointer; color: white; margin-right: 15px; background: rgba(255,255,255,0.2); width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; border-radius: 50%; font-size: 1.2rem; transition: background 0.2s;" (click)="goBack()">
          <i class="fa-solid fa-arrow-left"></i>
        </span>
        Client Profile
      </h2>
    </div>

    <!-- Tabs -->
    <div class="no-print" style="display: flex; gap: 1rem; margin-bottom: 1.5rem; border-bottom: 1px solid #dee2e6; padding-bottom: 0;">
      <button 
        (click)="activeTab = 'bills'" 
        [style.border-bottom]="activeTab === 'bills' ? '2px solid #ff6600' : 'none'"
        [style.color]="activeTab === 'bills' ? '#ff6600' : '#495057'"
        style="background: none; border: none; padding: 10px 20px; font-weight: 600; cursor: pointer; font-size: 1rem;">
        Bills & Work
      </button>
      <button 
        (click)="activeTab = 'transactions'" 
        [style.border-bottom]="activeTab === 'transactions' ? '2px solid #ff6600' : 'none'"
        [style.color]="activeTab === 'transactions' ? '#ff6600' : '#495057'"
        style="background: none; border: none; padding: 10px 20px; font-weight: 600; cursor: pointer; font-size: 1rem;">
        Transactions
      </button>
    </div>

    <!-- BILLS TAB -->
    <div *ngIf="activeTab === 'bills'" class="no-print" style="padding: 1.5rem;">
      <div style="display: flex; justify-content: flex-end; margin-bottom: 1rem;">
        <button (click)="openBillModal()" style="background: #ff6600; color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer; font-weight: 600; font-size: 1rem; box-shadow: 0 4px 10px rgba(255,102,0,0.2);">+ Create Bill</button>
      </div>

      <div class="table-responsive" style="background: white; border-radius: 12px; border: 1px solid #e9ecef; box-shadow: 0 4px 15px rgba(0,0,0,0.03); margin-bottom: 30px; overflow-x: auto;">
        <table class="data-table" style="width: 100%; border-collapse: collapse; font-family: 'Inter', sans-serif;">
          <thead>
            <tr style="background-color: #ff6600; color: white;">
              <th style="padding: 1.2rem 1.5rem; text-align: left; font-weight: 600; font-size: 1rem; border-top-left-radius: 10px;">Bill ID</th>
              <th style="padding: 1.2rem 1.5rem; text-align: left; font-weight: 600; font-size: 1rem;">Date</th>
              <th style="padding: 1.2rem 1.5rem; text-align: left; font-weight: 600; font-size: 1rem;">Items</th>
              <th style="padding: 1.2rem 1.5rem; text-align: left; font-weight: 600; font-size: 1rem;">Total Amount</th>
              <th style="padding: 1.2rem 1.5rem; text-align: center; font-weight: 600; font-size: 1rem; border-top-right-radius: 10px;">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let bill of bills" style="border-bottom: 1px solid #e9ecef; transition: background 0.2s; cursor: pointer;" (click)="openExistingBill(bill)" onmouseover="this.style.background='#fffaf7'" onmouseout="this.style.background='transparent'">
              <td style="padding: 1.2rem 1.5rem; font-weight: 600; color: #0059ff; font-size: 1.05rem;">{{ bill.billId || 'BLD-BILL' }}</td>
              <td style="padding: 1.2rem 1.5rem; color: #495057; font-weight: 500;">{{ bill.createdAt | date:'mediumDate' }}</td>
              <td style="padding: 1.2rem 1.5rem; color: #6c757d;">{{ bill.items?.length || 0 }} entries</td>
              <td style="padding: 1.2rem 1.5rem; font-weight: bold; color: #2b8a3e; font-size: 1.05rem;">₹{{ bill.totalAmount }}</td>
              <td style="padding: 1.2rem 1.5rem; text-align: center;">
                <button (click)="deleteBill(bill._id); $event.stopPropagation();" style="background: #fff0f0; color: #e03131; border: 1px solid #ffc9c9; width: 35px; height: 35px; border-radius: 6px; cursor: pointer; transition: 0.2s; display: inline-flex; align-items: center; justify-content: center;">
                  <i class="fa-solid fa-trash-can"></i>
                </button>
              </td>
            </tr>
            <tr *ngIf="bills.length === 0">
              <td colspan="5" style="text-align: center; padding: 4rem 1rem; color: #868e96;">
                <div style="font-size: 3rem; margin-bottom: 1rem; color: #dee2e6;"><i class="fa-solid fa-file-invoice"></i></div>
                <h3 style="color: #495057; margin-bottom: 0.5rem;">No bills found</h3>
                <p>Click "+ Create Bill" to generate the first invoice for this client.</p>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- TRANSACTIONS TAB -->
    <div *ngIf="activeTab === 'transactions'" class="no-print" style="padding: 1.5rem;">
      
      <!-- Summary Banner -->
      <div style="display: flex; gap: 1rem; margin-bottom: 2rem; flex-wrap: wrap;">
        <div style="flex: 1; min-width: 200px; background: #fff4ed; border: 1px solid #ffe8cc; border-radius: 12px; padding: 1.5rem; text-align: center; box-shadow: 0 4px 15px rgba(255,102,0,0.05);">
          <h4 style="margin: 0 0 8px 0; color: #ff6600; font-size: 0.95rem; text-transform: uppercase; font-weight: 700; letter-spacing: 0.5px;">Total Bill Amount</h4>
          <p style="margin: 0; font-size: 1.8rem; font-weight: 800; color: #343a40;">₹{{ totalBillAmount }}</p>
        </div>
        <div style="flex: 1; min-width: 200px; background: #eafbf1; border: 1px solid #d3f9e2; border-radius: 12px; padding: 1.5rem; text-align: center; box-shadow: 0 4px 15px rgba(43,138,62,0.05);">
          <h4 style="margin: 0 0 8px 0; color: #2b8a3e; font-size: 0.95rem; text-transform: uppercase; font-weight: 700; letter-spacing: 0.5px;">Total Received</h4>
          <p style="margin: 0; font-size: 1.8rem; font-weight: 800; color: #343a40;">₹{{ totalReceivedAmount }}</p>
        </div>
        <div style="flex: 1; min-width: 200px; background: #f8f9fa; border: 1px solid #dee2e6; border-radius: 12px; padding: 1.5rem; text-align: center; box-shadow: 0 4px 15px rgba(0,0,0,0.03);">
          <h4 style="margin: 0 0 8px 0; color: #495057; font-size: 0.95rem; text-transform: uppercase; font-weight: 700; letter-spacing: 0.5px;">Final Balance</h4>
          <p style="margin: 0; font-size: 1.8rem; font-weight: 800;" [style.color]="balanceAmount > 0 ? '#e03131' : '#2b8a3e'">
            ₹{{ balanceAmount }}
          </p>
        </div>
      </div>

      <div style="display: flex; justify-content: flex-end; margin-bottom: 1rem;">
        <button (click)="showTransactionModal = true" style="background: #2b8a3e; color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer; font-weight: 600; font-size: 1rem; box-shadow: 0 4px 10px rgba(43,138,62,0.2);">+ Receive Payment</button>
      </div>

      <div class="table-responsive" style="background: white; border-radius: 12px; border: 1px solid #e9ecef; box-shadow: 0 4px 15px rgba(0,0,0,0.03); margin-bottom: 30px; overflow-x: auto;">
        <table class="data-table" style="width: 100%; border-collapse: collapse; font-family: 'Inter', sans-serif;">
          <thead>
            <tr style="background-color: #ff6600; color: white;">
              <th style="padding: 1.2rem 1.5rem; text-align: left; font-weight: 600; font-size: 1rem; border-top-left-radius: 10px;">Txn ID</th>
              <th style="padding: 1.2rem 1.5rem; text-align: left; font-weight: 600; font-size: 1rem;">Date</th>
              <th style="padding: 1.2rem 1.5rem; text-align: left; font-weight: 600; font-size: 1rem;">Method</th>
              <th style="padding: 1.2rem 1.5rem; text-align: left; font-weight: 600; font-size: 1rem;">Amount Received</th>
              <th style="padding: 1.2rem 1.5rem; text-align: center; font-weight: 600; font-size: 1rem; border-top-right-radius: 10px;">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let txn of transactions" style="border-bottom: 1px solid #e9ecef; transition: background 0.2s;" onmouseover="this.style.background='#f8f9fa'" onmouseout="this.style.background='transparent'">
              <td style="padding: 1.2rem 1.5rem; font-weight: 600; color: #343a40; font-size: 1.05rem;">{{ txn.transactionId || 'TXN' }}</td>
              <td style="padding: 1.2rem 1.5rem; color: #495057; font-weight: 500;">{{ txn.date | date:'mediumDate' }}</td>
              <td style="padding: 1.2rem 1.5rem; text-transform: capitalize; color: #6c757d;">
                <span [ngStyle]="{'background': txn.paymentMethod === 'online' ? '#e7f5ff' : '#fff3cd', 'color': txn.paymentMethod === 'online' ? '#1864ab' : '#854d0e', 'padding': '4px 10px', 'border-radius': '20px', 'font-size': '0.85rem', 'font-weight': '700'}">
                  {{ txn.paymentMethod }}
                </span>
              </td>
              <td style="padding: 1.2rem 1.5rem; font-weight: bold; color: #0c831f; font-size: 1.05rem;">₹{{ txn.amount }}</td>
              <td style="padding: 1.2rem 1.5rem; text-align: center;">
                <button (click)="deleteTransaction(txn._id)" style="background: #fff0f0; color: #e03131; border: 1px solid #ffc9c9; width: 35px; height: 35px; border-radius: 6px; cursor: pointer; transition: 0.2s; display: inline-flex; align-items: center; justify-content: center;">
                  <i class="fa-solid fa-trash-can"></i>
                </button>
              </td>
            </tr>
            <tr *ngIf="transactions.length === 0">
              <td colspan="5" style="text-align: center; padding: 4rem 1rem; color: #868e96;">
                <div style="font-size: 3rem; margin-bottom: 1rem; color: #dee2e6;"><i class="fa-solid fa-indian-rupee-sign"></i></div>
                <h3 style="color: #495057; margin-bottom: 0.5rem;">No transactions yet</h3>
                <p>Click "+ Receive Payment" to add a new transaction.</p>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- INVOICE / BILL MODAL -->
    <div class="modal-backdrop" *ngIf="showBillModal">
      <div class="modal-content" id="invoice-print-area">
        
        <div class="invoice-header">
          <div>
            <h1 class="invoice-title">INVOICE</h1>
            <p style="margin: 5px 0 0 0; color: #6c757d; font-weight: 600;">{{ isEditingBill ? 'Bill ID: ' + editingBillDisplayId : 'New Bill' }}</p>
          </div>
          <div style="text-align: right;">
            <p style="margin: 0; font-weight: 600; color: #495057;">Date: {{ currentDate | date:'dd MMM yyyy' }}</p>
          </div>
        </div>

        <div class="details-row">
          <!-- Builder Details -->
          <div class="details-box">
            <h4>From (Builder)</h4>
            <p style="font-weight: bold; font-size: 1.1rem; color: #ff6600;">{{ builderProfile?.businessName || builderProfile?.name || 'Your Business Name' }}</p>
            <p *ngIf="builderProfile?.name && builderProfile?.businessName">Prop: {{ builderProfile.name }}</p>
            <p>Ph: {{ builderProfile?.mobileNumber || builderProfile?.mobileNo }}</p>
            <p *ngIf="builderProfile?.businessCategory">{{ builderProfile.businessCategory }}</p>
          </div>

          <!-- Client Details -->
          <div class="details-box" style="text-align: right;">
            <h4>Billed To</h4>
            <p style="font-weight: bold; font-size: 1.1rem; color: #0059ff;">{{ clientProfile?.clientName || 'Client Name' }}</p>
            <p>Ph: {{ clientProfile?.mobileNumber }}</p>
            <p>{{ clientProfile?.address }}</p>
          </div>
        </div>

        <!-- Items Table -->
        <div style="border: 1px solid #dee2e6; border-radius: 8px; overflow: hidden; margin-bottom: 20px;">
          <table style="width: 100%; border-collapse: collapse; text-align: left;">
            <thead style="background: #f8f9fa; border-bottom: 2px solid #dee2e6;">
              <tr>
                <th class="no-print" style="padding: 12px; width: 40px;"></th>
                <th style="padding: 12px; color: #495057;">Work / Description</th>
                <th style="padding: 12px; color: #495057; text-align: center; width: 70px;">L/S</th>
                <th style="padding: 12px; color: #495057; text-align: center; width: 70px;">H</th>
                <th style="padding: 12px; color: #495057; text-align: center; width: 70px;">W</th>
                <th style="padding: 12px; color: #495057; text-align: right; width: 100px;">Rate</th>
                <th style="padding: 12px; color: #495057; text-align: right; width: 120px;">Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let item of newBill.items; let i = index" [style.background]="item.isDeduction ? '#fff0f0' : 'white'" style="border-bottom: 1px solid #e9ecef;">
                
                <td class="no-print" style="padding: 12px; text-align: center;">
                  <button (click)="removeItem(i)" style="background: none; border: none; color: #e03131; cursor: pointer; font-size: 1.2rem; padding: 0;">×</button>
                </td>
                
                <td style="padding: 8px;">
                  <select class="orange-input" [(ngModel)]="item.selectedRateId" (change)="onRateChange(item)" [ngStyle]="{'color': item.isDeduction ? '#e03131' : 'inherit'}">
                    <option value="">-- Select Work --</option>
                    <option *ngFor="let rate of rateList" [value]="rate._id">{{ rate.workName }} (₹{{ rate.rate }}/{{ rate.unit }})</option>
                  </select>
                </td>
                
                <td style="padding: 8px;"><input type="number" class="orange-input" [(ngModel)]="item.size" (input)="calcAmount(item)" style="text-align: center;"></td>
                <td style="padding: 8px;"><input type="number" class="orange-input" [(ngModel)]="item.height" (input)="calcAmount(item)" style="text-align: center;"></td>
                <td style="padding: 8px;"><input type="number" class="orange-input" [(ngModel)]="item.width" (input)="calcAmount(item)" style="text-align: center;"></td>
                <td style="padding: 8px;"><input type="number" class="orange-input" [(ngModel)]="item.rate" (input)="calcAmount(item)" style="text-align: right;"></td>
                
                <td style="padding: 8px;">
                  <input type="number" class="orange-input" [(ngModel)]="item.amount" style="text-align: right; color: {{ item.isDeduction ? '#e03131' : '#2b8a3e' }}; font-weight: bold;" readonly>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="no-print" style="display: flex; gap: 15px; margin-bottom: 20px;">
          <button (click)="addItem()" style="background: #fff4ed; color: #ff6600; border: 1.5px dashed #ff6600; padding: 8px 15px; border-radius: 6px; cursor: pointer; font-weight: 600;">+ Add Work</button>
          <button (click)="addDeduction()" style="background: #fff0f0; color: #e03131; border: 1.5px dashed #e03131; padding: 8px 15px; border-radius: 6px; cursor: pointer; font-weight: 600;">- Add Deduction</button>
        </div>

        <div class="totals-row">
          <div>
            Total Amount: <span>₹{{ calculateTotal() }}</span>
          </div>
        </div>

        <!-- VyparSetu Branding Footer -->
        <div style="text-align: center; margin-top: 40px; padding-top: 15px; border-top: 1px solid #dee2e6; color: #868e96; font-size: 0.9rem;">
          <p style="margin: 0;">Created using <strong>VyparSetu</strong> - The Smart Builder Management System</p>
        </div>

        <!-- Action Buttons (Hidden in Print) -->
        <div class="no-print" style="display: flex; justify-content: flex-end; gap: 15px; margin-top: 30px;">
          <button (click)="showBillModal = false" style="background: white; border: 1px solid #ced4da; padding: 12px 25px; border-radius: 6px; cursor: pointer; color: #495057; font-weight: 600; font-size: 1rem;">Cancel</button>
          
          <!-- When creating NEW bill -->
          <ng-container *ngIf="!isEditingBill">
            <button (click)="saveBill(false)" [disabled]="saving" style="background: #343a40; border: none; padding: 12px 25px; border-radius: 6px; cursor: pointer; color: white; font-weight: 600; font-size: 1rem;">
              Final Bill
            </button>
            <button (click)="saveBill(true)" [disabled]="saving" style="background: #ff6600; border: none; padding: 12px 25px; border-radius: 6px; cursor: pointer; color: white; font-weight: 600; font-size: 1rem; display: flex; align-items: center; gap: 8px;">
              <i class="fa-solid fa-print"></i> Final & Print
            </button>
          </ng-container>

          <!-- When viewing EXISTING bill -->
          <ng-container *ngIf="isEditingBill">
            <button (click)="printBill()" style="background: #343a40; border: none; padding: 12px 25px; border-radius: 6px; cursor: pointer; color: white; font-weight: 600; font-size: 1rem; display: flex; align-items: center; gap: 8px;">
              <i class="fa-solid fa-print"></i> Print
            </button>
            <button (click)="updateBill()" [disabled]="saving" style="background: #ff6600; border: none; padding: 12px 25px; border-radius: 6px; cursor: pointer; color: white; font-weight: 600; font-size: 1rem;">
              Edit Bill (Save)
            </button>
          </ng-container>
        </div>
      </div>
    </div>

    <!-- Add Transaction Modal (Unchanged) -->
    <div class="modal-backdrop no-print" *ngIf="showTransactionModal" style="align-items: center;">
      <div class="modal-content" style="width: 450px; padding: 2rem;">
        <h3 style="margin-top: 0; color: #343a40; margin-bottom: 1.5rem;">Receive Payment</h3>
        <div class="form-group" style="margin-bottom: 1rem;">
          <label style="display: block; margin-bottom: 0.5rem; font-weight: 600; color: #495057;">Amount Received (₹) *</label>
          <input type="number" class="orange-input" [(ngModel)]="newTransaction.amount">
        </div>
        <div class="form-group" style="margin-bottom: 1rem;">
          <label style="display: block; margin-bottom: 0.5rem; font-weight: 600; color: #495057;">Payment Method</label>
          <select class="orange-input" [(ngModel)]="newTransaction.paymentMethod">
            <option value="cash">Cash</option>
            <option value="online">Online (UPI/Bank)</option>
          </select>
        </div>
        <div class="form-group" style="margin-bottom: 1.5rem;">
          <label style="display: block; margin-bottom: 0.5rem; font-weight: 600; color: #495057;">Date</label>
          <input type="date" class="orange-input" [(ngModel)]="newTransaction.date">
        </div>
        <div style="display: flex; justify-content: flex-end; gap: 10px;">
          <button (click)="showTransactionModal = false" style="background: white; border: 1px solid #ced4da; padding: 10px 20px; border-radius: 6px; cursor: pointer; color: #495057; font-weight: 600;">Cancel</button>
          <button (click)="saveTransaction()" [disabled]="saving" style="background: #2b8a3e; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer; color: white; font-weight: 600;">
            {{ saving ? 'Saving...' : 'Save Payment' }}
          </button>
        </div>
      </div>
    </div>
  `
})
export class BuilderClientProfileComponent implements OnInit {
  activeTab = 'bills';
  clientId: string | null = null;
  
  bills: any[] = [];
  transactions: any[] = [];
  rateList: any[] = [];
  
  builderProfile: any = null;
  clientProfile: any = null;
  currentDate = new Date();
  
  showBillModal = false;
  showTransactionModal = false;
  saving = false;
  showSuccessPopup = false;
  successMessage = '';

  isEditingBill = false;
  editingBillId: string | null = null;
  editingBillDisplayId: string | null = null;

  newBill = { items: <any[]>[] };
  newTransaction = { amount: null, paymentMethod: 'cash', date: new Date().toISOString().split('T')[0] };

  private route = inject(ActivatedRoute);
  private builderService = inject(BuilderService);
  private authService = inject(AuthService);
  private cdr = inject(ChangeDetectorRef);

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      this.clientId = params['clientId'];
      if (this.clientId) {
        this.loadProfileDetails();
        this.loadBills();
        this.loadTransactions();
        this.loadRateList();
      }
    });
  }

  goBack() {
    window.history.back();
  }

  loadProfileDetails() {
    this.authService.getProfile().subscribe(res => {
      this.builderProfile = res?.user || null;
      this.cdr.detectChanges();
    });

    this.builderService.getClients().subscribe(res => {
      let allClients = res?.data || res?.clients || [];
      this.clientProfile = allClients.find((c: any) => c._id === this.clientId) || null;
      this.cdr.detectChanges();
    });
  }

  loadRateList() {
    this.builderService.getRateList().subscribe(res => {
      this.rateList = res?.data || [];
      this.cdr.detectChanges();
    });
  }

  loadBills() {
    this.builderService.getBills().subscribe(res => {
      let allBills = res?.data || [];
      this.bills = allBills.filter((b: any) => b.clientId?._id === this.clientId || b.clientId === this.clientId);
      this.cdr.detectChanges();
    });
  }

  loadTransactions() {
    this.builderService.getTransactions().subscribe(res => {
      let allTxns = res?.data || [];
      this.transactions = allTxns.filter((t: any) => t.clientId?._id === this.clientId || t.clientId === this.clientId);
      this.cdr.detectChanges();
    });
  }

  // --- Summary Calculations ---
  get totalBillAmount(): number {
    return this.bills.reduce((sum, b) => sum + (b.totalAmount || 0), 0);
  }

  get totalReceivedAmount(): number {
    return this.transactions.reduce((sum, t) => sum + (t.amount || 0), 0);
  }

  get balanceAmount(): number {
    return this.totalBillAmount - this.totalReceivedAmount;
  }

  // --- Bill Logic ---
  openBillModal() {
    this.isEditingBill = false;
    this.editingBillId = null;
    this.editingBillDisplayId = null;
    this.currentDate = new Date();
    this.newBill = { items: [{ selectedRateId: '', workName: '', size: null, height: null, width: null, rate: null, amount: null, isDeduction: false }] };
    this.showBillModal = true;
  }

  openExistingBill(bill: any) {
    this.isEditingBill = true;
    this.editingBillId = bill._id;
    this.editingBillDisplayId = bill.billId || 'BLD-BILL';
    this.currentDate = new Date(bill.createdAt);
    
    this.newBill = { 
      items: (bill.items || []).map((i: any) => ({
        selectedRateId: '',
        workName: i.workName,
        size: i.size,
        height: i.height,
        width: i.width,
        rate: i.rate,
        amount: i.amount,
        isDeduction: (i.amount < 0) || i.workName?.toLowerCase().includes('deduction')
      }))
    };

    if (this.newBill.items.length === 0) {
      this.addItem();
    }
    this.showBillModal = true;
  }

  addItem() {
    this.newBill.items.push({ selectedRateId: '', workName: '', size: null, height: null, width: null, rate: null, amount: null, isDeduction: false });
  }

  addDeduction() {
    this.newBill.items.push({ workName: 'Deduction: ', size: null, height: null, width: null, rate: null, amount: null, isDeduction: true });
  }

  removeItem(index: number) {
    this.newBill.items.splice(index, 1);
    this.cdr.detectChanges();
  }

  onRateChange(item: any) {
    const rateItem = this.rateList.find(r => r._id === item.selectedRateId);
    if (rateItem) {
      item.workName = rateItem.workName;
      item.rate = rateItem.rate;
      this.calcAmount(item);
    }
  }

  calcAmount(item: any) {
    if (item.rate !== null && item.rate !== undefined) {
      let calc = 1;
      let hasDimensions = false;
      if (item.size) { calc *= item.size; hasDimensions = true; }
      if (item.height) { calc *= item.height; hasDimensions = true; }
      if (item.width) { calc *= item.width; hasDimensions = true; }
      
      let rawAmount = hasDimensions ? (calc * item.rate) : item.rate;
      
      if (item.isDeduction) {
        item.amount = -Math.abs(rawAmount);
      } else {
        item.amount = Math.abs(rawAmount);
      }
    }
  }

  calculateTotal(): number {
    return this.newBill.items.reduce((sum, item) => sum + (item.amount || 0), 0);
  }

  saveBill(printAfterSave: boolean) {
    if (!this.clientId) return;
    if (!this.validateBill()) return;

    this.saving = true;
    const payload = {
      clientId: this.clientId,
      items: this.newBill.items
    };

    this.builderService.createBill(payload).subscribe({
      next: () => {
        this.saving = false;
        this.showBillModal = false;
        this.loadBills();
        
        if (printAfterSave) {
          setTimeout(() => {
            window.print();
          }, 500);
        } else {
          this.successMessage = 'Bill Created Successfully!';
          this.showSuccessPopup = true;
          this.cdr.detectChanges();
          
          setTimeout(() => {
            this.showSuccessPopup = false;
            this.cdr.detectChanges();
          }, 1000);
        }
      },
      error: () => {
        alert("Failed to create bill");
        this.saving = false;
      }
    });
  }

  updateBill() {
    if (!this.editingBillId) return;
    if (!this.validateBill()) return;

    this.saving = true;
    const payload = {
      items: this.newBill.items
    };

    this.builderService.editBill(this.editingBillId, payload).subscribe({
      next: () => {
        this.saving = false;
        this.showBillModal = false;
        this.loadBills();
        
        this.successMessage = 'Bill Updated Successfully!';
        this.showSuccessPopup = true;
        this.cdr.detectChanges();
        
        setTimeout(() => {
          this.showSuccessPopup = false;
          this.cdr.detectChanges();
        }, 1000);
      },
      error: () => {
        alert("Failed to update bill");
        this.saving = false;
      }
    });
  }

  validateBill(): boolean {
    if (this.newBill.items.length === 0) {
      alert("Please add at least one item.");
      return false;
    }
    for (let item of this.newBill.items) {
      if (!item.workName || item.rate === null || item.amount === null) {
        alert("Work Name, Rate, and Amount are required for all entries.");
        return false;
      }
    }
    return true;
  }

  printBill() {
    window.print();
  }

  deleteBill(id: string) {
    if(confirm("Are you sure?")) {
      this.builderService.deleteBill(id).subscribe(() => this.loadBills());
    }
  }

  // --- Transaction Logic ---
  saveTransaction() {
    if (!this.clientId || !this.newTransaction.amount) {
      alert("Amount is required");
      return;
    }

    this.saving = true;
    const payload = {
      clientId: this.clientId,
      amount: this.newTransaction.amount,
      paymentMethod: this.newTransaction.paymentMethod,
      date: new Date(this.newTransaction.date).toISOString()
    };

    this.builderService.addTransaction(payload).subscribe({
      next: () => {
        this.showTransactionModal = false;
        this.saving = false;
        this.loadTransactions();
      },
      error: () => {
        alert("Failed to save transaction");
        this.saving = false;
      }
    });
  }

  deleteTransaction(id: string) {
    if(confirm("Are you sure?")) {
      this.builderService.deleteTransaction(id).subscribe(() => this.loadTransactions());
    }
  }
}
