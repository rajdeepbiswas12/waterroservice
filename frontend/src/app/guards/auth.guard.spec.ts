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

    mockRoute = {} as ActivatedRouteSnapshot;
    mockState = { url: '/admin/dashboard' } as RouterStateSnapshot;
  });

  it('should be created', () => {
    expect(guard).toBeTruthy();
  });

  describe('canActivate', () => {
    it('should allow access when user is authenticated', (done) => {
      const mockUser = {
        id: 1,
        name: 'Test User',
        email: 'test@test.com',
        role: 'admin'
      };

      Object.defineProperty(authServiceSpy, 'currentUser', {
        get: () => of(mockUser)
      });

      guard.canActivate(mockRoute, mockState).subscribe(result => {
        expect(result).toBe(true);
        expect(routerSpy.navigate).not.toHaveBeenCalled();
        done();
      });
    });

    it('should redirect to login when user is not authenticated', (done) => {
      Object.defineProperty(authServiceSpy, 'currentUser', {
        get: () => of(null)
      });

      guard.canActivate(mockRoute, mockState).subscribe(result => {
        expect(result).toBe(false);
        expect(routerSpy.navigate).toHaveBeenCalledWith(['/login']);
        done();
      });
    });

    it('should allow access when user has required role', (done) => {
      const mockUser = {
        id: 1,
        name: 'Admin User',
        email: 'admin@test.com',
        role: 'admin'
      };

      mockRoute.data = { role: 'admin' };

      Object.defineProperty(authServiceSpy, 'currentUser', {
        get: () => of(mockUser)
      });

      guard.canActivate(mockRoute, mockState).subscribe(result => {
        expect(result).toBe(true);
        done();
      });
    });

    it('should redirect when user does not have required role', (done) => {
      const mockUser = {
        id: 2,
        name: 'Employee User',
        email: 'emp@test.com',
        role: 'employee'
      };

      mockRoute.data = { role: 'admin' };

      Object.defineProperty(authServiceSpy, 'currentUser', {
        get: () => of(mockUser)
      });

      guard.canActivate(mockRoute, mockState).subscribe(result => {
        expect(result).toBe(false);
        expect(routerSpy.navigate).toHaveBeenCalledWith(['/']);
        done();
      });
    });

    it('should allow access when no specific role is required', (done) => {
      const mockUser = {
        id: 2,
        name: 'Employee User',
        email: 'emp@test.com',
        role: 'employee'
      };

      mockRoute.data = {};

      Object.defineProperty(authServiceSpy, 'currentUser', {
        get: () => of(mockUser)
      });

      guard.canActivate(mockRoute, mockState).subscribe(result => {
        expect(result).toBe(true);
        done();
      });
    });
  });
});
