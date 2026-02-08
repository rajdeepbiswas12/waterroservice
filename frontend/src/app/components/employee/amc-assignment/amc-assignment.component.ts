import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { debounceTime, distinctUntilChanged, switchMap, map } from 'rxjs/operators';
import { Observable, of } from 'rxjs';
import { AmcService } from '../../../services/amc.service';
import { CustomerService } from '../../../services/customer.service';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-amc-assignment',
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
    MatAutocompleteModule,
    MatProgressSpinnerModule,
    MatSnackBarModule
  ],
  templateUrl: './amc-assignment.component.html',
  styleUrls: ['./amc-assignment.component.scss']
})
export class AmcAssignmentComponent implements OnInit {
  assignmentForm!: FormGroup;
  amcPlans: any[] = [];
  filteredCustomers: Observable<any[]> = of([]);
  loading = false;
  submitting = false;
  selectedCustomer: any = null;
  selectedPlan: any = null;

  paymentModes = ['Cash', 'Card', 'UPI', 'Net Banking', 'Cheque'];

  constructor(
    private fb: FormBuilder,
    private amcService: AmcService,
    private customerService: CustomerService,
    private authService: AuthService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.loadAmcPlans();
    this.setupCustomerSearch();
  }

  initForm(): void {
    this.assignmentForm = this.fb.group({
      customerSearch: ['', Validators.required],
      planId: ['', Validators.required],
      startDate: [new Date(), Validators.required],
      paymentMode: ['', Validators.required],
      transactionId: [''],
      autoRenewal: [false],
      notes: ['']
    });
  }

  setupCustomerSearch(): void {
    this.filteredCustomers = this.assignmentForm.get('customerSearch')!.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(value => {
        if (typeof value === 'string' && value.length >= 2) {
          return this.customerService.getAllCustomers(1, 10, value).pipe(
            switchMap((response: any) => of(response.data || []))
          );
        }
        return of([]);
      })
    );
  }

  loadAmcPlans(): void {
    this.loading = true;
    this.amcService.getAllPlans(true).subscribe({
      next: (response: any) => {
        this.amcPlans = response.data || [];
        this.loading = false;
      },
      error: (error: any) => {
        console.error('Error loading AMC plans:', error);
        this.snackBar.open('Failed to load AMC plans', 'Close', { duration: 3000 });
        this.loading = false;
      }
    });
  }

  displayCustomer(customer: any): string {
    return customer ? `${customer.name} - ${customer.phone}` : '';
  }

  onCustomerSelected(customer: any): void {
    this.selectedCustomer = customer;
  }

  onPlanSelected(event: any): void {
    const planId = event.value;
    this.selectedPlan = this.amcPlans.find(p => p.id === planId);
  }

  calculateTotalAmount(): number {
    if (!this.selectedPlan) return 0;
    const price = Number(this.selectedPlan.price) || 0;
    const gstRate = Number(this.selectedPlan.gst) || 18;
    const gst = (price * gstRate) / 100;
    return price + gst;
  }

  calculateEndDate(): Date | null {
    if (!this.selectedPlan || !this.assignmentForm.get('startDate')?.value) return null;
    const startDate = new Date(this.assignmentForm.get('startDate')?.value);
    const endDate = new Date(startDate);
    const duration = Number(this.selectedPlan.duration) || 0;
    endDate.setMonth(endDate.getMonth() + duration);
    return endDate;
  }

  onSubmit(): void {
    if (this.assignmentForm.invalid || !this.selectedCustomer) {
      this.snackBar.open('Please fill all required fields', 'Close', { duration: 3000 });
      return;
    }

    this.submitting = true;
    const formData = {
      customerId: this.selectedCustomer.id,
      planId: this.assignmentForm.value.planId,
      startDate: this.assignmentForm.value.startDate,
      paymentMode: this.assignmentForm.value.paymentMode,
      transactionId: this.assignmentForm.value.transactionId,
      autoRenewal: this.assignmentForm.value.autoRenewal,
      notes: this.assignmentForm.value.notes
    };

    this.amcService.createSubscription(formData).subscribe({
      next: (response: any) => {
        this.snackBar.open('AMC subscription assigned successfully!', 'Close', {
          duration: 3000,
          panelClass: ['success-snackbar']
        });
        this.resetForm();
        this.submitting = false;
      },
      error: (error) => {
        console.error('Error assigning AMC:', error);
        this.snackBar.open(error.error?.message || 'Failed to assign AMC subscription', 'Close', {
          duration: 3000
        });
        this.submitting = false;
      }
    });
  }

  resetForm(): void {
    this.assignmentForm.reset();
    this.assignmentForm.patchValue({
      startDate: new Date(),
      autoRenewal: false
    });
    this.selectedCustomer = null;
    this.selectedPlan = null;
  }
}
