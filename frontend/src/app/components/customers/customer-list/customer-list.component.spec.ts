import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';

import { CustomerListComponent } from './customer-list.component';
import { CustomerService } from '../../../services/customer.service';

describe('CustomerListComponent', () => {
  let component: CustomerListComponent;
  let fixture: ComponentFixture<CustomerListComponent>;
  let customerService: jasmine.SpyObj<CustomerService>;

  const mockCustomers = [
    {
      id: 1,
      customerNumber: 'CUST-123456',
      name: 'John Doe',
      phone: '9876543210',
      email: 'john@test.com',
      address: '123 Test Street',
      city: 'Test City',
      state: 'Test State',
      postalCode: '123456',
      status: 'active',
      customerType: 'residential',
      totalBookings: 5,
      totalSpent: 15000,
      loyaltyPoints: 150,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ];

  beforeEach(async () => {
    const customerServiceSpy = jasmine.createSpyObj('CustomerService', [
      'getAllCustomers',
      'deleteCustomer',
      'getCustomerStats'
    ]);

    await TestBed.configureTestingModule({
      imports: [
        CustomerListComponent,
        HttpClientTestingModule,
        RouterTestingModule,
        BrowserAnimationsModule,
        MatTableModule,
        MatPaginatorModule,
        MatFormFieldModule,
        MatInputModule,
        MatSelectModule,
        MatButtonModule,
        MatIconModule,
        MatChipsModule,
        MatCardModule,
        MatProgressSpinnerModule
      ],
      providers: [
        { provide: CustomerService, useValue: customerServiceSpy }
      ]
    }).compileComponents();

    customerService = TestBed.inject(CustomerService) as jasmine.SpyObj<CustomerService>;
    fixture = TestBed.createComponent(CustomerListComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnInit', () => {
    it('should load customers on init', () => {
      const mockResponse = {
        success: true,
        data: mockCustomers,
        pagination: {
          total: 1,
          page: 1,
          limit: 10,
          totalPages: 1
        }
      };

      customerService.getAllCustomers.and.returnValue(of(mockResponse));

      component.ngOnInit();

      expect(customerService.getAllCustomers).toHaveBeenCalledWith(1, 10, '', '');
      expect(component.customers.length).toBe(1);
      expect(component.totalCustomers).toBe(1);
      expect(component.loading).toBe(false);
    });

    it('should handle error when loading customers', () => {
      customerService.getAllCustomers.and.returnValue(
        throwError(() => new Error('Failed to load customers'))
      );

      component.ngOnInit();

      expect(component.loading).toBe(false);
      expect(component.customers.length).toBe(0);
    });
  });

  describe('loadCustomers', () => {
    it('should load customers with search filter', () => {
      const mockResponse = {
        success: true,
        data: mockCustomers,
        pagination: { total: 1, page: 1, limit: 10, totalPages: 1 }
      };

      customerService.getAllCustomers.and.returnValue(of(mockResponse));

      component.searchQuery = 'John';
      component.loadCustomers();

      expect(customerService.getAllCustomers).toHaveBeenCalledWith(1, 10, 'John', '');
    });

    it('should load customers with status filter', () => {
      const mockResponse = {
        success: true,
        data: mockCustomers,
        pagination: { total: 1, page: 1, limit: 10, totalPages: 1 }
      };

      customerService.getAllCustomers.and.returnValue(of(mockResponse));

      component.statusFilter = 'active';
      component.loadCustomers();

      expect(customerService.getAllCustomers).toHaveBeenCalledWith(1, 10, '', 'active');
    });
  });

  describe('onSearch', () => {
    it('should trigger search and reset to first page', () => {
      const mockResponse = {
        success: true,
        data: mockCustomers,
        pagination: { total: 1, page: 1, limit: 10, totalPages: 1 }
      };

      customerService.getAllCustomers.and.returnValue(of(mockResponse));

      component.currentPage = 2;
      component.searchQuery = 'John';
      component.onSearch();

      expect(component.currentPage).toBe(1);
      expect(customerService.getAllCustomers).toHaveBeenCalled();
    });
  });

  describe('onStatusFilter', () => {
    it('should filter by status and reset to first page', () => {
      const mockResponse = {
        success: true,
        data: mockCustomers,
        pagination: { total: 1, page: 1, limit: 10, totalPages: 1 }
      };

      customerService.getAllCustomers.and.returnValue(of(mockResponse));

      component.currentPage = 2;
      component.onStatusFilter();

      expect(component.currentPage).toBe(1);
      expect(customerService.getAllCustomers).toHaveBeenCalled();
    });
  });

  describe('onPageChange', () => {
    it('should change page and reload customers', () => {
      const mockResponse = {
        success: true,
        data: mockCustomers,
        pagination: { total: 20, page: 2, limit: 10, totalPages: 2 }
      };

      customerService.getAllCustomers.and.returnValue(of(mockResponse));

      const event = {
        pageIndex: 1,
        pageSize: 10,
        length: 20
      };

      component.onPageChange(event);

      expect(component.currentPage).toBe(2);
      expect(component.pageSize).toBe(10);
      expect(customerService.getAllCustomers).toHaveBeenCalledWith(2, 10, '', '');
    });
  });

  describe('deleteCustomer', () => {
    it('should delete customer after confirmation', () => {
      spyOn(window, 'confirm').and.returnValue(true);
      const mockResponse = { success: true, message: 'Customer deleted' };
      customerService.deleteCustomer.and.returnValue(of(mockResponse));
      customerService.getAllCustomers.and.returnValue(of({
        success: true,
        data: [],
        pagination: { total: 0, page: 1, limit: 10, totalPages: 0 }
      }));

      component.deleteCustomer(1);

      expect(window.confirm).toHaveBeenCalled();
      expect(customerService.deleteCustomer).toHaveBeenCalledWith(1);
      expect(customerService.getAllCustomers).toHaveBeenCalled();
    });

    it('should not delete customer if not confirmed', () => {
      spyOn(window, 'confirm').and.returnValue(false);

      component.deleteCustomer(1);

      expect(window.confirm).toHaveBeenCalled();
      expect(customerService.deleteCustomer).not.toHaveBeenCalled();
    });

    it('should handle delete error', () => {
      spyOn(window, 'confirm').and.returnValue(true);
      spyOn(window, 'alert');
      customerService.deleteCustomer.and.returnValue(
        throwError(() => ({ error: { message: 'Cannot delete customer with orders' } }))
      );

      component.deleteCustomer(1);

      expect(customerService.deleteCustomer).toHaveBeenCalledWith(1);
    });
  });

  describe('getStatusColor', () => {
    it('should return correct color for active status', () => {
      expect(component.getStatusColor('active')).toBe('primary');
    });

    it('should return correct color for inactive status', () => {
      expect(component.getStatusColor('inactive')).toBe('warn');
    });

    it('should return accent for other statuses', () => {
      expect(component.getStatusColor('suspended')).toBe('accent');
    });
  });

  describe('displayedColumns', () => {
    it('should have correct columns', () => {
      expect(component.displayedColumns).toEqual([
        'customerNumber',
        'name',
        'phone',
        'email',
        'city',
        'status',
        'totalBookings',
        'actions'
      ]);
    });
  });
});
