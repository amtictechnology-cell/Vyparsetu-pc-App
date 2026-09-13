import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface Room {
  _id?: string;
  roomNumber: string;
  roomTypeId: string;
  floor: string;
  price: number;
  bedCapacity: number;
  status: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface RoomResponse {
  status: boolean;
  message: string;
  data: Room;
}

export interface RoomListResponse {
  status: boolean;
  message: string;
  data: Room[];
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
export class RoomService {
  private readonly apiUrl = `${environment.apiUrl}/api/v1/rooms`;

  constructor(private readonly http: HttpClient) {}

  getRooms(page: number = 1, limit: number = 20, search?: string, status?: string, floor?: string): Observable<RoomListResponse> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());

    if (search) params = params.set('search', search);
    if (status) params = params.set('status', status);
    if (floor) params = params.set('floor', floor);

    return this.http.get<RoomListResponse>(this.apiUrl, { params });
  }

  getAvailableRooms(checkIn: string, checkOut: string, capacity?: number): Observable<{ status: boolean; message: string; data: (Room & { availableForSelectedDates?: boolean })[] }> {
    let params = new HttpParams()
      .set('checkIn', checkIn)
      .set('checkOut', checkOut);
      
    if (capacity) params = params.set('capacity', capacity.toString());

    return this.http.get<{ status: boolean; message: string; data: (Room & { availableForSelectedDates?: boolean })[] }>(`${this.apiUrl}/availability`, { params });
  }

  getRoomById(id: string): Observable<RoomResponse> {
    return this.http.get<RoomResponse>(`${this.apiUrl}/${id}`);
  }

  addRoom(roomData: Partial<Room>): Observable<RoomResponse> {
    return this.http.post<RoomResponse>(this.apiUrl, roomData);
  }

  updateRoom(id: string, roomData: Partial<Room>): Observable<RoomResponse> {
    return this.http.put<RoomResponse>(`${this.apiUrl}/${id}`, roomData);
  }

  deleteRoom(id: string): Observable<{ status: boolean; message: string }> {
    return this.http.delete<{ status: boolean; message: string }>(`${this.apiUrl}/${id}`);
  }
}
