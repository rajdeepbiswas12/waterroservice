import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { HTTP_INTERCEPTORS, HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { JwtInterceptor, ErrorInterceptor } from './http.interceptor';
import { AuthService } from '../services/auth.service';

describe('HTTP Interceptors', () => {
  let httpMock: HttpTestingController;
  let httpClient: HttpClient;

  describe('JwtInterceptor', () => {
    let authService: jasmine.SpyObj<AuthService>;

    beforeEach(() => {
      const authSpy = jasmine.createSpyObj('AuthService', ['logout']);
      Object.defineProperty(authSpy, 'token', {
        get: jasmine.createSpy('token').and.returnValue('test-token-123'),
        configurable: true
      });

      TestBed.configureTestingModule({
        imports: [HttpClientTestingModule],
        providers: [
          { provide: AuthService, useValue: authSpy },
          {
            provide: HTTP_INTERCEPTORS,
            useClass: JwtInterceptor,
            multi: true
          }
        ]
      });

      httpClient = TestBed.inject(HttpClient);
      httpMock = TestBed.inject(HttpTestingController);
      authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    });

    afterEach(() => {
      httpMock.verify();
    });

    it('should add Authorization header when token exists', () => {
      httpClient.get('/api/test').subscribe();

      const req = httpMock.expectOne('/api/test');
      expect(req.request.headers.has('Authorization')).toBe(true);
      expect(req.request.headers.get('Authorization')).toBe('Bearer test-token-123');
      req.flush({});
    });

    it('should not add Authorization header when token is null', () => {
      // Change token getter to return null
      Object.defineProperty(authService, 'token', {
        get: jasmine.createSpy('token').and.returnValue(null),
        configurable: true
      });

      httpClient.get('/api/test').subscribe();

      const req = httpMock.expectOne('/api/test');
      expect(req.request.headers.has('Authorization')).toBe(false);
      req.flush({});
    });

    it('should not add Authorization header when token is empty string', () => {
      Object.defineProperty(authService, 'token', {
        get: jasmine.createSpy('token').and.returnValue(''),
        configurable: true
      });

      httpClient.get('/api/test').subscribe();

      const req = httpMock.expectOne('/api/test');
      expect(req.request.headers.has('Authorization')).toBe(false);
      req.flush({});
    });

    it('should add Authorization header to POST requests', () => {
      httpClient.post('/api/test', { data: 'value' }).subscribe();

      const req = httpMock.expectOne('/api/test');
      expect(req.request.headers.get('Authorization')).toBe('Bearer test-token-123');
      req.flush({});
    });

    it('should add Authorization header to PUT requests', () => {
      httpClient.put('/api/test/1', { data: 'updated' }).subscribe();

      const req = httpMock.expectOne('/api/test/1');
      expect(req.request.headers.get('Authorization')).toBe('Bearer test-token-123');
      req.flush({});
    });

    it('should add Authorization header to DELETE requests', () => {
      httpClient.delete('/api/test/1').subscribe();

      const req = httpMock.expectOne('/api/test/1');
      expect(req.request.headers.get('Authorization')).toBe('Bearer test-token-123');
      req.flush({});
    });

    it('should preserve existing headers', () => {
      const headers = { 'Custom-Header': 'custom-value' };
      httpClient.get('/api/test', { headers }).subscribe();

      const req = httpMock.expectOne('/api/test');
      expect(req.request.headers.get('Authorization')).toBe('Bearer test-token-123');
      expect(req.request.headers.get('Custom-Header')).toBe('custom-value');
      req.flush({});
    });
  });

  describe('ErrorInterceptor', () => {
    let authService: jasmine.SpyObj<AuthService>;
    let router: jasmine.SpyObj<Router>;

    beforeEach(() => {
      const authSpy = jasmine.createSpyObj('AuthService', ['logout']);
      const routerSpy = jasmine.createSpyObj('Router', ['navigate']);

      TestBed.configureTestingModule({
        imports: [HttpClientTestingModule],
        providers: [
          { provide: AuthService, useValue: authSpy },
          { provide: Router, useValue: routerSpy },
          {
            provide: HTTP_INTERCEPTORS,
            useClass: ErrorInterceptor,
            multi: true
          }
        ]
      });

      httpClient = TestBed.inject(HttpClient);
      httpMock = TestBed.inject(HttpTestingController);
      authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
      router = TestBed.inject(Router) as jasmine.SpyObj<Router>;
    });

    afterEach(() => {
      httpMock.verify();
    });

    it('should logout and redirect on 401 error', (done) => {
      httpClient.get('/api/test').subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(authService.logout).toHaveBeenCalled();
          expect(router.navigate).toHaveBeenCalledWith(['/login']);
          done();
        }
      });

      const req = httpMock.expectOne('/api/test');
      req.flush({ message: 'Unauthorized' }, { status: 401, statusText: 'Unauthorized' });
    });

    it('should extract error message from response', (done) => {
      const errorMessage = 'Custom error message';

      httpClient.get('/api/test').subscribe({
        next: () => fail('should have failed'),
        error: (error: Error) => {
          expect(error.message).toBe(errorMessage);
          done();
        }
      });

      const req = httpMock.expectOne('/api/test');
      req.flush({ message: errorMessage }, { status: 400, statusText: 'Bad Request' });
    });

    it('should use statusText when error message is not available', (done) => {
      httpClient.get('/api/test').subscribe({
        next: () => fail('should have failed'),
        error: (error: Error) => {
          expect(error.message).toBe('Bad Request');
          done();
        }
      });

      const req = httpMock.expectOne('/api/test');
      req.flush({}, { status: 400, statusText: 'Bad Request' });
    });

    it('should not logout on non-401 errors', (done) => {
      httpClient.get('/api/test').subscribe({
        next: () => fail('should have failed'),
        error: () => {
          expect(authService.logout).not.toHaveBeenCalled();
          expect(router.navigate).not.toHaveBeenCalled();
          done();
        }
      });

      const req = httpMock.expectOne('/api/test');
      req.flush({ message: 'Server error' }, { status: 500, statusText: 'Internal Server Error' });
    });

    it('should handle 403 Forbidden without logout', (done) => {
      httpClient.get('/api/test').subscribe({
        next: () => fail('should have failed'),
        error: (error: Error) => {
          expect(authService.logout).not.toHaveBeenCalled();
          expect(error.message).toBe('Forbidden');
          done();
        }
      });

      const req = httpMock.expectOne('/api/test');
      req.flush({ message: 'Forbidden' }, { status: 403, statusText: 'Forbidden' });
    });

    it('should handle 404 Not Found', (done) => {
      httpClient.get('/api/test').subscribe({
        next: () => fail('should have failed'),
        error: (error: Error) => {
          expect(authService.logout).not.toHaveBeenCalled();
          expect(error.message).toBe('Resource not found');
          done();
        }
      });

      const req = httpMock.expectOne('/api/test');
      req.flush({ message: 'Resource not found' }, { status: 404, statusText: 'Not Found' });
    });

    it('should handle network errors', (done) => {
      httpClient.get('/api/test').subscribe({
        next: () => fail('should have failed'),
        error: (error: Error) => {
          expect(authService.logout).not.toHaveBeenCalled();
          done();
        }
      });

      const req = httpMock.expectOne('/api/test');
      req.error(new ProgressEvent('error'));
    });
  });

  describe('Combined Interceptors', () => {
    let authService: jasmine.SpyObj<AuthService>;
    let router: jasmine.SpyObj<Router>;

    beforeEach(() => {
      const authSpy = jasmine.createSpyObj('AuthService', ['logout']);
      Object.defineProperty(authSpy, 'token', {
        get: jasmine.createSpy('token').and.returnValue('test-token'),
        configurable: true
      });
      const routerSpy = jasmine.createSpyObj('Router', ['navigate']);

      TestBed.configureTestingModule({
        imports: [HttpClientTestingModule],
        providers: [
          { provide: AuthService, useValue: authSpy },
          { provide: Router, useValue: routerSpy },
          {
            provide: HTTP_INTERCEPTORS,
            useClass: JwtInterceptor,
            multi: true
          },
          {
            provide: HTTP_INTERCEPTORS,
            useClass: ErrorInterceptor,
            multi: true
          }
        ]
      });

      httpClient = TestBed.inject(HttpClient);
      httpMock = TestBed.inject(HttpTestingController);
      authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
      router = TestBed.inject(Router) as jasmine.SpyObj<Router>;
    });

    afterEach(() => {
      httpMock.verify();
    });

    it('should add token and handle 401 error together', (done) => {
      httpClient.get('/api/test').subscribe({
        next: () => fail('should have failed'),
        error: () => {
          expect(authService.logout).toHaveBeenCalled();
          expect(router.navigate).toHaveBeenCalledWith(['/login']);
          done();
        }
      });

      const req = httpMock.expectOne('/api/test');
      expect(req.request.headers.get('Authorization')).toBe('Bearer test-token');
      req.flush({ message: 'Token expired' }, { status: 401, statusText: 'Unauthorized' });
    });

    it('should handle successful request with token', () => {
      const mockResponse = { success: true, data: 'test' };

      httpClient.get('/api/test').subscribe(response => {
        expect(response).toEqual(mockResponse);
      });

      const req = httpMock.expectOne('/api/test');
      expect(req.request.headers.get('Authorization')).toBe('Bearer test-token');
      req.flush(mockResponse);
    });
  });
});
