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

@Component({
  selector: 'app-create-admin',
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
  templateUrl: './create-admin.component.html',
  styleUrls: ['./create-admin.component.scss']
})
export class CreateAdminComponent implements OnInit {
  adminForm!: FormGroup;
  loading = false;
  hidePassword = true;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    this.initForm();
  }

  initForm() {
    this.adminForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      phone: ['', [Validators.required, Validators.pattern(/^\+?[0-9]{10,15}$/)]],
      address: [''],
      role: ['admin', Validators.required]
    });
  }

  onSubmit() {
    if (this.adminForm.valid) {
      this.loading = true;
      
      this.authService.register(this.adminForm.value).subscribe({
        next: (response) => {
          alert('Admin created successfully!');
          this.router.navigate(['/admin/admins']);
        },
        error: (error) => {
          console.error('Error creating admin:', error);
          alert('Failed to create admin: ' + (error.message || 'Unknown error'));
          this.loading = false;
        }
      });
    }
  }

  cancel() {
    this.router.navigate(['/admin/admins']);
  }

  togglePasswordVisibility() {
    this.hidePassword = !this.hidePassword;
  }
}
