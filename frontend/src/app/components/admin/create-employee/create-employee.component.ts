import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../../services/auth.service';
import { NotificationService } from '../../../services/notification.service';

@Component({
  selector: 'app-create-employee',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatIconModule,
    RouterModule
  ],
  templateUrl: './create-employee.component.html',
  styleUrls: ['./create-employee.component.scss']
})
export class CreateEmployeeComponent implements OnInit {
  employeeForm!: FormGroup;
  loading = false;
  hidePassword = true;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private notificationService: NotificationService
  ) {}

  ngOnInit() {
    this.initForm();
  }

  initForm() {
    this.employeeForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      phone: ['', [Validators.required, Validators.pattern(/^\+?[0-9]{10,15}$/)]],
      address: [''],
      role: ['employee', Validators.required]
    });
  }

  onSubmit() {
    if (this.employeeForm.valid) {
      this.loading = true;
      
      this.authService.register(this.employeeForm.value).subscribe({
        next: (response) => {
          this.notificationService.showSuccess('Employee created successfully!');
          this.router.navigate(['/admin/employees']);
        },
        error: (error) => {
          console.error('Error creating employee:', error);
          this.notificationService.showError('Failed to create employee: ' + (error.message || 'Unknown error'));
          this.loading = false;
        }
      });
    }
  }

  cancel() {
    this.router.navigate(['/admin/employees']);
  }

  togglePasswordVisibility() {
    this.hidePassword = !this.hidePassword;
  }
}
