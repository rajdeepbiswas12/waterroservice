import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { ActivatedRoute, Router } from '@angular/router';
import { of, throwError } from 'rxjs';

import { CustomerFormComponent } from './customer-form.component';
import { CustomerService } from '../../../services/customer.service';

describe('CustomerFormComponent', () => {
  let component: CustomerFormComponent;
  let fixture: ComponentFixture<CustomerFormComponent>;
  let customerService: jasmine.SpyObj<CustomerService>;
  let router: jasmine.SpyObj<Router>;
  let activatedRoute: any;

  const mockCustomer = {
    id: 1,
    customerNumber: 'CUST-123456',
    name: 'John Doe',
    phone: '9876543210',
    email: 'john@test.com',
    alternatePhone: '9876543211',
    address: '123 Test Street',
    city: 'Test City',
    state: 'Test State',
    postalCode: '123456',
    customerType: 'residential',
    status: 'active',
    totalBookings: 5,
    totalSpent: 15000,
    loyaltyPoints: 150,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  beforeEach(async () => {
    const customerServiceSpy = jasmine.createSpyObj('CustomerService', [
      'getCustomerById',
      'createCustomer',
      'updateCustomer'
    ]);
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    activatedRoute = {
      params: of({ id: null }),
      snapshot: { params: {} }
    };

    await TestBed.configureTestingModule({
      imports: [
        CustomerFormComponent,
        ReactiveFormsModule,
        HttpClientTestingModule,
        RouterTestingModule,
        BrowserAnimationsModule,
        MatFormFieldModule,
        MatInputModule,
        MatSelectModule,
        MatButtonModule,
        MatIconModule,
        MatCardModule
      ],
      providers: [
        { provide: CustomerService, useValue: customerServiceSpy },
        { provide: Router, useValue: routerSpy },
        { provide: ActivatedRoute, useValue: activatedRoute }
      ]
    }).compileComponents();

    customerService = TestBed.inject(CustomerService) as jasmine.SpyObj<CustomerService>;
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;
    fixture = TestBed.createComponent(CustomerFormComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize form in create mode', () => {
    activatedRoute.params = of({});
    fixture.detectChanges();
    
    expect(component.isEditMode).toBeFalse();
    expect(component.customerForm).toBeDefined();
    expect(component.customerForm.get('name')).toBeDefined();
  });

  it('should initialize form in edit mode and load customer data', () => {
    activatedRoute.params = of({ id: '1' });
    customerService.getCustomerById.and.returnValue(of({
      success: true,
      data: mockCustomer
    }));

    fixture.detectChanges();

    expect(component.isEditMode).toBeTrue();
    expect(customerService.getCustomerById).toHaveBeenCalledWith(1);
    expect(component.customerForm.get('name')?.value).toBe('John Doe');
    expect(component.customerForm.get('phone')?.value).toBe('9876543210');
  });

  it('should validate required fields', () => {
    fixture.detectChanges();
    const form = component.customerForm;

    form.get('name')?.setValue('');
    form.get('phone')?.setValue('');
    form.get('address')?.setValue('');

    expect(form.get('name')?.hasError('required')).toBeTrue();
    expect(form.get('phone')?.hasError('required')).toBeTrue();
    expect(form.get('address')?.hasError('required')).toBeTrue();
    expect(form.valid).toBeFalse();
  });

  it('should validate phone number format', () => {
    fixture.detectChanges();
    const phoneControl = component.customerForm.get('phone');

    phoneControl?.setValue('123');
    expect(phoneControl?.hasError('pattern')).toBeTrue();

    phoneControl?.setValue('12345678901'); // 11 digits
    expect(phoneControl?.hasError('pattern')).toBeTrue();

    phoneControl?.setValue('9876543210'); // 10 digits
    expect(phoneControl?.hasError('pattern')).toBeFalse();
  });

  it('should validate email format', () => {
    fixture.detectChanges();
    const emailControl = component.customerForm.get('email');

    emailControl?.setValue('invalid-email');
    expect(emailControl?.hasError('email')).toBeTrue();

    emailControl?.setValue('valid@email.com');
    expect(emailControl?.hasError('email')).toBeFalse();
  });

  it('should create customer with valid form data', () => {
    activatedRoute.params = of({});
    customerService.createCustomer.and.returnValue(of({
      success: true,
      data: mockCustomer,
      message: 'Customer created successfully'
    }));

    fixture.detectChanges();

    component.customerForm.patchValue({
      name: 'John Doe',
      phone: '9876543210',
      email: 'john@test.com',
      address: '123 Test Street',
      city: 'Test City',
      state: 'Test State',
      postalCode: '123456',
      customerType: 'residential'
    });

    component.onSubmit();

    expect(customerService.createCustomer).toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledWith(['/admin/customers']);
  });

  it('should update customer in edit mode', () => {
    activatedRoute.params = of({ id: '1' });
    customerService.getCustomerById.and.returnValue(of({
      success: true,
      data: mockCustomer
    }));
    customerService.updateCustomer.and.returnValue(of({
      success: true,
      data: { ...mockCustomer, name: 'Updated Name' },
      message: 'Customer updated successfully'
    }));

    fixture.detectChanges();

    component.customerForm.patchValue({ name: 'Updated Name' });
    component.onSubmit();

    expect(customerService.updateCustomer).toHaveBeenCalledWith(1, jasmine.any(Object));
    expect(router.navigate).toHaveBeenCalledWith(['/admin/customers']);
  });

  it('should handle create customer error', () => {
    activatedRoute.params = of({});
    customerService.createCustomer.and.returnValue(throwError(() => ({
      error: { message: 'Phone number already exists' }
    })));

    fixture.detectChanges();

    component.customerForm.patchValue({
      name: 'John Doe',
      phone: '9876543210',
      address: '123 Test Street'
    });

    component.onSubmit();

    expect(customerService.createCustomer).toHaveBeenCalled();
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('should navigate back on cancel', () => {
    fixture.detectChanges();
    component.onCancel();
    expect(router.navigate).toHaveBeenCalledWith(['/admin/customers']);
  });

  it('should not submit form if invalid', () => {
    fixture.detectChanges();
    component.customerForm.patchValue({ name: '' }); // Invalid form
    component.onSubmit();
    expect(customerService.createCustomer).not.toHaveBeenCalled();
  });
});
