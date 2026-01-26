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
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatTabsModule } from '@angular/material/tabs';
import { OrderService } from '../../../services/order.service';
import { UserService } from '../../../services/user.service';

@Component({
  selector: 'app-admin-order-detail',
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
    MatDividerModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatTabsModule
  ],
  templateUrl: './admin-order-detail.component.html',
  styleUrls: ['./admin-order-detail.component.scss']
})
export class AdminOrderDetailComponent implements OnInit {
  order: any = null;
  orderForm!: FormGroup;
  assignForm!: FormGroup;
  loading = false;
  orderId!: number;
  employees: any[] = [];
  editMode = false;

  serviceTypes = ['Installation', 'Repair', 'Maintenance', 'Filter Change', 'AMC', 'Inspection'];
  priorities = ['low', 'medium', 'high', 'urgent'];
  statusOptions = [
    { value: 'pending', label: 'Pending' },
    { value: 'assigned', label: 'Assigned' },
    { value: 'in-progress', label: 'In Progress' },
    { value: 'completed', label: 'Completed' },
    { value: 'cancelled', label: 'Cancelled' }
  ];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private fb: FormBuilder,
    private orderService: OrderService,
    private userService: UserService,
    private snackBar: MatSnackBar
  ) {
    this.initForms();
  }

  ngOnInit(): void {
    this.orderId = Number(this.route.snapshot.paramMap.get('id'));
    if (this.orderId) {
      this.loadOrder();
      this.loadEmployees();
    }
  }

  initForms(): void {
    this.orderForm = this.fb.group({
      customerName: ['', Validators.required],
      customerPhone: ['', [Validators.required, Validators.pattern(/^\+?[0-9]{10,15}$/)]],
      customerEmail: ['', [Validators.email]],
      customerAddress: ['', Validators.required],
      latitude: [''],
      longitude: [''],
      serviceType: ['', Validators.required],
      priority: ['medium', Validators.required],
      status: ['', Validators.required],
      description: [''],
      scheduledDate: [''],
      notes: ['']
    });

    this.assignForm = this.fb.group({
      assignedToId: ['', Validators.required]
    });
  }

  loadOrder(): void {
    this.loading = true;
    this.orderService.getOrder(this.orderId).subscribe({
      next: (response: any) => {
        this.order = response.data || response;
        this.populateForm();
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
        this.router.navigate(['/admin/orders']);
      }
    });
  }

  loadEmployees(): void {
    this.userService.getAvailableEmployees().subscribe({
      next: (response: any) => {
        this.employees = response.data || [];
      },
      error: (error) => {
        console.error('Error loading employees:', error);
      }
    });
  }

  populateForm(): void {
    this.orderForm.patchValue({
      customerName: this.order.customerName,
      customerPhone: this.order.customerPhone,
      customerEmail: this.order.customerEmail,
      customerAddress: this.order.customerAddress,
      latitude: this.order.latitude,
      longitude: this.order.longitude,
      serviceType: this.order.serviceType,
      priority: this.order.priority,
      status: this.order.status,
      description: this.order.description,
      scheduledDate: this.order.scheduledDate ? new Date(this.order.scheduledDate) : null,
      notes: this.order.notes
    });

    if (this.order.assignedToId) {
      this.assignForm.patchValue({
        assignedToId: this.order.assignedToId
      });
    }
  }

  toggleEditMode(): void {
    this.editMode = !this.editMode;
    if (!this.editMode) {
      this.populateForm();
    }
  }

  updateOrder(): void {
    if (this.orderForm.invalid) {
      this.snackBar.open('Please fill all required fields', 'Close', {
        duration: 3000
      });
      return;
    }

    this.loading = true;
    const formData = { ...this.orderForm.value };
    
    // Handle empty email
    if (!formData.customerEmail) {
      formData.customerEmail = null;
    }

    this.orderService.updateOrder(this.orderId, formData).subscribe({
      next: (response) => {
        this.snackBar.open('Order updated successfully!', 'Close', {
          duration: 3000,
          horizontalPosition: 'end',
          verticalPosition: 'top',
          panelClass: ['success-snackbar']
        });
        this.editMode = false;
        this.loadOrder();
      },
      error: (error) => {
        console.error('Error updating order:', error);
        this.snackBar.open('Failed to update order', 'Close', {
          duration: 3000,
          horizontalPosition: 'end',
          verticalPosition: 'top'
        });
        this.loading = false;
      }
    });
  }

  assignEmployee(): void {
    if (this.assignForm.invalid) {
      return;
    }

    this.loading = true;
    const employeeId = this.assignForm.value.assignedToId;

    this.orderService.assignOrder(this.orderId, employeeId).subscribe({
      next: (response) => {
        this.snackBar.open('Employee assigned successfully!', 'Close', {
          duration: 3000,
          horizontalPosition: 'end',
          verticalPosition: 'top',
          panelClass: ['success-snackbar']
        });
        this.loadOrder();
      },
      error: (error) => {
        console.error('Error assigning employee:', error);
        this.snackBar.open('Failed to assign employee', 'Close', {
          duration: 3000,
          horizontalPosition: 'end',
          verticalPosition: 'top'
        });
        this.loading = false;
      }
    });
  }

  deleteOrder(): void {
    if (confirm('Are you sure you want to delete this order? This action cannot be undone.')) {
      this.loading = true;
      this.orderService.deleteOrder(this.orderId).subscribe({
        next: () => {
          this.snackBar.open('Order deleted successfully', 'Close', {
            duration: 3000,
            horizontalPosition: 'end',
            verticalPosition: 'top'
          });
          this.router.navigate(['/admin/orders']);
        },
        error: (error) => {
          console.error('Error deleting order:', error);
          this.snackBar.open('Failed to delete order', 'Close', {
            duration: 3000
          });
          this.loading = false;
        }
      });
    }
  }

  goBack(): void {
    this.router.navigate(['/admin/orders']);
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
    if (!date) return 'Not set';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}
