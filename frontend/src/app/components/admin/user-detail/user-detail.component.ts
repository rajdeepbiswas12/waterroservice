import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDividerModule } from '@angular/material/divider';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTableModule } from '@angular/material/table';
import { UserService } from '../../../services/user.service';
import { OrderService } from '../../../services/order.service';

@Component({
  selector: 'app-user-detail',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatDividerModule,
    MatSlideToggleModule,
    MatTabsModule,
    MatTableModule
  ],
  templateUrl: './user-detail.component.html',
  styleUrls: ['./user-detail.component.scss']
})
export class UserDetailComponent implements OnInit {
  user: any = null;
  userForm!: FormGroup;
  passwordForm!: FormGroup;
  orders: any[] = [];
  loading = false;
  userId!: number;
  userType: 'employee' | 'admin' = 'employee';
  editMode = false;
  hidePassword = true;
  hideConfirmPassword = true;
  displayedColumns: string[] = ['orderNumber', 'customerName', 'status', 'priority', 'scheduledDate'];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private fb: FormBuilder,
    private userService: UserService,
    private orderService: OrderService,
    private snackBar: MatSnackBar
  ) {
    this.initForms();
  }

  ngOnInit(): void {
    // Determine user type from route
    this.userType = this.router.url.includes('/employees/') ? 'employee' : 'admin';
    
    this.userId = Number(this.route.snapshot.paramMap.get('id'));
    if (this.userId) {
      this.loadUser();
      if (this.userType === 'employee') {
        this.loadUserOrders();
      }
    }
  }

  initForms(): void {
    this.userForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.required, Validators.pattern(/^\+?[0-9]{10,15}$/)]],
      address: [''],
      isActive: [true]
    });

    this.passwordForm = this.fb.group({
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required]
    }, { validators: this.passwordMatchValidator });
  }

  passwordMatchValidator(group: FormGroup) {
    const password = group.get('newPassword')?.value;
    const confirmPassword = group.get('confirmPassword')?.value;
    return password === confirmPassword ? null : { passwordMismatch: true };
  }

  loadUser(): void {
    this.loading = true;
    this.userService.getUser(this.userId).subscribe({
      next: (response: any) => {
        this.user = response.data || response;
        this.populateForm();
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading user:', error);
        this.snackBar.open('Failed to load user details', 'Close', {
          duration: 3000
        });
        this.loading = false;
        this.router.navigate([`/admin/${this.userType === 'employee' ? 'employees' : 'admins'}`]);
      }
    });
  }

  loadUserOrders(): void {
    this.orderService.getOrders().subscribe({
      next: (response: any) => {
        const allOrders = response.data || [];
        this.orders = allOrders.filter((order: any) => order.assignedToId === this.userId);
      },
      error: (error) => {
        console.error('Error loading orders:', error);
      }
    });
  }

  populateForm(): void {
    this.userForm.patchValue({
      name: this.user.name,
      email: this.user.email,
      phone: this.user.phone,
      address: this.user.address,
      isActive: this.user.isActive
    });
  }

  toggleEditMode(): void {
    this.editMode = !this.editMode;
    if (!this.editMode) {
      this.populateForm();
    }
  }

  updateUser(): void {
    if (this.userForm.invalid) {
      this.snackBar.open('Please fill all required fields correctly', 'Close', {
        duration: 3000
      });
      return;
    }

    this.loading = true;
    this.userService.updateUser(this.userId, this.userForm.value).subscribe({
      next: (response) => {
        this.snackBar.open('User updated successfully!', 'Close', {
          duration: 3000,
          panelClass: ['success-snackbar']
        });
        this.editMode = false;
        this.loadUser();
      },
      error: (error) => {
        console.error('Error updating user:', error);
        this.snackBar.open(error.error?.message || 'Failed to update user', 'Close', {
          duration: 3000
        });
        this.loading = false;
      }
    });
  }

  changePassword(): void {
    if (this.passwordForm.invalid) {
      if (this.passwordForm.hasError('passwordMismatch')) {
        this.snackBar.open('Passwords do not match', 'Close', {
          duration: 3000
        });
      } else {
        this.snackBar.open('Please fill all password fields correctly', 'Close', {
          duration: 3000
        });
      }
      return;
    }

    this.loading = true;
    const newPassword = this.passwordForm.value.newPassword;
    
    this.userService.updateUser(this.userId, { password: newPassword }).subscribe({
      next: (response) => {
        this.snackBar.open('Password changed successfully!', 'Close', {
          duration: 3000,
          panelClass: ['success-snackbar']
        });
        this.passwordForm.reset();
        this.loading = false;
      },
      error: (error) => {
        console.error('Error changing password:', error);
        this.snackBar.open('Failed to change password', 'Close', {
          duration: 3000
        });
        this.loading = false;
      }
    });
  }

  deleteUser(): void {
    if (confirm(`Are you sure you want to delete this ${this.userType}? This action cannot be undone.`)) {
      this.loading = true;
      this.userService.deleteUser(this.userId).subscribe({
        next: () => {
          this.snackBar.open('User deleted successfully', 'Close', {
            duration: 3000
          });
          this.router.navigate([`/admin/${this.userType === 'employee' ? 'employees' : 'admins'}`]);
        },
        error: (error) => {
          console.error('Error deleting user:', error);
          this.snackBar.open(error.error?.message || 'Failed to delete user', 'Close', {
            duration: 3000
          });
          this.loading = false;
        }
      });
    }
  }

  goBack(): void {
    this.router.navigate([`/admin/${this.userType === 'employee' ? 'employees' : 'admins'}`]);
  }

  getStatusColor(status: string): string {
    const colors: any = {
      'pending': 'default',
      'assigned': 'primary',
      'in-progress': 'accent',
      'completed': 'success',
      'cancelled': 'warn'
    };
    return colors[status] || 'default';
  }

  getPriorityColor(priority: string): string {
    const colors: any = {
      'low': 'default',
      'medium': 'primary',
      'high': 'accent',
      'urgent': 'warn'
    };
    return colors[priority] || 'default';
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
