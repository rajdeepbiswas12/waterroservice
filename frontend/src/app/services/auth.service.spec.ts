import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { AuthService } from './auth.service';
import { environment } from '../../environments/environment';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;
  const apiUrl = environment.apiUrl;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [AuthService]
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
        role: 'admin'
      };

      localStorage.setItem('user', JSON.stringify(mockUser));
      service = new AuthService(TestBed.inject(HttpClientTestingModule) as any);

      service.currentUser.subscribe(user => {
        expect(user).toEqual(mockUser);
        done();
      });
    });
  });

  describe('login', () => {
    it('should login and store token and user', (done) => {
      const credentials = { email: 'test@test.com', password: 'Test@123' };
      const mockResponse = {
        success: true,
        token: 'test-token-123',
        user: {
          id: 1,
          name: 'Test User',
          email: 'test@test.com',
          role: 'admin'
        }
      };

      service.login(credentials).subscribe(response => {
        expect(response).toEqual(mockResponse);
        expect(localStorage.getItem('token')).toBe('test-token-123');
        expect(localStorage.getItem('user')).toBe(JSON.stringify(mockResponse.user));
        done();
      });

      const req = httpMock.expectOne(`${apiUrl}/auth/login`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(credentials);
      req.flush(mockResponse);
    });

    it('should handle login error', (done) => {
      const credentials = { email: 'test@test.com', password: 'wrong' };
      const mockError = { message: 'Invalid credentials' };

      service.login(credentials).subscribe(
        () => fail('should have failed'),
        error => {
          expect(error.error).toEqual(mockError);
          done();
        }
      );

      const req = httpMock.expectOne(`${apiUrl}/auth/login`);
      req.flush(mockError, { status: 401, statusText: 'Unauthorized' });
    });
  });

  describe('logout', () => {
    it('should clear localStorage and update currentUser', () => {
      localStorage.setItem('token', 'test-token');
      localStorage.setItem('user', JSON.stringify({ id: 1, name: 'Test' }));

      service.logout();

      expect(localStorage.getItem('token')).toBeNull();
      expect(localStorage.getItem('user')).toBeNull();
      
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
      const passwordData = {
        currentPassword: 'Old@123',
        newPassword: 'New@123'
      };

      const mockResponse = {
        success: true,
        message: 'Password updated successfully'
      };

      service.updatePassword(passwordData).subscribe(response => {
        expect(response).toEqual(mockResponse);
        done();
      });

      const req = httpMock.expectOne(`${apiUrl}/auth/update-password`);
      expect(req.request.method).toBe('PUT');
      req.flush(mockResponse);
    });
  });

  describe('isAdmin', () => {
    it('should return true for admin user', () => {
      const adminUser = { id: 1, name: 'Admin', email: 'admin@test.com', role: 'admin' };
      localStorage.setItem('user', JSON.stringify(adminUser));
      service = new AuthService(TestBed.inject(HttpClientTestingModule) as any);

      expect(service.isAdmin).toBe(true);
    });

    it('should return false for non-admin user', () => {
      const employeeUser = { id: 2, name: 'Employee', email: 'emp@test.com', role: 'employee' };
      localStorage.setItem('user', JSON.stringify(employeeUser));
      service = new AuthService(TestBed.inject(HttpClientTestingModule) as any);

      expect(service.isAdmin).toBe(false);
    });
  });

  describe('isEmployee', () => {
    it('should return true for employee user', () => {
      const employeeUser = { id: 2, name: 'Employee', email: 'emp@test.com', role: 'employee' };
      localStorage.setItem('user', JSON.stringify(employeeUser));
      service = new AuthService(TestBed.inject(HttpClientTestingModule) as any);

      expect(service.isEmployee).toBe(true);
    });

    it('should return false for non-employee user', () => {
      const adminUser = { id: 1, name: 'Admin', email: 'admin@test.com', role: 'admin' };
      localStorage.setItem('user', JSON.stringify(adminUser));
      service = new AuthService(TestBed.inject(HttpClientTestingModule) as any);

      expect(service.isEmployee).toBe(false);
    });
  });
});
