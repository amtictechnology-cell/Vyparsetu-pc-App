import { Component, Input, Output, EventEmitter, OnInit, Inject, PLATFORM_ID, ChangeDetectorRef } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { RoomService, Room } from '../../dashboard/rooms/room.service';
import { BookingService } from '../booking.service';

@Component({
  selector: 'app-booking-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './booking-form.html',
  styleUrls: ['./booking-form.css']
})
export class BookingForm implements OnInit {
  @Input() customer: any;
  @Input() customerId?: string;
  @Input() customerName?: string;

  @Output() bookingCreated = new EventEmitter<any>();
  @Output() close = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();

  // Step: 1=Dates & Counts, 2=Member Details, 3=Select Rooms, 4=Confirm
  step = 1;

  // Forms
  searchForm: FormGroup;
  confirmForm: FormGroup;

  // State
  availableRooms: Room[] = [];
  cleaningRooms: Room[] = [];
  selectedRooms: Room[] = [];    // Multiple rooms selection
  memberForms: FormGroup[] = [];  // Dynamic member detail forms

  isLoadingRooms = false;
  isSubmitting = false;
  nights = 0;
  error = '';

  constructor(
    private readonly fb: FormBuilder,
    private readonly roomService: RoomService,
    private readonly bookingService: BookingService,
    private readonly cdr: ChangeDetectorRef,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.searchForm = this.fb.group({
      checkInDate: ['', Validators.required],
      checkOutDate: ['', Validators.required],
      totalMembers: [1, [Validators.required, Validators.min(1), Validators.max(20)]],
      roomsNeeded: [1, [Validators.required, Validators.min(1), Validators.max(10)]]
    });

    this.confirmForm = this.fb.group({
      discountAmount: [0],
      taxAmount: [0],
      notes: ['']
    });
  }

  get effectiveCustomerId(): string {
    return this.customerId || this.customer?._id || '';
  }

  get displayCustomerName(): string {
    return this.customerName || this.customer?.name || 'Guest';
  }

  // ─── Stepper Helpers ─────────────────────────────────────────────

  incrementMembers(): void {
    const current = Number(this.searchForm.get('totalMembers')?.value) || 1;
    if (current < 20) {
      this.searchForm.patchValue({ totalMembers: current + 1 });
      this.cdr.detectChanges();
    }
  }

  decrementMembers(): void {
    const current = Number(this.searchForm.get('totalMembers')?.value) || 1;
    if (current > 1) {
      this.searchForm.patchValue({ totalMembers: current - 1 });
      this.cdr.detectChanges();
    }
  }

  onMembersChange(event: any): void {
    let val = parseInt(event.target.value, 10);
    if (isNaN(val) || val < 1) val = 1;
    if (val > 20) val = 20;
    this.searchForm.patchValue({ totalMembers: val });
    this.cdr.detectChanges();
  }

  incrementRooms(): void {
    const current = Number(this.searchForm.get('roomsNeeded')?.value) || 1;
    if (current < 10) {
      this.searchForm.patchValue({ roomsNeeded: current + 1 });
      this.cdr.detectChanges();
    }
  }

  decrementRooms(): void {
    const current = Number(this.searchForm.get('roomsNeeded')?.value) || 1;
    if (current > 1) {
      this.searchForm.patchValue({ roomsNeeded: current - 1 });
      this.cdr.detectChanges();
    }
  }

  onRoomsChange(event: any): void {
    let val = parseInt(event.target.value, 10);
    if (isNaN(val) || val < 1) val = 1;
    if (val > 10) val = 10;
    this.searchForm.patchValue({ roomsNeeded: val });
    this.cdr.detectChanges();
  }

  ngOnInit(): void {
    // Set default dates: check-in = today, check-out = tomorrow
    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);

    const formatDate = (d: Date) => d.toISOString().split('T')[0];

