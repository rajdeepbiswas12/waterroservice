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
    MatIconModule
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
      paidAmount: [0, [Validators.required, Validators.min(0)]],
      transactionId: [''],
      autoRenewal: [false],
      notes: ['']
    });
  }

  loadCustomers(): void {
    this.customerService.getAllCustomers(1, 1000, '', 'active').subscribe({
      next: (response) => {
        this.customers = response.data || response.customers || [];
      },
      error: (error) => {
        console.error('Error loading customers:', error);
        this.notificationService.showError('Failed to load customers');
      }
    });
  }

  loadPlans(): void {
    this.amcService.getAllPlans(true).subscribe({
      next: (response) => {
        this.plans = response.data || response.plans || [];
      },
      error: (error) => {
        console.error('Error loading plans:', error);
        this.notificationService.showError('Failed to load AMC plans');
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
      const gst = this.selectedPlan.gst || 18;
      const totalAmount = this.selectedPlan.price + (this.selectedPlan.price * gst / 100);
      
      // Update paid amount if payment is full
      if (this.subscriptionForm.get('paymentStatus')?.value === 'Paid') {
        this.subscriptionForm.patchValue({
          paidAmount: totalAmount
        });
      }
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
    return `${customer.name} - ${customer.phone}`;
  }

  getPlanDisplay(plan: AmcPlan): string {
    return `${plan.planName} - ₹${plan.price} (${plan.duration} months)`;
  }
}
