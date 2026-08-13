import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class BuilderService {
  private http = inject(HttpClient);
  // private apiUrl = environment.apiUrl; 
  private apiUrl = 'http://127.0.0.1:5000'; 

  private getHeaders() {
    const token = localStorage.getItem('userToken');
    return new HttpHeaders().set('Authorization', `Bearer ${token}`);
  }

  // --- CLIENT APIs ---
  addClient(data: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/api/v1/builder/client`, data, { headers: this.getHeaders() });
  }

  getClients(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/api/v1/builder/client`, { headers: this.getHeaders() });
  }

  editClient(id: string, data: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/api/v1/builder/client/${id}`, data, { headers: this.getHeaders() });
  }

  deleteClient(id: string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/api/v1/builder/client/${id}`, { headers: this.getHeaders() });
  }

  // --- BILL APIs ---
  createBill(data: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/api/v1/builder/bill`, data, { headers: this.getHeaders() });
  }

  getBills(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/api/v1/builder/bill`, { headers: this.getHeaders() });
  }

  editBill(id: string, data: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/api/v1/builder/bill/${id}`, data, { headers: this.getHeaders() });
  }

  deleteBill(id: string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/api/v1/builder/bill/${id}`, { headers: this.getHeaders() });
  }

  // --- TRANSACTION APIs ---
  addTransaction(data: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/api/v1/builder/transaction`, data, { headers: this.getHeaders() });
  }

  getTransactions(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/api/v1/builder/transaction`, { headers: this.getHeaders() });
  }

  editTransaction(id: string, data: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/api/v1/builder/transaction/${id}`, data, { headers: this.getHeaders() });
  }

  deleteTransaction(id: string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/api/v1/builder/transaction/${id}`, { headers: this.getHeaders() });
  }



  // --- RATE LIST APIs ---
  addRate(data: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/api/v1/builder/rate-list/`, data, { headers: this.getHeaders() });
  }

  getRateList(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/api/v1/builder/rate-list/`, { headers: this.getHeaders() });
  }

  editRate(id: string, data: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/api/v1/builder/rate-list/${id}`, data, { headers: this.getHeaders() });
  }

  deleteRate(id: string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/api/v1/builder/rate-list/${id}`, { headers: this.getHeaders() });
  }

  // --- MASON APIs ---
  createMason(data: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/api/v1/builder/mason/`, data, { headers: this.getHeaders() });
  }

  getMasons(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/api/v1/builder/mason/`, { headers: this.getHeaders() });
  }

  editMason(id: string, data: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/api/v1/builder/mason/${id}`, data, { headers: this.getHeaders() });
  }

  deleteMason(id: string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/api/v1/builder/mason/${id}`, { headers: this.getHeaders() });
  }

  // --- MASON ATTENDANCE APIs ---
  getMasonAttendance(masonId: string, startDate?: string, endDate?: string): Observable<any> {
    let params = `?masonId=${masonId}`;
    if (startDate) params += `&startDate=${startDate}`;
    if (endDate) params += `&endDate=${endDate}`;
    return this.http.get<any>(`${this.apiUrl}/api/v1/builder/mason/attendance${params}`, { headers: this.getHeaders() });
  }

  markMasonAttendance(data: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/api/v1/builder/mason/attendance`, data, { headers: this.getHeaders() });
  }

  updateMasonAttendance(id: string, data: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/api/v1/builder/mason/attendance/${id}`, data, { headers: this.getHeaders() });
  }
}
