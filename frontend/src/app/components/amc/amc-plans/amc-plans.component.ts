import { Component, OnInit, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatDialogModule, MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AmcService, AmcPlan } from '../../../services/amc.service';
import { NotificationService } from '../../../services/notification.service';

@Component({
  selector: 'app-amc-plan-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatCheckboxModule,
    MatIconModule
  ],
  template: `
    <div class="dialog-container">
      <h2 mat-dialog-title>
        <mat-icon class="title-icon">{{ data.id ? 'edit' : 'add_circle' }}</mat-icon>
        {{ data.id ? 'Edit' : 'Create New' }} AMC Plan
      </h2>
      
      <mat-dialog-content>
        <form [formGroup]="planForm" class="plan-form">
          <!-- Plan Details Section -->
          <div class="form-section">
            <h4 class="section-title">
              <mat-icon>info</mat-icon>
              Plan Details
            </h4>
            
            <mat-form-field class="w-100 mb-3" appearance="outline">
              <mat-label>Plan Name <span class="required">*</span></mat-label>
              <input matInput formControlName="planName" placeholder="e.g., Premium RO Care Plan" maxlength="100">
              <mat-icon matPrefix>label</mat-icon>
              <mat-error *ngIf="planForm.get('planName')?.hasError('required')">
                Plan name is required
              </mat-error>
              <mat-error *ngIf="planForm.get('planName')?.hasError('minlength')">
                Plan name must be at least 3 characters
              </mat-error>
              <mat-hint align="end">{{ planForm.get('planName')?.value?.length || 0 }}/100</mat-hint>
            </mat-form-field>

            <mat-form-field class="w-100 mb-3" appearance="outline">
              <mat-label>Service Type <span class="required">*</span></mat-label>
              <mat-select formControlName="serviceType">
                <mat-option value="RO Maintenance">
                  <mat-icon class="option-icon">water_drop</mat-icon>
                  RO Maintenance
                </mat-option>
                <mat-option value="Water Purifier Service">
                  <mat-icon class="option-icon">cleaning_services</mat-icon>
                  Water Purifier Service
                </mat-option>
                <mat-option value="Installation & Maintenance">
                  <mat-icon class="option-icon">build</mat-icon>
                  Installation & Maintenance
                </mat-option>
                <mat-option value="Filter Replacement">
                  <mat-icon class="option-icon">filter_alt</mat-icon>
                  Filter Replacement
                </mat-option>
                <mat-option value="Comprehensive Care">
                  <mat-icon class="option-icon">verified_user</mat-icon>
                  Comprehensive Care
                </mat-option>
              </mat-select>
              <mat-icon matPrefix>category</mat-icon>
              <mat-error *ngIf="planForm.get('serviceType')?.hasError('required')">
                Service type is required
              </mat-error>
            </mat-form-field>

            <mat-form-field class="w-100 mb-3" appearance="outline">
              <mat-label>Description (Optional)</mat-label>
              <textarea matInput formControlName="description" rows="3" 
                        placeholder="Describe what's included in this plan..."
                        maxlength="500"></textarea>
              <mat-icon matPrefix>description</mat-icon>
              <mat-hint align="end">{{ planForm.get('description')?.value?.length || 0 }}/500</mat-hint>
            </mat-form-field>
          </div>

          <!-- Plan Configuration Section -->
          <div class="form-section">
            <h4 class="section-title">
              <mat-icon>settings</mat-icon>
              Plan Configuration
            </h4>
            
            <div class="row">
              <div class="col-md-6">
                <mat-form-field class="w-100 mb-3" appearance="outline">
                  <mat-label>Duration (Months) <span class="required">*</span></mat-label>
                  <input matInput type="number" formControlName="duration" min="1" max="60">
                  <mat-icon matPrefix>schedule</mat-icon>
                  <mat-error *ngIf="planForm.get('duration')?.hasError('required')">
                    Duration is required
                  </mat-error>
                  <mat-error *ngIf="planForm.get('duration')?.hasError('min')">
                    Minimum 1 month required
                  </mat-error>
                  <mat-error *ngIf="planForm.get('duration')?.hasError('max')">
                    Maximum 60 months allowed
                  </mat-error>
                  <mat-hint>1-60 months</mat-hint>
                </mat-form-field>
              </div>
              
              <div class="col-md-6">
                <mat-form-field class="w-100 mb-3" appearance="outline">
                  <mat-label>Number of Visits <span class="required">*</span></mat-label>
                  <input matInput type="number" formControlName="numberOfVisits" min="1" max="100">
                  <mat-icon matPrefix>event_available</mat-icon>
                  <mat-error *ngIf="planForm.get('numberOfVisits')?.hasError('required')">
                    Number of visits is required
                  </mat-error>
                  <mat-error *ngIf="planForm.get('numberOfVisits')?.hasError('min')">
                    Minimum 1 visit required
                  </mat-error>
                  <mat-error *ngIf="planForm.get('numberOfVisits')?.hasError('max')">
                    Maximum 100 visits allowed
                  </mat-error>
                  <mat-hint>Total visits in plan period</mat-hint>
                </mat-form-field>
              </div>
            </div>
          </div>

          <!-- Pricing Section -->
          <div class="form-section">
            <h4 class="section-title">
              <mat-icon>payments</mat-icon>
              Pricing Details
            </h4>
            
            <div class="row">
              <div class="col-md-8">
                <mat-form-field class="w-100 mb-3" appearance="outline">
                  <mat-label>Base Price (₹) <span class="required">*</span></mat-label>
                  <input matInput type="number" formControlName="price" min="0" max="1000000" step="0.01">
                  <span matTextPrefix>₹&nbsp;</span>
                  <mat-icon matPrefix>currency_rupee</mat-icon>
                  <mat-error *ngIf="planForm.get('price')?.hasError('required')">
                    Price is required
                  </mat-error>
                  <mat-error *ngIf="planForm.get('price')?.hasError('min')">
                    Price must be greater than 0
                  </mat-error>
                  <mat-error *ngIf="planForm.get('price')?.hasError('max')">
                    Price cannot exceed ₹10,00,000
                  </mat-error>
                  <mat-hint>Enter amount without GST</mat-hint>
                </mat-form-field>
              </div>
              
              <div class="col-md-4">
                <mat-form-field class="w-100 mb-3" appearance="outline">
                  <mat-label>GST (%)</mat-label>
                  <input matInput type="number" formControlName="gst" min="0" max="100" step="0.01">
                  <span matTextSuffix>%</span>
                  <mat-icon matPrefix>receipt</mat-icon>
                  <mat-error *ngIf="planForm.get('gst')?.hasError('min')">
                    GST cannot be negative
                  </mat-error>
                  <mat-error *ngIf="planForm.get('gst')?.hasError('max')">
                    GST cannot exceed 100%
                  </mat-error>
                  <mat-hint>0-100%</mat-hint>
                </mat-form-field>
              </div>
            </div>

            <!-- Price Summary -->
            <div class="price-summary" *ngIf="planForm.get('price')?.value > 0">
              <div class="summary-row">
                <span class="label">Base Price:</span>
                <span class="value">₹{{ planForm.get('price')?.value | number:'1.2-2' }}</span>
              </div>
              <div class="summary-row" *ngIf="planForm.get('gst')?.value > 0">
                <span class="label">GST ({{ planForm.get('gst')?.value }}%):</span>
                <span class="value">₹{{ calculateGST() | number:'1.2-2' }}</span>
              </div>
              <div class="summary-row total">
                <span class="label">Total Amount:</span>
                <span class="value">₹{{ calculateTotal() | number:'1.2-2' }}</span>
              </div>
              <div class="summary-row per-visit">
                <span class="label">Per Visit Cost:</span>
                <span class="value">₹{{ calculatePerVisit() | number:'1.2-2' }}</span>
              </div>
            </div>
          </div>

          <!-- Status Section -->
          <div class="form-section status-section">
            <mat-checkbox formControlName="isActive" class="status-checkbox">
              <span class="checkbox-label">
                <mat-icon>{{ planForm.get('isActive')?.value ? 'check_circle' : 'cancel' }}</mat-icon>
                {{ planForm.get('isActive')?.value ? 'Plan is Active' : 'Plan is Inactive' }}
              </span>
            </mat-checkbox>
            <p class="status-hint">
              {{ planForm.get('isActive')?.value ? 'Customers can subscribe to this plan' : 'This plan will be hidden from customers' }}
            </p>
          </div>
        </form>
      </mat-dialog-content>
      
      <mat-dialog-actions align="end" class="dialog-actions">
        <button mat-stroked-button mat-dialog-close type="button">
          <mat-icon>close</mat-icon>
          Cancel
        </button>
        <button mat-raised-button color="primary" (click)="onSave()" 
                [disabled]="!planForm.valid || saving">
          <mat-icon *ngIf="!saving">{{ data.id ? 'save' : 'add' }}</mat-icon>
          <span *ngIf="!saving">{{ data.id ? 'Update Plan' : 'Create Plan' }}</span>
          <span *ngIf="saving">Saving...</span>
        </button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    .dialog-container {
      max-height: 90vh;
      display: flex;
      flex-direction: column;
    }

    h2[mat-dialog-title] {
      display: flex;
      align-items: center;
      gap: 12px;
      margin: 0;
      padding: 20px 24px;
      border-bottom: 2px solid #e0e0e0;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      font-size: 20px;
      font-weight: 600;
    }

    .title-icon {
      font-size: 28px;
      width: 28px;
      height: 28px;
    }

    mat-dialog-content {
      padding: 24px;
      overflow-y: auto;
      max-height: calc(90vh - 200px);
    }

    .plan-form {
      display: flex;
      flex-direction: column;
      gap: 24px;
    }

    .form-section {
      background: #f8f9fa;
      padding: 20px;
      border-radius: 8px;
      border-left: 4px solid #667eea;
    }

    .section-title {
      display: flex;
      align-items: center;
      gap: 8px;
      color: #667eea;
      font-size: 16px;
      font-weight: 600;
      margin: 0 0 16px 0;
      padding-bottom: 8px;
      border-bottom: 1px solid #e0e0e0;
    }

    .section-title mat-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
    }

    .required {
      color: #f44336;
      font-weight: bold;
    }

    .w-100 {
      width: 100%;
    }

    .mb-3 {
      margin-bottom: 16px;
    }

    .row {
      display: flex;
      gap: 16px;
      margin: 0 -8px;
    }

    .col-md-6, .col-md-4, .col-md-8 {
      padding: 0 8px;
    }

    .col-md-6 {
      flex: 0 0 50%;
    }

    .col-md-4 {
      flex: 0 0 33.333%;
    }

    .col-md-8 {
      flex: 0 0 66.667%;
    }

    .option-icon {
      vertical-align: middle;
      margin-right: 8px;
      font-size: 18px;
      width: 18px;
      height: 18px;
    }

    .price-summary {
      background: white;
      border: 2px solid #e0e0e0;
      border-radius: 8px;
      padding: 16px;
      margin-top: 16px;
    }

    .summary-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      font-size: 14px;
    }

    .summary-row.total {
      border-top: 2px solid #e0e0e0;
      margin-top: 8px;
      padding-top: 12px;
      font-weight: 600;
      font-size: 16px;
      color: #2e7d32;
    }

    .summary-row.per-visit {
      font-size: 13px;
      color: #666;
      border-top: 1px dashed #e0e0e0;
      margin-top: 4px;
      padding-top: 8px;
    }

    .status-section {
      background: #fff3e0;
      border-left-color: #ff9800;
    }

    .status-checkbox {
      display: flex;
      align-items: center;
    }

    .checkbox-label {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 16px;
      font-weight: 500;
    }

    .checkbox-label mat-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
    }

    .status-hint {
      margin: 8px 0 0 32px;
      font-size: 13px;
      color: #666;
    }

    .dialog-actions {
      padding: 16px 24px;
      border-top: 1px solid #e0e0e0;
      background: #fafafa;
      gap: 12px;
    }

    .dialog-actions button {
      min-width: 120px;
      height: 42px;
      font-weight: 500;
    }

    @media (max-width: 768px) {
      .row {
        flex-direction: column;
      }
      
      .col-md-6, .col-md-4, .col-md-8 {
        flex: 0 0 100%;
      }
    }
  `]
})
export class AmcPlanDialogComponent {
  planForm: FormGroup;
  saving = false;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<AmcPlanDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.planForm = this.fb.group({
      planName: [data?.planName || '', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
      serviceType: [data?.serviceType || '', Validators.required],
      duration: [data?.duration || 12, [Validators.required, Validators.min(1), Validators.max(60)]],
      numberOfVisits: [data?.numberOfVisits || 4, [Validators.required, Validators.min(1), Validators.max(100)]],
      price: [data?.price || 0, [Validators.required, Validators.min(0.01), Validators.max(1000000)]],
      gst: [data?.gst || 18, [Validators.min(0), Validators.max(100)]],
      description: [data?.description || '', Validators.maxLength(500)],
      isActive: [data?.isActive !== undefined ? data.isActive : true]
    });
  }

