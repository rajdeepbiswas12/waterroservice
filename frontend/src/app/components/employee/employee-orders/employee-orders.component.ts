import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { OrderService } from '../../../services/order.service';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-employee-orders',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatSnackBarModule
  ],
  templateUrl: './employee-orders.component.html',
  styleUrls: ['./employee-orders.component.scss']
})
export class EmployeeOrdersComponent implements OnInit {
  orders: any[] = [];
  loading = false;
  displayedColumns: string[] = ['orderId', 'customerName', 'serviceType', 'status', 'priority', 'scheduledDate', 'actions'];
  currentUserId: number | null = null;

  constructor(
    private orderService: OrderService,
    private authService: AuthService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    const currentUser = this.authService.currentUserValue;
    if (currentUser) {
      this.currentUserId = currentUser.id;
      this.loadOrders();
    }
  }

  loadOrders(): void {
    this.loading = true;
    this.orderService.getOrders().subscribe({
      next: (response: any) => {
        // Filter orders assigned to current employee
        const allOrders = response.data || response || [];
        this.orders = allOrders.filter((order: any) => 
          order.assignedToId === this.currentUserId
        );
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading orders:', error);
        this.snackBar.open('Failed to load orders', 'Close', {
          duration: 3000,
          horizontalPosition: 'end',
          verticalPosition: 'top'
        });
        this.loading = false;
      }
    });
  }

  viewOrder(orderId: number): void {
    this.router.navigate(['/employee/orders', orderId]);
  }

  getStatusColor(status: string): string {
    const statusColors: any = {
      'pending': 'default',
      'assigned': 'primary',
      'in-progress': 'accent',
      'completed': 'success',
      'cancelled': 'warn'
    };
    return statusColors[status] || 'default';
  }

  getPriorityColor(priority: string): string {
    const priorityColors: any = {
      'low': 'default',
      'medium': 'primary',
      'high': 'accent',
      'urgent': 'warn'
    };
    return priorityColors[priority] || 'default';
  }

  formatDate(date: string): string {
    if (!date) return 'Not scheduled';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }
}
