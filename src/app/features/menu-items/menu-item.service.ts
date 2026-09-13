import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface MenuItem {
  _id?: string;
  itemName: string;
  itemPrice: number;
  itemCategory: string;
  unit: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface MenuItemCounts {
  total: number;
  active: number;
  inactive: number;
}

export interface MenuItemPagination {
  totalCount: number;
  currentPage: number;
  totalPages: number;
  limit: number;
}

export interface MenuItemListResponse {
  success: boolean;
  status: boolean;
  message: string;
  data: MenuItem[];
  counts?: MenuItemCounts;
  pagination?: MenuItemPagination;
}

export interface SingleMenuItemResponse {
  success: boolean;
  status: boolean;
  message: string;
  data: MenuItem;
}

export interface BulkMenuItemsResponse {
  success: boolean;
  status: boolean;
  message: string;
  data: MenuItem[];
  errors?: string[];
}

@Injectable({
  providedIn: 'root'
})
export class MenuItemService {
  private readonly apiUrl = `${environment.apiUrl}/api/v1/menu-items`;

  constructor(private readonly http: HttpClient) {}

  getItems(
    page: number = 1, 
    limit: number = 20, 
    search?: string, 
    category?: string, 
    isActive?: boolean | string
  ): Observable<MenuItemListResponse> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());

    if (search && search.trim()) {
      params = params.set('search', search.trim());
    }

    if (category && category.trim()) {
      params = params.set('category', category.trim());
    }

    if (isActive !== undefined && isActive !== '') {
      params = params.set('isActive', isActive.toString());
    }

    return this.http.get<MenuItemListResponse>(this.apiUrl, { params });
  }

  getItemById(id: string): Observable<SingleMenuItemResponse> {
    return this.http.get<SingleMenuItemResponse>(`${this.apiUrl}/${id}`);
  }

  addItem(itemData: Partial<MenuItem>): Observable<SingleMenuItemResponse> {
    return this.http.post<SingleMenuItemResponse>(this.apiUrl, itemData);
  }

  addBulkItems(items: Partial<MenuItem>[]): Observable<BulkMenuItemsResponse> {
    return this.http.post<BulkMenuItemsResponse>(`${this.apiUrl}/bulk`, { items });
  }

  updateItem(id: string, itemData: Partial<MenuItem>): Observable<SingleMenuItemResponse> {
    return this.http.put<SingleMenuItemResponse>(`${this.apiUrl}/${id}`, itemData);
  }

  deleteItem(id: string): Observable<{ success: boolean; status: boolean; message: string }> {
    return this.http.delete<{ success: boolean; status: boolean; message: string }>(`${this.apiUrl}/${id}`);
  }

  toggleStatus(id: string): Observable<SingleMenuItemResponse> {
    return this.http.patch<SingleMenuItemResponse>(`${this.apiUrl}/${id}/toggle-status`, {});
  }
}
