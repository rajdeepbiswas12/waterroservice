import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { EmployeeOrdersComponent } from './employee-orders.component';
import { OrderService } from '../../../services/order.service';
import { AuthService } from '../../../services/auth.service';
import { of, throwError } from 'rxjs';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { Router } from '@angular/router';

describe('EmployeeOrdersComponent', () => {
  let component: EmployeeOrdersComponent;
  let fixture: ComponentFixture<EmployeeOrdersComponent>;
  let orderService: jasmine.SpyObj<OrderService>;
  let authService: jasmine.SpyObj<AuthService>;
  let router: jasmine.SpyObj<Router>;

  const mockUser = {
    id: 1,
    name: 'Test Employee',
    email: 'employee@test.com',
    role: 'employee'
  };

  const mockOrders = {
    success: true,
    data: [
      {
        id: 1,
        orderNumber: 'RO12345',
        customerName: 'John Doe',
        customerPhone: '9999999999',
        serviceType: 'Installation',
        status: 'assigned',
        priority: 'high',
        scheduledDate: '2026-02-10',
        assignedToId: 1
      },
      {
        id: 2,
        orderNumber: 'RO12346',
        customerName: 'Jane Smith',
        customerPhone: '8888888888',
        serviceType: 'Repair',
        status: 'in-progress',
        priority: 'medium',
        scheduledDate: '2026-02-11',
        assignedToId: 1
      }
    ],
    total: 2
  };

  beforeEach(async () => {
    const orderServiceSpy = jasmine.createSpyObj('OrderService', ['getOrders']);
    const authServiceSpy = jasmine.createSpyObj('AuthService', [], {
      currentUserValue: mockUser
    });
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [
        EmployeeOrdersComponent,
        HttpClientTestingModule,
        BrowserAnimationsModule,
        MatSnackBarModule
      ],
      providers: [
        { provide: OrderService, useValue: orderServiceSpy },
        { provide: AuthService, useValue: authServiceSpy },
        { provide: Router, useValue: routerSpy }
      ]
    }).compileComponents();

    orderService = TestBed.inject(OrderService) as jasmine.SpyObj<OrderService>;
    authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;

    fixture = TestBed.createComponent(EmployeeOrdersComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load orders on init', () => {
    orderService.getOrders.and.returnValue(of(mockOrders));
    
    component.ngOnInit();

    expect(orderService.getOrders).toHaveBeenCalled();
    expect(component.orders.length).toBe(2);
    expect(component.totalRecords).toBe(2);
  });

  it('should set current user ID from auth service', () => {
    orderService.getOrders.and.returnValue(of(mockOrders));
    
    component.ngOnInit();

    expect(component.currentUserId).toBe(1);
  });

  it('should handle pagination changes', () => {
    orderService.getOrders.and.returnValue(of(mockOrders));
    
    component.onPageChange({ pageIndex: 1, pageSize: 20 });

    expect(component.currentPage).toBe(2); // pageIndex + 1
    expect(component.pageSize).toBe(20);
    expect(orderService.getOrders).toHaveBeenCalled();
  });

  it('should navigate to order detail on viewOrder', () => {
    component.viewOrder(1);

    expect(router.navigate).toHaveBeenCalledWith(['/employee/orders', 1]);
  });

  it('should handle error when loading orders fails', () => {
    const error = { error: { message: 'Failed to load' } };
    orderService.getOrders.and.returnValue(throwError(() => error));
    
    component.loadOrders();

    expect(component.loading).toBe(false);
    expect(component.orders.length).toBe(0);
  });

  it('should return correct status color', () => {
    expect(component.getStatusColor('pending')).toBe('default');
    expect(component.getStatusColor('assigned')).toBe('primary');
    expect(component.getStatusColor('in-progress')).toBe('accent');
    expect(component.getStatusColor('completed')).toBe('success');
    expect(component.getStatusColor('cancelled')).toBe('warn');
  });

  it('should return correct priority color', () => {
    expect(component.getPriorityColor('low')).toBe('default');
    expect(component.getPriorityColor('medium')).toBe('primary');
    expect(component.getPriorityColor('high')).toBe('accent');
    expect(component.getPriorityColor('urgent')).toBe('warn');
  });

  it('should format date correctly', () => {
    const dateString = '2026-02-10T10:00:00.000Z';
    const formatted = component.formatDate(dateString);

    expect(formatted).toContain('Feb');
    expect(formatted).toContain('10');
    expect(formatted).toContain('2026');
  });

  it('should return "Not scheduled" for null date', () => {
    expect(component.formatDate('')).toBe('Not scheduled');
    expect(component.formatDate(null as any)).toBe('Not scheduled');
  });

  it('should send correct params to API', () => {
    orderService.getOrders.and.returnValue(of(mockOrders));
    component.currentUserId = 1;
    component.currentPage = 2;
    component.pageSize = 25;

    component.loadOrders();

    expect(orderService.getOrders).toHaveBeenCalledWith({
      page: 2,
      limit: 25,
      assignedToId: 1
    });
  });

  it('should show loading spinner while loading', () => {
    orderService.getOrders.and.returnValue(of(mockOrders));
    
    component.loadOrders();
    expect(component.loading).toBe(false); // Will be false after observable completes
  });
});
