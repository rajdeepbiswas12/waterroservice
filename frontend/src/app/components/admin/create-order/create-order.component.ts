import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { OrderService } from '../../../services/order.service';
import { UserService } from '../../../services/user.service';
import { AddressAutocompleteComponent } from '../../shared/address-autocomplete/address-autocomplete.component';

@Component({
  selector: 'app-create-order',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatIconModule,
    MatDividerModule,
    RouterModule,
    AddressAutocompleteComponent
  ],
  templateUrl: './create-order.component.html',
  styleUrls: ['./create-order.component.scss']
})
export class CreateOrderComponent implements OnInit {
  orderForm!: FormGroup;
  employees: any[] = [];
  loading = false;

  serviceTypes = ['Installation', 'Repair', 'Maintenance', 'Filter Change', 'AMC', 'Inspection'];
  priorities = ['low', 'medium', 'high', 'urgent'];

  constructor(
    private fb: FormBuilder,
    private orderService: OrderService,
    private userService: UserService,
    private router: Router
  ) {}

  ngOnInit() {
    this.initForm();
    this.loadEmployees();
  }

  initForm() {
    this.orderForm = this.fb.group({
      customerName: ['', Validators.required],
      customerPhone: ['', [Validators.required, Validators.pattern(/^\+?[0-9]{10,15}$/)]],
      customerEmail: ['', [Validators.email]],
      customerAddress: ['', Validators.required],
      city: [''],
      state: [''],
      postalCode: [''],
      latitude: [''],
      longitude: [''],
      serviceType: ['', Validators.required],
      priority: ['medium', Validators.required],
      description: [''],
      scheduledDate: [''],
      assignedToId: [''],
      notes: ['']
    });
  }

  loadEmployees() {
    this.userService.getAvailableEmployees().subscribe({
      next: (response: any) => {
        this.employees = response.data || [];
      },
      error: (error) => {
        console.error('Error loading employees:', error);
        alert('Failed to load employees: ' + error.message);
      }
    });
  }

  onAddressSelected(addressData: any) {
    this.orderForm.patchValue({
      customerAddress: addressData.address,
      latitude: addressData.latitude,
      longitude: addressData.longitude,
      city: addressData.city,
      state: addressData.state,
      postalCode: addressData.postalCode
    });
  }

  onSubmit() {
    if (this.orderForm.valid) {
      this.loading = true;
      
      const orderData = {
        ...this.orderForm.value,
        customerEmail: this.orderForm.value.customerEmail || null,
        latitude: this.orderForm.value.latitude ? parseFloat(this.orderForm.value.latitude) : null,
        longitude: this.orderForm.value.longitude ? parseFloat(this.orderForm.value.longitude) : null,
        scheduledDate: this.orderForm.value.scheduledDate ? new Date(this.orderForm.value.scheduledDate).toISOString() : null
      };

      this.orderService.createOrder(orderData).subscribe({
        next: (response) => {
          alert('Order created successfully!');
          this.router.navigate(['/admin/orders']);
        },
        error: (error) => {
          console.error('Error creating order:', error);
          alert('Failed to create order: ' + (error.message || 'Unknown error'));
          this.loading = false;
        }
      });
    }
  }

  cancel() {
    this.router.navigate(['/admin/orders']);
  }
}