    this.searchForm.patchValue({
      checkInDate: formatDate(today),
      checkOutDate: formatDate(tomorrow)
    });
  }

  // ─── STEP 1: Search ───────────────────────────────────────────────

  searchRooms(): void {
    if (this.searchForm.invalid) {
      this.searchForm.markAllAsTouched();
      return;
    }

    const { checkInDate, checkOutDate, totalMembers } = this.searchForm.value;
    const checkIn = new Date(checkInDate);
    const checkOut = new Date(checkOutDate);

    if (checkIn >= checkOut) {
      this.error = 'Check-out date must be after check-in date.';
      return;
    }

    this.error = '';

    // Build member forms
    this.buildMemberForms(Number(totalMembers));

    // Move to step 2 (member details)
    this.step = 2;
    this.cdr.detectChanges();
  }

  buildMemberForms(count: number): void {
    this.memberForms = [];
    for (let i = 0; i < count; i++) {
      // Pre-fill primary guest (index 0) with customer details if available
      const initialName = (i === 0 && this.customer?.name) ? this.customer.name : '';
      const initialId = (i === 0 && this.customer?.idNumber) ? this.customer.idNumber : '';

      this.memberForms.push(this.fb.group({
        name: [initialName, Validators.required],
        idNumber: [initialId]
      }));
    }
  }

  // ─── STEP 2: Member Details ───────────────────────────────────────

  proceedToRoomSelection(): void {
    const allValid = this.memberForms.every(f => f.valid);
    if (!allValid) {
      this.memberForms.forEach(f => f.markAllAsTouched());
      this.error = 'Please enter name for all members.';
      return;
    }

    this.error = '';
    this.selectedRooms = [];
    this.isLoadingRooms = true;
    this.step = 3;
    this.cdr.detectChanges();

    const { checkInDate, checkOutDate } = this.searchForm.value;
    const checkIn = new Date(checkInDate);
    const checkOut = new Date(checkOutDate);
    const diffTime = Math.abs(checkOut.getTime() - checkIn.getTime());
    this.nights = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

    this.roomService.getAvailableRooms(checkInDate, checkOutDate, 1).subscribe({
      next: (res) => {
        const rawRooms: Room[] = res.data || [];
        // Only rooms with status AVAILABLE are available for selection
        this.availableRooms = rawRooms.filter(r => r.status === 'AVAILABLE' || !r.status);
        this.isLoadingRooms = false;

        // Fetch rooms in CLEANING to display as locked / non-selectable
        this.roomService.getRooms(1, 50, '', 'CLEANING').subscribe({
          next: (r) => { 
            this.cleaningRooms = r.data || []; 
            this.cdr.detectChanges(); 
          },
          error: () => { 
            this.cleaningRooms = []; 
            this.cdr.detectChanges(); 
          }
        });

        this.cdr.detectChanges();
      },
      error: (err) => {
        this.error = err.error?.message || 'Failed to fetch available rooms.';
        this.isLoadingRooms = false;
        this.cdr.detectChanges();
      }
    });
  }

  // ─── STEP 3: Room Selection ───────────────────────────────────────

  get roomsNeeded(): number {
    return Number(this.searchForm.get('roomsNeeded')?.value || 1);
  }

  isRoomSelected(room: Room): boolean {
    return this.selectedRooms.some(r => r._id === room._id);
  }

  isRoomSelectable(room: Room): boolean {
    return room.status === 'AVAILABLE' || !room.status;
  }

  toggleRoomSelection(room: Room): void {
    if (room.status === 'CLEANING') {
      this.error = `Room ${room.roomNumber} safai (cleaning) me hai aur select nahi ho sakta. Pehle safai complete karein.`;
      this.cdr.detectChanges();
      return;
    }

    if (room.status && room.status !== 'AVAILABLE') {
      this.error = `Room ${room.roomNumber} ${room.status.toLowerCase()} hai aur abhi select nahi ho sakta.`;
      this.cdr.detectChanges();
      return;
    }

    const idx = this.selectedRooms.findIndex(r => r._id === room._id);
    if (idx >= 0) {
      // Deselect
      this.selectedRooms.splice(idx, 1);
      this.error = '';
    } else {
      if (this.selectedRooms.length >= this.roomsNeeded) {
        this.error = `You need ${this.roomsNeeded} room(s). Deselect a room first to choose another.`;
        return;
      }
      this.selectedRooms.push(room);
      this.error = '';
    }
    this.cdr.detectChanges();
  }

  onCleaningRoomClick(room: Room): void {
    this.error = `Room ${room.roomNumber} safai (cleaning) me hai aur book nahi ho sakta. Kripya Rooms page par jakar 'Mark Ready' karein.`;
    this.cdr.detectChanges();
  }

  proceedToConfirm(): void {
    if (this.selectedRooms.length === 0) {
      this.error = 'Please select at least one room.';
      return;
    }
    if (this.selectedRooms.length < this.roomsNeeded) {
      this.error = `Please select ${this.roomsNeeded} room(s). You have selected ${this.selectedRooms.length}.`;
      return;
    }
    this.error = '';
    this.step = 4;
    this.cdr.detectChanges();
  }

  // ─── STEP 4: Confirm ─────────────────────────────────────────────

  get totalRoomAmount(): number {
    return this.selectedRooms.reduce((sum, r) => sum + (r.price * this.nights), 0);
  }

  get finalTotalAmount(): number {
    const discount = Number(this.confirmForm.get('discountAmount')?.value || 0);
    const tax = Number(this.confirmForm.get('taxAmount')?.value || 0);
    return Math.max(0, this.totalRoomAmount - discount + tax);
  }

  get members(): { name: string; idNumber: string }[] {
    return this.memberForms.map(f => f.value);
  }

  async confirmBooking(): Promise<void> {
    if (this.isSubmitting) return;
    this.isSubmitting = true;
    this.error = '';

    const { checkInDate, checkOutDate, totalMembers } = this.searchForm.value;
    const { discountAmount, taxAmount, notes } = this.confirmForm.value;
    const guests = this.members;

    const count = this.selectedRooms.length || 1;
    const perRoomDiscount = Math.round((Number(discountAmount || 0) / count) * 100) / 100;
    const perRoomTax = Math.round((Number(taxAmount || 0) / count) * 100) / 100;
    const membersPerRoom = Math.max(1, Math.ceil(Number(totalMembers) / count));

    let successCount = 0;
    const errors: string[] = [];
    let lastBooking: any = null;

    for (const room of this.selectedRooms) {
      try {
        const result = await this.bookingService.createBooking({
          primaryGuestId: this.effectiveCustomerId,
          roomId: room._id!,
          checkInDate,
          checkOutDate,
          totalMembers: membersPerRoom,
          guests,
          discountAmount: perRoomDiscount,
          taxAmount: perRoomTax,
          notes
        }).toPromise();
        successCount++;
        lastBooking = result?.data;
      } catch (e: any) {
        errors.push(`Room ${room.roomNumber}: ${e?.error?.message || 'Failed to book'}`);
      }
    }

    this.isSubmitting = false;

    if (successCount > 0) {
      this.bookingCreated.emit(lastBooking);
    } else {
      this.error = errors.join('; ');
      this.cdr.detectChanges();
    }
  }

  // ─── Navigation ───────────────────────────────────────────────────

  goToStep(s: number): void {
    if (s < this.step) {
      this.step = s;
      this.error = '';
      this.cdr.detectChanges();
    }
  }

  goBack(): void {
    if (this.step > 1) {
      this.step--;
      this.error = '';
      this.cdr.detectChanges();
    } else {
      this.onCancel();
    }
  }

  onCancel(): void {
    this.close.emit();
    this.cancel.emit();
  }

  getMemberLabel(i: number): string {
    return i === 0 ? 'Primary Guest' : `Member ${i + 1}`;
  }
}
