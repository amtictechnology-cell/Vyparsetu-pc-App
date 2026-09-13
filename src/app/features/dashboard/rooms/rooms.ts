import { Component, OnInit, Inject, PLATFORM_ID, ChangeDetectorRef } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { RoomService, Room } from './room.service';

@Component({
  selector: 'app-rooms',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './rooms.html',
  styleUrls: ['./rooms.css']
})
export class Rooms implements OnInit {
  rooms: Room[] = [];
  
  // Pagination & Filtering
  currentPage = 1;
  totalPages = 1;
  totalCount = 0;
  limit = 20;
  searchQuery = '';
  statusFilter = '';
  floorFilter = '';

  // UI States
  isLoading = false;
  isSubmitting = false;
  error = '';
  successMessage = '';
  
  // Modal state
  showModal = false;
  isEditing = false;
  currentRoomId: string | null = null;

  // Cleaning modal state
  showCleaningModal = false;
  cleaningRoom: Room | null = null;
  isMarkingReady = false;
  
  roomForm: FormGroup;

  // Dropdown options
  floors = ['Ground Floor', '1st Floor', '2nd Floor', '3rd Floor', '4th Floor'];
  roomTypes = ['Standard', 'Deluxe', 'Super Deluxe', 'Suite'];
  statuses = ['AVAILABLE', 'OCCUPIED', 'RESERVED', 'CLEANING', 'MAINTENANCE', 'BLOCKED'];

  constructor(
    private readonly roomService: RoomService,
    private readonly fb: FormBuilder,
    private readonly cdr: ChangeDetectorRef,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.roomForm = this.fb.group({
      roomNumber: ['', Validators.required],
      roomTypeId: ['Standard', Validators.required],
      floor: ['', Validators.required],
      price: ['', [Validators.required, Validators.min(0)]],
      bedCapacity: [1, [Validators.required, Validators.min(1)]],
      status: ['AVAILABLE']
    });
  }

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.loadRooms();
    } else {
      this.isLoading = false;
    }
  }

  loadRooms(): void {
    this.isLoading = true;
    this.error = '';
    this.roomService.getRooms(this.currentPage, this.limit, this.searchQuery, this.statusFilter, this.floorFilter)
      .subscribe({
        next: (res) => {
          this.rooms = res.data || [];
          if (res.pagination) {
            this.currentPage = res.pagination.currentPage;
            this.totalPages = res.pagination.totalPages;
            this.totalCount = res.pagination.totalCount;
          }
          this.isLoading = false;
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.error = 'Failed to load rooms. ' + (err.error?.message || err.message);
          this.isLoading = false;
          this.cdr.detectChanges();
        }
      });
  }

  onSearch(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.searchQuery = target.value;
    this.currentPage = 1;
    this.loadRooms();
  }

  onStatusFilterChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.statusFilter = target.value;
    this.currentPage = 1;
    this.loadRooms();
  }
  
  onFloorFilterChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.floorFilter = target.value;
    this.currentPage = 1;
    this.loadRooms();
  }

  changePage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.loadRooms();
    }
  }

  openAddModal(): void {
    this.isEditing = false;
    this.currentRoomId = null;
    this.roomForm.reset({
      roomTypeId: 'Standard',
      bedCapacity: 1,
      status: 'AVAILABLE'
    });
    this.showModal = true;
  }

  openEditModal(room: Room): void {
    this.isEditing = true;
    this.currentRoomId = room._id || null;
    this.roomForm.patchValue({
      roomNumber: room.roomNumber,
      roomTypeId: room.roomTypeId,
      floor: room.floor,
      price: room.price,
      bedCapacity: room.bedCapacity,
      status: room.status
    });
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.roomForm.reset();
  }

  onSubmit(): void {
    if (this.roomForm.invalid) {
      this.roomForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    this.error = '';
    this.successMessage = '';

    const roomData = this.roomForm.value;

    if (this.isEditing && this.currentRoomId) {
      this.roomService.updateRoom(this.currentRoomId, roomData).subscribe({
        next: (res) => {
          this.successMessage = 'Room updated successfully';
          this.isSubmitting = false;
          this.closeModal();
          this.loadRooms(); // Refresh the list
        },
        error: (err) => {
          this.error = err.error?.message || 'Failed to update room';
          this.isSubmitting = false;
        }
      });
    } else {
      // Create new room (don't send status if backend handles it initially, but it's safe to send AVAILABLE)
      this.roomService.addRoom(roomData).subscribe({
        next: (res) => {
          this.successMessage = 'Room added successfully';
          this.isSubmitting = false;
          this.closeModal();
          this.loadRooms(); // Refresh the list
        },
        error: (err) => {
          this.error = err.error?.message || 'Failed to add room';
          this.isSubmitting = false;
        }
      });
    }
  }

  deleteRoom(id: string | undefined): void {
    if (!id) return;
    if (confirm('Are you sure you want to delete this room?')) {
      this.error = '';
      this.roomService.deleteRoom(id).subscribe({
        next: () => {
          this.successMessage = 'Room deleted successfully';
          this.loadRooms();
        },
        error: (err) => {
          this.error = err.error?.message || 'Failed to delete room';
        }
      });
    }
  }

  // Cleaning modal methods
  openCleaningModal(room: Room): void {
    if (room.status === 'CLEANING') {
      this.cleaningRoom = room;
      this.showCleaningModal = true;
    }
  }

  closeCleaningModal(): void {
    this.showCleaningModal = false;
    this.cleaningRoom = null;
    this.isMarkingReady = false;
  }

  markRoomAvailable(): void {
    if (!this.cleaningRoom || !this.cleaningRoom._id) return;
    this.isMarkingReady = true;
    this.roomService.updateRoom(this.cleaningRoom._id, { status: 'AVAILABLE' }).subscribe({
      next: () => {
        this.successMessage = `Room ${this.cleaningRoom!.roomNumber} marked as Available!`;
        this.isMarkingReady = false;
        this.closeCleaningModal();
        this.loadRooms();
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.error = err.error?.message || 'Failed to update room status';
        this.isMarkingReady = false;
        this.cdr.detectChanges();
      }
    });
  }
}
