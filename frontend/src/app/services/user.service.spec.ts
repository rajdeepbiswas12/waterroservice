import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { UserService } from './user.service';
import { environment } from '../../environments/environment';

describe('UserService', () => {
  let service: UserService;
  let httpMock: HttpTestingController;
  const apiUrl = environment.apiUrl;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [UserService]
    });
    service = TestBed.inject(UserService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getUsers', () => {
    it('should get all users', (done) => {
      const mockResponse = {
        success: true,
        count: 3,
        users: [
          { id: 1, name: 'Admin', email: 'admin@test.com', role: 'admin' },
          { id: 2, name: 'Employee 1', email: 'emp1@test.com', role: 'employee' },
          { id: 3, name: 'Employee 2', email: 'emp2@test.com', role: 'employee' }
        ]
      };

      service.getUsers().subscribe(response => {
        expect(response).toEqual(mockResponse);
        expect(response.users.length).toBe(3);
        done();
      });

      const req = httpMock.expectOne(`${apiUrl}/users`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should filter users with query params', (done) => {
      const filters = { role: 'employee', isActive: 'true' };

      service.getUsers(filters).subscribe(() => {
        done();
      });

      const req = httpMock.expectOne(
        req => req.url === `${apiUrl}/users` && 
               req.params.get('role') === 'employee' &&
               req.params.get('isActive') === 'true'
      );
      expect(req.request.method).toBe('GET');
      req.flush({ success: true, users: [] });
    });
  });

  describe('getUser', () => {
    it('should get single user by id', (done) => {
      const mockUser = {
        success: true,
        user: {
          id: 1,
          name: 'Test User',
          email: 'test@test.com',
          role: 'employee'
        }
      };

      service.getUser(1).subscribe(response => {
        expect(response).toEqual(mockUser);
        done();
      });

      const req = httpMock.expectOne(`${apiUrl}/users/1`);
      expect(req.request.method).toBe('GET');
      req.flush(mockUser);
    });
  });

  describe('updateUser', () => {
    it('should update user', (done) => {
      const updates = {
        name: 'Updated Name',
        phone: '+9999999999',
        isActive: true
      };

      const mockResponse = {
        success: true,
        user: { id: 1, ...updates }
      };

      service.updateUser(1, updates).subscribe(response => {
        expect(response).toEqual(mockResponse);
        done();
      });

      const req = httpMock.expectOne(`${apiUrl}/users/1`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(updates);
      req.flush(mockResponse);
    });
  });

  describe('deleteUser', () => {
    it('should delete user', (done) => {
      const mockResponse = {
        success: true,
        message: 'User deleted successfully'
      };

      service.deleteUser(1).subscribe(response => {
        expect(response).toEqual(mockResponse);
        done();
      });

      const req = httpMock.expectOne(`${apiUrl}/users/1`);
      expect(req.request.method).toBe('DELETE');
      req.flush(mockResponse);
    });
  });

  describe('getAvailableEmployees', () => {
    it('should get available employees', (done) => {
      const mockResponse = {
        success: true,
        employees: [
          { id: 2, name: 'Employee 1', email: 'emp1@test.com', orderCount: 2 },
          { id: 3, name: 'Employee 2', email: 'emp2@test.com', orderCount: 0 }
        ]
      };

      service.getAvailableEmployees().subscribe(response => {
        expect(response).toEqual(mockResponse);
        expect(response.employees.length).toBe(2);
        done();
      });

      const req = httpMock.expectOne(`${apiUrl}/users/available-employees`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });
  });
});
