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
    <h2 mat-dialog-title>{{ data.id ? 'Edit' : 'Create' }} AMC Plan</h2>
    <mat-dialog-content>
      <form [formGroup]="planForm">
        <mat-form-field class="w-100 mb-3">
          <mat-label>Plan Name *</mat-label>
          <input matInput formControlName="planName">
        </mat-form-field>

        <mat-form-field class="w-100 mb-3">
          <mat-label>Service Type *</mat-label>
          <input matInput formControlName="serviceType" placeholder="e.g., RO Maintenance">
        </mat-form-field>

        <div class="row">
          <div class="col-md-6">
            <mat-form-field class="w-100 mb-3">
              <mat-label>Duration (months) *</mat-label>
              <input matInput type="number" formControlName="duration">
            </mat-form-field>
          </div>
          <div class="col-md-6">
            <mat-form-field class="w-100 mb-3">
              <mat-label>Number of Visits *</mat-label>
              <input matInput type="number" formControlName="numberOfVisits">
            </mat-form-field>
          </div>
        </div>

        <div class="row">
          <div class="col-md-6">
            <mat-form-field class="w-100 mb-3">
              <mat-label>Price (₹) *</mat-label>
              <input matInput type="number" formControlName="price">
            </mat-form-field>
          </div>
          <div class="col-md-6">
            <mat-form-field class="w-100 mb-3">
              <mat-label>GST (%)</mat-label>
              <input matInput type="number" formControlName="gst">
            </mat-form-field>
          </div>
        </div>

        <mat-form-field class="w-100 mb-3">
          <mat-label>Description</mat-label>
          <textarea matInput formControlName="description" rows="3"></textarea>
        </mat-form-field>

        <mat-checkbox formControlName="isActive" class="mb-3">
          Active
        </mat-checkbox>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancel</button>
      <button mat-raised-button color="primary" (click)="onSave()" [disabled]="!planForm.valid">
        Save
      </button>
    </mat-dialog-actions>
  `
})
export class AmcPlanDialogComponent {
  planForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<AmcPlanDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.planForm = this.fb.group({
      planName: [data?.planName || '', Validators.required],
      serviceType: [data?.serviceType || '', Validators.required],
      duration: [data?.duration || 12, [Validators.required, Validators.min(1)]],
      numberOfVisits: [data?.numberOfVisits || 4, [Validators.required, Validators.min(1)]],
      price: [data?.price || 0, [Validators.required, Validators.min(0)]],
      gst: [data?.gst || 18],
      description: [data?.description || ''],
      isActive: [data?.isActive !== undefined ? data.isActive : true]
    });
  }

  onSave(): void {
    if (this.planForm.valid) {
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
    MatChipsModule
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
      width: '600px',
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
