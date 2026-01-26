import { TestBed } from '@angular/core/testing';
import { Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthGuard } from './auth.guard';
import { AuthService } from '../services/auth.service';
import { of } from 'rxjs';

describe('AuthGuard', () => {
  let guard: AuthGuard;
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let routerSpy: jasmine.SpyObj<Router>;
  let mockRoute: ActivatedRouteSnapshot;
  let mockState: RouterStateSnapshot;

  beforeEach(() => {
    const authSpy = jasmine.createSpyObj('AuthService', [], {
      currentUser: of(null)
    });
    const routerSpyObj = jasmine.createSpyObj('Router', ['navigate']);

    TestBed.configureTestingModule({
      providers: [
        AuthGuard,
        { provide: AuthService, useValue: authSpy },
        { provide: Router, useValue: routerSpyObj }
      ]
    });

    guard = TestBed.inject(AuthGuard);
    authServiceSpy = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    routerSpy = TestBed.inject(Router) as jasmine.SpyObj<Router>;

    mockRoute = { data: {} } as ActivatedRouteSnapshot;
    mockState = { url: '/admin/dashboard' } as RouterStateSnapshot;
  });

  it('should be created', () => {
    expect(guard).toBeTruthy();
  });

  describe('canActivate', () => {
    it('should allow access when user is authenticated', () => {
      const mockUser = {
        id: 1,
        name: 'Test User',
        email: 'test@test.com',
        phone: '1234567890',
        role: 'admin' as 'admin' | 'employee',
        isActive: true
      };

      Object.defineProperty(authServiceSpy, 'currentUserValue', {
        get: () => mockUser
      });

      const result = guard.canActivate(mockRoute, mockState);
      expect(result).toBe(true);
      expect(routerSpy.navigate).not.toHaveBeenCalled();
    });

    it('should redirect to login when user is not authenticated', () => {
      Object.defineProperty(authServiceSpy, 'currentUserValue', {
        get: () => null
      });

      const result = guard.canActivate(mockRoute, mockState);
      expect(result).toBe(false);
      expect(routerSpy.navigate).toHaveBeenCalledWith(['/login'], { queryParams: { returnUrl: '/admin/dashboard' } });
    });

    it('should allow access when user has required role', () => {
      const mockUser = {
        id: 1,
        name: 'Admin User',
        email: 'admin@test.com',
        phone: '1234567890',
        role: 'admin' as 'admin' | 'employee',
        isActive: true
      };

      mockRoute.data = { roles: ['admin'] };

      Object.defineProperty(authServiceSpy, 'currentUserValue', {
        get: () => mockUser
      });

      const result = guard.canActivate(mockRoute, mockState);
      expect(result).toBe(true);
    });

    it('should redirect when user does not have required role', () => {
      const mockUser = {
        id: 2,
        name: 'Employee User',
        email: 'emp@test.com',
        phone: '1234567890',
        role: 'employee' as 'admin' | 'employee',
        isActive: true
      };

      mockRoute.data = { roles: ['admin'] };

      Object.defineProperty(authServiceSpy, 'currentUserValue', {
        get: () => mockUser
      });

      const result = guard.canActivate(mockRoute, mockState);
      expect(result).toBe(false);
      expect(routerSpy.navigate).toHaveBeenCalledWith(['/']);
    });

    it('should allow access when no specific role is required', () => {
      const mockUser = {
        id: 2,
        name: 'Employee User',
        email: 'emp@test.com',
        phone: '1234567890',
        role: 'employee' as 'admin' | 'employee',
        isActive: true
      };

      mockRoute.data = {};

      Object.defineProperty(authServiceSpy, 'currentUserValue', {
        get: () => mockUser
      });

      const result = guard.canActivate(mockRoute, mockState);
      expect(result).toBe(true);
    });
  });
});