  calculateGST(): number {
    const price = this.planForm.get('price')?.value || 0;
    const gst = this.planForm.get('gst')?.value || 0;
    return (price * gst) / 100;
  }

  calculateTotal(): number {
    const price = this.planForm.get('price')?.value || 0;
    return price + this.calculateGST();
  }

  calculatePerVisit(): number {
    const total = this.calculateTotal();
    const visits = this.planForm.get('numberOfVisits')?.value || 1;
    return total / visits;
  }

  onSave(): void {
    if (this.planForm.valid) {
      this.saving = true;
      
      // Mark all fields as touched to show validation errors
      this.planForm.markAllAsTouched();
      
      if (this.planForm.invalid) {
        this.saving = false;
        return;
      }
      
      this.dialogRef.close(this.planForm.value);
    }
  }
}

@Component({
  selector: 'app-amc-plans',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatChipsModule,
    MatTooltipModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './amc-plans.component.html',
  styleUrls: ['./amc-plans.component.css']
})
export class AmcPlansComponent implements OnInit {
  plans: AmcPlan[] = [];
  displayedColumns: string[] = ['planCode', 'planName', 'serviceType', 'duration', 'numberOfVisits', 'price', 'isActive', 'actions'];
  loading = false;

  constructor(
    private amcService: AmcService,
    private notificationService: NotificationService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.loadPlans();
  }

