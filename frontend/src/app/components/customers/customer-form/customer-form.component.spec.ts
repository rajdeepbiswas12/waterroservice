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
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ActivatedRoute, Router } from '@angular/router';
import { of, throwError } from 'rxjs';

import { CustomerFormComponent } from './customer-form.component';
import { CustomerService } from '../../../services/customer.service';
import { NotificationService } from '../../../services/notification.service';

describe('CustomerFormComponent', () => {
  let component: CustomerFormComponent;
  let fixture: ComponentFixture<CustomerFormComponent>;
  let customerService: jasmine.SpyObj<CustomerService>;
  let notificationService: jasmine.SpyObj<NotificationService>;
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
    const notificationServiceSpy = jasmine.createSpyObj('NotificationService', [
      'showSuccess',
      'showError'
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
        MatCardModule,
        MatProgressSpinnerModule
      ],
      providers: [
        { provide: CustomerService, useValue: customerServiceSpy },
        { provide: NotificationService, useValue: notificationServiceSpy },
        { provide: Router, useValue: routerSpy },
        { provide: ActivatedRoute, useValue: activatedRoute }
      ]
    }).compileComponents();

    customerService = TestBed.inject(CustomerService) as jasmine.SpyObj<CustomerService>;
    notificationService = TestBed.inject(NotificationService) as jasmine.SpyObj<NotificationService>;
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

  describe('Loading State', () => {
    it('should show loading overlay during form submission', () => {
      activatedRoute.params = of({});
      customerService.createCustomer.and.returnValue(
        new Promise(resolve => setTimeout(() => resolve({
          success: true,
          data: mockCustomer,
          message: 'Success'
        }), 100)) as any
      );

      fixture.detectChanges();
      component.customerForm.patchValue({
        name: 'John Doe',
        phone: '9876543210',
        address: '123 Test Street'
      });

      component.onSubmit();
      expect(component.loading).toBeTrue();
    });

    it('should hide loading overlay after successful submission', (done) => {
      activatedRoute.params = of({});
      customerService.createCustomer.and.returnValue(of({
        success: true,
        data: mockCustomer,
        message: 'Success'
      }));

      fixture.detectChanges();
      component.customerForm.patchValue({
        name: 'John Doe',
        phone: '9876543210',
        address: '123 Test Street'
      });

      component.onSubmit();
      
      setTimeout(() => {
        expect(component.loading).toBeFalse();
        done();
      }, 100);
    });

    it('should disable form during loading', () => {
      component.loading = true;
      fixture.detectChanges();
      expect(component.customerForm.disabled).toBeTrue();
    });

    it('should display loading spinner in template', () => {
      component.loading = true;
      fixture.detectChanges();
      
      const compiled = fixture.nativeElement;
      const loadingOverlay = compiled.querySelector('.loading-overlay');
      expect(loadingOverlay).toBeTruthy();
    });
  });

  describe('Form Sections', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should display Basic Information section', () => {
      const compiled = fixture.nativeElement;
      const sections = compiled.querySelectorAll('.form-section h3');
      const sectionTitles = Array.from(sections).map((s: any) => s.textContent.trim());
      expect(sectionTitles).toContain('Basic Information');
    });

    it('should display Address Information section', () => {
      const compiled = fixture.nativeElement;
      const sections = compiled.querySelectorAll('.form-section h3');
      const sectionTitles = Array.from(sections).map((s: any) => s.textContent.trim());
      expect(sectionTitles).toContain('Address Information');
    });

    it('should have icons on all form fields', () => {
      const compiled = fixture.nativeElement;
      const matIcons = compiled.querySelectorAll('mat-icon');
      expect(matIcons.length).toBeGreaterThan(0);
    });

    it('should display required indicators', () => {
      const compiled = fixture.nativeElement;
      const requiredLabels = compiled.querySelectorAll('label');
      const hasRequired = Array.from(requiredLabels).some((label: any) => 
        label.textContent.includes('*')
      );
      expect(hasRequired).toBeTrue();
    });
  });

  describe('Validation Messages', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should show validation error for empty name field', () => {
      const nameControl = component.customerForm.get('name');
      nameControl?.setValue('');
      nameControl?.markAsTouched();
      fixture.detectChanges();

      const compiled = fixture.nativeElement;
      const errorMessage = compiled.querySelector('mat-error');
      expect(errorMessage).toBeTruthy();
    });

    it('should show validation error for invalid phone number', () => {
      const phoneControl = component.customerForm.get('phone');
      phoneControl?.setValue('123');
      phoneControl?.markAsTouched();
      fixture.detectChanges();

      expect(phoneControl?.hasError('pattern')).toBeTrue();
    });

    it('should show validation error for invalid email', () => {
      const emailControl = component.customerForm.get('email');
      emailControl?.setValue('invalid-email');
      emailControl?.markAsTouched();
      fixture.detectChanges();

      expect(emailControl?.hasError('email')).toBeTrue();
    });

    it('should clear validation errors when valid data is entered', () => {
      const nameControl = component.customerForm.get('name');
      nameControl?.setValue('');
      nameControl?.markAsTouched();
      fixture.detectChanges();

      nameControl?.setValue('John Doe');
      fixture.detectChanges();

      expect(nameControl?.valid).toBeTrue();
    });
  });

  describe('Error Handling', () => {
    it('should display error notification on create failure', () => {
      activatedRoute.params = of({});
      customerService.createCustomer.and.returnValue(
        throwError(() => ({ error: { message: 'Creation failed' } }))
      );

      fixture.detectChanges();
      component.customerForm.patchValue({
        name: 'John Doe',
        phone: '9876543210',
        address: '123 Test Street'
      });

      component.onSubmit();
      expect(notificationService.showError).toHaveBeenCalled();
    });

    it('should display error notification on update failure', () => {
      activatedRoute.params = of({ id: '1' });
      customerService.getCustomerById.and.returnValue(of({
        success: true,
        data: mockCustomer
      }));
      customerService.updateCustomer.and.returnValue(
        throwError(() => ({ error: { message: 'Update failed' } }))
      );

      fixture.detectChanges();
      component.onSubmit();
      
      expect(notificationService.showError).toHaveBeenCalled();
    });

    it('should handle customer load error in edit mode', () => {
      activatedRoute.params = of({ id: '1' });
      customerService.getCustomerById.and.returnValue(
        throwError(() => ({ error: { message: 'Customer not found' } }))
      );

      fixture.detectChanges();
      expect(notificationService.showError).toHaveBeenCalled();
    });
  });

  describe('Customer Type Selection', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should have residential and commercial options', () => {
      expect(component.customerTypes).toContain('residential');
      expect(component.customerTypes).toContain('commercial');
    });

    it('should allow selecting customer type', () => {
      const customerTypeControl = component.customerForm.get('customerType');
      customerTypeControl?.setValue('commercial');
      expect(customerTypeControl?.value).toBe('commercial');
    });
  });

  describe('Button States', () => {
    it('should display Create button in create mode', () => {
      activatedRoute.params = of({});
      fixture.detectChanges();
      
      const compiled = fixture.nativeElement;
      const submitButton = compiled.querySelector('button[type="submit"]');
      expect(submitButton?.textContent).toContain('Create');
    });

    it('should display Update button in edit mode', () => {
      activatedRoute.params = of({ id: '1' });
      customerService.getCustomerById.and.returnValue(of({
        success: true,
        data: mockCustomer
      }));
      fixture.detectChanges();
      
      const compiled = fixture.nativeElement;
      const submitButton = compiled.querySelector('button[type="submit"]');
      expect(submitButton?.textContent).toContain('Update');
    });

    it('should disable submit button when form is invalid', () => {
      fixture.detectChanges();
      component.customerForm.patchValue({ name: '' });
      fixture.detectChanges();
      
      const compiled = fixture.nativeElement;
      const submitButton = compiled.querySelector('button[type="submit"]');
      expect(submitButton?.disabled).toBeTrue();
    });
  });
