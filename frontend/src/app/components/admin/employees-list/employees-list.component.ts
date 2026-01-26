import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterModule } from '@angular/router';
import { UserService } from '../../../services/user.service';

@Component({
  selector: 'app-employees-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatSlideToggleModule,
    MatTooltipModule,
    RouterModule
  ],
  templateUrl: './employees-list.component.html',
  styleUrls: ['./employees-list.component.scss']
})
export class EmployeesListComponent implements OnInit {
  employees: any[] = [];
  filteredEmployees: any[] = [];
  displayedColumns: string[] = ['name', 'email', 'phone', 'role', 'isActive', 'orderCount', 'actions'];
  
  roleFilter = '';
  activeFilter = '';
  loading = false;

  constructor(private userService: UserService) {}

  ngOnInit() {
    this.loadEmployees();
  }

  loadEmployees() {
    this.loading = true;
    this.userService.getUsers({ role: 'employee' }).subscribe({
      next: (response: any) => {
        this.employees = response.data || [];
        this.filteredEmployees = [...this.employees];
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading employees:', error);
        alert('Failed to load employees: ' + error.message);
        this.loading = false;
      }
    });
  }

  applyFilters() {
    this.filteredEmployees = this.employees.filter(emp => {
      const activeMatch = this.activeFilter === '' || 
                         (this.activeFilter === 'active' && emp.isActive) || 
                         (this.activeFilter === 'inactive' && !emp.isActive);
      return activeMatch;
    });
  }

  toggleActive(employee: any) {
    this.userService.updateUser(employee.id, { isActive: !employee.isActive }).subscribe({
      next: () => {
        employee.isActive = !employee.isActive;
      },
      error: (error) => {
        console.error('Error updating employee:', error);
        alert('Failed to update employee status');
      }
    });
  }

  deleteEmployee(employeeId: number) {
    if (confirm('Are you sure you want to delete this employee?')) {
      this.userService.deleteUser(employeeId).subscribe({
        next: () => {
          this.loadEmployees();
        },
        error: (error) => {
          console.error('Error deleting employee:', error);
          alert('Failed to delete employee: ' + (error.error?.message || 'Unknown error'));
        }
      });
    }
  }
}
