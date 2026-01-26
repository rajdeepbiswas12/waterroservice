import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { OrderService } from './order.service';
import { environment } from '../../environments/environment';

describe('OrderService', () => {
  let service: OrderService;
  let httpMock: HttpTestingController;
  const apiUrl = environment.apiUrl;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [OrderService]
    });
    service = TestBed.inject(OrderService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getOrders', () => {
    it('should get all orders', (done) => {
      const mockResponse = {
        success: true,
        count: 2,
        orders: [
          { id: 1, orderNumber: 'RO-001', customerName: 'John Doe' },
          { id: 2, orderNumber: 'RO-002', customerName: 'Jane Smith' }
        ]
      };

      service.getOrders().subscribe(response => {
        expect(response).toEqual(mockResponse);
        expect(response.orders.length).toBe(2);
        done();
      });

      const req = httpMock.expectOne(`${apiUrl}/orders`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should filter orders with query params', (done) => {
      const filters = { status: 'pending', priority: 'high' };

      service.getOrders(filters).subscribe(() => {
        done();
      });

      const req = httpMock.expectOne(
        req => req.url === `${apiUrl}/orders` && 
               req.params.get('status') === 'pending' &&
               req.params.get('priority') === 'high'
      );
      expect(req.request.method).toBe('GET');
      req.flush({ success: true, orders: [] });
    });
  });

  describe('getOrder', () => {
    it('should get single order by id', (done) => {
      const mockOrder = {
        success: true,
        order: {
          id: 1,
          orderNumber: 'RO-001',
          customerName: 'John Doe',
          status: 'pending'
        }
      };

      service.getOrder(1).subscribe(response => {
        expect(response).toEqual(mockOrder);
        done();
      });

      const req = httpMock.expectOne(`${apiUrl}/orders/1`);
      expect(req.request.method).toBe('GET');
      req.flush(mockOrder);
    });
  });

  describe('createOrder', () => {
    it('should create new order', (done) => {
      const newOrder = {
        customerName: 'New Customer',
        customerPhone: '+1234567890',
        customerAddress: '123 Main St',
        serviceType: 'Installation',
        priority: 'high'
      };

      const mockResponse = {
        success: true,
        order: { id: 3, ...newOrder, orderNumber: 'RO-003' }
      };

      service.createOrder(newOrder).subscribe(response => {
        expect(response).toEqual(mockResponse);
        done();
      });

      const req = httpMock.expectOne(`${apiUrl}/orders`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(newOrder);
      req.flush(mockResponse);
    });
  });

  describe('updateOrder', () => {
    it('should update order', (done) => {
      const updates = { priority: 'urgent', description: 'Updated' };
      const mockResponse = {
        success: true,
        order: { id: 1, ...updates }
      };

      service.updateOrder(1, updates).subscribe(response => {
        expect(response).toEqual(mockResponse);
        done();
      });

      const req = httpMock.expectOne(`${apiUrl}/orders/1`);
      expect(req.request.method).toBe('PUT');
      req.flush(mockResponse);
    });
  });

  describe('assignOrder', () => {
    it('should assign order to employee', (done) => {
      const mockResponse = {
        success: true,
        order: { id: 1, assignedToId: 5, status: 'assigned' }
      };

      service.assignOrder(1, 5).subscribe(response => {
        expect(response).toEqual(mockResponse);
        done();
      });

      const req = httpMock.expectOne(`${apiUrl}/orders/1/assign`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual({ employeeId: 5 });
      req.flush(mockResponse);
    });
  });

  describe('updateOrderStatus', () => {
    it('should update order status', (done) => {
      const mockResponse = {
        success: true,
        order: { id: 1, status: 'completed' }
      };

      service.updateOrderStatus(1, 'completed', 'Work finished').subscribe(response => {
        expect(response).toEqual(mockResponse);
        done();
      });

      const req = httpMock.expectOne(`${apiUrl}/orders/1/status`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual({ status: 'completed', notes: 'Work finished' });
      req.flush(mockResponse);
    });
  });

  describe('deleteOrder', () => {
    it('should delete order', (done) => {
      const mockResponse = {
        success: true,
        message: 'Order deleted successfully'
      };

      service.deleteOrder(1).subscribe(response => {
        expect(response).toEqual(mockResponse);
        done();
      });

      const req = httpMock.expectOne(`${apiUrl}/orders/1`);
      expect(req.request.method).toBe('DELETE');
      req.flush(mockResponse);
    });
  });

  describe('getOrderHistory', () => {
    it('should get order history', (done) => {
      const mockHistory = {
        success: true,
        history: [
          { id: 1, action: 'Created', newStatus: 'pending' },
          { id: 2, action: 'Assigned', newStatus: 'assigned' }
        ]
      };

      service.getOrderHistory(1).subscribe(response => {
        expect(response).toEqual(mockHistory);
        done();
      });

      const req = httpMock.expectOne(`${apiUrl}/orders/1/history`);
      expect(req.request.method).toBe('GET');
      req.flush(mockHistory);
    });
  });

  describe('getDashboardStats', () => {
    it('should get dashboard statistics', (done) => {
      const mockStats = {
        success: true,
        stats: {
          totalOrders: 50,
          ordersByStatus: { pending: 10, assigned: 15 },
          ordersByPriority: { high: 20, medium: 20 }
        }
      };

      service.getDashboardStats().subscribe(response => {
        expect(response).toEqual(mockStats);
        done();
      });

      const req = httpMock.expectOne(`${apiUrl}/orders/dashboard/stats`);
      expect(req.request.method).toBe('GET');
      req.flush(mockStats);
    });
  });
});
