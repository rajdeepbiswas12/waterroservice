import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { CreateAdminComponent } from './create-admin.component';
import { AuthService } from '../../../services/auth.service';

describe('CreateAdminComponent', () => {
  let component: CreateAdminComponent;
  let fixture: ComponentFixture<CreateAdminComponent>;
  let authService: jasmine.SpyObj<AuthService>;
  let router: Router;

  beforeEach(async () => {
    const authServiceSpy = jasmine.createSpyObj('AuthService', ['register']);

    await TestBed.configureTestingModule({
      imports: [
        CreateAdminComponent,
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
    
    fixture = TestBed.createComponent(CreateAdminComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize form with admin role', () => {
    component.ngOnInit();
    
    expect(component.adminForm.get('role')?.value).toBe('admin');
  });

  it('should create admin successfully', () => {
    spyOn(window, 'alert');
    spyOn(router, 'navigate');
    authService.register.and.returnValue(of({ success: true }));
    
    component.ngOnInit();
    component.adminForm.patchValue({
      name: 'New Admin',
      email: 'newadmin@example.com',
      password: 'Admin123',
      phone: '1234567890',
      role: 'admin'
    });
    
    component.onSubmit();
    
    expect(authService.register).toHaveBeenCalled();
    expect(window.alert).toHaveBeenCalledWith('Admin created successfully!');
    expect(router.navigate).toHaveBeenCalledWith(['/admin/admins']);
  });

  it('should navigate back on cancel', () => {
    spyOn(router, 'navigate');
    
    component.cancel();
    
    expect(router.navigate).toHaveBeenCalledWith(['/admin/admins']);
  });
});
