import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Guest {
  name: string;
  idNumber?: string;
}

export interface BookingRequest {
  primaryGuestId: string;
  roomId: string;
  checkInDate: string;
  checkOutDate: string;
  totalMembers: number;
  guests?: Guest[];
  discountAmount?: number;
  taxAmount?: number;
  notes?: string;
}

export interface BookingResponse {
  status: boolean;
  message: string;
  data: any;
}

export interface BookingListResponse {
  status: boolean;
  message: string;
  data: any[];
  pagination: {
    totalCount: number;
    currentPage: number;
    totalPages: number;
    limit: number;
  };
}

@Injectable({
  providedIn: 'root'
})
export class BookingService {
  private readonly apiUrl = `${environment.apiUrl}/api/v1/bookings`;

  constructor(private readonly http: HttpClient) {}

  createBooking(bookingData: BookingRequest): Observable<BookingResponse> {
    return this.http.post<BookingResponse>(this.apiUrl, bookingData);
  }

  getBookings(page: number = 1, limit: number = 20, search?: string, status?: string, primaryGuestId?: string): Observable<BookingListResponse> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());

    if (search) params = params.set('search', search);
    if (status) params = params.set('status', status);
    if (primaryGuestId) params = params.set('primaryGuestId', primaryGuestId);

    return this.http.get<BookingListResponse>(this.apiUrl, { params });
  }

  getBookingById(id: string): Observable<BookingResponse> {
    return this.http.get<BookingResponse>(`${this.apiUrl}/${id}`);
  }

  checkIn(id: string, guests?: Guest[]): Observable<BookingResponse> {
    return this.http.post<BookingResponse>(`${this.apiUrl}/${id}/check-in`, { guests });
  }

  checkOut(id: string): Observable<BookingResponse> {
    return this.http.post<BookingResponse>(`${this.apiUrl}/${id}/check-out`, {});
  }

  addPayment(id: string, amount: number): Observable<BookingResponse> {
    return this.http.post<BookingResponse>(`${this.apiUrl}/${id}/payment`, { amount });
  }
}
