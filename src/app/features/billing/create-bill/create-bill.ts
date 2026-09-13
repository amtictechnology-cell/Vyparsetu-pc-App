import { Component, Input, Output, EventEmitter, OnInit, Inject, PLATFORM_ID, ChangeDetectorRef } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MenuItemService, MenuItem } from '../../menu-items/menu-item.service';
import { BillService, Bill } from '../bill.service';

export interface CartItem {
  menuItemId?: string;
  itemName: string;
  unit: string;
  unitPrice: number;
  quantity: number;
  total: number;
}

@Component({
  selector: 'app-create-bill',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './create-bill.html',
  styleUrls: ['./create-bill.css']
})
export class CreateBill implements OnInit {
  @Input() customer?: any;
  @Input() customerId?: string;
  @Input() customerName?: string;
  @Input() customerMobile?: string;
  @Input() editingBill: Bill | null = null;

  @Output() close = new EventEmitter<void>();
  @Output() billGenerated = new EventEmitter<Bill>();

  // POS State
  menuItems: MenuItem[] = [];
  categories: string[] = ['All'];
  selectedCategory: string = 'All';
  searchQuery: string = '';
  isLoadingItems: boolean = false;
  isSubmitting: boolean = false;
  error: string = '';

  // Customer Form (if not passed as input)
  formCustomerName: string = '';
  formCustomerMobile: string = '';

  // Cart / Bill State
  cart: CartItem[] = [];
  discountAmount: number = 0;
  taxAmount: number = 0;
  paymentMode: string = 'CASH';
  notes: string = '';

  // Receipt Modal State
  createdBill: Bill | null = null;
  showReceipt: boolean = false;

