import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface AmcPlan {
  id?: number;
  planCode?: string;
  planName: string;
  description?: string;
  duration: number;
  serviceType: string;
  numberOfVisits: number;
  price: number;
  gst?: number;
  features?: string[];
  isActive?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface AmcSubscription {
  id?: number;
  subscriptionNumber?: string;
  customerId: number;
  planId: number;
  startDate: Date;
  endDate?: Date;
  status?: string;
  totalAmount?: number;
  paidAmount?: number;
  balanceAmount?: number;
  paymentStatus?: string;
  paymentMode?: string;
  transactionId?: string;
  visitsUsed?: number;
  visitsRemaining?: number;
  lastVisitDate?: Date;
  nextVisitDue?: Date;
  autoRenewal?: boolean;
  notes?: string;
  customer?: any;
  plan?: any;
}

export interface AmcVisit {
  id?: number;
  visitNumber?: string;
  subscriptionId: number;
  orderId?: number;
  visitType?: string;
  scheduledDate?: Date;
  completedDate?: Date;
  status?: string;
  servicePerformed?: string;
  partsReplaced?: any[];
  additionalCharges?: number;
  technicianId?: number;
  customerRating?: number;
  customerFeedback?: string;
  notes?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AmcService {
  private get apiUrl() {
    return `${this.configService.getApiUrl()}/amc`;
  }

  constructor(
    private http: HttpClient,
    private configService: ConfigService
  ) { }

  // AMC Plans
  getAllPlans(isActive?: boolean): Observable<any> {
    let params = new HttpParams();
    if (isActive !== undefined) {
      params = params.set('isActive', isActive.toString());
    }
    return this.http.get(`${this.apiUrl}/plans`, { params });
  }

  getPlanById(id: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/plans/${id}`);
  }

  createPlan(plan: AmcPlan): Observable<any> {
    return this.http.post(`${this.apiUrl}/plans`, plan);
  }

  updatePlan(id: number, plan: Partial<AmcPlan>): Observable<any> {
    return this.http.put(`${this.apiUrl}/plans/${id}`, plan);
  }

  deletePlan(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/plans/${id}`);
  }

  // AMC Subscriptions
  getAllSubscriptions(page = 1, limit = 10, status = '', customerId?: number): Observable<any> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());
    
    if (status) params = params.set('status', status);
    if (customerId) params = params.set('customerId', customerId.toString());

    return this.http.get(`${this.apiUrl}/subscriptions`, { params });
  }

  getSubscriptionById(id: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/subscriptions/${id}`);
  }

  createSubscription(subscription: AmcSubscription): Observable<any> {
    return this.http.post(`${this.apiUrl}/subscriptions`, subscription);
  }

  updateSubscription(id: number, subscription: Partial<AmcSubscription>): Observable<any> {
    return this.http.put(`${this.apiUrl}/subscriptions/${id}`, subscription);
  }

  cancelSubscription(id: number, reason: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/subscriptions/${id}/cancel`, { reason });
  }

  // AMC Visits
  getAllVisits(page = 1, limit = 10, status = '', subscriptionId?: number): Observable<any> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());
    
    if (status) params = params.set('status', status);
    if (subscriptionId) params = params.set('subscriptionId', subscriptionId.toString());

    return this.http.get(`${this.apiUrl}/visits`, { params });
  }

  createVisit(visit: AmcVisit): Observable<any> {
    return this.http.post(`${this.apiUrl}/visits`, visit);
  }

  updateVisit(id: number, visit: Partial<AmcVisit>): Observable<any> {
    return this.http.put(`${this.apiUrl}/visits/${id}`, visit);
  }

  // Statistics
  getAmcStats(): Observable<any> {
    return this.http.get(`${this.apiUrl}/stats`);
  }
}
