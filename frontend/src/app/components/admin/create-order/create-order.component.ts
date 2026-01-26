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
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { OrderService } from '../../../services/order.service';
import { UserService } from '../../../services/user.service';
import { CustomerService } from '../../../services/customer.service';
import { NotificationService } from '../../../services/notification.service';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { Observable, of } from 'rxjs';
// import { AddressAutocompleteComponent } from '../../shared/address-autocomplete/address-autocomplete.component'; // Commented out Google Maps integration

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
    MatAutocompleteModule,
    RouterModule
    // AddressAutocompleteComponent // Commented out Google Maps integration
  ],
  templateUrl: './create-order.component.html',
  styleUrls: ['./create-order.component.scss']
})
export class CreateOrderComponent implements OnInit {
  orderForm!: FormGroup;
  employees: any[] = [];
  customers: any[] = [];
  filteredCustomers: Observable<any[]> = of([]);
  selectedCustomer: any = null;
  loading = false;

  serviceTypes = ['Installation', 'Repair', 'Maintenance', 'Filter Change', 'AMC', 'Inspection'];
  priorities = ['low', 'medium', 'high', 'urgent'];

  constructor(
    private fb: FormBuilder,
    private orderService: OrderService,
    private userService: UserService,
    private customerService: CustomerService,
    private router: Router,
    private notificationService: NotificationService
  ) {}

  ngOnInit() {
    this.initForm();
    this.loadEmployees();
  }

  initForm() {
    this.orderForm = this.fb.group({
      customerId: ['', Validators.required],
      customerSearch: [''],
      serviceType: ['', Validators.required],
      priority: ['medium', Validators.required],
      description: [''],
      scheduledDate: [''],
      assignedToId: [''],
      notes: ['']
    });

    // Setup customer search autocomplete
    this.filteredCustomers = this.orderForm.get('customerSearch')!.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(value => {
        if (typeof value === 'string' && value.length >= 2) {
          return this.customerService.getAllCustomers(1, 10, value);
        }
        return of({ data: [] });
      }),
      switchMap(response => of(response.data || []))
    );
  }

  displayCustomer(customer: any): string {
    return customer ? `${customer.name} (${customer.phone})` : '';
  }

  onCustomerSelected(customer: any): void {
    this.selectedCustomer = customer;
    this.orderForm.patchValue({ customerId: customer.id });
  }

  clearCustomer(): void {
    this.selectedCustomer = null;
    this.orderForm.patchValue({ customerId: '', customerSearch: '' });
  }

  loadEmployees() {
    this.userService.getAvailableEmployees().subscribe({
      next: (response: any) => {
        this.employees = response.data || [];
      },
      error: (error) => {
        console.error('Error loading employees:', error);
        this.notificationService.showError('Failed to load employees: ' + error.message);
      }
    });
  }

  // Commented out Google Maps integration
  // onAddressSelected(addressData: any) {
  //   this.orderForm.patchValue({
  //     customerAddress: addressData.address,
  //     latitude: addressData.latitude,
  //     longitude: addressData.longitude,
  //     city: addressData.city,
  //     state: addressData.state,
  //     postalCode: addressData.postalCode
  //   });
  // }

  onSubmit() {
    if (this.orderForm.valid) {
      this.loading = true;
      
      const orderData = {
        ...this.orderForm.value,
        customerEmail: this.orderForm.value.customerEmail || null,
        // latitude: this.orderForm.value.latitude ? parseFloat(this.orderForm.value.latitude) : null, // Removed
        // longitude: this.orderForm.value.longitude ? parseFloat(this.orderForm.value.longitude) : null, // Removed
        scheduledDate: this.orderForm.value.scheduledDate ? new Date(this.orderForm.value.scheduledDate).toISOString() : null
      };

      this.orderService.createOrder(orderData).subscribe({
        next: (response) => {
          this.notificationService.showSuccess('Order created successfully!');
          this.router.navigate(['/admin/orders']);
        },
        error: (error) => {
          console.error('Error creating order:', error);
          this.notificationService.showError('Failed to create order: ' + (error.message || 'Unknown error'));
          this.loading = false;
        }
      });
    }
  }

  cancel() {
    this.router.navigate(['/admin/orders']);
  }
}
