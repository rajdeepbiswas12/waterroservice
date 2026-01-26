import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CustomerService, Customer } from '../../../services/customer.service';
import { NotificationService } from '../../../services/notification.service';

@Component({
  selector: 'app-customer-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatPaginatorModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatChipsModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './customer-list.component.html',
  styleUrls: ['./customer-list.component.css']
})
export class CustomerListComponent implements OnInit {
  customers: Customer[] = [];
  displayedColumns: string[] = ['customerNumber', 'name', 'phone', 'email', 'city', 'status', 'totalBookings', 'totalSpent', 'actions'];
  
  // Pagination
  totalCustomers = 0;
  pageSize = 10;
  pageIndex = 0;
  
  // Filters
  searchText = '';
  statusFilter = '';
  
  loading = false;

  constructor(
    private customerService: CustomerService,
    private notificationService: NotificationService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadCustomers();
  }

  loadCustomers(): void {
    this.loading = true;
    const page = this.pageIndex + 1;
    
    this.customerService.getAllCustomers(page, this.pageSize, this.searchText, this.statusFilter)
      .subscribe({
        next: (response) => {
          this.customers = response.data;
          this.totalCustomers = response.pagination.total;
          this.loading = false;
        },
        error: (error) => {
          console.error('Error loading customers:', error);
          this.notificationService.showError('Failed to load customers');
          this.loading = false;
        }
      });
  }

  onPageChange(event: PageEvent): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.loadCustomers();
  }

  onSearch(): void {
    this.pageIndex = 0;
    this.loadCustomers();
  }

  onFilterChange(): void {
    this.pageIndex = 0;
    this.loadCustomers();
  }

  viewCustomer(customer: Customer): void {
    this.router.navigate(['/customers', customer.id]);
  }

  editCustomer(customer: Customer): void {
    this.router.navigate(['/customers', customer.id, 'edit']);
  }

  deleteCustomer(customer: Customer): void {
    if (confirm(`Are you sure you want to delete customer ${customer.name}?`)) {
      this.customerService.deleteCustomer(customer.id!).subscribe({
        next: () => {
          this.notificationService.showSuccess('Customer deleted successfully');
          this.loadCustomers();
        },
        error: (error) => {
          console.error('Error deleting customer:', error);
          this.notificationService.showError(error.error?.message || 'Failed to delete customer');
        }
      });
    }
  }

  addCustomer(): void {
    this.router.navigate(['/customers/new']);
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'active': return 'primary';
      case 'inactive': return 'accent';
      case 'blocked': return 'warn';
      default: return '';
    }
  }
}
