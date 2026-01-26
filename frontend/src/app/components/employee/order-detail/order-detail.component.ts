import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDividerModule } from '@angular/material/divider';
import { OrderService } from '../../../services/order.service';

@Component({
  selector: 'app-order-detail',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    MatCardModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatDividerModule
  ],
  templateUrl: './order-detail.component.html',
  styleUrls: ['./order-detail.component.scss']
})
export class OrderDetailComponent implements OnInit {
  order: any = null;
  statusForm!: FormGroup;
  loading = false;
  orderId!: number;

  statusOptions = [
    { value: 'pending', label: 'Pending', icon: 'schedule' },
    { value: 'assigned', label: 'Assigned', icon: 'assignment_ind' },
    { value: 'in-progress', label: 'In Progress', icon: 'autorenew' },
    { value: 'completed', label: 'Completed', icon: 'check_circle' },
    { value: 'cancelled', label: 'Cancelled', icon: 'cancel' }
  ];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private fb: FormBuilder,
    private orderService: OrderService,
    private snackBar: MatSnackBar
  ) {
    this.statusForm = this.fb.group({
      status: ['', Validators.required],
      notes: ['']
    });
  }

  ngOnInit(): void {
    this.orderId = Number(this.route.snapshot.paramMap.get('id'));
    if (this.orderId) {
      this.loadOrder();
    }
  }

  loadOrder(): void {
    this.loading = true;
    this.orderService.getOrder(this.orderId).subscribe({
      next: (response: any) => {
        this.order = response.data || response;
        this.statusForm.patchValue({
          status: this.order.status,
          notes: ''
        });
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading order:', error);
        this.snackBar.open('Failed to load order details', 'Close', {
          duration: 3000,
          horizontalPosition: 'end',
          verticalPosition: 'top'
        });
        this.loading = false;
        this.router.navigate(['/employee/orders']);
      }
    });
  }

  updateStatus(): void {
    if (this.statusForm.invalid) {
      return;
    }

    this.loading = true;
    const { status, notes } = this.statusForm.value;

    this.orderService.updateOrderStatus(this.orderId, status, notes).subscribe({
      next: (response) => {
        this.snackBar.open('Order status updated successfully!', 'Close', {
          duration: 3000,
          horizontalPosition: 'end',
          verticalPosition: 'top',
          panelClass: ['success-snackbar']
        });
        this.loadOrder(); // Reload to get updated data
        this.statusForm.patchValue({ notes: '' }); // Clear notes
      },
      error: (error) => {
        console.error('Error updating status:', error);
        this.snackBar.open('Failed to update order status', 'Close', {
          duration: 3000,
          horizontalPosition: 'end',
          verticalPosition: 'top'
        });
        this.loading = false;
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/employee/orders']);
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
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}
