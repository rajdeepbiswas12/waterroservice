import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatCardModule } from '@angular/material/card';
import { of, throwError } from 'rxjs';

import { AmcSubscriptionsComponent } from './amc-subscriptions.component';
import { AmcService, AmcSubscription } from '../../../services/amc.service';

describe('AmcSubscriptionsComponent', () => {
  let component: AmcSubscriptionsComponent;
  let fixture: ComponentFixture<AmcSubscriptionsComponent>;
  let amcService: jasmine.SpyObj<AmcService>;

  const mockSubscriptions: AmcSubscription[] = [
    {
      id: 1,
      subscriptionNumber: 'SUB-123456',
      customerId: 1,
      planId: 1,
      startDate: '2026-01-01',
      endDate: '2026-12-31',
      status: 'active',
      paymentStatus: 'paid',
      totalAmount: 5900,
      visitsUsed: 1,
      visitsRemaining: 3,
      autoRenewal: true,
      customer: {
        id: 1,
        name: 'John Doe',
        phone: '9876543210'
      },
      plan: {
        id: 1,
        planName: 'Gold Plan',
        serviceType: 'Full Service'
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 2,
      subscriptionNumber: 'SUB-789012',
      customerId: 2,
      planId: 2,
      startDate: '2025-07-01',
      endDate: '2026-06-30',
      status: 'expired',
      paymentStatus: 'paid',
      totalAmount: 3540,
      visitsUsed: 2,
      visitsRemaining: 0,
      autoRenewal: false,
      customer: {
        id: 2,
        name: 'Jane Smith',
        phone: '9876543211'
      },
      plan: {
        id: 2,
        planName: 'Silver Plan',
        serviceType: 'Basic Service'
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ];

  beforeEach(async () => {
    const amcServiceSpy = jasmine.createSpyObj('AmcService', [
      'getAllSubscriptions',
      'cancelSubscription'
    ]);

    await TestBed.configureTestingModule({
      imports: [
        AmcSubscriptionsComponent,
        HttpClientTestingModule,
        RouterTestingModule,
        BrowserAnimationsModule,
        MatTableModule,
        MatPaginatorModule,
        MatFormFieldModule,
        MatSelectModule,
        MatButtonModule,
        MatIconModule,
        MatChipsModule,
        MatCardModule
      ],
      providers: [
        { provide: AmcService, useValue: amcServiceSpy }
      ]
    }).compileComponents();

    amcService = TestBed.inject(AmcService) as jasmine.SpyObj<AmcService>;
    fixture = TestBed.createComponent(AmcSubscriptionsComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load subscriptions on init', () => {
    amcService.getAllSubscriptions.and.returnValue(of({
      success: true,
      data: mockSubscriptions,
      pagination: { total: 2, page: 1, limit: 10, totalPages: 1 }
    }));

    fixture.detectChanges();

    expect(amcService.getAllSubscriptions).toHaveBeenCalled();
    expect(component.dataSource.data.length).toBe(2);
    expect(component.totalSubscriptions).toBe(2);
  });

  it('should handle pagination', () => {
    amcService.getAllSubscriptions.and.returnValue(of({
      success: true,
      data: [],
      pagination: { total: 25, page: 2, limit: 10, totalPages: 3 }
    }));

    fixture.detectChanges();
    component.onPageChange({ pageIndex: 1, pageSize: 10, length: 25 });

    expect(component.pageIndex).toBe(1);
    expect(amcService.getAllSubscriptions).toHaveBeenCalledWith(2, 10, undefined);
  });

  it('should filter subscriptions by status', () => {
    amcService.getAllSubscriptions.and.returnValue(of({
      success: true,
      data: [mockSubscriptions[0]],
      pagination: { total: 1, page: 1, limit: 10, totalPages: 1 }
    }));

    fixture.detectChanges();
    component.onStatusFilterChange('active');

    expect(component.selectedStatus).toBe('active');
    expect(amcService.getAllSubscriptions).toHaveBeenCalledWith(1, 10, 'active');
  });

  it('should clear status filter when "all" selected', () => {
    amcService.getAllSubscriptions.and.returnValue(of({
      success: true,
      data: mockSubscriptions,
      pagination: { total: 2, page: 1, limit: 10, totalPages: 1 }
    }));

    fixture.detectChanges();
    component.onStatusFilterChange('');

    expect(component.selectedStatus).toBe('');
    expect(amcService.getAllSubscriptions).toHaveBeenCalledWith(1, 10, undefined);
  });

  it('should cancel subscription with reason', () => {
    spyOn(window, 'prompt').and.returnValue('User requested cancellation');
    amcService.cancelSubscription.and.returnValue(of({
      success: true,
      data: { ...mockSubscriptions[0], status: 'cancelled' },
      message: 'Subscription cancelled successfully'
    }));
    amcService.getAllSubscriptions.and.returnValue(of({
      success: true,
      data: mockSubscriptions,
      pagination: { total: 2, page: 1, limit: 10, totalPages: 1 }
    }));

    fixture.detectChanges();
    component.cancelSubscription(1);

    expect(window.prompt).toHaveBeenCalled();
    expect(amcService.cancelSubscription).toHaveBeenCalledWith(1, 'User requested cancellation');
  });

  it('should not cancel if user dismisses prompt', () => {
    spyOn(window, 'prompt').and.returnValue(null);
    amcService.getAllSubscriptions.and.returnValue(of({
      success: true,
      data: mockSubscriptions,
      pagination: { total: 2, page: 1, limit: 10, totalPages: 1 }
    }));

    fixture.detectChanges();
    component.cancelSubscription(1);

    expect(window.prompt).toHaveBeenCalled();
    expect(amcService.cancelSubscription).not.toHaveBeenCalled();
  });

  it('should handle cancel subscription error', () => {
    spyOn(window, 'prompt').and.returnValue('Cancel reason');
    spyOn(window, 'alert');
    amcService.cancelSubscription.and.returnValue(throwError(() => ({
      error: { message: 'Cannot cancel subscription' }
    })));
    amcService.getAllSubscriptions.and.returnValue(of({
      success: true,
      data: mockSubscriptions,
      pagination: { total: 2, page: 1, limit: 10, totalPages: 1 }
    }));

    fixture.detectChanges();
    component.cancelSubscription(1);

    expect(amcService.cancelSubscription).toHaveBeenCalled();
    expect(window.alert).toHaveBeenCalled();
  });

  it('should return correct status color', () => {
    expect(component.getStatusColor('active')).toBe('primary');
    expect(component.getStatusColor('expired')).toBe('warn');
    expect(component.getStatusColor('cancelled')).toBe('accent');
    expect(component.getStatusColor('suspended')).toBe('accent');
  });

  it('should format date correctly', () => {
    const date = '2026-01-15T10:30:00.000Z';
    const formatted = component.formatDate(date);
    expect(formatted).toContain('Jan');
    expect(formatted).toContain('15');
    expect(formatted).toContain('2026');
  });

  it('should display visits remaining correctly', () => {
    amcService.getAllSubscriptions.and.returnValue(of({
      success: true,
      data: mockSubscriptions,
      pagination: { total: 2, page: 1, limit: 10, totalPages: 1 }
    }));

    fixture.detectChanges();
    const compiled = fixture.nativeElement;
    
    expect(component.dataSource.data[0].visitsRemaining).toBe(3);
    expect(component.dataSource.data[1].visitsRemaining).toBe(0);
  });

  it('should handle API errors gracefully', () => {
    spyOn(console, 'error');
    amcService.getAllSubscriptions.and.returnValue(throwError(() => ({
      error: { message: 'API Error' }
    })));

    fixture.detectChanges();

    expect(console.error).toHaveBeenCalled();
    expect(component.loading).toBeFalse();
  });

  it('should display loading state', () => {
    amcService.getAllSubscriptions.and.returnValue(of({
      success: true,
      data: [],
      pagination: { total: 0, page: 1, limit: 10, totalPages: 0 }
    }));

    expect(component.loading).toBeTrue();
    fixture.detectChanges();
    expect(component.loading).toBeFalse();
  });
});
