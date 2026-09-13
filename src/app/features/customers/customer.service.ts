import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Customer {
  _id?: string;
  name: string;
  mobile: string;
  idType?: string;
  idNumber?: string;
  address?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CustomerResponse {
  status: boolean;
  message: string;
  data: Customer;
}

export interface CustomerListResponse {
  status: boolean;
  message: string;
  data: Customer[];
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
export class CustomerService {
  private readonly apiUrl = `${environment.apiUrl}/api/v1/customers`;

  constructor(private readonly http: HttpClient) {}

  getCustomers(page: number = 1, limit: number = 20, search?: string): Observable<CustomerListResponse> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());

    if (search) params = params.set('search', search);

    return this.http.get<CustomerListResponse>(this.apiUrl, { params });
  }

  getCustomerById(id: string): Observable<CustomerResponse> {
    return this.http.get<CustomerResponse>(`${this.apiUrl}/${id}`);
  }

  addCustomer(customerData: Partial<Customer>): Observable<CustomerResponse> {
    return this.http.post<CustomerResponse>(this.apiUrl, customerData);
  }

  updateCustomer(id: string, customerData: Partial<Customer>): Observable<CustomerResponse> {
    return this.http.put<CustomerResponse>(`${this.apiUrl}/${id}`, customerData);
  }

  deleteCustomer(id: string): Observable<{ status: boolean; message: string }> {
    return this.http.delete<{ status: boolean; message: string }>(`${this.apiUrl}/${id}`);
  }
}
