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
      name: ['', [Validators.required, Validators.minLength(2)]],
      phone: ['', [Validators.required, Validators.pattern(/^[0-9]{10}$/)]],
      email: [''],
      alternatePhone: ['', [Validators.pattern(/^[0-9]{10}$/)]],
      address: ['', [Validators.required, Validators.minLength(10)]],
      city: [''],
      state: [''],
      postalCode: ['', [Validators.pattern(/^[0-9]{6}$/)]],
      customerType: ['residential'],
      gstNumber: ['', [Validators.pattern(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/)]],
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
      this.notificationService.showError('Please fill all required fields correctly');
      return;
    }

    this.loading = true;
    const formData = { ...this.customerForm.value };

    // Clean empty email to prevent validation errors
    if (formData.email && !this.isValidEmail(formData.email)) {
      this.notificationService.showError('Please enter a valid email address');
      this.loading = false;
      return;
    }
    
    // Remove email if empty to avoid backend validation error
    if (!formData.email || formData.email.trim() === '') {
      delete formData.email;
    }
    
    // Remove empty optional fields
    if (!formData.alternatePhone || formData.alternatePhone.trim() === '') {
      delete formData.alternatePhone;
    }
    if (!formData.gstNumber || formData.gstNumber.trim() === '') {
      delete formData.gstNumber;
    }

    const request = this.isEditMode
      ? this.customerService.updateCustomer(this.customerId!, formData)
      : this.customerService.createCustomer(formData);

    request.subscribe({
      next: () => {
        this.notificationService.showSuccess(
          `Customer ${this.isEditMode ? 'updated' : 'created'} successfully`
        );
        this.router.navigate(['/admin/customers']);
      },
      error: (error) => {
        console.error('Error saving customer:', error);
        const errorMessage = error.error?.message || error.error?.error || 'Failed to save customer';
        this.notificationService.showError(errorMessage);
        this.loading = false;
      }
    });
  }

  isValidEmail(email: string): boolean {
    if (!email || email.trim() === '') return true; // Empty is valid
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  onCancel(): void {
    this.router.navigate(['/admin/customers']);
  }

  getErrorMessage(fieldName: string): string {
    const control = this.customerForm.get(fieldName);
    if (control?.hasError('required')) {
      return 'This field is required';
    }
    if (control?.hasError('email')) {
      return 'Invalid email format';
    }
    if (control?.hasError('minLength')) {
      const minLength = control.errors?.['minLength'].requiredLength;
      return `Minimum ${minLength} characters required`;
    }
    if (control?.hasError('pattern')) {
      if (fieldName === 'phone' || fieldName === 'alternatePhone') {
        return 'Please enter a valid 10-digit phone number';
      }
      if (fieldName === 'postalCode') {
        return 'Please enter a valid 6-digit PIN code';
      }
      if (fieldName === 'gstNumber') {
        return 'Invalid GST number format';
      }
      return 'Invalid format';
    }
    return '';
  }

  // Helper method to check if field should show error
  shouldShowError(fieldName: string): boolean {
    const control = this.customerForm.get(fieldName);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }
}
