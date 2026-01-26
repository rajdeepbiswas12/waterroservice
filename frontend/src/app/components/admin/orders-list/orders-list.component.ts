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
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterModule } from '@angular/router';
import { OrderService } from '../../../services/order.service';
import { UserService } from '../../../services/user.service';

@Component({
  selector: 'app-orders-list',
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
    MatDatepickerModule,
    MatNativeDateModule,
    MatTooltipModule,
    RouterModule
  ],
  templateUrl: './orders-list.component.html',
  styleUrls: ['./orders-list.component.scss']
})
export class OrdersListComponent implements OnInit {
  orders: any[] = [];
  filteredOrders: any[] = [];
  displayedColumns: string[] = ['orderNumber', 'customerName', 'serviceType', 'status', 'priority', 'assignedTo', 'createdAt', 'actions'];
  
  statusFilter = '';
  priorityFilter = '';
  loading = false;

  statusOptions = ['pending', 'assigned', 'in-progress', 'completed', 'cancelled'];
  priorityOptions = ['low', 'medium', 'high', 'urgent'];

  constructor(
    private orderService: OrderService,
    private userService: UserService
  ) {}

  ngOnInit() {
    this.loadOrders();
  }

  loadOrders() {
    this.loading = true;
    this.orderService.getOrders().subscribe({
      next: (response: any) => {
        this.orders = response.orders || [];
        this.filteredOrders = [...this.orders];
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading orders:', error);
        this.loading = false;
      }
    });
  }

  applyFilters() {
    this.filteredOrders = this.orders.filter(order => {
      const statusMatch = !this.statusFilter || order.status === this.statusFilter;
      const priorityMatch = !this.priorityFilter || order.priority === this.priorityFilter;
      return statusMatch && priorityMatch;
    });
  }

  getStatusColor(status: string): string {
    const colors: any = {
      'pending': 'warn',
      'assigned': 'primary',
      'in-progress': 'accent',
      'completed': 'primary',
      'cancelled': 'warn'
    };
    return colors[status] || 'primary';
  }

  getPriorityColor(priority: string): string {
    const colors: any = {
      'low': 'primary',
      'medium': 'accent',
      'high': 'warn',
      'urgent': 'warn'
    };
    return colors[priority] || 'primary';
  }

  deleteOrder(orderId: number) {
    if (confirm('Are you sure you want to delete this order?')) {
      this.orderService.deleteOrder(orderId).subscribe({
        next: () => {
          this.loadOrders();
        },
        error: (error) => {
          console.error('Error deleting order:', error);
          alert('Failed to delete order');
        }
      });
    }
  }
}
