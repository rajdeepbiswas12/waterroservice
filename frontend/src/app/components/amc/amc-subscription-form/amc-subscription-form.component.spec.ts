import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { ActivatedRoute, Router } from '@angular/router';
import { of, throwError } from 'rxjs';

import { AmcSubscriptionFormComponent } from './amc-subscription-form.component';
import { AmcService, AmcPlan, AmcSubscription } from '../../../services/amc.service';
import { CustomerService, Customer } from '../../../services/customer.service';
import { NotificationService } from '../../../services/notification.service';

describe('AmcSubscriptionFormComponent', () => {
  let component: AmcSubscriptionFormComponent;
  let fixture: ComponentFixture<AmcSubscriptionFormComponent>;
  let amcService: jasmine.SpyObj<AmcService>;
  let customerService: jasmine.SpyObj<CustomerService>;
  let notificationService: jasmine.SpyObj<NotificationService>;
  let router: jasmine.SpyObj<Router>;
  let activatedRoute: any;

  const mockCustomers: Customer[] = [
    {
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
    }
  ];

  const mockPlans: AmcPlan[] = [
    {
      id: 1,
      planCode: 'PLAN-ABC123',
      planName: 'Gold Plan',
      serviceType: 'Full Service',
      duration: 12,
      numberOfVisits: 4,
      price: 5000,
      gst: 18,
      totalAmount: 5900,
      description: 'Quarterly service',
      features: ['Free parts', 'Priority service'],
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ];

  const mockSubscription: AmcSubscription = {
    id: 1,
    subscriptionNumber: 'AMC-SUB-12345',
    customerId: 1,
    planId: 1,
    startDate: '2024-01-01',
    endDate: '2025-01-01',
    totalAmount: 5900,
    paidAmount: 3000,
    balanceAmount: 2900,
    gstAmount: 900,
    paymentMode: 'Cash',
    paymentStatus: 'Partial',
    status: 'Active',
    completedVisits: 1,
    remainingVisits: 3,
    nextVisitDate: '2024-04-01',
    notes: 'Test subscription',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  beforeEach(async () => {
    const amcServiceSpy = jasmine.createSpyObj('AmcService', [
      'getAllPlans',
      'getSubscriptionById',
      'createSubscription',
      'updateSubscription'
    ]);

    const customerServiceSpy = jasmine.createSpyObj('CustomerService', [
      'getAllCustomers'
    ]);

    const notificationServiceSpy = jasmine.createSpyObj('NotificationService', [
      'showSuccess',
      'showError'
    ]);

    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    activatedRoute = {
      snapshot: {
        paramMap: {
          get: jasmine.createSpy('get').and.returnValue(null)
        }
      }
    };

    await TestBed.configureTestingModule({
      imports: [
        AmcSubscriptionFormComponent,
        ReactiveFormsModule,
        HttpClientTestingModule,
        RouterTestingModule,
        BrowserAnimationsModule,
        MatFormFieldModule,
        MatInputModule,
        MatSelectModule,
        MatButtonModule,
        MatDatepickerModule,
        MatNativeDateModule,
        MatCheckboxModule,
        MatProgressSpinnerModule,
        MatIconModule,
        MatCardModule
      ],
      providers: [
        { provide: AmcService, useValue: amcServiceSpy },
        { provide: CustomerService, useValue: customerServiceSpy },
        { provide: NotificationService, useValue: notificationServiceSpy },
        { provide: Router, useValue: routerSpy },
        { provide: ActivatedRoute, useValue: activatedRoute }
      ]
    }).compileComponents();

    amcService = TestBed.inject(AmcService) as jasmine.SpyObj<AmcService>;
    customerService = TestBed.inject(CustomerService) as jasmine.SpyObj<CustomerService>;
    notificationService = TestBed.inject(NotificationService) as jasmine.SpyObj<NotificationService>;
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;

    // Setup default return values
    customerService.getAllCustomers.and.returnValue(
      of({ success: true, data: mockCustomers })
    );
    amcService.getAllPlans.and.returnValue(
      of({ success: true, data: mockPlans })
    );

    fixture = TestBed.createComponent(AmcSubscriptionFormComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Form Initialization', () => {
    it('should initialize form with required fields', () => {
      expect(component.subscriptionForm).toBeDefined();
      expect(component.subscriptionForm.get('customerId')).toBeDefined();
      expect(component.subscriptionForm.get('planId')).toBeDefined();
      expect(component.subscriptionForm.get('startDate')).toBeDefined();
      expect(component.subscriptionForm.get('paymentMode')).toBeDefined();
      expect(component.subscriptionForm.get('paidAmount')).toBeDefined();
    });

    it('should set customerId as required', () => {
      const customerId = component.subscriptionForm.get('customerId');
      customerId?.setValue(null);
      expect(customerId?.hasError('required')).toBeTruthy();
    });

    it('should set planId as required', () => {
      const planId = component.subscriptionForm.get('planId');
      planId?.setValue(null);
      expect(planId?.hasError('required')).toBeTruthy();
    });

    it('should set startDate as required', () => {
      const startDate = component.subscriptionForm.get('startDate');
      startDate?.setValue(null);
      expect(startDate?.hasError('required')).toBeTruthy();
    });

    it('should set paymentMode as required', () => {
      const paymentMode = component.subscriptionForm.get('paymentMode');
      paymentMode?.setValue(null);
      expect(paymentMode?.hasError('required')).toBeTruthy();
    });
  });

  describe('Data Loading', () => {
    it('should load customers on init', () => {
      fixture.detectChanges();
      expect(customerService.getAllCustomers).toHaveBeenCalled();
      expect(component.customers.length).toBe(1);
      expect(component.customers[0].name).toBe('John Doe');
    });

    it('should load plans on init', () => {
      fixture.detectChanges();
      expect(amcService.getAllPlans).toHaveBeenCalled();
      expect(component.plans.length).toBe(1);
      expect(component.plans[0].planName).toBe('Gold Plan');
    });

    it('should handle customer loading error', () => {
      customerService.getAllCustomers.and.returnValue(
        throwError(() => new Error('API error'))
      );
      fixture.detectChanges();
      expect(notificationService.showError).toHaveBeenCalledWith(
        'Failed to load customers'
      );
    });

    it('should handle plan loading error', () => {
      amcService.getAllPlans.and.returnValue(
        throwError(() => new Error('API error'))
      );
      fixture.detectChanges();
      expect(notificationService.showError).toHaveBeenCalledWith(
        'Failed to load plans'
      );
    });
  });

  describe('Edit Mode', () => {
    beforeEach(() => {
      activatedRoute.snapshot.paramMap.get = jasmine.createSpy('get').and.returnValue('1');
      amcService.getSubscriptionById.and.returnValue(of(mockSubscription));
    });

    it('should enter edit mode when subscription ID is present', () => {
      fixture.detectChanges();
      expect(component.isEditMode).toBeTruthy();
      expect(component.subscriptionId).toBe(1);
    });

    it('should load subscription data in edit mode', () => {
      fixture.detectChanges();
      expect(amcService.getSubscriptionById).toHaveBeenCalledWith(1);
    });

    it('should populate form with subscription data in edit mode', () => {
      fixture.detectChanges();
      expect(component.subscriptionForm.get('customerId')?.value).toBe(1);
      expect(component.subscriptionForm.get('planId')?.value).toBe(1);
      expect(component.subscriptionForm.get('paidAmount')?.value).toBe(3000);
      expect(component.subscriptionForm.get('paymentStatus')?.value).toBe('Partial');
    });

    it('should handle subscription loading error in edit mode', () => {
      amcService.getSubscriptionById.and.returnValue(
        throwError(() => new Error('API error'))
      );
      fixture.detectChanges();
      expect(notificationService.showError).toHaveBeenCalledWith(
        'Failed to load subscription'
      );
    });
  });

  describe('Payment Calculations', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should calculate amounts when plan is selected', () => {
      component.subscriptionForm.patchValue({
        planId: 1
      });
      
      expect(component.selectedPlan).toBeDefined();
      expect(component.subscriptionForm.get('totalAmount')?.value).toBe(5900);
      expect(component.subscriptionForm.get('gstAmount')?.value).toBe(900);
    });

    it('should calculate balance amount', () => {
      component.subscriptionForm.patchValue({
        planId: 1,
        paidAmount: 3000
      });
      
      expect(component.subscriptionForm.get('balanceAmount')?.value).toBe(2900);
    });

    it('should set payment status to Paid when full amount is paid', () => {
      component.subscriptionForm.patchValue({
        planId: 1,
        paidAmount: 5900
      });
      
      expect(component.subscriptionForm.get('paymentStatus')?.value).toBe('Paid');
      expect(component.subscriptionForm.get('balanceAmount')?.value).toBe(0);
    });

    it('should set payment status to Partial when partial amount is paid', () => {
      component.subscriptionForm.patchValue({
        planId: 1,
        paidAmount: 3000
      });
      
      expect(component.subscriptionForm.get('paymentStatus')?.value).toBe('Partial');
      expect(component.subscriptionForm.get('balanceAmount')?.value).toBe(2900);
    });

    it('should set payment status to Pending when no amount is paid', () => {
      component.subscriptionForm.patchValue({
        planId: 1,
        paidAmount: 0
      });
      
      expect(component.subscriptionForm.get('paymentStatus')?.value).toBe('Pending');
      expect(component.subscriptionForm.get('balanceAmount')?.value).toBe(5900);
    });

    it('should handle zero GST plans', () => {
      const planWithoutGst: AmcPlan = { ...mockPlans[0], gst: 0, totalAmount: 5000 };
      component.plans = [planWithoutGst];
      component.subscriptionForm.patchValue({ planId: 1 });
      
      expect(component.subscriptionForm.get('gstAmount')?.value).toBe(0);
      expect(component.subscriptionForm.get('totalAmount')?.value).toBe(5000);
    });
  });

  describe('Form Submission - Create Mode', () => {
    beforeEach(() => {
      fixture.detectChanges();
      amcService.createSubscription.and.returnValue(of(mockSubscription));
    });

    it('should not submit if form is invalid', () => {
      component.subscriptionForm.patchValue({
        customerId: null,
        planId: null
      });
      
      component.onSubmit();
      
      expect(amcService.createSubscription).not.toHaveBeenCalled();
    });

    it('should create subscription with valid data', () => {
      component.subscriptionForm.patchValue({
        customerId: 1,
        planId: 1,
        startDate: new Date('2024-01-01'),
        paymentMode: 'Cash',
        paidAmount: 5900,
        notes: 'Test notes'
      });
      
      component.onSubmit();
      
      expect(amcService.createSubscription).toHaveBeenCalled();
      expect(notificationService.showSuccess).toHaveBeenCalledWith(
        'Subscription created successfully'
      );
    });

    it('should navigate to subscriptions list after successful creation', () => {
      component.subscriptionForm.patchValue({
        customerId: 1,
        planId: 1,
        startDate: new Date('2024-01-01'),
        paymentMode: 'Cash',
        paidAmount: 5900
      });
      
      component.onSubmit();
      
      expect(router.navigate).toHaveBeenCalledWith(['/admin/amc/subscriptions']);
    });

    it('should handle creation error', () => {
      amcService.createSubscription.and.returnValue(
        throwError(() => new Error('API error'))
      );
      
      component.subscriptionForm.patchValue({
        customerId: 1,
        planId: 1,
        startDate: new Date('2024-01-01'),
        paymentMode: 'Cash',
        paidAmount: 5900
      });
      
      component.onSubmit();
      
      expect(notificationService.showError).toHaveBeenCalledWith(
        'Failed to create subscription'
      );
      expect(component.loading).toBeFalsy();
    });

    it('should set loading state during submission', () => {
      component.subscriptionForm.patchValue({
        customerId: 1,
        planId: 1,
        startDate: new Date('2024-01-01'),
        paymentMode: 'Cash',
        paidAmount: 5900
      });
      
      amcService.createSubscription.and.returnValue(
        new Promise(resolve => setTimeout(() => resolve(mockSubscription), 100)) as any
      );
      
      component.onSubmit();
      expect(component.loading).toBeTruthy();
    });
  });

  describe('Form Submission - Edit Mode', () => {
    beforeEach(() => {
      activatedRoute.snapshot.paramMap.get = jasmine.createSpy('get').and.returnValue('1');
      amcService.getSubscriptionById.and.returnValue(of(mockSubscription));
      amcService.updateSubscription.and.returnValue(of(mockSubscription));
      fixture.detectChanges();
    });

    it('should update subscription in edit mode', () => {
      component.subscriptionForm.patchValue({
        paidAmount: 5900,
        notes: 'Updated notes'
      });
      
      component.onSubmit();
      
      expect(amcService.updateSubscription).toHaveBeenCalledWith(1, jasmine.any(Object));
      expect(notificationService.showSuccess).toHaveBeenCalledWith(
        'Subscription updated successfully'
      );
    });

    it('should handle update error', () => {
      amcService.updateSubscription.and.returnValue(
        throwError(() => new Error('API error'))
      );
      
      component.subscriptionForm.patchValue({
        paidAmount: 5900
      });
      
      component.onSubmit();
      
      expect(notificationService.showError).toHaveBeenCalledWith(
        'Failed to update subscription'
      );
    });
  });

  describe('Cancel Action', () => {
    it('should navigate back to subscriptions list on cancel', () => {
      component.onCancel();
      expect(router.navigate).toHaveBeenCalledWith(['/admin/amc/subscriptions']);
    });
  });

  describe('Form Validation', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should validate minimum paid amount', () => {
      const paidAmount = component.subscriptionForm.get('paidAmount');
      paidAmount?.setValue(-100);
      expect(paidAmount?.hasError('min')).toBeTruthy();
    });

    it('should accept zero as valid paid amount', () => {
      const paidAmount = component.subscriptionForm.get('paidAmount');
      paidAmount?.setValue(0);
      expect(paidAmount?.valid).toBeTruthy();
    });

    it('should invalidate form when required fields are empty', () => {
      component.subscriptionForm.reset();
      expect(component.subscriptionForm.invalid).toBeTruthy();
    });

    it('should validate form when all required fields are filled', () => {
      component.subscriptionForm.patchValue({
        customerId: 1,
        planId: 1,
        startDate: new Date(),
        paymentMode: 'Cash',
        paidAmount: 0
      });
      expect(component.subscriptionForm.valid).toBeTruthy();
    });
  });

  describe('UI State Management', () => {
    it('should show loading spinner during data fetch', () => {
      component.loading = true;
      fixture.detectChanges();
      const compiled = fixture.nativeElement;
      const spinner = compiled.querySelector('mat-spinner');
      expect(spinner).toBeTruthy();
    });

    it('should disable form during submission', () => {
      component.loading = true;
      fixture.detectChanges();
      expect(component.subscriptionForm.disabled).toBeTruthy();
    });

    it('should display correct button text in create mode', () => {
      component.isEditMode = false;
      fixture.detectChanges();
      const compiled = fixture.nativeElement;
      const submitButton = compiled.querySelector('button[type="submit"]');
      expect(submitButton?.textContent).toContain('Create');
    });

    it('should display correct button text in edit mode', () => {
      activatedRoute.snapshot.paramMap.get = jasmine.createSpy('get').and.returnValue('1');
      amcService.getSubscriptionById.and.returnValue(of(mockSubscription));
      fixture.detectChanges();
      
      const compiled = fixture.nativeElement;
      const submitButton = compiled.querySelector('button[type="submit"]');
      expect(submitButton?.textContent).toContain('Update');
    });
  });
});
