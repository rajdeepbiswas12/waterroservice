import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Order, OrderHistory, DashboardStats } from '../models/order.model';

@Injectable({
  providedIn: 'root'
})
export class OrderService {
  private apiUrl = `${environment.apiUrl}/orders`;

  constructor(private http: HttpClient) {}

  getOrders(filters?: any): Observable<any> {
    let params = new HttpParams();
    if (filters) {
      Object.keys(filters).forEach(key => {
        if (filters[key]) {
          params = params.append(key, filters[key]);
        }
      });
    }
    return this.http.get<any>(this.apiUrl, { params });
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
