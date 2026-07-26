import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../services/auth.service';
import { forkJoin } from 'rxjs';

interface HotelItem {
  _id: string;
  itemId: string;
  itemName: string;
  unit: string;
  rate: number;
  category?: string;
  itemImage?: string;
}

@Component({
  selector: 'app-item-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './item-management.component.html',
  styleUrl: './dashboard.shared.css'
})
export class ItemManagementComponent implements OnInit {
  items: HotelItem[] = [];
  loading: boolean = true;
  submitting: boolean = false;
  errorMessage: string = '';
  successMessage: string = '';

  // Search filter
  searchQuery: string = '';

  // Form states (Add/Edit)
  isEditing: boolean = false;
  editingItem: HotelItem | null = null;

  itemName: string = '';
  unit: string = 'Plate';
  rate: number = 0;
  category: string = 'Roti';
  categories: string[] = ['Roti', 'Sabji', 'Cold Drink', 'Breakfast', 'Liquid', 'Rice', 'Dessert', 'Snacks', 'Others'];
  selectedCategoryFilter: string = 'All';

  // Modal open states
  showAddEditModal: boolean = false;

  // Bulk Add state
  bulkItems: { itemName: string, unit: string, rate: number | null, category: string }[] = [];

  private authService = inject(AuthService);
  public cdr = inject(ChangeDetectorRef);
  backendUrl: string = '';

  ngOnInit(): void {
    this.backendUrl = this.authService.getApiUrl();
    this.fetchItems();
  }

  fetchItems(): void {
    this.loading = true;
    this.errorMessage = '';
    this.authService.getHotelItems().subscribe({
      next: (res) => {
        this.items = res?.data || [];
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Failed to fetch hotel items:', err);
        this.errorMessage = err?.error?.message || 'Failed to load hotel items.';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  openAddModal(): void {
    this.isEditing = false;
    this.editingItem = null;
    
    // Initialize 10 empty rows for bulk add
    this.bulkItems = Array.from({ length: 10 }, () => ({
      itemName: '',
      unit: 'Plate',
      rate: null,
      category: 'Roti'
    }));

    this.errorMessage = '';
    this.successMessage = '';
    this.showAddEditModal = true;
    this.cdr.detectChanges();
  }

  openEditModal(item: HotelItem): void {
    this.isEditing = true;
    this.editingItem = item;
    this.itemName = item.itemName;
    this.unit = item.unit;
    this.rate = item.rate;
    this.category = (item as any).category || 'Roti';
    this.errorMessage = '';
    this.successMessage = '';
    this.showAddEditModal = true;
    this.cdr.detectChanges();
  }

  closeModal(): void {
    this.showAddEditModal = false;
    this.cdr.detectChanges();
  }

  onSubmit(): void {
    this.submitting = true;
    this.errorMessage = '';
    this.successMessage = '';
    this.cdr.detectChanges();

    if (this.isEditing && this.editingItem) {
      if (!this.itemName.trim() || !this.unit.trim() || this.rate <= 0) {
        this.errorMessage = 'All fields are required and rate must be greater than 0.';
        this.submitting = false;
        this.cdr.detectChanges();
        return;
      }

      const formData = new FormData();
      formData.append('itemName', this.itemName.trim());
      formData.append('unit', this.unit.trim());
      formData.append('rate', this.rate.toString());
      formData.append('category', this.category.trim());
      formData.append('itemId', this.editingItem.itemId);
      
      this.authService.editHotelItem(formData).subscribe({
        next: (res) => {
          this.submitting = false;
          this.successMessage = 'Item updated successfully!';
          this.fetchItems();
          setTimeout(() => this.closeModal(), 2000);
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Failed to update hotel item:', err);
          this.errorMessage = err?.error?.message || 'Failed to update item.';
          this.submitting = false;
          this.cdr.detectChanges();
        }
      });
    } else {
      // Bulk Add Mode
      const validItems = this.bulkItems.filter(item => item.itemName.trim() && item.rate !== null && item.rate > 0);
      
      if (validItems.length === 0) {
        this.errorMessage = 'Please fill out at least one valid item row (Name and Rate > 0).';
        this.submitting = false;
        this.cdr.detectChanges();
        return;
      }

      const addObservables = validItems.map(item => {
        const formData = new FormData();
        formData.append('itemName', item.itemName.trim());
        formData.append('unit', item.unit.trim());
        formData.append('rate', (item.rate || 0).toString());
        formData.append('category', item.category.trim());
        return this.authService.addHotelItem(formData);
      });

      forkJoin(addObservables).subscribe({
        next: (responses) => {
          this.submitting = false;
          this.successMessage = `${validItems.length} item(s) added successfully!`;
          this.fetchItems();
          setTimeout(() => this.closeModal(), 2000);
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Failed to add some or all hotel items:', err);
          this.errorMessage = 'An error occurred while adding items. Some items may not have been saved.';
          this.submitting = false;
          this.fetchItems(); // Fetch whatever succeeded
          this.cdr.detectChanges();
        }
      });
    }
  }

  deleteItem(item: HotelItem): void {
    if (confirm(`Are you sure you want to delete ${item.itemName}?`)) {
      this.authService.deleteHotelItem(item.itemId).subscribe({
        next: (res) => {
          this.successMessage = 'Item deleted successfully!';
          this.fetchItems();
          setTimeout(() => {
            this.successMessage = '';
            this.cdr.detectChanges();
          }, 3000);
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Failed to delete hotel item:', err);
          this.errorMessage = err?.error?.message || 'Failed to delete item.';
          setTimeout(() => {
            this.errorMessage = '';
            this.cdr.detectChanges();
          }, 3000);
          this.cdr.detectChanges();
        }
      });
    }
  }

  get filteredItems(): HotelItem[] {
    let list = this.items;
    
    // Category filter
    if (this.selectedCategoryFilter !== 'All') {
      list = list.filter((item: any) => item.category === this.selectedCategoryFilter);
    }
    
    // Search query filter
    if (this.searchQuery.trim()) {
      const query = this.searchQuery.toLowerCase().trim();
      list = list.filter(item => 
        item.itemName.toLowerCase().includes(query) ||
        item.unit.toLowerCase().includes(query) ||
        item.rate.toString().includes(query)
      );
    }
    return list;
  }

  onSearchChange(): void {
    this.cdr.detectChanges();
  }

  getCategoryCount(catName: string): number {
    if (catName === 'All') return this.items.length;
    return this.items.filter((item: any) => item.category === catName).length;
  }
}
