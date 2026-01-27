import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Customer {
  id?: number;
  customerNumber?: string;
  name: string;
  phone: string;
  email?: string;
  alternatePhone?: string;
  address: string;
  city?: string;
  state?: string;
  postalCode?: string;
  latitude?: number;
  longitude?: number;
  customerType?: 'residential' | 'commercial' | 'industrial';
  gstNumber?: string;
  status?: 'active' | 'inactive' | 'blocked';
  loyaltyPoints?: number;
  totalBookings?: number;
  totalSpent?: number;
  lastBookingDate?: Date;
  notes?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

@Injectable({
  providedIn: 'root'
})
export class CustomerService {
  private get apiUrl() {
    return `${this.configService.getApiUrl()}/customers`;
  }

  constructor(
    private http: HttpClient,
    private configService: ConfigService
  ) { }

  getAllCustomers(page = 1, limit = 10, search = '', status = ''): Observable<any> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());
    
    if (search) params = params.set('search', search);
    if (status) params = params.set('status', status);

    return this.http.get(this.apiUrl, { params });
  }

  getCustomerById(id: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/${id}`);
  }

  createCustomer(customer: Customer): Observable<any> {
    return this.http.post(this.apiUrl, customer);
  }

  updateCustomer(id: number, customer: Partial<Customer>): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, customer);
  }

  deleteCustomer(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

  getCustomerStats(): Observable<any> {
    return this.http.get(`${this.apiUrl}/stats`);
  }
}
