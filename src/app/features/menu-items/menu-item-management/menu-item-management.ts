import { Component, OnInit, OnDestroy, Inject, PLATFORM_ID, ChangeDetectorRef } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule } from '@angular/forms';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { MenuItemService, MenuItem, MenuItemCounts } from '../menu-item.service';

@Component({
  selector: 'app-menu-item-management',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './menu-item-management.html',
  styleUrls: ['./menu-item-management.css']
})
export class MenuItemManagement implements OnInit, OnDestroy {
  menuItems: MenuItem[] = [];
  counts: MenuItemCounts = { total: 0, active: 0, inactive: 0 };

  // Pagination & Filters
  currentPage = 1;
  totalPages = 1;
  totalCount = 0;
  limit = 20;
  searchQuery = '';
  selectedCategory = '';
  selectedStatus = '';

  // UI States
  isLoading = false;
  isSubmitting = false;
  error = '';
  successMessage = '';

  // Single Item Modal (Add / Edit)
  showSingleModal = false;
  isEditing = false;
  currentEditId: string | null = null;
  singleForm: FormGroup;

  // Bulk Add Modal
  showBulkModal = false;
  bulkForm: FormGroup;
  bulkErrors: string[] = [];

  // Debounce for search
  private readonly searchSubject = new Subject<string>();
  private searchSubscription?: Subscription;
  private currentRequestSubscription?: Subscription;

  // Standard Categories & Units
  categories = [
    'Main Course',
    'Breakfast',
    'Lunch',
    'Dinner',
    'Snacks',
    'Beverages',
    'Fast Food',
    'Desserts',
    'Rajasthani',
    'Chinese',
    'Other'
  ];

  units = [
    'Plate',
    'Piece',
    'Glass',
    'Cup',
    'Kg',
    'Gram',
    'Litre',
    'Bottle',
    'Packet',
    'Bowl',
    'Portion'
  ];

  constructor(
    private readonly menuItemService: MenuItemService,
    private readonly fb: FormBuilder,
    private readonly cdr: ChangeDetectorRef,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    // Initialize Single Item Form
    this.singleForm = this.fb.group({
      itemName: ['', [Validators.required, Validators.minLength(2)]],
      itemPrice: ['', [Validators.required, Validators.min(0)]],
      itemCategory: ['Main Course', Validators.required],
      unit: ['Plate', Validators.required],
      isActive: [true]
    });

    // Initialize Bulk Form
    this.bulkForm = this.fb.group({
      items: this.fb.array([])
    });
  }

  get bulkItemsArray(): FormArray {
    return this.bulkForm.get('items') as FormArray;
  }

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.loadItems();