  loadPlans(): void {
    this.loading = true;
    this.amcService.getAllPlans().subscribe({
      next: (response) => {
        this.plans = response.data;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading plans:', error);
        this.notificationService.showError('Failed to load AMC plans');
        this.loading = false;
      }
    });
  }

  openPlanDialog(plan?: AmcPlan): void {
    const dialogRef = this.dialog.open(AmcPlanDialogComponent, {
      width: '800px',
      maxWidth: '95vw',
      maxHeight: '90vh',
      disableClose: false,
      autoFocus: true,
      data: plan || {}
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.savePlan(result, plan?.id);
      }
    });
  }

  savePlan(planData: AmcPlan, id?: number): void {
    const request = id 
      ? this.amcService.updatePlan(id, planData)
      : this.amcService.createPlan(planData);

    request.subscribe({
      next: () => {
        this.notificationService.showSuccess(`Plan ${id ? 'updated' : 'created'} successfully`);
        this.loadPlans();
      },
      error: (error) => {
        console.error('Error saving plan:', error);
        this.notificationService.showError('Failed to save plan');
      }
    });
  }

  deletePlan(plan: AmcPlan): void {
    if (confirm(`Delete plan "${plan.planName}"?`)) {
      this.amcService.deletePlan(plan.id!).subscribe({
        next: () => {
          this.notificationService.showSuccess('Plan deleted successfully');
          this.loadPlans();
        },
        error: (error) => {
          this.notificationService.showError(error.error?.message || 'Failed to delete plan');
        }
      });
    }
  }
}
