import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { CustomerService } from '../../../services/customer.service';
import { NotificationService } from '../../../services/notification.service';

@Component({
  selector: 'app-customer-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatIconModule
  ],
  templateUrl: './customer-form.component.html',
  styleUrls: ['./customer-form.component.css']
})
export class CustomerFormComponent implements OnInit {
  customerForm!: FormGroup;
  customerId: number | null = null;
  isEditMode = false;
  loading = false;

  constructor(
    private fb: FormBuilder,
    private customerService: CustomerService,
    private notificationService: NotificationService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.initForm();
    
    this.route.params.subscribe(params => {
      if (params['id'] && params['id'] !== 'new') {
        this.customerId = +params['id'];
        this.isEditMode = true;
        this.loadCustomer();
      }
    });
  }

  initForm(): void {
    this.customerForm = this.fb.group({
      name: ['', Validators.required],
      phone: ['', [Validators.required, Validators.pattern(/^[0-9]{10}$/)]],
      email: ['', [Validators.email]],
      alternatePhone: ['', [Validators.pattern(/^[0-9]{10}$/)]],
      address: ['', Validators.required],
      city: [''],
      state: [''],
      postalCode: [''],
      customerType: ['residential'],
      gstNumber: [''],
      notes: ['']
    });
  }

  loadCustomer(): void {
    this.loading = true;
    this.customerService.getCustomerById(this.customerId!).subscribe({
      next: (response) => {
        this.customerForm.patchValue(response.data);
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading customer:', error);
        this.notificationService.showError('Failed to load customer');
        this.loading = false;
      }
    });
  }

  onSubmit(): void {
    if (this.customerForm.invalid) {
      this.customerForm.markAllAsTouched();
      return;
    }

    this.loading = true;
    const formData = this.customerForm.value;

    const request = this.isEditMode
      ? this.customerService.updateCustomer(this.customerId!, formData)
      : this.customerService.createCustomer(formData);

    request.subscribe({
      next: () => {
        this.notificationService.showSuccess(
          `Customer ${this.isEditMode ? 'updated' : 'created'} successfully`
        );
        this.router.navigate(['/customers']);
      },
      error: (error) => {
        console.error('Error saving customer:', error);
        this.notificationService.showError(
          error.error?.message || 'Failed to save customer'
        );
        this.loading = false;
      }
    });
  }

  onCancel(): void {
    this.router.navigate(['/customers']);
  }

  getErrorMessage(fieldName: string): string {
    const control = this.customerForm.get(fieldName);
    if (control?.hasError('required')) {
      return 'This field is required';
    }
    if (control?.hasError('email')) {
      return 'Invalid email format';
    }
    if (control?.hasError('pattern')) {
      return 'Invalid format';
    }
    return '';
  }
}
