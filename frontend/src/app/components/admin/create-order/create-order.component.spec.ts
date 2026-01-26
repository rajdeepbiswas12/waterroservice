import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { CreateOrderComponent } from './create-order.component';
import { OrderService } from '../../../services/order.service';
import { UserService } from '../../../services/user.service';

describe('CreateOrderComponent', () => {
  let component: CreateOrderComponent;
  let fixture: ComponentFixture<CreateOrderComponent>;
  let orderService: jasmine.SpyObj<OrderService>;
  let userService: jasmine.SpyObj<UserService>;
  let router: Router;

  const mockEmployees = {
    success: true,
    data: [
      { id: 2, name: 'Employee 1', orderCount: 2 },
      { id: 3, name: 'Employee 2', orderCount: 1 }
    ]
  };

  beforeEach(async () => {
    const orderServiceSpy = jasmine.createSpyObj('OrderService', ['createOrder']);
    const userServiceSpy = jasmine.createSpyObj('UserService', ['getAvailableEmployees']);

    await TestBed.configureTestingModule({
      imports: [
        CreateOrderComponent,
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
    router = TestBed.inject(Router);
    
    fixture = TestBed.createComponent(CreateOrderComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize form with default values', () => {
    component.ngOnInit();
    
    expect(component.orderForm).toBeDefined();
    expect(component.orderForm.get('priority')?.value).toBe('medium');
  });

  it('should load available employees on init', () => {
    userService.getAvailableEmployees.and.returnValue(of(mockEmployees));
    
    component.ngOnInit();
    
    expect(userService.getAvailableEmployees).toHaveBeenCalled();
    expect(component.employees.length).toBe(2);
  });

  it('should validate required fields', () => {
    component.ngOnInit();
    
    expect(component.orderForm.valid).toBeFalse();
    
    component.orderForm.patchValue({
      customerName: 'John Doe',
      customerPhone: '1234567890',
      customerAddress: '123 Main St',
      serviceType: 'Installation',
      priority: 'high'
    });
    
    expect(component.orderForm.valid).toBeTrue();
  });

  it('should validate phone number format', () => {
    component.ngOnInit();
    const phoneControl = component.orderForm.get('customerPhone');
    
    phoneControl?.setValue('123');
    expect(phoneControl?.hasError('pattern')).toBeTrue();
    
    phoneControl?.setValue('1234567890');
    expect(phoneControl?.hasError('pattern')).toBeFalse();
  });

  it('should create order successfully', () => {
    spyOn(window, 'alert');
    spyOn(router, 'navigate');
    userService.getAvailableEmployees.and.returnValue(of(mockEmployees));
    orderService.createOrder.and.returnValue(of({ success: true, data: { id: 1 } }));
    
    component.ngOnInit();
    component.orderForm.patchValue({
      customerName: 'John Doe',
      customerPhone: '1234567890',
      customerAddress: '123 Main St',
      serviceType: 'Installation',
      priority: 'high'
    });
    
    component.onSubmit();
    
    expect(orderService.createOrder).toHaveBeenCalled();
    expect(window.alert).toHaveBeenCalledWith('Order created successfully!');
    expect(router.navigate).toHaveBeenCalledWith(['/admin/orders']);
  });

  it('should handle error when creating order fails', () => {
    spyOn(window, 'alert');
    userService.getAvailableEmployees.and.returnValue(of(mockEmployees));
    orderService.createOrder.and.returnValue(throwError(() => new Error('Network error')));
    
    component.ngOnInit();
    component.orderForm.patchValue({
      customerName: 'John Doe',
      customerPhone: '1234567890',
      customerAddress: '123 Main St',
      serviceType: 'Installation',
      priority: 'high'
    });
    
    component.onSubmit();
    
    expect(window.alert).toHaveBeenCalledWith('Failed to create order: Network error');
    expect(component.loading).toBeFalse();
  });

  it('should navigate back on cancel', () => {
    spyOn(router, 'navigate');
    
    component.cancel();
    
    expect(router.navigate).toHaveBeenCalledWith(['/admin/orders']);
  });

  it('should not submit if form is invalid', () => {
    component.ngOnInit();
    component.orderForm.patchValue({
      customerName: 'John Doe'
      // Missing required fields
    });
    
    component.onSubmit();
    
    expect(orderService.createOrder).not.toHaveBeenCalled();
  });
});
