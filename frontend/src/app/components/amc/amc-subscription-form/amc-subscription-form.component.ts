import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { AmcService, AmcSubscription, AmcPlan } from '../../../services/amc.service';
import { CustomerService, Customer } from '../../../services/customer.service';
import { NotificationService } from '../../../services/notification.service';

@Component({
  selector: 'app-amc-subscription-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatCheckboxModule,
    MatProgressSpinnerModule,
    MatIconModule,
    MatChipsModule
  ],
  templateUrl: './amc-subscription-form.component.html',
  styleUrls: ['./amc-subscription-form.component.css']
})
export class AmcSubscriptionFormComponent implements OnInit {
  subscriptionForm!: FormGroup;
  isEditMode = false;
  subscriptionId?: number;
  loading = false;
  customers: Customer[] = [];
  plans: AmcPlan[] = [];
  selectedPlan?: AmcPlan;
  
  paymentModes = ['Cash', 'Card', 'UPI', 'Net Banking', 'Cheque'];
  paymentStatuses = ['Paid', 'Partial', 'Pending'];

  constructor(
    private fb: FormBuilder,
    private amcService: AmcService,
    private customerService: CustomerService,
    private notificationService: NotificationService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.initForm();
  }

  ngOnInit(): void {
    this.loadCustomers();
    this.loadPlans();
    
    this.subscriptionId = Number(this.route.snapshot.paramMap.get('id'));
    if (this.subscriptionId) {
      this.isEditMode = true;
      this.loadSubscription(this.subscriptionId);
    }

    // Listen for plan changes to calculate amounts
    this.subscriptionForm.get('planId')?.valueChanges.subscribe(planId => {
      this.onPlanChange(planId);
    });

    // Listen for payment amount changes to calculate balance
    this.subscriptionForm.get('paidAmount')?.valueChanges.subscribe(() => {
      this.calculateBalance();
    });
  }

  initForm(): void {
    this.subscriptionForm = this.fb.group({
      customerId: ['', Validators.required],
      planId: ['', Validators.required],
      startDate: [new Date(), Validators.required],
      paymentMode: ['', Validators.required],
      paymentStatus: ['Paid', Validators.required],
      paidAmount: [0, [Validators.required, Validators.min(0.01)]],
      transactionId: ['', Validators.maxLength(100)],
      autoRenewal: [false],
      notes: ['', Validators.maxLength(500)]
    });
  }

  loadCustomers(): void {
    this.customerService.getAllCustomers(1, 1000, '', 'active').subscribe({
      next: (response) => {
        console.log('Customers loaded:', response);
        this.customers = response.data || response.customers || [];
        console.log('Customers array:', this.customers.length);
      },
      error: (error) => {
        console.error('Error loading customers:', error);
        this.notificationService.showError('Failed to load customers');
        this.customers = [];
      }
    });
  }

  loadPlans(): void {
    this.amcService.getAllPlans(true).subscribe({
      next: (response) => {
        console.log('Plans loaded:', response);
        this.plans = response.data || response.plans || [];
        console.log('Plans array:', this.plans.length);
      },
      error: (error) => {
        console.error('Error loading plans:', error);
        this.notificationService.showError('Failed to load AMC plans');
        this.plans = [];
      }
    });
  }

  loadSubscription(id: number): void {
    this.loading = true;
    this.amcService.getSubscriptionById(id).subscribe({
      next: (response) => {
        const subscription = response.data || response.subscription;
        this.subscriptionForm.patchValue({
          customerId: subscription.customerId,
          planId: subscription.planId,
          startDate: new Date(subscription.startDate),
          paymentMode: subscription.paymentMode,
          paymentStatus: subscription.paymentStatus,
          paidAmount: subscription.paidAmount,
          transactionId: subscription.transactionId,
          autoRenewal: subscription.autoRenewal,
          notes: subscription.notes
        });
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading subscription:', error);
        this.notificationService.showError('Failed to load subscription');
        this.loading = false;
      }
    });
  }