  constructor(
    private readonly menuItemService: MenuItemService,
    private readonly billService: BillService,
    private readonly cdr: ChangeDetectorRef,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit(): void {
    if (this.editingBill) {
      this.formCustomerName = this.editingBill.customerName || '';
      this.formCustomerMobile = this.editingBill.customerMobile || '';
      this.discountAmount = this.editingBill.discountAmount || 0;
      this.taxAmount = this.editingBill.taxAmount || 0;
      this.paymentMode = this.editingBill.paymentMode || 'CASH';
      this.notes = this.editingBill.notes || '';
      this.cart = (this.editingBill.items || []).map(it => ({
        menuItemId: it.menuItemId,
        itemName: it.itemName,
        unit: it.unit,
        unitPrice: it.unitPrice,
        quantity: it.quantity,
        total: it.total || (it.quantity * it.unitPrice)
      }));
    } else if (this.customer) {
      this.formCustomerName = this.customer.name || '';
      this.formCustomerMobile = this.customer.mobile || '';
    } else {
      this.formCustomerName = this.customerName || '';
      this.formCustomerMobile = this.customerMobile || '';
    }

    if (isPlatformBrowser(this.platformId)) {
      this.loadMenuItems();
    }
  }

  get effectiveCustomerId(): string | undefined {
    return this.customerId || this.customer?._id;
  }

  get finalCustomerName(): string {
    return this.formCustomerName.trim();
  }

  get finalCustomerMobile(): string {
    return this.formCustomerMobile.trim();
  }

  loadMenuItems(): void {
    this.isLoadingItems = true;
    this.error = '';

    // Fetch active items
    this.menuItemService.getItems(1, 100, '', '', 'true').subscribe({
      next: (res) => {
        this.menuItems = res.data || [];

        // Extract distinct categories
        const catSet = new Set<string>();
        catSet.add('All');
        this.menuItems.forEach(item => {
          if (item.itemCategory) {
            catSet.add(item.itemCategory.trim());
          }
        });
        this.categories = Array.from(catSet);

        this.isLoadingItems = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.error = 'Failed to load menu items: ' + (err.error?.message || err.message);
        this.isLoadingItems = false;
        this.cdr.detectChanges();
      }
    });
  }

  // ─── Filtered Items ───────────────────────────────────────────────

  get filteredItems(): MenuItem[] {
    let list = this.menuItems;

    if (this.selectedCategory !== 'All') {
      list = list.filter(i => i.itemCategory.toLowerCase() === this.selectedCategory.toLowerCase());
    }

    if (this.searchQuery.trim()) {
      const q = this.searchQuery.trim().toLowerCase();
      list = list.filter(i => 
        i.itemName.toLowerCase().includes(q) || 
        i.itemCategory.toLowerCase().includes(q)
      );
    }

    return list;
  }

  selectCategory(cat: string): void {
    this.selectedCategory = cat;
  }

  // ─── Cart Quantity Operations ────────────────────────────────────

  getItemQuantityInCart(item: MenuItem): number {
    const found = this.cart.find(c => c.menuItemId === item._id || c.itemName.toLowerCase() === item.itemName.toLowerCase());
    return found ? found.quantity : 0;
  }

  addItem(item: MenuItem): void {
    const existing = this.cart.find(c => c.menuItemId === item._id || c.itemName.toLowerCase() === item.itemName.toLowerCase());

    if (existing) {
      existing.quantity += 1;
      existing.total = Math.round(existing.quantity * existing.unitPrice * 100) / 100;
    } else {
      this.cart.push({
        menuItemId: item._id,
        itemName: item.itemName,
        unit: item.unit,
        unitPrice: item.itemPrice,
        quantity: 1,
        total: item.itemPrice
      });
    }

    this.cdr.detectChanges();
  }

  decrementItem(item: MenuItem): void {
    const index = this.cart.findIndex(c => c.menuItemId === item._id || c.itemName.toLowerCase() === item.itemName.toLowerCase());

    if (index >= 0) {
      if (this.cart[index].quantity > 1) {
        this.cart[index].quantity -= 1;
        this.cart[index].total = Math.round(this.cart[index].quantity * this.cart[index].unitPrice * 100) / 100;
      } else {
        this.cart.splice(index, 1);
      }
      this.cdr.detectChanges();
    }
  }

  incrementCartItem(cartItem: CartItem): void {
    cartItem.quantity += 1;
    cartItem.total = Math.round(cartItem.quantity * cartItem.unitPrice * 100) / 100;
    this.cdr.detectChanges();
  }

  decrementCartItem(cartItem: CartItem): void {
    if (cartItem.quantity > 1) {
      cartItem.quantity -= 1;
      cartItem.total = Math.round(cartItem.quantity * cartItem.unitPrice * 100) / 100;
    } else {
      this.removeCartItem(cartItem);
    }
    this.cdr.detectChanges();
  }

  removeCartItem(cartItem: CartItem): void {
    const idx = this.cart.indexOf(cartItem);
    if (idx >= 0) {
      this.cart.splice(idx, 1);
      this.cdr.detectChanges();
    }
  }

  clearCart(): void {
    this.cart = [];
    this.discountAmount = 0;
    this.taxAmount = 0;
    this.cdr.detectChanges();
  }

  // ─── Financial Calculations ──────────────────────────────────────

  get subTotal(): number {
    const sum = this.cart.reduce((acc, it) => acc + it.total, 0);
    return Math.round(sum * 100) / 100;
  }

  get finalAmount(): number {
    const disc = Math.max(0, Number(this.discountAmount) || 0);
    const tax = Math.max(0, Number(this.taxAmount) || 0);
    return Math.max(0, Math.round((this.subTotal - disc + tax) * 100) / 100);
  }

  // ─── Submit & Generate Bill ──────────────────────────────────────

  generateBill(): void {
    if (this.isSubmitting) return;

    if (!this.finalCustomerName) {
      this.error = 'Customer name is required';
      return;
    }

    if (!this.finalCustomerMobile) {
      this.error = 'Customer mobile number is required';
      return;
    }

    if (this.cart.length === 0) {
      this.error = 'Please add at least one item to the bill';
      return;
    }

    this.isSubmitting = true;
    this.error = '';

    const payload = {
      customerId: this.effectiveCustomerId,
      customerName: this.finalCustomerName,
      customerMobile: this.finalCustomerMobile,
      items: this.cart.map(c => ({
        menuItemId: c.menuItemId,
        itemName: c.itemName,
        unit: c.unit,
        unitPrice: c.unitPrice,
        quantity: c.quantity
      })),
      discountAmount: Number(this.discountAmount) || 0,
      taxAmount: Number(this.taxAmount) || 0,
      paymentMode: this.paymentMode,
      paymentStatus: 'PAID',
      notes: this.notes
    };

    if (this.editingBill && this.editingBill._id) {
      this.billService.updateBill(this.editingBill._id, payload).subscribe({
        next: (res) => {
          this.isSubmitting = false;
          this.createdBill = res.data;
          this.showReceipt = true;
          this.billGenerated.emit(res.data);
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.isSubmitting = false;
          this.error = err.error?.message || 'Failed to update bill';
          this.cdr.detectChanges();
        }
      });
    } else {
      this.billService.createBill(payload).subscribe({
        next: (res) => {
          this.isSubmitting = false;
          this.createdBill = res.data;
          this.showReceipt = true;
          this.billGenerated.emit(res.data);
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.isSubmitting = false;
          this.error = err.error?.message || 'Failed to generate bill';
          this.cdr.detectChanges();
        }
      });
    }
  }

  printReceipt(): void {
    window.print();
  }

  closeReceiptAndExit(): void {
    this.showReceipt = false;
    this.close.emit();
  }

  onClose(): void {
    this.close.emit();
  }
}