      // Debounced search setup
      this.searchSubscription = this.searchSubject.pipe(
        debounceTime(350),
        distinctUntilChanged()
      ).subscribe(query => {
        this.searchQuery = query;
        this.currentPage = 1;
        this.loadItems();
      });
    }
  }

  ngOnDestroy(): void {
    this.searchSubscription?.unsubscribe();
    this.currentRequestSubscription?.unsubscribe();
  }

  // ─── Data Fetching ────────────────────────────────────────────────

  loadItems(): void {
    this.currentRequestSubscription?.unsubscribe();
    this.isLoading = true;
    this.error = '';

    this.currentRequestSubscription = this.menuItemService.getItems(
      this.currentPage,
      this.limit,
      this.searchQuery,
      this.selectedCategory,
      this.selectedStatus
    ).subscribe({
      next: (res) => {
        this.menuItems = res.data || [];
        if (res.counts) {
          this.counts = res.counts;
        }
        if (res.pagination) {
          this.currentPage = res.pagination.currentPage;
          this.totalPages = res.pagination.totalPages;
          this.totalCount = res.pagination.totalCount;
        }
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.error = 'Failed to load menu items: ' + (err.error?.message || err.message);
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  onSearch(event: Event): void {
    const val = (event.target as HTMLInputElement).value;
    this.searchSubject.next(val);
  }

  onCategoryFilterChange(event: Event): void {
    this.selectedCategory = (event.target as HTMLSelectElement).value;
    this.currentPage = 1;
    this.loadItems();
  }

  onStatusFilterChange(event: Event): void {
    this.selectedStatus = (event.target as HTMLSelectElement).value;
    this.currentPage = 1;
    this.loadItems();
  }

  changePage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.loadItems();
    }
  }

  // ─── Single Item Modal (Add / Edit) ───────────────────────────────

  openAddSingleModal(): void {
    this.isEditing = false;
    this.currentEditId = null;
    this.singleForm.reset({
      itemCategory: 'Main Course',
      unit: 'Plate',
      isActive: true
    });
    this.showSingleModal = true;
    this.error = '';
    this.successMessage = '';
  }

  openEditModal(item: MenuItem): void {
    this.isEditing = true;
    this.currentEditId = item._id || null;
    this.singleForm.patchValue({
      itemName: item.itemName,
      itemPrice: item.itemPrice,
      itemCategory: item.itemCategory,
      unit: item.unit,
      isActive: item.isActive !== undefined ? item.isActive : true
    });
    this.showSingleModal = true;
    this.error = '';
    this.successMessage = '';
  }

  closeSingleModal(): void {
    this.showSingleModal = false;
    this.singleForm.reset();
  }

  onSubmitSingle(): void {
    if (this.isSubmitting) return;

    if (this.singleForm.invalid) {
      this.singleForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    this.error = '';
    this.successMessage = '';

    const payload = this.singleForm.value;

    if (this.isEditing && this.currentEditId) {
      this.menuItemService.updateItem(this.currentEditId, payload).subscribe({
        next: (res) => {
          this.successMessage = `"${res.data.itemName}" updated successfully`;
          this.isSubmitting = false;
          this.closeSingleModal();
          this.loadItems();
        },
        error: (err) => {
          this.error = err.error?.message || 'Failed to update menu item';
          this.isSubmitting = false;
          this.cdr.detectChanges();
        }
      });
    } else {
      this.menuItemService.addItem(payload).subscribe({
        next: (res) => {
          this.successMessage = `"${res.data.itemName}" added to menu successfully`;
          this.isSubmitting = false;
          this.closeSingleModal();
          this.loadItems();
        },
        error: (err) => {
          this.error = err.error?.message || 'Failed to add menu item';
          this.isSubmitting = false;
          this.cdr.detectChanges();
        }
      });
    }
  }

  // ─── Bulk Add Modal (Up to 10 Items) ─────────────────────────────

  openBulkModal(): void {
    this.bulkErrors = [];
    this.error = '';
    this.successMessage = '';
    this.bulkItemsArray.clear();

    // Start with exactly 1 initial row as specified
    this.addBulkRow();

    this.showBulkModal = true;
    this.cdr.detectChanges();
  }

  closeBulkModal(): void {
    this.showBulkModal = false;
    this.bulkItemsArray.clear();
    this.bulkErrors = [];
  }

  createBulkRow(): FormGroup {
    return this.fb.group({
      itemName: ['', [Validators.required, Validators.minLength(2)]],
      itemPrice: ['', [Validators.required, Validators.min(0)]],
      itemCategory: ['Main Course', Validators.required],
      unit: ['Plate', Validators.required]
    });
  }

  addBulkRow(): void {
    if (this.bulkItemsArray.length >= 10) {
      return;
    }
    this.bulkItemsArray.push(this.createBulkRow());
    this.cdr.detectChanges();
  }

  removeBulkRow(index: number): void {
    if (this.bulkItemsArray.length > 1) {
      this.bulkItemsArray.removeAt(index);
      this.cdr.detectChanges();
    }
  }

  onSubmitBulk(): void {
    if (this.isSubmitting) return;

    if (this.bulkForm.invalid) {
      this.bulkForm.markAllAsTouched();
      this.bulkErrors = ['Please fill all required fields correctly in every row.'];
      return;
    }

    const items = this.bulkItemsArray.value;
    if (!items || items.length === 0) {
      this.bulkErrors = ['Please add at least one item.'];
      return;
    }

    if (items.length > 10) {
      this.bulkErrors = ['Maximum 10 items can be added at once.'];
      return;
    }

    // Check duplicate names within the form itself
    const names = items.map((it: any) => (it.itemName || '').trim().toLowerCase());
    const duplicates = names.filter((name: string, index: number) => names.indexOf(name) !== index && name !== '');
    if (duplicates.length > 0) {
      this.bulkErrors = [`Duplicate item name "${duplicates[0]}" found in your rows. Each item name must be unique.`];
      return;
    }

    this.isSubmitting = true;
    this.bulkErrors = [];
    this.error = '';

    this.menuItemService.addBulkItems(items).subscribe({
      next: (res) => {
        this.successMessage = res.message || `Successfully added ${res.data?.length || items.length} menu items!`;
        this.isSubmitting = false;
        this.closeBulkModal();
        this.loadItems();
      },
      error: (err) => {
        this.isSubmitting = false;
        if (err.error?.errors && Array.isArray(err.error.errors)) {
          this.bulkErrors = err.error.errors;
        } else {
          this.bulkErrors = [err.error?.message || 'Failed to add items in bulk'];
        }
        this.cdr.detectChanges();
      }
    });
  }

  // ─── Status Toggle & Soft Delete ──────────────────────────────────

  onToggleStatus(item: MenuItem): void {
    if (!item._id) return;
    this.menuItemService.toggleStatus(item._id).subscribe({
      next: (res) => {
        item.isActive = res.data.isActive;
        // Update local counts
        if (item.isActive) {
          this.counts.active++;
          this.counts.inactive = Math.max(0, this.counts.inactive - 1);
        } else {
          this.counts.inactive++;
          this.counts.active = Math.max(0, this.counts.active - 1);
        }
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.error = err.error?.message || 'Failed to toggle status';
        this.cdr.detectChanges();
      }
    });
  }

  onDeleteItem(item: MenuItem): void {
    if (!item._id) return;
    if (confirm(`Are you sure you want to remove "${item.itemName}"? It will be deactivated to protect historical billing records.`)) {
      this.menuItemService.deleteItem(item._id).subscribe({
        next: () => {
          this.successMessage = `"${item.itemName}" removed successfully`;
          this.loadItems();
        },
        error: (err) => {
          this.error = err.error?.message || 'Failed to delete item';
          this.cdr.detectChanges();
        }
      });
    }
  }
}
