import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';

interface Room {
  bookingId: number | string;
  customerName?: string;
  roomNumber: string;
  status: 'BOOKED' | 'CHECKOUT_COMPLETE' | 'UNDER_CLEANING' | 'AVAILABLE';
}

@Component({
  selector: 'app-track-room',
  imports: [CommonModule, FormsModule],
  templateUrl: './track-room.html',
  styleUrl: './track-room.css',
})
export class TrackRoom implements OnInit {
  rooms: Room[] = [];
  loading = true;

  bookingRoomNumber = '';
  bookingError = '';
  bookingSuccess = '';

  trackingSteps = [
    { id: 'BOOKED', label: 'Room is Booked' },
    { id: 'CHECKOUT_COMPLETE', label: 'Checkout Complete' },
    { id: 'UNDER_CLEANING', label: 'Under Cleaning' },
    { id: 'AVAILABLE', label: 'Available' },
  ];

  constructor(private cdr: ChangeDetectorRef, private authService: AuthService) {}

  ngOnInit() {
    this.fetchBookings();
  }

  fetchBookings() {
    this.loading = true;
    
    this.authService.getAllBookings().subscribe({
      next: (res) => {
        const apiResponseData = res?.data || res || [];
        const formattedRooms: Room[] = [];
        
        if (Array.isArray(apiResponseData)) {
          apiResponseData.forEach((booking: any) => {
            if (booking.roomNumber) {
              const roomNumbersArray = String(booking.roomNumber).split(',').map((r) => r.trim());
              roomNumbersArray.forEach((roomNo) => {
                let status = booking.status || 'BOOKED';
                // Automatically map some standard API statuses if needed
                if (status.toUpperCase() === 'CHECKED_OUT' || status.toUpperCase() === 'CHECKOUT') {
                  status = 'CHECKOUT_COMPLETE';
                } else if (status.toUpperCase() === 'CLEANING') {
                  status = 'UNDER_CLEANING';
                }

                formattedRooms.push({
                  bookingId: booking.id || booking._id || booking.bookingId,
                  customerName: booking.customerName || booking.guestName || 'Guest',
                  roomNumber: roomNo,
                  status: status.toUpperCase() as Room['status'],
                });
              });
            }
          });
        }

        this.rooms = formattedRooms;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Failed to fetch bookings from API', err);
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  handleAction(roomNumber: string, currentStatus: string) {
    if (currentStatus === 'BOOKED') {
      this.updateRoomStatus(roomNumber, 'CHECKOUT_COMPLETE');
      
      setTimeout(() => {
        this.updateRoomStatus(roomNumber, 'UNDER_CLEANING');
        this.cdr.detectChanges();
      }, 2000);
    } else if (currentStatus === 'UNDER_CLEANING') {
      this.updateRoomStatus(roomNumber, 'AVAILABLE');
    }
  }

  updateRoomStatus(roomNumber: string, newStatus: Room['status']) {
    this.rooms = this.rooms.map((room) =>
      room.roomNumber === roomNumber ? { ...room, status: newStatus } : room
    );
    this.cdr.detectChanges();
  }

  handleNewBooking(event: Event) {
    event.preventDefault();
    this.bookingError = '';
    this.bookingSuccess = '';

    if (!this.bookingRoomNumber) return;

    const requestedRooms = this.bookingRoomNumber.split(',').map((r) => r.trim());

    for (let requestedRoom of requestedRooms) {
      const existingRoom = this.rooms.find((r) => r.roomNumber === requestedRoom);

      if (existingRoom) {
        if (existingRoom.status === 'BOOKED' || existingRoom.status === 'CHECKOUT_COMPLETE') {
          this.bookingError = `Error: Room ${requestedRoom} is already booked.`;
          return;
        } else if (existingRoom.status === 'UNDER_CLEANING') {
          this.bookingError = `Error: Room ${requestedRoom} is under cleaning, please select other room.`;
          return;
        }
      }
    }

    this.bookingSuccess = `Success: Room ${this.bookingRoomNumber} is available and can be booked!`;
  }

  getStepIndex(status: string): number {
    return this.trackingSteps.findIndex((s) => s.id === status);
  }
}
