import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { CreateEmployeeComponent } from './create-employee.component';
import { AuthService } from '../../../services/auth.service';

describe('CreateEmployeeComponent', () => {
  let component: CreateEmployeeComponent;
  let fixture: ComponentFixture<CreateEmployeeComponent>;
  let authService: jasmine.SpyObj<AuthService>;
  let router: Router;

  beforeEach(async () => {
    const authServiceSpy = jasmine.createSpyObj('AuthService', ['register']);

    await TestBed.configureTestingModule({
      imports: [
        CreateEmployeeComponent,
        HttpClientTestingModule,
        RouterTestingModule,
        BrowserAnimationsModule
      ],
      providers: [
        { provide: AuthService, useValue: authServiceSpy }
      ]
    }).compileComponents();

    authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    router = TestBed.inject(Router);
    
    fixture = TestBed.createComponent(CreateEmployeeComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize form with employee role', () => {
    component.ngOnInit();
    
    expect(component.employeeForm.get('role')?.value).toBe('employee');
  });

  it('should validate required fields', () => {
    component.ngOnInit();
    
    expect(component.employeeForm.valid).toBeFalse();
    
    component.employeeForm.patchValue({
      name: 'John Doe',
      email: 'john@example.com',
      password: 'Test123',
      phone: '1234567890',
      role: 'employee'
    });
    
    expect(component.employeeForm.valid).toBeTrue();
  });

  it('should validate email format', () => {
    component.ngOnInit();
    const emailControl = component.employeeForm.get('email');
    
    emailControl?.setValue('invalid-email');
    expect(emailControl?.hasError('email')).toBeTrue();
    
    emailControl?.setValue('valid@email.com');
    expect(emailControl?.hasError('email')).toBeFalse();
  });

  it('should validate password minimum length', () => {
    component.ngOnInit();
    const passwordControl = component.employeeForm.get('password');
    
    passwordControl?.setValue('12345');
    expect(passwordControl?.hasError('minlength')).toBeTrue();
    
    passwordControl?.setValue('123456');
    expect(passwordControl?.hasError('minlength')).toBeFalse();
  });

  it('should create employee successfully', () => {
    spyOn(window, 'alert');
    spyOn(router, 'navigate');
    authService.register.and.returnValue(of({ success: true }));
    
    component.ngOnInit();
    component.employeeForm.patchValue({
      name: 'John Doe',
      email: 'john@example.com',
      password: 'Test123',
      phone: '1234567890',
      role: 'employee'
    });
    
    component.onSubmit();
    
    expect(authService.register).toHaveBeenCalled();
    expect(window.alert).toHaveBeenCalledWith('Employee created successfully!');
    expect(router.navigate).toHaveBeenCalledWith(['/admin/employees']);
  });

  it('should toggle password visibility', () => {
    component.hidePassword = true;
    
    component.togglePasswordVisibility();
    
    expect(component.hidePassword).toBeFalse();
  });

  it('should navigate back on cancel', () => {
    spyOn(router, 'navigate');
    
    component.cancel();
    
    expect(router.navigate).toHaveBeenCalledWith(['/admin/employees']);
  });
});