  onPlanChange(planId: number): void {
    this.selectedPlan = this.plans.find(p => p.id === planId);
    if (this.selectedPlan) {
      // Calculate total amount including GST
      const totalAmount = this.getTotalAmount();
      
      // Update paid amount to full amount by default
      this.subscriptionForm.patchValue({
        paidAmount: totalAmount,
        paymentStatus: 'Paid'
      }, { emitEvent: false });
    }
  }

  calculateBalance(): void {
    if (this.selectedPlan) {
      const gst = this.selectedPlan.gst || 18;
      const totalAmount = this.selectedPlan.price + (this.selectedPlan.price * gst / 100);
      const paidAmount = this.subscriptionForm.get('paidAmount')?.value || 0;
      
      // Update payment status based on amount
      if (paidAmount >= totalAmount) {
        this.subscriptionForm.patchValue({ paymentStatus: 'Paid' }, { emitEvent: false });
      } else if (paidAmount > 0) {
        this.subscriptionForm.patchValue({ paymentStatus: 'Partial' }, { emitEvent: false });
      } else {
        this.subscriptionForm.patchValue({ paymentStatus: 'Pending' }, { emitEvent: false });
      }
    }
  }

  getTotalAmount(): number {
    if (this.selectedPlan) {
      const gst = this.selectedPlan.gst || 18;
      return this.selectedPlan.price + (this.selectedPlan.price * gst / 100);
    }
    return 0;
  }

  getBalanceAmount(): number {
    const total = this.getTotalAmount();
    const paid = this.subscriptionForm.get('paidAmount')?.value || 0;
    return Math.max(0, total - paid);
  }

  onSubmit(): void {
    if (this.subscriptionForm.valid) {
      this.loading = true;
      const formData = this.subscriptionForm.value;

      const subscription: AmcSubscription = {
        ...formData,
        startDate: new Date(formData.startDate)
      };

      const request = this.isEditMode
        ? this.amcService.updateSubscription(this.subscriptionId!, subscription)
        : this.amcService.createSubscription(subscription);

      request.subscribe({
        next: (response) => {
          this.notificationService.showSuccess(
            this.isEditMode ? 'Subscription updated successfully' : 'Subscription created successfully'
          );
          this.router.navigate(['/admin/amc/subscriptions']);
        },
        error: (error) => {
          console.error('Error saving subscription:', error);
          this.notificationService.showError(
            error.error?.message || 'Failed to save subscription'
          );
          this.loading = false;
        }
      });
    } else {
      this.notificationService.showError('Please fill all required fields');
      Object.keys(this.subscriptionForm.controls).forEach(key => {
        const control = this.subscriptionForm.get(key);
        if (control?.invalid) {
          control.markAsTouched();
        }
      });
    }
  }

  onCancel(): void {
    this.router.navigate(['/admin/amc/subscriptions']);
  }

  getCustomerDisplay(customer: Customer): string {
    return `${customer.name} - ${customer.phone}${customer.customerNumber ? ' (' + customer.customerNumber + ')' : ''}`;
  }

  getPlanDisplay(plan: AmcPlan): string {
    const gst = plan.gst || 18;
    const total = plan.price + (plan.price * gst / 100);
    return `${plan.planName} - ₹${total.toFixed(0)} (${plan.duration} months, ${plan.numberOfVisits} visits)`;
  }

  getEndDate(): Date | null {
    const startDate = this.subscriptionForm.get('startDate')?.value;
    if (startDate && this.selectedPlan) {
      const endDate = new Date(startDate);
      endDate.setMonth(endDate.getMonth() + this.selectedPlan.duration);
      return endDate;
    }
    return null;
  }

  getGSTAmount(): number {
    if (this.selectedPlan) {
      const gst = this.selectedPlan.gst || 18;
      return (this.selectedPlan.price * gst) / 100;
    }
    return 0;
  }

  getPaymentStatusColor(): string {
    const status = this.subscriptionForm.get('paymentStatus')?.value;
    switch(status) {
      case 'Paid': return 'success';
      case 'Partial': return 'warn';
      case 'Pending': return 'accent';
      default: return '';
    }
  }
}
