import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../services/auth.service';

interface HotelItem {
  _id: string;
  itemId: string;
  itemName: string;
  unit: string;
  rate: number;
  category?: string;
  itemImage?: string;
}

interface CartItem {
  item: HotelItem;
  qty: number;
}

@Component({
  selector: 'app-create-bill',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './create-bill.component.html'
})
export class CreateBillComponent implements OnInit {
  customerId: string = '';
  customer: any = null;
  currentDate: Date = new Date();

  items: HotelItem[] = [];
  categories: string[] = [];
  selectedCategory: string = 'All';
  searchQuery: string = '';

  cart: CartItem[] = [];
  loading: boolean = true;
  submitting: boolean = false;

  showSuccessPopup: boolean = false;
  lastBillAmount: number = 0;

  private authService = inject(AuthService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private location = inject(Location);
  public cdr = inject(ChangeDetectorRef);

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.customerId = params['customerId'];
      if (this.customerId) {
        this.fetchCustomerDetails();
        this.fetchHotelItems();
      } else {
        this.goBack();
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/home/billing']);
  }

  fetchCustomerDetails(): void {
    // Assuming this endpoint fetches billing customer details. 
    // If not, we can adjust.
    this.authService.getBillingCustomers().subscribe({
      next: (res: any) => {
        const customers = res?.data || [];
        this.customer = customers.find((c: any) => c.customerId === this.customerId || c._id === this.customerId);
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        console.error('Failed to fetch customer:', err);
      }
    });
  }

  fetchHotelItems(): void {
    this.loading = true;
    this.authService.getHotelItems().subscribe({
      next: (res) => {
        this.items = res?.data || [];
        
        // Extract unique categories
        const catSet = new Set<string>();
        this.items.forEach(item => {
          if (item.category) {
            catSet.add(item.category);
          }
        });
        this.categories = Array.from(catSet);
        
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        console.error('Failed to fetch hotel items:', err);
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  get filteredItems(): HotelItem[] {
    let list = this.items;

    if (this.selectedCategory !== 'All') {
      list = list.filter(item => item.category === this.selectedCategory);
    }

    if (this.searchQuery.trim()) {
      const q = this.searchQuery.toLowerCase().trim();
      list = list.filter(item => 
        item.itemName.toLowerCase().includes(q)
      );
    }

    return list;
  }

  getItemQty(item: HotelItem): number {
    const cartItem = this.cart.find(c => c.item.itemId === item.itemId);
    return cartItem ? cartItem.qty : 0;
  }

  incrementQty(item: HotelItem): void {
    const cartItem = this.cart.find(c => c.item.itemId === item.itemId);
    if (cartItem) {
      cartItem.qty += 1;
    } else {
      this.cart.push({ item, qty: 1 });
    }
    this.cdr.detectChanges();
  }

  decrementQty(item: HotelItem): void {
    const cartIndex = this.cart.findIndex(c => c.item.itemId === item.itemId);
    if (cartIndex > -1) {
      if (this.cart[cartIndex].qty > 1) {
        this.cart[cartIndex].qty -= 1;
      } else {
        this.cart.splice(cartIndex, 1);
      }
    }
    this.cdr.detectChanges();
  }

  get totalAmount(): number {
    return this.cart.reduce((total, cartItem) => {
      return total + (cartItem.qty * cartItem.item.rate);
    }, 0);
  }

  cancelBill(): void {
    this.cart = [];
    this.cdr.detectChanges();
  }

  createBill(print: boolean = false): void {
    if (this.cart.length === 0) {
      alert('Please add items to the bill.');
      return;
    }
    
    this.submitting = true;
    this.cdr.detectChanges();

    const billItems = this.cart.map(c => ({
      itemName: c.item.itemName,
      price: c.item.rate,
      qty: c.qty,
      unit: c.item.unit || 'Plate'
    }));

    this.authService.createBill(this.customerId, billItems, 'pending').subscribe({
      next: (res) => {
        this.submitting = false;
        this.lastBillAmount = this.totalAmount;
        this.showSuccessPopup = true;
        
        if (print) {
          window.print();
        }
        this.cart = [];
        this.cdr.detectChanges();

        // Auto close and navigate back after 2 seconds
        setTimeout(() => {
          this.showSuccessPopup = false;
          this.router.navigate(['/home/billing']);
        }, 2000);
      },
      error: (err: any) => {
        console.error('Failed to create bill:', err);
        alert(err?.error?.message || 'Failed to create bill.');
        this.submitting = false;
        this.cdr.detectChanges();
      }
    });
  }
}
