import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Order, OrderHistory, DashboardStats } from '../models/order.model';

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
  status?: string;
  priority?: string;
  search?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

@Injectable({
  providedIn: 'root'
})
export class OrderService {
  private get apiUrl() {
    return `${this.configService.getApiUrl()}/orders`;
  }

  constructor(
    private http: HttpClient,
    private configService: ConfigService
  ) { }

  getOrders(params?: PaginationParams): Observable<PaginatedResponse<Order>> {
    let httpParams = new HttpParams();
    
    if (params) {
      if (params.page) httpParams = httpParams.set('page', params.page.toString());
      if (params.limit) httpParams = httpParams.set('limit', params.limit.toString());
      if (params.sortBy) httpParams = httpParams.set('sortBy', params.sortBy);
      if (params.sortOrder) httpParams = httpParams.set('sortOrder', params.sortOrder);
      if (params.status) httpParams = httpParams.set('status', params.status);
      if (params.priority) httpParams = httpParams.set('priority', params.priority);
      if (params.search) httpParams = httpParams.set('search', params.search);
    }
    
    return this.http.get<PaginatedResponse<Order>>(this.apiUrl, { params: httpParams });
  }

  getOrder(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`);
  }

  createOrder(orderData: Partial<Order>): Observable<any> {
    return this.http.post<any>(this.apiUrl, orderData);
  }

  updateOrder(id: number, orderData: Partial<Order>): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, orderData);
  }

  assignOrder(id: number, employeeId: number): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}/assign`, { employeeId });
  }

  updateOrderStatus(id: number, status: string, notes?: string): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}/status`, { status, notes });
  }

  deleteOrder(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`);
  }

  getOrderHistory(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}/history`);
  }

  getDashboardStats(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/dashboard/stats`);
  }

  getMonthlyStats(months: number = 6): Observable<any> {
    let params = new HttpParams().set('months', months.toString());
    return this.http.get<any>(`${this.apiUrl}/dashboard/monthly-stats`, { params });
  }
}
