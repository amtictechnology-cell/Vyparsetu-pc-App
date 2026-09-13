import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface BillItem {
  menuItemId?: string;
  itemName: string;
  unit: string;
  unitPrice: number;
  quantity: number;
  total: number;
}

export interface Bill {
  _id?: string;
  billNumber: string;
  customerId: string;
  customerName: string;
  customerMobile: string;
  items: BillItem[];
  subTotal: number;
  discountAmount?: number;
  taxAmount?: number;
  finalAmount: number;
  paymentMode: string;
  paymentStatus: string;
  notes?: string;
  createdAt?: string;
}

export interface CreateBillRequest {
  customerId?: string;
  customerName: string;
  customerMobile: string;
  items: {
    menuItemId?: string;
    itemName: string;
    unit: string;
    unitPrice: number;
    quantity: number;
  }[];
  discountAmount?: number;
  taxAmount?: number;
  paymentMode?: string;
  paymentStatus?: string;
  notes?: string;
}

export interface BillResponse {
  success: boolean;
  status: boolean;
  message: string;
  data: Bill;
}

export interface BillListResponse {
  success: boolean;
  status: boolean;
  message: string;
  data: Bill[];
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
export class BillService {
  private readonly apiUrl = `${environment.apiUrl}/api/v1/bills`;

  constructor(private readonly http: HttpClient) {}

  createBill(payload: CreateBillRequest): Observable<BillResponse> {
    return this.http.post<BillResponse>(this.apiUrl, payload);
  }

  getBills(page: number = 1, limit: number = 20, search?: string, customerId?: string): Observable<BillListResponse> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());

    if (search && search.trim()) {
      params = params.set('search', search.trim());
    }

    if (customerId && customerId.trim()) {
      params = params.set('customerId', customerId.trim());
    }

    return this.http.get<BillListResponse>(this.apiUrl, { params });
  }

  getBillById(id: string): Observable<BillResponse> {
    return this.http.get<BillResponse>(`${this.apiUrl}/${id}`);
  }

  updateBill(id: string, payload: Partial<CreateBillRequest>): Observable<BillResponse> {
    return this.http.put<BillResponse>(`${this.apiUrl}/${id}`, payload);
  }

  deleteBill(id: string): Observable<{ success: boolean; message: string; data?: any }> {
    return this.http.delete<{ success: boolean; message: string; data?: any }>(`${this.apiUrl}/${id}`);
  }
}
