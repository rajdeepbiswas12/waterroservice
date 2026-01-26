import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { AmcService, AmcPlan, AmcSubscription, AmcVisit } from './amc.service';
import { environment } from '../../environments/environment';

describe('AmcService', () => {
  let service: AmcService;
  let httpMock: HttpTestingController;
  const apiUrl = `${environment.apiUrl}/amc`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [AmcService]
    });
    service = TestBed.inject(AmcService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  // ========== AMC PLANS TESTS ==========
  describe('AMC Plans', () => {
    describe('getAllPlans', () => {
      it('should get all AMC plans', () => {
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

        const mockResponse = {
          success: true,
          data: mockPlans
        };

        service.getAllPlans().subscribe(response => {
          expect(response.success).toBe(true);
          expect(response.data.length).toBe(1);
          expect(response.data[0].planName).toBe('Gold Plan');
        });

        const req = httpMock.expectOne(`${apiUrl}/plans`);
        expect(req.request.method).toBe('GET');
        req.flush(mockResponse);
      });

      it('should filter active plans', () => {
        const mockResponse = {
          success: true,
          data: []
        };

        service.getAllPlans(true).subscribe(response => {
          expect(response.success).toBe(true);
        });

        const req = httpMock.expectOne(`${apiUrl}/plans?isActive=true`);
        expect(req.request.method).toBe('GET');
        req.flush(mockResponse);
      });
    });

    describe('getPlanById', () => {
      it('should get plan by id', () => {
        const mockPlan: AmcPlan = {
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
          features: ['Free parts'],
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        const mockResponse = {
          success: true,
          data: mockPlan
        };

        service.getPlanById(1).subscribe(response => {
          expect(response.success).toBe(true);
          expect(response.data.id).toBe(1);
          expect(response.data.planName).toBe('Gold Plan');
        });

        const req = httpMock.expectOne(`${apiUrl}/plans/1`);
        expect(req.request.method).toBe('GET');
        req.flush(mockResponse);
      });
    });

    describe('createPlan', () => {
      it('should create a new AMC plan', () => {
        const newPlan: Partial<AmcPlan> = {
          planName: 'Silver Plan',
          serviceType: 'Basic Service',
          duration: 6,
          numberOfVisits: 2,
          price: 2500,
          gst: 18,
          description: 'Half-yearly service',
          features: ['Basic maintenance'],
          isActive: true
        };

        const mockResponse = {
          success: true,
          data: {
            id: 2,
            planCode: 'PLAN-XYZ789',
            ...newPlan,
            totalAmount: 2950,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        };

        service.createPlan(newPlan).subscribe(response => {
          expect(response.success).toBe(true);
          expect(response.data.planName).toBe('Silver Plan');
          expect(response.data.planCode).toMatch(/^PLAN-[A-Z0-9]{6}$/);
        });

        const req = httpMock.expectOne(`${apiUrl}/plans`);
        expect(req.request.method).toBe('POST');
        expect(req.request.body).toEqual(newPlan);
        req.flush(mockResponse);
      });
    });

    describe('updatePlan', () => {
      it('should update an existing plan', () => {
        const updateData: Partial<AmcPlan> = {
          planName: 'Gold Plan Updated',
          price: 5500
        };

        const mockResponse = {
          success: true,
          data: {
            id: 1,
            planCode: 'PLAN-ABC123',
            ...updateData,
            totalAmount: 6490,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        };

        service.updatePlan(1, updateData).subscribe(response => {
          expect(response.success).toBe(true);
          expect(response.data.planName).toBe('Gold Plan Updated');
        });

        const req = httpMock.expectOne(`${apiUrl}/plans/1`);
        expect(req.request.method).toBe('PUT');
        req.flush(mockResponse);
      });
    });

    describe('deletePlan', () => {
      it('should delete a plan', () => {
        const mockResponse = {
          success: true,
          message: 'Plan deleted successfully'
        };

        service.deletePlan(1).subscribe(response => {
          expect(response.success).toBe(true);
        });

        const req = httpMock.expectOne(`${apiUrl}/plans/1`);
        expect(req.request.method).toBe('DELETE');
        req.flush(mockResponse);
      });
    });
  });

  // ========== AMC SUBSCRIPTIONS TESTS ==========
  describe('AMC Subscriptions', () => {
    describe('getAllSubscriptions', () => {
      it('should get all subscriptions with pagination', () => {
        const mockSubscriptions: AmcSubscription[] = [
          {
            id: 1,
            subscriptionNumber: 'SUB-ABC12345',
            customerId: 1,
            planId: 1,
            startDate: new Date().toISOString(),
            endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
            status: 'active',
            paymentMode: 'online',
            transactionId: 'TXN123456',
            amountPaid: 5000,
            gstAmount: 900,
            totalAmount: 5900,
            visitsUsed: 1,
            visitsRemaining: 3,
            autoRenewal: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        ];

        const mockResponse = {
          success: true,
          data: mockSubscriptions,
          pagination: {
            total: 1,
            page: 1,
            limit: 10,
            totalPages: 1
          }
        };

        service.getAllSubscriptions(1, 10).subscribe(response => {
          expect(response.success).toBe(true);
          expect(response.data.length).toBe(1);
          expect(response.data[0].status).toBe('active');
        });

        const req = httpMock.expectOne(`${apiUrl}/subscriptions?page=1&limit=10`);
        expect(req.request.method).toBe('GET');
        req.flush(mockResponse);
      });

      it('should filter subscriptions by status', () => {
        const mockResponse = {
          success: true,
          data: [],
          pagination: { total: 0, page: 1, limit: 10, totalPages: 0 }
        };

        service.getAllSubscriptions(1, 10, 'active').subscribe(response => {
          expect(response.success).toBe(true);
        });

        const req = httpMock.expectOne(`${apiUrl}/subscriptions?page=1&limit=10&status=active`);
        expect(req.request.method).toBe('GET');
        req.flush(mockResponse);
      });

      it('should filter subscriptions by customer', () => {
        const mockResponse = {
          success: true,
          data: [],
          pagination: { total: 0, page: 1, limit: 10, totalPages: 0 }
        };

        service.getAllSubscriptions(1, 10, undefined, 1).subscribe(response => {
          expect(response.success).toBe(true);
        });

        const req = httpMock.expectOne(`${apiUrl}/subscriptions?page=1&limit=10&customerId=1`);
        expect(req.request.method).toBe('GET');
        req.flush(mockResponse);
      });
    });

    describe('getSubscriptionById', () => {
      it('should get subscription by id with details', () => {
        const mockSubscription: AmcSubscription = {
          id: 1,
          subscriptionNumber: 'SUB-ABC12345',
          customerId: 1,
          planId: 1,
          startDate: new Date().toISOString(),
          endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'active',
          paymentMode: 'online',
          transactionId: 'TXN123456',
          amountPaid: 5000,
          gstAmount: 900,
          totalAmount: 5900,
          visitsUsed: 1,
          visitsRemaining: 3,
          autoRenewal: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        const mockResponse = {
          success: true,
          data: mockSubscription
        };

        service.getSubscriptionById(1).subscribe(response => {
          expect(response.success).toBe(true);
          expect(response.data.id).toBe(1);
        });

        const req = httpMock.expectOne(`${apiUrl}/subscriptions/1`);
        expect(req.request.method).toBe('GET');
        req.flush(mockResponse);
      });
    });

    describe('createSubscription', () => {
      it('should create a new subscription', () => {
        const newSubscription: Partial<AmcSubscription> = {
          customerId: 1,
          planId: 1,
          startDate: new Date().toISOString(),
          paymentMode: 'online',
          transactionId: 'TXN123456',
          autoRenewal: true
        };

        const mockResponse = {
          success: true,
          data: {
            id: 2,
            subscriptionNumber: 'SUB-XYZ67890',
            ...newSubscription,
            endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
            status: 'active',
            amountPaid: 5000,
            gstAmount: 900,
            totalAmount: 5900,
            visitsUsed: 0,
            visitsRemaining: 4,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        };

        service.createSubscription(newSubscription).subscribe(response => {
          expect(response.success).toBe(true);
          expect(response.data.subscriptionNumber).toMatch(/^SUB-[A-Z0-9]{8}$/);
        });

        const req = httpMock.expectOne(`${apiUrl}/subscriptions`);
        expect(req.request.method).toBe('POST');
        req.flush(mockResponse);
      });
    });

    describe('cancelSubscription', () => {
      it('should cancel a subscription', () => {
        const mockResponse = {
          success: true,
          data: {
            id: 1,
            status: 'cancelled',
            cancellationReason: 'Customer request',
            cancelledAt: new Date().toISOString()
          }
        };

        service.cancelSubscription(1, 'Customer request').subscribe(response => {
          expect(response.success).toBe(true);
          expect(response.data.status).toBe('cancelled');
        });

        const req = httpMock.expectOne(`${apiUrl}/subscriptions/1/cancel`);
        expect(req.request.method).toBe('PUT');
        expect(req.request.body).toEqual({ cancellationReason: 'Customer request' });
        req.flush(mockResponse);
      });
    });
  });

  // ========== AMC VISITS TESTS ==========
  describe('AMC Visits', () => {
    describe('getAllVisits', () => {
      it('should get all visits', () => {
        const mockVisits: AmcVisit[] = [
          {
            id: 1,
            visitNumber: 'VISIT-12345678',
            subscriptionId: 1,
            scheduledDate: new Date().toISOString(),
            actualDate: null,
            status: 'scheduled',
            servicePerformed: null,
            partsReplaced: null,
            technicianNotes: null,
            customerRating: null,
            notes: 'Scheduled maintenance',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        ];

        const mockResponse = {
          success: true,
          data: mockVisits
        };

        service.getAllVisits().subscribe(response => {
          expect(response.success).toBe(true);
          expect(response.data.length).toBe(1);
          expect(response.data[0].status).toBe('scheduled');
        });

        const req = httpMock.expectOne(`${apiUrl}/visits`);
        expect(req.request.method).toBe('GET');
        req.flush(mockResponse);
      });

      it('should filter visits by subscription', () => {
        const mockResponse = {
          success: true,
          data: []
        };

        service.getAllVisits(1).subscribe(response => {
          expect(response.success).toBe(true);
        });

        const req = httpMock.expectOne(`${apiUrl}/visits?subscriptionId=1`);
        expect(req.request.method).toBe('GET');
        req.flush(mockResponse);
      });

      it('should filter visits by status', () => {
        const mockResponse = {
          success: true,
          data: []
        };

        service.getAllVisits(undefined, 'completed').subscribe(response => {
          expect(response.success).toBe(true);
        });

        const req = httpMock.expectOne(`${apiUrl}/visits?status=completed`);
        expect(req.request.method).toBe('GET');
        req.flush(mockResponse);
      });
    });

    describe('createVisit', () => {
      it('should create a new visit', () => {
        const newVisit: Partial<AmcVisit> = {
          subscriptionId: 1,
          scheduledDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          notes: 'Scheduled maintenance visit'
        };

        const mockResponse = {
          success: true,
          data: {
            id: 2,
            visitNumber: 'VISIT-87654321',
            ...newVisit,
            status: 'scheduled',
            actualDate: null,
            servicePerformed: null,
            partsReplaced: null,
            technicianNotes: null,
            customerRating: null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        };

        service.createVisit(newVisit).subscribe(response => {
          expect(response.success).toBe(true);
          expect(response.data.visitNumber).toMatch(/^VISIT-\d{8}$/);
          expect(response.data.status).toBe('scheduled');
        });

        const req = httpMock.expectOne(`${apiUrl}/visits`);
        expect(req.request.method).toBe('POST');
        req.flush(mockResponse);
      });
    });

    describe('updateVisit', () => {
      it('should update visit status and details', () => {
        const updateData: Partial<AmcVisit> = {
          status: 'completed',
          actualDate: new Date().toISOString(),
          servicePerformed: 'Full maintenance',
          partsReplaced: [{ part: 'Filter', quantity: 2 }],
          technicianNotes: 'All systems working',
          customerRating: 5
        };

        const mockResponse = {
          success: true,
          data: {
            id: 1,
            visitNumber: 'VISIT-12345678',
            subscriptionId: 1,
            scheduledDate: new Date().toISOString(),
            ...updateData,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        };

        service.updateVisit(1, updateData).subscribe(response => {
          expect(response.success).toBe(true);
          expect(response.data.status).toBe('completed');
          expect(response.data.customerRating).toBe(5);
        });

        const req = httpMock.expectOne(`${apiUrl}/visits/1`);
        expect(req.request.method).toBe('PUT');
        req.flush(mockResponse);
      });
    });
  });

  // ========== AMC STATS TESTS ==========
  describe('getAmcStats', () => {
    it('should get AMC statistics', () => {
      const mockStats = {
        success: true,
        data: {
          totalSubscriptions: 50,
          activeSubscriptions: 35,
          expiredSubscriptions: 10,
          pendingVisits: 15,
          completedVisits: 120
        }
      };

      service.getAmcStats().subscribe(response => {
        expect(response.success).toBe(true);
        expect(response.data.totalSubscriptions).toBe(50);
        expect(response.data.activeSubscriptions).toBe(35);
        expect(response.data.completedVisits).toBe(120);
      });

      const req = httpMock.expectOne(`${apiUrl}/stats`);
      expect(req.request.method).toBe('GET');
      req.flush(mockStats);
    });
  });
});
