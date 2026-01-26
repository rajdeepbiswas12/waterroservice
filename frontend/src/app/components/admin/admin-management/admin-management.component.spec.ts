import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';
import { AdminManagementComponent } from './admin-management.component';
import { UserService } from '../../../services/user.service';
import { AuthService } from '../../../services/auth.service';

describe('AdminManagementComponent', () => {
  let component: AdminManagementComponent;
  let fixture: ComponentFixture<AdminManagementComponent>;
  let userService: jasmine.SpyObj<UserService>;
  let authService: jasmine.SpyObj<AuthService>;

  const mockAdmins = {
    success: true,
    count: 2,
    data: [
      {
        id: 1,
        name: 'Admin User',
        email: 'admin@test.com',
        phone: '1234567890',
        role: 'admin',
        isActive: true
      },
      {
        id: 4,
        name: 'Admin 2',
        email: 'admin2@test.com',
        phone: '0987654321',
        role: 'admin',
        isActive: true
      }
    ]
  };

  beforeEach(async () => {
    const userServiceSpy = jasmine.createSpyObj('UserService', [
      'getUsers',
      'updateUser',
      'deleteUser'
    ]);
    const authServiceSpy = jasmine.createSpyObj('AuthService', [], {
      currentUserValue: { id: 1, role: 'admin' }
    });

    await TestBed.configureTestingModule({
      imports: [
        AdminManagementComponent,
        HttpClientTestingModule,
        RouterTestingModule,
        BrowserAnimationsModule
      ],
      providers: [
        { provide: UserService, useValue: userServiceSpy },
        { provide: AuthService, useValue: authServiceSpy }
      ]
    }).compileComponents();

    userService = TestBed.inject(UserService) as jasmine.SpyObj<UserService>;
    authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    
    fixture = TestBed.createComponent(AdminManagementComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load admins on init', () => {
    userService.getUsers.and.returnValue(of(mockAdmins));
    
    component.ngOnInit();
    
    expect(userService.getUsers).toHaveBeenCalledWith({ role: 'admin' });
    expect(component.admins.length).toBe(2);
  });

  it('should not allow deactivating self', () => {
    spyOn(window, 'alert');
    const currentAdmin = { id: 1, isActive: true };
    
    component.toggleActive(currentAdmin);
    
    expect(window.alert).toHaveBeenCalledWith('You cannot deactivate your own account!');
    expect(userService.updateUser).not.toHaveBeenCalled();
  });

  it('should allow deactivating other admins', () => {
    const otherAdmin = { id: 4, isActive: true };
    userService.updateUser.and.returnValue(of({ success: true }));
    
    component.toggleActive(otherAdmin);
    
    expect(userService.updateUser).toHaveBeenCalledWith(4, { isActive: false });
  });

  it('should not allow deleting self', () => {
    spyOn(window, 'alert');
    
    component.deleteAdmin(1);
    
    expect(window.alert).toHaveBeenCalledWith('You cannot delete your own account!');
    expect(userService.deleteUser).not.toHaveBeenCalled();
  });

  it('should delete other admin after confirmation', () => {
    spyOn(window, 'confirm').and.returnValue(true);
    userService.deleteUser.and.returnValue(of({ success: true }));
    userService.getUsers.and.returnValue(of(mockAdmins));
    
    component.deleteAdmin(4);
    
    expect(userService.deleteUser).toHaveBeenCalledWith(4);
    expect(userService.getUsers).toHaveBeenCalled();
  });
});
