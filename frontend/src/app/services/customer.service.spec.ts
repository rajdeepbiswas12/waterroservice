import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { CustomerService, Customer } from './customer.service';
import { environment } from '../../environments/environment';

describe('CustomerService', () => {
  let service: CustomerService;
  let httpMock: HttpTestingController;
  const apiUrl = `${environment.apiUrl}/customers`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [CustomerService]
    });
    service = TestBed.inject(CustomerService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getAllCustomers', () => {
    it('should get all customers with pagination', () => {
      const mockResponse = {
        success: true,
        data: [
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
        ],
        pagination: {
          total: 1,
          page: 1,
          limit: 10,
          totalPages: 1
        }
      };

      service.getAllCustomers(1, 10).subscribe(response => {
        expect(response.success).toBe(true);
        expect(response.data.length).toBe(1);
        expect(response.data[0].name).toBe('John Doe');
        expect(response.pagination.total).toBe(1);
      });

      const req = httpMock.expectOne(`${apiUrl}?page=1&limit=10`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should filter customers by search query', () => {
      const mockResponse = {
        success: true,
        data: [],
        pagination: { total: 0, page: 1, limit: 10, totalPages: 0 }
      };

      service.getAllCustomers(1, 10, 'John').subscribe(response => {
        expect(response.success).toBe(true);
      });

      const req = httpMock.expectOne(`${apiUrl}?page=1&limit=10&search=John`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should filter customers by status', () => {
      const mockResponse = {
        success: true,
        data: [],
        pagination: { total: 0, page: 1, limit: 10, totalPages: 0 }
      };

      service.getAllCustomers(1, 10, '', 'active').subscribe(response => {
        expect(response.success).toBe(true);
      });

      const req = httpMock.expectOne(`${apiUrl}?page=1&limit=10&status=active`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });
  });

  describe('getCustomerById', () => {
    it('should get customer by id with related data', () => {
      const mockCustomer: Customer = {
        id: 1,
        customerNumber: 'CUST-123456',
        name: 'John Doe',
        phone: '9876543210',
        email: 'john@test.com',
        alternatePhone: null,
        address: '123 Test Street',
        city: 'Test City',
        state: 'Test State',
        postalCode: '123456',
        status: 'active',
        customerType: 'residential',
        gstNumber: null,
        totalBookings: 5,
        totalSpent: 15000,
        loyaltyPoints: 150,
        lastServiceDate: null,
        notes: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const mockResponse = {
        success: true,
        data: mockCustomer
      };

      service.getCustomerById(1).subscribe(response => {
        expect(response.success).toBe(true);
        expect(response.data.id).toBe(1);
        expect(response.data.name).toBe('John Doe');
      });

      const req = httpMock.expectOne(`${apiUrl}/1`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should handle error for non-existent customer', () => {
      const mockError = {
        success: false,
        message: 'Customer not found'
      };

      service.getCustomerById(99999).subscribe(
        () => fail('should have failed with 404 error'),
        (error) => {
          expect(error.status).toBe(404);
        }
      );

      const req = httpMock.expectOne(`${apiUrl}/99999`);
      expect(req.request.method).toBe('GET');
      req.flush(mockError, { status: 404, statusText: 'Not Found' });
    });
  });

  describe('createCustomer', () => {
    it('should create a new customer', () => {
      const newCustomer: Partial<Customer> = {
        name: 'Jane Smith',
        phone: '8765432109',
        email: 'jane@test.com',
        address: '456 Test Avenue',
        city: 'Test City',
        state: 'Test State',
        postalCode: '654321',
        customerType: 'commercial'
      };

      const mockResponse = {
        success: true,
        data: {
          id: 2,
          customerNumber: 'CUST-654321',
          ...newCustomer,
          status: 'active',
          totalBookings: 0,
          totalSpent: 0,
          loyaltyPoints: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      };

      service.createCustomer(newCustomer).subscribe(response => {
        expect(response.success).toBe(true);
        expect(response.data.name).toBe('Jane Smith');
        expect(response.data.customerNumber).toMatch(/^CUST-\d{6}$/);
      });

      const req = httpMock.expectOne(apiUrl);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(newCustomer);
      req.flush(mockResponse);
    });

    it('should handle validation errors', () => {
      const invalidCustomer = {
        name: 'Test',
        // Missing required fields
      };

      service.createCustomer(invalidCustomer).subscribe(
        () => fail('should have failed with validation error'),
        (error) => {
          expect(error.status).toBe(400);
        }
      );

      const req = httpMock.expectOne(apiUrl);
      expect(req.request.method).toBe('POST');
      req.flush({ success: false, message: 'Validation failed' }, 
        { status: 400, statusText: 'Bad Request' });
    });
  });

  describe('updateCustomer', () => {
    it('should update an existing customer', () => {
      const updateData: Partial<Customer> = {
        name: 'John Doe Updated',
        email: 'john.updated@test.com'
      };

      const mockResponse = {
        success: true,
        data: {
          id: 1,
          customerNumber: 'CUST-123456',
          ...updateData,
          phone: '9876543210',
          address: '123 Test Street',
          status: 'active',
          customerType: 'residential',
          totalBookings: 5,
          totalSpent: 15000,
          loyaltyPoints: 150,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      };

      service.updateCustomer(1, updateData).subscribe(response => {
        expect(response.success).toBe(true);
        expect(response.data.name).toBe('John Doe Updated');
      });

      const req = httpMock.expectOne(`${apiUrl}/1`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(updateData);
      req.flush(mockResponse);
    });
  });

  describe('deleteCustomer', () => {
    it('should delete a customer', () => {
      const mockResponse = {
        success: true,
        message: 'Customer deleted successfully'
      };

      service.deleteCustomer(1).subscribe(response => {
        expect(response.success).toBe(true);
        expect(response.message).toBe('Customer deleted successfully');
      });

      const req = httpMock.expectOne(`${apiUrl}/1`);
      expect(req.request.method).toBe('DELETE');
      req.flush(mockResponse);
    });

    it('should handle error when customer has orders', () => {
      const mockError = {
        success: false,
        message: 'Cannot delete customer with existing orders'
      };

      service.deleteCustomer(1).subscribe(
        () => fail('should have failed with error'),
        (error) => {
          expect(error.status).toBe(400);
        }
      );

      const req = httpMock.expectOne(`${apiUrl}/1`);
      expect(req.request.method).toBe('DELETE');
      req.flush(mockError, { status: 400, statusText: 'Bad Request' });
    });
  });

  describe('getCustomerStats', () => {
    it('should get customer statistics', () => {
      const mockStats = {
        success: true,
        data: {
          totalCustomers: 100,
          activeCustomers: 85,
          inactiveCustomers: 15,
          topCustomers: [
            {
              id: 1,
              name: 'John Doe',
              phone: '9876543210',
              totalBookings: 25,
              totalSpent: 50000
            }
          ]
        }
      };

      service.getCustomerStats().subscribe(response => {
        expect(response.success).toBe(true);
        expect(response.data.totalCustomers).toBe(100);
        expect(response.data.activeCustomers).toBe(85);
        expect(response.data.topCustomers.length).toBeGreaterThan(0);
      });

      const req = httpMock.expectOne(`${apiUrl}/stats`);
      expect(req.request.method).toBe('GET');
      req.flush(mockStats);
    });
  });
});
