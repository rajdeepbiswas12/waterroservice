import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';
import { EmployeesListComponent } from './employees-list.component';
import { UserService } from '../../../services/user.service';

describe('EmployeesListComponent', () => {
  let component: EmployeesListComponent;
  let fixture: ComponentFixture<EmployeesListComponent>;
  let userService: jasmine.SpyObj<UserService>;

  const mockEmployees = {
    success: true,
    count: 2,
    data: [
      {
        id: 2,
        name: 'Employee 1',
        email: 'emp1@test.com',
        phone: '1234567890',
        role: 'employee',
        isActive: true,
        orderCount: 5
      },
      {
        id: 3,
        name: 'Employee 2',
        email: 'emp2@test.com',
        phone: '0987654321',
        role: 'employee',
        isActive: false,
        orderCount: 2
      }
    ]
  };

  beforeEach(async () => {
    const userServiceSpy = jasmine.createSpyObj('UserService', [
      'getUsers',
      'updateUser',
      'deleteUser'
    ]);

    await TestBed.configureTestingModule({
      imports: [
        EmployeesListComponent,
        HttpClientTestingModule,
        RouterTestingModule,
        BrowserAnimationsModule
      ],
      providers: [
        { provide: UserService, useValue: userServiceSpy }
      ]
    }).compileComponents();

    userService = TestBed.inject(UserService) as jasmine.SpyObj<UserService>;
    
    fixture = TestBed.createComponent(EmployeesListComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load employees on init', () => {
    userService.getUsers.and.returnValue(of(mockEmployees));
    
    component.ngOnInit();
    
    expect(userService.getUsers).toHaveBeenCalledWith({ role: 'employee' });
    expect(component.employees.length).toBe(2);
    expect(component.filteredEmployees.length).toBe(2);
  });

  it('should handle error when loading employees fails', () => {
    spyOn(window, 'alert');
    userService.getUsers.and.returnValue(throwError(() => new Error('Network error')));
    
    component.loadEmployees();
    
    expect(component.loading).toBeFalse();
    expect(window.alert).toHaveBeenCalledWith('Failed to load employees: Network error');
  });

  it('should filter employees by active status', () => {
    component.employees = mockEmployees.data;
    component.filteredEmployees = [...component.employees];
    component.activeFilter = 'active';
    
    component.applyFilters();
    
    expect(component.filteredEmployees.length).toBe(1);
    expect(component.filteredEmployees[0].isActive).toBeTrue();
  });

  it('should filter employees by inactive status', () => {
    component.employees = mockEmployees.data;
    component.filteredEmployees = [...component.employees];
    component.activeFilter = 'inactive';
    
    component.applyFilters();
    
    expect(component.filteredEmployees.length).toBe(1);
    expect(component.filteredEmployees[0].isActive).toBeFalse();
  });

  it('should toggle employee active status', () => {
    const employee = { ...mockEmployees.data[0] };
    userService.updateUser.and.returnValue(of({ success: true }));
    
    component.toggleActive(employee);
    
    expect(userService.updateUser).toHaveBeenCalledWith(employee.id, { isActive: false });
    expect(employee.isActive).toBeFalse();
  });

  it('should handle error when toggling active status fails', () => {
    spyOn(window, 'alert');
    const employee = { ...mockEmployees.data[0] };
    userService.updateUser.and.returnValue(throwError(() => new Error('Update failed')));
    
    component.toggleActive(employee);
    
    expect(window.alert).toHaveBeenCalledWith('Failed to update employee status');
  });

  it('should delete employee after confirmation', () => {
    spyOn(window, 'confirm').and.returnValue(true);
    userService.deleteUser.and.returnValue(of({ success: true }));
    userService.getUsers.and.returnValue(of(mockEmployees));
    
    component.deleteEmployee(2);
    
    expect(window.confirm).toHaveBeenCalled();
    expect(userService.deleteUser).toHaveBeenCalledWith(2);
    expect(userService.getUsers).toHaveBeenCalled();
  });

  it('should not delete employee if not confirmed', () => {
    spyOn(window, 'confirm').and.returnValue(false);
    
    component.deleteEmployee(2);
    
    expect(userService.deleteUser).not.toHaveBeenCalled();
  });

  it('should handle error when deleting employee fails', () => {
    spyOn(window, 'confirm').and.returnValue(true);
    spyOn(window, 'alert');
    userService.deleteUser.and.returnValue(throwError(() => ({ error: { message: 'Delete failed' } })));
    
    component.deleteEmployee(2);
    
    expect(window.alert).toHaveBeenCalledWith('Failed to delete employee: Delete failed');
  });
});
