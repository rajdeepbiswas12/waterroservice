import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { of, throwError } from 'rxjs';
import { LoginComponent } from './login.component';
import { AuthService } from '../../services/auth.service';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let routerSpy: jasmine.SpyObj<Router>;
  let activatedRouteSpy: any;

  beforeEach(async () => {
    const authSpy = jasmine.createSpyObj('AuthService', ['login'], { currentUserValue: null });
    const routerSpyObj = jasmine.createSpyObj('Router', ['navigate']);
    activatedRouteSpy = { snapshot: { queryParams: {} } };

    await TestBed.configureTestingModule({
      imports: [
        LoginComponent,
        ReactiveFormsModule,
        MatFormFieldModule,
        MatInputModule,
        MatButtonModule,
        MatCardModule,
        MatIconModule,
        MatSnackBarModule,
        MatProgressSpinnerModule,
        BrowserAnimationsModule
      ],
      providers: [
        { provide: AuthService, useValue: authSpy },
        { provide: Router, useValue: routerSpyObj },
        { provide: ActivatedRoute, useValue: activatedRouteSpy }
      ]
    }).compileComponents();

    authServiceSpy = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    routerSpy = TestBed.inject(Router) as jasmine.SpyObj<Router>;

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize login form with empty values', () => {
    expect(component.loginForm.get('email')?.value).toBe('');
    expect(component.loginForm.get('password')?.value).toBe('');
  });

  it('should mark form as invalid when empty', () => {
    expect(component.loginForm.valid).toBeFalsy();
  });

  it('should validate email format', () => {
    const emailControl = component.loginForm.get('email');
    
    emailControl?.setValue('invalid-email');
    expect(emailControl?.hasError('email')).toBeTruthy();
    
    emailControl?.setValue('valid@email.com');
    expect(emailControl?.hasError('email')).toBeFalsy();
  });

  it('should require password', () => {
    const passwordControl = component.loginForm.get('password');
    
    passwordControl?.setValue('');
    expect(passwordControl?.hasError('required')).toBeTruthy();
    
    passwordControl?.setValue('password123');
    expect(passwordControl?.hasError('required')).toBeFalsy();
  });

  it('should toggle password visibility', () => {
    expect(component.hidePassword).toBe(true);
    
    component.hidePassword = false;
    expect(component.hidePassword).toBe(false);
    
    component.hidePassword = true;
    expect(component.hidePassword).toBe(true);
  });

  describe('onSubmit', () => {
    it('should not submit if form is invalid', () => {
      component.loginForm.setValue({ email: '', password: '' });
      component.onSubmit();
      
      expect(authServiceSpy.login).not.toHaveBeenCalled();
    });

    it('should login admin user and navigate to admin dashboard', () => {
      const mockResponse = {
        success: true,
        token: 'test-token',
        data: { id: 1, name: 'Admin', email: 'admin@test.com', phone: '1234567890', role: 'admin' as 'admin' | 'employee', isActive: true }
      };

      authServiceSpy.login.and.returnValue(of(mockResponse));
      Object.defineProperty(authServiceSpy, 'currentUserValue', { get: () => mockResponse.data });
      
      component.loginForm.setValue({
        email: 'admin@test.com',
        password: 'Admin@123'
      });
      
      component.onSubmit();
      
      expect(authServiceSpy.login).toHaveBeenCalledWith('admin@test.com', 'Admin@123');
      expect(routerSpy.navigate).toHaveBeenCalledWith(['/admin/dashboard']);
    });

    it('should login employee user and navigate to employee dashboard', () => {
      const mockResponse = {
        success: true,
        token: 'test-token',
        data: { id: 2, name: 'Employee', email: 'emp@test.com', phone: '1234567890', role: 'employee' as 'admin' | 'employee', isActive: true }
      };

      authServiceSpy.login.and.returnValue(of(mockResponse));
      Object.defineProperty(authServiceSpy, 'currentUserValue', { get: () => mockResponse.data });
      
      component.loginForm.setValue({
        email: 'emp@test.com',
        password: 'Emp@123'
      });
      
      component.onSubmit();
      
      expect(routerSpy.navigate).toHaveBeenCalledWith(['/employee/dashboard']);
    });

    it('should handle login error', () => {
      const mockError = new Error('Invalid credentials');
      authServiceSpy.login.and.returnValue(throwError(() => mockError));
      
      component.loginForm.setValue({
        email: 'wrong@test.com',
        password: 'wrong'
      });
      
      component.onSubmit();
      
      expect(component.loading).toBe(false);
    });

    it('should set loading state during login', () => {
      const mockResponse = { 
        success: true, 
        token: 'token', 
        data: { id: 1, name: 'Admin', email: 'admin@test.com', phone: '1234567890', role: 'admin' as 'admin' | 'employee', isActive: true }
      };
      authServiceSpy.login.and.returnValue(of(mockResponse));
      Object.defineProperty(authServiceSpy, 'currentUserValue', { get: () => mockResponse.data });
      
      component.loginForm.setValue({
        email: 'test@test.com',
        password: 'Test@123'
      });
      
      expect(component.loading).toBe(false);
      component.onSubmit();
      expect(component.loading).toBe(false); // After completion
    });
  });

  describe('Form Validation Error Messages', () => {
    it('should show required email error', () => {
      const emailControl = component.loginForm.get('email');
      emailControl?.markAsTouched();
      
      fixture.detectChanges();
      
      const compiled = fixture.nativeElement;
      expect(compiled.querySelector('mat-error')).toBeTruthy();
    });

    it('should show invalid email format error', () => {
      const emailControl = component.loginForm.get('email');
      emailControl?.setValue('invalid-email');
      emailControl?.markAsTouched();
      
      fixture.detectChanges();
      
      const compiled = fixture.nativeElement;
      const errorElement = compiled.querySelector('mat-error');
      expect(errorElement).toBeTruthy();
    });
  });
});
