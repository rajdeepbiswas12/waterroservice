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
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-admin-management',
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
  templateUrl: './admin-management.component.html',
  styleUrls: ['./admin-management.component.scss']
})
export class AdminManagementComponent implements OnInit {
  admins: any[] = [];
  filteredAdmins: any[] = [];
  displayedColumns: string[] = ['name', 'email', 'phone', 'role', 'isActive', 'actions'];
  
  activeFilter = '';
  loading = false;
  currentUserId: number | undefined;

  constructor(
    private userService: UserService,
    private authService: AuthService
  ) {
    this.currentUserId = this.authService.currentUserValue?.id;
  }

  ngOnInit() {
    this.loadAdmins();
  }

  loadAdmins() {
    this.loading = true;
    this.userService.getUsers({ role: 'admin' }).subscribe({
      next: (response: any) => {
        this.admins = response.users || [];
        this.filteredAdmins = [...this.admins];
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading admins:', error);
        this.loading = false;
      }
    });
  }

  applyFilters() {
    this.filteredAdmins = this.admins.filter(admin => {
      const activeMatch = this.activeFilter === '' || 
                         (this.activeFilter === 'active' && admin.isActive) || 
                         (this.activeFilter === 'inactive' && !admin.isActive);
      return activeMatch;
    });
  }

  toggleActive(admin: any) {
    if (admin.id === this.currentUserId) {
      alert('You cannot deactivate your own account!');
      return;
    }

    this.userService.updateUser(admin.id, { isActive: !admin.isActive }).subscribe({
      next: () => {
        admin.isActive = !admin.isActive;
      },
      error: (error) => {
        console.error('Error updating admin:', error);
        alert('Failed to update admin status');
      }
    });
  }

  deleteAdmin(adminId: number) {
    if (adminId === this.currentUserId) {
      alert('You cannot delete your own account!');
      return;
    }

    if (confirm('Are you sure you want to delete this admin user?')) {
      this.userService.deleteUser(adminId).subscribe({
        next: () => {
          this.loadAdmins();
        },
        error: (error) => {
          console.error('Error deleting admin:', error);
          alert('Failed to delete admin: ' + (error.error?.message || 'Unknown error'));
        }
      });
    }
  }
}
