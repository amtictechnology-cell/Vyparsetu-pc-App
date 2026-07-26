import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, tap, concat, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  
  // Default API URL. Feel free to modify this (e.g. 'http://192.168.31.192:5000') if the backend runs on a different machine.
  private apiUrl = 'http://127.0.0.1:5000'; 

  private getCache(key: string): any {
    if (typeof window !== 'undefined') {
      const val = localStorage.getItem(key);
      if (val) {
        try {
          return JSON.parse(val);
        } catch (e) {
          return null;
        }
      }
    }
    return null;
  }

  private setCache(key: string, data: any): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem(key, JSON.stringify(data));
    }
  }

  private getWithCache<T>(cacheKey: string, apiCall: Observable<T>): Observable<T> {
    const cachedData = this.getCache(cacheKey);
    const networkCall = apiCall.pipe(
      tap(res => this.setCache(cacheKey, res))
    );

    if (cachedData) {
      return concat(
        of(cachedData),
        networkCall.pipe(
          catchError(() => of())
        )
      );
    } else {
      return networkCall;
    }
  }

  setApiUrl(url: string): void {
    this.apiUrl = url;
  }

  getApiUrl(): string {
    return this.apiUrl;
  }

  sendOtp(mobileNo: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/api/v1/auth/send/otp`, { mobileNo });
  }

  verifyOtp(mobileNo: string, otpCode: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/api/v1/auth/verify-otp`, { mobileNo, otpCode }).pipe(
      tap(res => {
        if (res && res.token) {
          this.setToken(res.token);
        }
      })
    );
  }

  completeProfile(userId: string, name: string, businessName: string, businessCategory: string): Observable<any> {
    return this.http.patch<any>(`${this.apiUrl}/api/v1/user/complete-profile`, {
      userId,
      name,
      businessName,
      businessCategory
    }).pipe(
      tap(res => {
        if (res && res.token) {
          this.setToken(res.token);
        }
      })
    );
  }

  updateProfile(payload: any): Observable<any> {
    return this.http.patch<any>(`${this.apiUrl}/api/v1/user/complete-profile`, payload).pipe(
      tap(res => {
        if (res && res.token) {
          this.setToken(res.token);
        }
      })
    );
  }


  getProfile(): Observable<any> {
    const token = this.getToken();
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    const call = this.http.get<any>(`${this.apiUrl}/api/v1/user/profile`, { headers });
    return this.getWithCache('cache_profile', call);
  }

  setToken(token: string): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem('userToken', token);
    }
  }

  getToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('userToken');
    }
    return null;
  }

  logout(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('userToken');
    }
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  addHotelItem(formData: FormData): Observable<any> {
    const token = this.getToken();
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    return this.http.post<any>(`${this.apiUrl}/api/v1/hotel/add-item`, formData, { headers });
  }

  getHotelItems(): Observable<any> {
    const token = this.getToken();
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    const call = this.http.get<any>(`${this.apiUrl}/api/v1/hotel/get-items`, { headers });
    return this.getWithCache('cache_hotel_items', call);
  }

  editHotelItem(formData: FormData): Observable<any> {
    const token = this.getToken();
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    return this.http.patch<any>(`${this.apiUrl}/api/v1/hotel/edit-item`, formData, { headers });
  }

  deleteHotelItem(itemId: string): Observable<any> {
    const token = this.getToken();
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`)
                                      .set('Content-Type', 'application/json');
    return this.http.delete<any>(`${this.apiUrl}/api/v1/hotel/delete-item`, {
      headers,
      body: { itemId }
    });
  }

  addBillingCustomer(customerName: string, mobileNumber: string): Observable<any> {
    const token = this.getToken();
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`)
                                      .set('Content-Type', 'application/json');
    return this.http.post<any>(`${this.apiUrl}/api/v1/hotel/bill-customer`, { customerName, mobileNumber }, { headers });
  }

  getBillingCustomers(): Observable<any> {
    const token = this.getToken();
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    const call = this.http.get<any>(`${this.apiUrl}/api/v1/hotel/bill-customers`, { headers });
    return this.getWithCache('cache_billing_customers', call);
  }

  createBill(customerId: string, items: any[], paymentStatus: string): Observable<any> {
    const token = this.getToken();
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`)
                                      .set('Content-Type', 'application/json');
    return this.http.post<any>(`${this.apiUrl}/api/v1/hotel/create-bill`, { customerId, items, paymentStatus }, { headers });
  }

  getBills(customerId?: string, paymentStatus?: string): Observable<any> {
    const token = this.getToken();
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    let url = `${this.apiUrl}/api/v1/hotel/get-bills`;
    const params = [];
    if (customerId) params.push(`customerId=${customerId}`);
    if (paymentStatus) params.push(`paymentStatus=${paymentStatus}`);
    if (params.length > 0) {
      url += `?${params.join('&')}`;
    }
    const call = this.http.get<any>(url, { headers });
    const cacheKey = `cache_bills_${customerId || ''}_${paymentStatus || ''}`;
    return this.getWithCache(cacheKey, call);
  }

  editBill(billId: string, items?: any[], paymentStatus?: string): Observable<any> {
    const token = this.getToken();
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`)
                                      .set('Content-Type', 'application/json');
    const body: any = { billId };
    if (items) body.items = items;
    if (paymentStatus) body.paymentStatus = paymentStatus;
    return this.http.patch<any>(`${this.apiUrl}/api/v1/hotel/edit-bill`, body, { headers });
  }

  deleteBill(billId: string): Observable<any> {
    const token = this.getToken();
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`)
                                      .set('Content-Type', 'application/json');
    return this.http.delete<any>(`${this.apiUrl}/api/v1/hotel/delete-bill`, {
      headers,
      body: { billId }
    });
  }

  // --- Stay Customers APIs ---
  addStayCustomer(formData: FormData): Observable<any> {
    const token = this.getToken();
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    return this.http.post<any>(`${this.apiUrl}/api/v1/hotel/add-customer`, formData, { headers });
  }

  getStayCustomers(): Observable<any> {
    const token = this.getToken();
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    const call = this.http.get<any>(`${this.apiUrl}/api/v1/hotel/get-all-customers`, { headers });
    return this.getWithCache('cache_stay_customers', call);
  }

  editStayCustomer(formData: FormData): Observable<any> {
    const token = this.getToken();
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    return this.http.patch<any>(`${this.apiUrl}/api/v1/hotel/edit-customer`, formData, { headers });
  }

  deleteStayCustomer(customerId: string): Observable<any> {
    const token = this.getToken();
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`)
                                      .set('Content-Type', 'application/json');
    return this.http.delete<any>(`${this.apiUrl}/api/v1/hotel/delete-customer`, {
      headers,
      body: { customerId }
    });
  }

  // --- Booking APIs ---
  addBooking(bookingData: any): Observable<any> {
    const token = this.getToken();
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`)
                                      .set('Content-Type', 'application/json');
    return this.http.post<any>(`${this.apiUrl}/api/v1/hotel/add-booking`, bookingData, { headers });
  }

  getAllBookings(): Observable<any> {
    const token = this.getToken();
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    const call = this.http.get<any>(`${this.apiUrl}/api/v1/hotel/get-all-bookings`, { headers });
    return this.getWithCache('cache_all_bookings', call);
  }

  checkoutBooking(bookingId: string): Observable<any> {
    const token = this.getToken();
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`)
                                      .set('Content-Type', 'application/json');
    return this.http.patch<any>(`${this.apiUrl}/api/v1/hotel/checkout-booking`, { bookingId }, { headers });
  }

  deleteBooking(bookingId: string): Observable<any> {
    const token = this.getToken();
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`)
                                      .set('Content-Type', 'application/json');
    return this.http.delete<any>(`${this.apiUrl}/api/v1/hotel/delete-booking`, {
      headers,
      body: { bookingId }
    });
  }

  // --- Driver APIs ---
  addDriver(driverData: any): Observable<any> {
    const token = this.getToken();
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`)
                                      .set('Content-Type', 'application/json');
    return this.http.post<any>(`${this.apiUrl}/api/v1/hotel/add-driver`, driverData, { headers });
  }

  getDrivers(filters?: any): Observable<any> {
    const token = this.getToken();
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    let url = `${this.apiUrl}/api/v1/hotel/get-all-driver`;
    const params = [];
    if (filters) {
      if (filters.SRnumber) params.push(`SRnumber=${filters.SRnumber}`);
      if (filters.driverName) params.push(`driverName=${filters.driverName}`);
      if (filters.carNumber) params.push(`carNumber=${filters.carNumber}`);
      if (filters.mobileNumber) params.push(`mobileNumber=${filters.mobileNumber}`);
      if (filters.city) params.push(`city=${filters.city}`);
    }
    if (params.length > 0) {
      url += `?${params.join('&')}`;
    }
    const call = this.http.get<any>(url, { headers });
    const cacheKey = `cache_drivers_${JSON.stringify(filters || {})}`;
    return this.getWithCache(cacheKey, call);
  }

  editDriver(driverData: any): Observable<any> {
    const token = this.getToken();
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`)
                                      .set('Content-Type', 'application/json');
    return this.http.patch<any>(`${this.apiUrl}/api/v1/hotel/edit-driver`, driverData, { headers });
  }

  deleteDriver(driverId: string): Observable<any> {
    const token = this.getToken();
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`)
                                      .set('Content-Type', 'application/json');
    return this.http.delete<any>(`${this.apiUrl}/api/v1/hotel/delete-driver`, {
      headers,
      body: { driverId }
    });
  }

  // --- Driver Entry APIs ---
  addDriverEntry(entryData: any): Observable<any> {
    const token = this.getToken();
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`)
                                      .set('Content-Type', 'application/json');
    return this.http.post<any>(`${this.apiUrl}/api/v1/hotel/add-driver-entry`, entryData, { headers });
  }

  getDriverEntries(filters?: any): Observable<any> {
    const token = this.getToken();
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    let url = `${this.apiUrl}/api/v1/hotel/get-all-driver-entry`;
    const params = [];
    if (filters) {
      if (filters.driverId) params.push(`driverId=${filters.driverId}`);
      if (filters.driverName) params.push(`driverName=${filters.driverName}`);
      if (filters.carNumber) params.push(`carNumber=${filters.carNumber}`);
      if (filters.mobileNumber) params.push(`mobileNumber=${filters.mobileNumber}`);
    }
    if (params.length > 0) {
      url += `?${params.join('&')}`;
    }
    const call = this.http.get<any>(url, { headers });
    const cacheKey = `cache_driver_entries_${JSON.stringify(filters || {})}`;
    return this.getWithCache(cacheKey, call);
  }

  editDriverEntry(entryData: any): Observable<any> {
    const token = this.getToken();
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`)
                                      .set('Content-Type', 'application/json');
    return this.http.patch<any>(`${this.apiUrl}/api/v1/hotel/edit-driver-entry`, entryData, { headers });
  }

  deleteDriverEntry(entryId: string, driverId: string): Observable<any> {
    const token = this.getToken();
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`)
                                      .set('Content-Type', 'application/json');
    return this.http.delete<any>(`${this.apiUrl}/api/v1/hotel/delete-driver-entry`, {
      headers,
      body: { entryId, driverId }
    });
  }

  // --- Staff APIs ---
  addStaff(staffData: any): Observable<any> {
    const token = this.getToken();
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`)
                                      .set('Content-Type', 'application/json');
    return this.http.post<any>(`${this.apiUrl}/api/v1/staff/add`, staffData, { headers });
  }

  getStaff(): Observable<any> {
    const token = this.getToken();
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    const call = this.http.get<any>(`${this.apiUrl}/api/v1/staff/get-staff`, { headers });
    return this.getWithCache('cache_staff', call);
  }

  editStaff(staffData: any): Observable<any> {
    const token = this.getToken();
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`)
                                      .set('Content-Type', 'application/json');
    return this.http.patch<any>(`${this.apiUrl}/api/v1/staff/update`, staffData, { headers });
  }

  deleteStaff(staffId: string): Observable<any> {
    const token = this.getToken();
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`)
                                      .set('Content-Type', 'application/json');
    return this.http.delete<any>(`${this.apiUrl}/api/v1/staff/delete`, {
      headers,
      body: { staffId }
    });
  }

  // --- Attendance APIs ---
  markAttendance(attendanceData: any): Observable<any> {
    const token = this.getToken();
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`)
                                      .set('Content-Type', 'application/json');
    return this.http.post<any>(`${this.apiUrl}/api/v1/staff/attendance/mark`, attendanceData, { headers });
  }

  getAttendance(filters?: any): Observable<any> {
    const token = this.getToken();
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    let url = `${this.apiUrl}/api/v1/staff/attendance/get`;
    const params = [];
    if (filters) {
      if (filters.staffId) params.push(`staffId=${filters.staffId}`);
      if (filters.month) params.push(`month=${filters.month}`);
      if (filters.year) params.push(`year=${filters.year}`);
    }
    if (params.length > 0) {
      url += `?${params.join('&')}`;
    }
    const call = this.http.get<any>(url, { headers });
    const cacheKey = `cache_attendance_${JSON.stringify(filters || {})}`;
    return this.getWithCache(cacheKey, call);
  }

  editAttendance(attendanceData: any): Observable<any> {
    const token = this.getToken();
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`)
                                      .set('Content-Type', 'application/json');
    return this.http.patch<any>(`${this.apiUrl}/api/v1/staff/attendance/edit`, attendanceData, { headers });
  }

  getMyPlans(): Observable<any> {
    const token = this.getToken();
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    const call = this.http.get<any>(`${this.apiUrl}/api/v1/plans/app/my-plans`, { headers });
    return this.getWithCache('cache_my_plans', call);
  }

  subscribeToPlan(planId: string): Observable<any> {
    const token = this.getToken();
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`)
                                      .set('Content-Type', 'application/json');
    return this.http.post<any>(`${this.apiUrl}/api/v1/plans/subscribe`, { planId }, { headers });
  }

  // --- Supplier Rate List APIs ---
  getRateList(): Observable<any> {
    const token = this.getToken();
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    return this.http.get<any>(`${this.apiUrl}/api/v1/supplier/rate-list`, { headers });
  }

  addRateListItem(itemName: string, itemPrice: number): Observable<any> {
    const token = this.getToken();
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`)
                                      .set('Content-Type', 'application/json');
    return this.http.post<any>(`${this.apiUrl}/api/v1/supplier/rate-list/add-item`, { itemName, itemPrice }, { headers });
  }

  editRateListItem(itemId: string, itemName?: string, itemPrice?: number): Observable<any> {
    const token = this.getToken();
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`)
                                      .set('Content-Type', 'application/json');
    const body: any = { itemId };
    if (itemName !== undefined) body.itemName = itemName;
    if (itemPrice !== undefined) body.itemPrice = itemPrice;
    return this.http.put<any>(`${this.apiUrl}/api/v1/supplier/rate-list/edit-item`, body, { headers });
  }

  deleteRateListItem(itemId: string): Observable<any> {
    const token = this.getToken();
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`)
                                      .set('Content-Type', 'application/json');
    return this.http.delete<any>(`${this.apiUrl}/api/v1/supplier/rate-list/delete-item`, {
      headers,
      body: { itemId }
    });
  }

  // --- Supplier Customer APIs ---
  getSupplierCustomers(filters?: { customerSR?: string; customerName?: string }): Observable<any> {
    const token = this.getToken();
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    let url = `${this.apiUrl}/api/v1/supplier/customer`;
    const params = [];
    if (filters) {
      if (filters.customerSR) params.push(`customerSR=${filters.customerSR}`);
      if (filters.customerName) params.push(`customerName=${filters.customerName}`);
    }
    if (params.length > 0) {
      url += `?${params.join('&')}`;
    }
    return this.http.get<any>(url, { headers });
  }

  addSupplierCustomer(customerData: { customerSR: string; customerName: string; mobileNumber: string; shopName: string }): Observable<any> {
    const token = this.getToken();
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`)
                                      .set('Content-Type', 'application/json');
    return this.http.post<any>(`${this.apiUrl}/api/v1/supplier/customer`, customerData, { headers });
  }

  updateSupplierCustomer(customerData: { customerId: string; customerName?: string; mobileNumber?: string; shopName?: string; customerSR?: string }): Observable<any> {
    const token = this.getToken();
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`)
                                      .set('Content-Type', 'application/json');
    return this.http.put<any>(`${this.apiUrl}/api/v1/supplier/customer`, customerData, { headers });
  }

  deleteSupplierCustomer(customerId: string): Observable<any> {
    const token = this.getToken();
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`)
                                      .set('Content-Type', 'application/json');
    return this.http.delete<any>(`${this.apiUrl}/api/v1/supplier/customer`, {
      headers,
      body: { customerId }
    });
  }

  // --- Supplier Billing APIs ---
  getSupplierBills(customerId: string): Observable<any> {
    const token = this.getToken();
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    return this.http.get<any>(`${this.apiUrl}/api/v1/supplier/bill?customerId=${customerId}`, { headers });
  }

  createSupplierBill(billData: { customerId: string; items: any[]; paymentStatus: string; notes?: string }): Observable<any> {
    const token = this.getToken();
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`)
                                      .set('Content-Type', 'application/json');
    return this.http.post<any>(`${this.apiUrl}/api/v1/supplier/bill`, billData, { headers });
  }

  updateSupplierBill(billData: { billId: string; paymentStatus?: string; notes?: string }): Observable<any> {
    const token = this.getToken();
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`)
                                      .set('Content-Type', 'application/json');
    return this.http.put<any>(`${this.apiUrl}/api/v1/supplier/bill`, billData, { headers });
  }

  deleteSupplierBill(billId: string): Observable<any> {
    const token = this.getToken();
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`)
                                      .set('Content-Type', 'application/json');
    return this.http.delete<any>(`${this.apiUrl}/api/v1/supplier/bill`, {
      headers,
      body: { billId }
    });
  }

  // --- Supplier Company APIs ---
  getSupplierCompanies(filters?: { companyName?: string; mobile?: string }): Observable<any> {
    const token = this.getToken();
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    let url = `${this.apiUrl}/api/v1/supplier/company`;
    const params = [];
    if (filters) {
      if (filters.companyName) params.push(`companyName=${encodeURIComponent(filters.companyName)}`);
      if (filters.mobile) params.push(`mobile=${encodeURIComponent(filters.mobile)}`);
    }
    if (params.length > 0) {
      url += `?${params.join('&')}`;
    }
    return this.http.get<any>(url, { headers });
  }

  addSupplierCompany(companyData: { companyName: string; mobile: string }): Observable<any> {
    const token = this.getToken();
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`)
                                      .set('Content-Type', 'application/json');
    return this.http.post<any>(`${this.apiUrl}/api/v1/supplier/company`, companyData, { headers });
  }

  updateSupplierCompany(companyData: { companyId: string; companyName?: string; mobile?: string }): Observable<any> {
    const token = this.getToken();
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`)
                                      .set('Content-Type', 'application/json');
    return this.http.put<any>(`${this.apiUrl}/api/v1/supplier/company`, companyData, { headers });
  }

  deleteSupplierCompany(companyId: string): Observable<any> {
    const token = this.getToken();
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`)
                                      .set('Content-Type', 'application/json');
    return this.http.delete<any>(`${this.apiUrl}/api/v1/supplier/company`, {
      headers,
      body: { companyId }
    });
  }

  // --- Supplier Transaction (Len-Den) APIs (Form-Data / Multipart) ---
  getSupplierTransactions(companyId: string, type?: string): Observable<any> {
    const token = this.getToken();
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    let url = `${this.apiUrl}/api/v1/supplier/transaction?companyId=${companyId}`;
    if (type) {
      url += `&type=${type}`;
    }
    return this.http.get<any>(url, { headers });
  }

  addSupplierTransaction(formData: FormData): Observable<any> {
    const token = this.getToken();
    // Do NOT set Content-Type header here. HttpClient will auto-set boundary when multipart FormData is passed.
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    return this.http.post<any>(`${this.apiUrl}/api/v1/supplier/transaction`, formData, { headers });
  }

  updateSupplierTransaction(formData: FormData): Observable<any> {
    const token = this.getToken();
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    return this.http.put<any>(`${this.apiUrl}/api/v1/supplier/transaction`, formData, { headers });
  }

  deleteSupplierTransaction(transactionId: string): Observable<any> {
    const token = this.getToken();
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`)
                                      .set('Content-Type', 'application/json');
    return this.http.delete<any>(`${this.apiUrl}/api/v1/supplier/transaction`, {
      headers,
      body: { transactionId }
    });
  }
}
