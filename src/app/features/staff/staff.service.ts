import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'HALF_DAY' | 'PAID_LEAVE';

export interface Staff {
  _id: string;
  staffName: string;
  mobileNumber: string;
  address?: string;
  isActive: boolean;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AttendanceRecord {
  date: string; // YYYY-MM-DD
  status: AttendanceStatus | null;
  isFuture: boolean;
}

export interface AttendanceSummary {
  totalDays: number;
  markedDays: number;
  present: number;
  absent: number;
  halfDay: number;
  paidLeave: number;
  effectivePresentDays: number;
}

export interface MonthlyAttendanceResponse {
  success: boolean;
  status: boolean;
  message: string;
  staff: {
    id: string;
    staffName: string;
    mobileNumber: string;
    address?: string;
    isActive: boolean;
    isDeleted: boolean;
  };
  year: number;
  month: number;
  attendance: AttendanceRecord[];
  summary: AttendanceSummary;
}

export interface StaffListResponse {
  success: boolean;
  status: boolean;
  message: string;
  data: Staff[];
  pagination: {
    totalCount: number;
    currentPage: number;
    totalPages: number;
    limit: number;
  };
}

export interface StaffSingleResponse {
  success: boolean;
  status: boolean;
  message: string;
  data: Staff;
}

export interface UpdateAttendanceResponse {
  success: boolean;
  status: boolean;
  message: string;
  data: {
    _id: string;
    staffId: string;
    date: string;
    status: AttendanceStatus;
    updatedAt: string;
  };
}

@Injectable({
  providedIn: 'root'
})
export class StaffService {
  private readonly apiUrl = `${environment.apiUrl}/api/v1/staff`;

  constructor(private readonly http: HttpClient) {}

  /**
   * Get paginated staff list with search and status filter
   */
  getStaff(page: number = 1, limit: number = 20, search?: string, status?: string): Observable<StaffListResponse> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());

    if (search && search.trim()) {
      params = params.set('search', search.trim());
    }

    if (status && status !== 'all') {
      params = params.set('status', status);
    }

    return this.http.get<StaffListResponse>(this.apiUrl, { params });
  }

  /**
   * Get single staff profile by ID
   */
  getStaffById(id: string): Observable<StaffSingleResponse> {
    return this.http.get<StaffSingleResponse>(`${this.apiUrl}/${id}`);
  }

  /**
   * Create new staff member
   */
  createStaff(data: { staffName: string; mobileNumber: string; address?: string }): Observable<StaffSingleResponse> {
    return this.http.post<StaffSingleResponse>(this.apiUrl, data);
  }

  /**
   * Update staff member details
   */
  updateStaff(id: string, data: { staffName?: string; mobileNumber?: string; address?: string }): Observable<StaffSingleResponse> {
    return this.http.put<StaffSingleResponse>(`${this.apiUrl}/${id}`, data);
  }

  /**
   * Soft delete staff member
   */
  deleteStaff(id: string): Observable<{ success: boolean; status: boolean; message: string }> {
    return this.http.delete<{ success: boolean; status: boolean; message: string }>(`${this.apiUrl}/${id}`);
  }

  /**
   * Toggle staff active/inactive status
   */
  updateStaffStatus(id: string, isActive: boolean): Observable<StaffSingleResponse> {
    return this.http.patch<StaffSingleResponse>(`${this.apiUrl}/${id}/status`, { isActive });
  }

  /**
   * Get month-wise attendance calendar and summary
   */
  getMonthlyAttendance(staffId: string, year: number, month: number): Observable<MonthlyAttendanceResponse> {
    const params = new HttpParams()
      .set('year', year.toString())
      .set('month', month.toString());

    return this.http.get<MonthlyAttendanceResponse>(`${this.apiUrl}/${staffId}/attendance/month`, { params });
  }

  /**
   * Update attendance status for a specific date
   */
  updateAttendance(staffId: string, date: string, status: AttendanceStatus): Observable<UpdateAttendanceResponse> {
    return this.http.put<UpdateAttendanceResponse>(`${this.apiUrl}/${staffId}/attendance/${date}`, { status });
  }

  /**
   * Get today's overall attendance summary across all staff
   */
  getTodayAttendanceSummary(): Observable<{
    success: boolean;
    status: boolean;
    message: string;
    data: {
      totalStaff: number;
      activeStaff: number;
      present: number;
      absent: number;
      halfDay: number;
      paidLeave: number;
      unmarked: number;
      date: string;
    };
  }> {
    return this.http.get<any>(`${this.apiUrl}/attendance/today-summary`);
  }
}
