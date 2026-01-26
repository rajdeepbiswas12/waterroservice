import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';
import { OrdersListComponent } from './orders-list.component';
import { OrderService } from '../../../services/order.service';
import { UserService } from '../../../services/user.service';

describe('OrdersListComponent', () => {
  let component: OrdersListComponent;
  let fixture: ComponentFixture<OrdersListComponent>;
  let orderService: jasmine.SpyObj<OrderService>;
  let userService: jasmine.SpyObj<UserService>;

  const mockOrders = {
    success: true,
    count: 2,
    data: [
      {
        id: 1,
        orderNumber: 'ORD-001',
        customerName: 'John Doe',
        customerPhone: '1234567890',
        status: 'pending',
        priority: 'high',
        serviceType: 'Installation',
        assignedTo: null,
        createdAt: '2026-01-26T00:00:00.000Z'
      },
      {
        id: 2,
        orderNumber: 'ORD-002',
        customerName: 'Jane Smith',
        customerPhone: '0987654321',
        status: 'completed',
        priority: 'medium',
        serviceType: 'Repair',
        assignedTo: { id: 2, name: 'Employee 1' },
        createdAt: '2026-01-25T00:00:00.000Z'
      }
    ]
  };

  beforeEach(async () => {
    const orderServiceSpy = jasmine.createSpyObj('OrderService', ['getOrders', 'deleteOrder']);
    const userServiceSpy = jasmine.createSpyObj('UserService', ['getUsers']);

    await TestBed.configureTestingModule({
      imports: [
        OrdersListComponent,
        HttpClientTestingModule,
        RouterTestingModule,
        BrowserAnimationsModule
      ],
      providers: [
        { provide: OrderService, useValue: orderServiceSpy },
        { provide: UserService, useValue: userServiceSpy }
      ]
    }).compileComponents();

    orderService = TestBed.inject(OrderService) as jasmine.SpyObj<OrderService>;
    userService = TestBed.inject(UserService) as jasmine.SpyObj<UserService>;
    
    fixture = TestBed.createComponent(OrdersListComponent);
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
    expect(component.filteredOrders.length).toBe(2);
    expect(component.loading).toBeFalse();
  });

  it('should handle error when loading orders fails', () => {
    spyOn(window, 'alert');
    orderService.getOrders.and.returnValue(throwError(() => new Error('Network error')));
    
    component.loadOrders();
    
    expect(component.loading).toBeFalse();
    expect(window.alert).toHaveBeenCalledWith('Failed to load orders: Network error');
  });

  it('should filter orders by status', () => {
    component.orders = mockOrders.data;
    component.filteredOrders = [...component.orders];
    component.statusFilter = 'pending';
    
    component.applyFilters();
    
    expect(component.filteredOrders.length).toBe(1);
    expect(component.filteredOrders[0].status).toBe('pending');
  });

  it('should filter orders by priority', () => {
    component.orders = mockOrders.data;
    component.filteredOrders = [...component.orders];
    component.priorityFilter = 'high';
    
    component.applyFilters();
    
    expect(component.filteredOrders.length).toBe(1);
    expect(component.filteredOrders[0].priority).toBe('high');
  });

  it('should delete order after confirmation', () => {
    spyOn(window, 'confirm').and.returnValue(true);
    orderService.deleteOrder.and.returnValue(of({ success: true }));
    orderService.getOrders.and.returnValue(of(mockOrders));
    
    component.deleteOrder(1);
    
    expect(window.confirm).toHaveBeenCalled();
    expect(orderService.deleteOrder).toHaveBeenCalledWith(1);
    expect(orderService.getOrders).toHaveBeenCalled();
  });

  it('should not delete order if not confirmed', () => {
    spyOn(window, 'confirm').and.returnValue(false);
    
    component.deleteOrder(1);
    
    expect(orderService.deleteOrder).not.toHaveBeenCalled();
  });

  it('should get correct status color', () => {
    expect(component.getStatusColor('pending')).toBe('warn');
    expect(component.getStatusColor('assigned')).toBe('primary');
    expect(component.getStatusColor('completed')).toBe('primary');
  });

  it('should get correct priority color', () => {
    expect(component.getPriorityColor('low')).toBe('primary');
    expect(component.getPriorityColor('high')).toBe('warn');
    expect(component.getPriorityColor('urgent')).toBe('warn');
  });
});
