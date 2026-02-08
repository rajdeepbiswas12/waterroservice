import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { AmcAssignmentComponent } from './amc-assignment.component';
import { AmcService } from '../../../services/amc.service';
import { CustomerService } from '../../../services/customer.service';
import { AuthService } from '../../../services/auth.service';
import { of, throwError } from 'rxjs';
import { MatSnackBarModule } from '@angular/material/snack-bar';

describe('AmcAssignmentComponent', () => {
  let component: AmcAssignmentComponent;
  let fixture: ComponentFixture<AmcAssignmentComponent>;
  let amcService: jasmine.SpyObj<AmcService>;
  let customerService: jasmine.SpyObj<CustomerService>;

  const mockAmcPlans = {
    success: true,
    data: [
      {
        id: 1,
        planName: 'Basic Plan',
        description: 'Basic maintenance',
        duration: 12,
        serviceType: 'Maintenance',
        numberOfVisits: 4,
        price: 5000,
        gst: 18,
        isActive: true
      },
      {
        id: 2,
        planName: 'Premium Plan',
        description: 'Premium service',
        duration: 12,
        serviceType: 'Installation',
        numberOfVisits: 6,
        price: 8000,
        gst: 18,
        isActive: true
      }
    ]
  };

  const mockCustomers = [
    {
      id: 1,
      name: 'John Doe',
      phone: '9999999999',
      email: 'john@test.com',
      address: '123 Main St',
      city: 'Mumbai'
    },
    {
      id: 2,
      name: 'Jane Smith',
      phone: '8888888888',
      email: 'jane@test.com',
      address: '456 Park Ave',
      city: 'Delhi'
    }
  ];

  beforeEach(async () => {
    const amcServiceSpy = jasmine.createSpyObj('AmcService', [
      'getAmcPlans',
      'createSubscription'
    ]);
    const customerServiceSpy = jasmine.createSpyObj('CustomerService', [
      'searchCustomers'
    ]);
    const authServiceSpy = jasmine.createSpyObj('AuthService', [], {
      currentUserValue: { id: 1, role: 'employee' }
    });

    await TestBed.configureTestingModule({
      imports: [
        AmcAssignmentComponent,
        HttpClientTestingModule,
        BrowserAnimationsModule,
        MatSnackBarModule
      ],
      providers: [
        { provide: AmcService, useValue: amcServiceSpy },
        { provide: CustomerService, useValue: customerServiceSpy },
        { provide: AuthService, useValue: authServiceSpy }
      ]
    }).compileComponents();

    amcService = TestBed.inject(AmcService) as jasmine.SpyObj<AmcService>;
    customerService = TestBed.inject(CustomerService) as jasmine.SpyObj<CustomerService>;

    fixture = TestBed.createComponent(AmcAssignmentComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize form on init', () => {
    amcService.getAmcPlans.and.returnValue(of(mockAmcPlans));
    
    component.ngOnInit();

    expect(component.assignmentForm).toBeDefined();
    expect(component.assignmentForm.get('customerSearch')).toBeDefined();
    expect(component.assignmentForm.get('planId')).toBeDefined();
    expect(component.assignmentForm.get('startDate')).toBeDefined();
  });

  it('should load AMC plans on init', () => {
    amcService.getAmcPlans.and.returnValue(of(mockAmcPlans));
    
    component.ngOnInit();

    expect(amcService.getAmcPlans).toHaveBeenCalledWith({ isActive: true });
    expect(component.amcPlans.length).toBe(2);
  });

  it('should search customers on input', (done) => {
    amcService.getAmcPlans.and.returnValue(of(mockAmcPlans));
    customerService.searchCustomers.and.returnValue(of(mockCustomers));
    
    component.ngOnInit();
    
    component.assignmentForm.get('customerSearch')?.setValue('John');
    
    setTimeout(() => {
      expect(customerService.searchCustomers).toHaveBeenCalledWith('John');
      done();
    }, 400); // Wait for debounce
  });

  it('should set selected customer when customer is selected', () => {
    amcService.getAmcPlans.and.returnValue(of(mockAmcPlans));
    
    component.ngOnInit();
    component.onCustomerSelected(mockCustomers[0]);

    expect(component.selectedCustomer).toEqual(mockCustomers[0]);
  });

  it('should set selected plan when plan is selected', () => {
    amcService.getAmcPlans.and.returnValue(of(mockAmcPlans));
    
    component.ngOnInit();
    component.onPlanSelected({ value: 1 });

    expect(component.selectedPlan).toEqual(mockAmcPlans.data[0]);
  });

  it('should calculate total amount correctly with GST', () => {
    amcService.getAmcPlans.and.returnValue(of(mockAmcPlans));
    
    component.ngOnInit();
    component.selectedPlan = mockAmcPlans.data[0];

    const total = component.calculateTotalAmount();

    // 5000 + (5000 * 18/100) = 5900
    expect(total).toBe(5900);
  });

  it('should calculate end date based on plan duration', () => {
    amcService.getAmcPlans.and.returnValue(of(mockAmcPlans));
    
    component.ngOnInit();
    component.selectedPlan = mockAmcPlans.data[0]; // 12 months duration
    component.assignmentForm.patchValue({
      startDate: new Date('2026-01-01')
    });

    const endDate = component.calculateEndDate();

    expect(endDate).toBeDefined();
    expect(endDate?.getFullYear()).toBe(2027);
    expect(endDate?.getMonth()).toBe(0); // January (0-indexed)
  });

  it('should submit valid form successfully', () => {
    amcService.getAmcPlans.and.returnValue(of(mockAmcPlans));
    amcService.createSubscription.and.returnValue(of({
      success: true,
      data: { id: 1, subscriptionNumber: 'SUB-001' }
    }));
    
    component.ngOnInit();
    component.selectedCustomer = mockCustomers[0];
    component.assignmentForm.patchValue({
      customerSearch: mockCustomers[0],
      planId: 1,
      startDate: new Date(),
      paymentMode: 'Cash',
      transactionId: 'TXN-001',
      autoRenewal: false,
      notes: 'Test subscription'
    });

    component.onSubmit();

    expect(amcService.createSubscription).toHaveBeenCalled();
    expect(component.submitting).toBe(false);
  });

  it('should not submit invalid form', () => {
    amcService.getAmcPlans.and.returnValue(of(mockAmcPlans));
    
    component.ngOnInit();
    component.assignmentForm.patchValue({
      customerSearch: '',
      planId: '',
      startDate: null
    });

    component.onSubmit();

    expect(amcService.createSubscription).not.toHaveBeenCalled();
  });

  it('should not submit form without selected customer', () => {
    amcService.getAmcPlans.and.returnValue(of(mockAmcPlans));
    
    component.ngOnInit();
    component.selectedCustomer = null;
    component.assignmentForm.patchValue({
      customerSearch: 'Some Text',
      planId: 1,
      startDate: new Date(),
      paymentMode: 'Cash'
    });

    component.onSubmit();

    expect(amcService.createSubscription).not.toHaveBeenCalled();
  });

  it('should handle submission error', () => {
    amcService.getAmcPlans.and.returnValue(of(mockAmcPlans));
    const error = { error: { message: 'Failed to create subscription' } };
    amcService.createSubscription.and.returnValue(throwError(() => error));
    
    component.ngOnInit();
    component.selectedCustomer = mockCustomers[0];
    component.assignmentForm.patchValue({
      customerSearch: mockCustomers[0],
      planId: 1,
      startDate: new Date(),
      paymentMode: 'Cash'
    });

    component.onSubmit();

    expect(component.submitting).toBe(false);
  });

  it('should reset form correctly', () => {
    amcService.getAmcPlans.and.returnValue(of(mockAmcPlans));
    
    component.ngOnInit();
    component.selectedCustomer = mockCustomers[0];
    component.selectedPlan = mockAmcPlans.data[0];
    component.assignmentForm.patchValue({
      customerSearch: mockCustomers[0],
      planId: 1
    });

    component.resetForm();

    expect(component.selectedCustomer).toBeNull();
    expect(component.selectedPlan).toBeNull();
    expect(component.assignmentForm.get('autoRenewal')?.value).toBe(false);
  });

  it('should display customer info correctly', () => {
    const customer = mockCustomers[0];
    const display = component.displayCustomer(customer);

    expect(display).toContain('John Doe');
    expect(display).toContain('9999999999');
  });

  it('should return empty string for null customer', () => {
    const display = component.displayCustomer(null);
    expect(display).toBe('');
  });

  it('should validate required fields', () => {
    amcService.getAmcPlans.and.returnValue(of(mockAmcPlans));
    
    component.ngOnInit();

    expect(component.assignmentForm.get('customerSearch')?.hasError('required')).toBe(true);
    expect(component.assignmentForm.get('planId')?.hasError('required')).toBe(true);
    expect(component.assignmentForm.get('paymentMode')?.hasError('required')).toBe(true);
  });

  it('should have payment modes defined', () => {
    expect(component.paymentModes).toBeDefined();
    expect(component.paymentModes.length).toBeGreaterThan(0);
    expect(component.paymentModes).toContain('Cash');
    expect(component.paymentModes).toContain('UPI');
  });
});
