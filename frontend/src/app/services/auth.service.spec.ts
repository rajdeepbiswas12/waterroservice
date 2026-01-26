import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';
import { environment } from '../../environments/environment';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;
  const apiUrl = environment.apiUrl;

  beforeEach(() => {
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        AuthService,
        { provide: Router, useValue: routerSpy }
      ]
    });
    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
    localStorage.clear();
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('currentUser', () => {
    it('should return current user from BehaviorSubject', (done) => {
      const mockUser = {
        id: 1,
        name: 'Test User',
        email: 'test@test.com',
        phone: '1234567890',
        role: 'admin' as 'admin' | 'employee',
        isActive: true
      };

      localStorage.setItem('currentUser', JSON.stringify(mockUser));
      // Create a new service instance to pick up the localStorage change
      const freshService = new (AuthService as any)(httpMock, TestBed.inject(Router));

      freshService.currentUser.subscribe((user: any) => {
        expect(user).toEqual(mockUser);
        localStorage.removeItem('currentUser');
        done();
      });
    });
  });

  describe('login', () => {
    it('should login and store token and user', (done) => {
      const email = 'test@test.com';
      const password = 'Test@123';
      const mockResponse = {
        success: true,
        token: 'test-token-123',
        data: {
          id: 1,
          name: 'Test User',
          email: 'test@test.com',
          phone: '1234567890',
          role: 'admin' as 'admin' | 'employee',
          isActive: true
        }
      };

      service.login(email, password).subscribe(response => {
        expect(response).toEqual(mockResponse);
        expect(localStorage.getItem('token')).toBe('test-token-123');
        expect(localStorage.getItem('currentUser')).toBe(JSON.stringify(mockResponse.data));
        done();
      });

      const req = httpMock.expectOne(`${apiUrl}/auth/login`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ email, password });
      req.flush(mockResponse);
    });

    it('should handle login error', (done) => {
      const email = 'test@test.com';
      const password = 'wrong';
      const mockError = { message: 'Invalid credentials' };

      service.login(email, password).subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.error).toEqual(mockError);
          done();
        }
      });

      const req = httpMock.expectOne(`${apiUrl}/auth/login`);
      req.flush(mockError, { status: 401, statusText: 'Unauthorized' });
    });
  });

  describe('logout', () => {
    it('should clear localStorage and update currentUser', () => {
      localStorage.setItem('token', 'test-token');
      localStorage.setItem('currentUser', JSON.stringify({ id: 1, name: 'Test' }));

      service.logout();

      expect(localStorage.getItem('token')).toBeNull();
      expect(localStorage.getItem('currentUser')).toBeNull();
      
      service.currentUser.subscribe(user => {
        expect(user).toBeNull();
      });
    });
  });

  describe('register', () => {
    it('should register new user', (done) => {
      const userData = {
        name: 'New User',
        email: 'new@test.com',
        password: 'New@123',
        phone: '+1234567890',
        role: 'employee'
      };

      const mockResponse = {
        success: true,
        token: 'new-token-123',
        user: { id: 2, ...userData }
      };

      service.register(userData).subscribe(response => {
        expect(response).toEqual(mockResponse);
        done();
      });

      const req = httpMock.expectOne(`${apiUrl}/auth/register`);
      expect(req.request.method).toBe('POST');
      req.flush(mockResponse);
    });
  });

  describe('getMe', () => {
    it('should get current user from API', (done) => {
      const mockResponse = {
        success: true,
        user: { id: 1, name: 'Test User', email: 'test@test.com' }
      };

      service.getMe().subscribe(response => {
        expect(response).toEqual(mockResponse);
        done();
      });

      const req = httpMock.expectOne(`${apiUrl}/auth/me`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });
  });

  describe('updatePassword', () => {
    it('should update password', (done) => {
      const currentPassword = 'Old@123';
      const newPassword = 'New@123';

      const mockResponse = {
        success: true,
        message: 'Password updated successfully'
      };

      service.updatePassword(currentPassword, newPassword).subscribe(response => {
        expect(response).toEqual(mockResponse);
        done();
      });

      const req = httpMock.expectOne(`${apiUrl}/auth/updatepassword`);
      expect(req.request.method).toBe('PUT');
      req.flush(mockResponse);
    });
  });

  describe('isAdmin', () => {
    it('should return true for admin user', () => {
      const adminUser = { id: 1, name: 'Admin', email: 'admin@test.com', phone: '1234567890', role: 'admin' as 'admin' | 'employee', isActive: true };
      localStorage.setItem('currentUser', JSON.stringify(adminUser));
      // Create a new service instance to pick up the localStorage change
      const freshService = new (AuthService as any)(httpMock, TestBed.inject(Router));

      expect(freshService.isAdmin).toBe(true);
      
      localStorage.removeItem('currentUser');
    });

    it('should return false for non-admin user', () => {
      const employeeUser = { id: 2, name: 'Employee', email: 'emp@test.com', phone: '1234567890', role: 'employee' as 'admin' | 'employee', isActive: true };
      localStorage.setItem('currentUser', JSON.stringify(employeeUser));
      // Create a new service instance to pick up the localStorage change
      const freshService = new (AuthService as any)(httpMock, TestBed.inject(Router));

      expect(freshService.isAdmin).toBe(false);
      
      localStorage.removeItem('currentUser');
    });
  });

  describe('isEmployee', () => {
    it('should return true for employee user', () => {
      const employeeUser = { id: 2, name: 'Employee', email: 'emp@test.com', phone: '1234567890', role: 'employee' as 'admin' | 'employee', isActive: true };
      localStorage.setItem('currentUser', JSON.stringify(employeeUser));
      // Create a new service instance to pick up the localStorage change
      const freshService = new (AuthService as any)(httpMock, TestBed.inject(Router));

      expect(freshService.isEmployee).toBe(true);
      
      localStorage.removeItem('currentUser');
    });

    it('should return false for non-employee user', () => {
      const adminUser = { id: 1, name: 'Admin', email: 'admin@test.com', phone: '1234567890', role: 'admin' as 'admin' | 'employee', isActive: true };
      localStorage.setItem('currentUser', JSON.stringify(adminUser));
      // Create a new service instance to pick up the localStorage change
      const freshService = new (AuthService as any)(httpMock, TestBed.inject(Router));

      expect(freshService.isEmployee).toBe(false);
      
      localStorage.removeItem('currentUser');
    });
  });
});
