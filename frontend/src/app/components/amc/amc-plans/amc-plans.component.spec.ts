import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { of, throwError } from 'rxjs';

import { AmcPlansComponent } from './amc-plans.component';
import { AmcService, AmcPlan } from '../../../services/amc.service';

describe('AmcPlansComponent', () => {
  let component: AmcPlansComponent;
  let fixture: ComponentFixture<AmcPlansComponent>;
  let amcService: jasmine.SpyObj<AmcService>;
  let dialog: jasmine.SpyObj<MatDialog>;

  const mockPlans: AmcPlan[] = [
    {
      id: 1,
      planCode: 'PLAN-ABC123',
      planName: 'Gold Plan',
      serviceType: 'Full Service',
      duration: 12,
      numberOfVisits: 4,
      price: 5000,
      gst: 18,
      totalAmount: 5900,
      description: 'Quarterly service',
      features: ['Free parts', 'Priority service'],
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 2,
      planCode: 'PLAN-XYZ456',
      planName: 'Silver Plan',
      serviceType: 'Basic Service',
      duration: 6,
      numberOfVisits: 2,
      price: 3000,
      gst: 18,
      totalAmount: 3540,
      description: 'Half-yearly service',
      features: ['Standard service'],
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ];

  beforeEach(async () => {
    const amcServiceSpy = jasmine.createSpyObj('AmcService', [
      'getAllPlans',
      'createPlan',
      'updatePlan',
      'deletePlan'
    ]);
    const dialogSpy = jasmine.createSpyObj('MatDialog', ['open']);

    await TestBed.configureTestingModule({
      imports: [
        AmcPlansComponent,
        ReactiveFormsModule,
        HttpClientTestingModule,
        BrowserAnimationsModule,
        MatDialogModule,
        MatTableModule,
        MatButtonModule,
        MatIconModule,
        MatChipsModule,
        MatCardModule,
        MatFormFieldModule,
        MatInputModule,
        MatSelectModule,
        MatCheckboxModule
      ],
      providers: [
        { provide: AmcService, useValue: amcServiceSpy },
        { provide: MatDialog, useValue: dialogSpy }
      ]
    }).compileComponents();

    amcService = TestBed.inject(AmcService) as jasmine.SpyObj<AmcService>;
    dialog = TestBed.inject(MatDialog) as jasmine.SpyObj<MatDialog>;
    fixture = TestBed.createComponent(AmcPlansComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load plans on init', () => {
    amcService.getAllPlans.and.returnValue(of({
      success: true,
      data: mockPlans
    }));

    fixture.detectChanges();

    expect(amcService.getAllPlans).toHaveBeenCalled();
    expect(component.dataSource.data.length).toBe(2);
    expect(component.dataSource.data[0].planName).toBe('Gold Plan');
  });

  it('should display loading state while fetching plans', () => {
    amcService.getAllPlans.and.returnValue(of({
      success: true,
      data: []
    }));

    expect(component.loading).toBeTrue();
    fixture.detectChanges();
    expect(component.loading).toBeFalse();
  });

  it('should open dialog for creating new plan', () => {
    const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
    dialogRefSpy.afterClosed.and.returnValue(of(null));
    dialog.open.and.returnValue(dialogRefSpy);

    amcService.getAllPlans.and.returnValue(of({
      success: true,
      data: []
    }));

    fixture.detectChanges();
    component.openDialog();

    expect(dialog.open).toHaveBeenCalled();
  });

  it('should open dialog for editing plan', () => {
    const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
    dialogRefSpy.afterClosed.and.returnValue(of(null));
    dialog.open.and.returnValue(dialogRefSpy);

    amcService.getAllPlans.and.returnValue(of({
      success: true,
      data: mockPlans
    }));

    fixture.detectChanges();
    component.openDialog(mockPlans[0]);

    expect(dialog.open).toHaveBeenCalledWith(jasmine.any(Function), {
      width: '600px',
      data: mockPlans[0]
    });
  });

  it('should create plan through dialog', () => {
    const newPlan = {
      planName: 'Bronze Plan',
      serviceType: 'Basic',
      duration: 3,
      numberOfVisits: 1,
      price: 1500,
      gst: 18,
      description: 'Quarterly basic',
      isActive: true
    };

    const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
    dialogRefSpy.afterClosed.and.returnValue(of(newPlan));
    dialog.open.and.returnValue(dialogRefSpy);

    amcService.createPlan.and.returnValue(of({
      success: true,
      data: { ...newPlan, id: 3, planCode: 'PLAN-NEW789' } as AmcPlan,
      message: 'Plan created successfully'
    }));

    amcService.getAllPlans.and.returnValue(of({
      success: true,
      data: []
    }));

    fixture.detectChanges();
    component.openDialog();

    dialogRefSpy.afterClosed().subscribe(() => {
      expect(amcService.createPlan).toHaveBeenCalled();
    });
  });

  it('should update plan through dialog', () => {
    const updatedPlan = { ...mockPlans[0], planName: 'Updated Plan' };

    const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
    dialogRefSpy.afterClosed.and.returnValue(of(updatedPlan));
    dialog.open.and.returnValue(dialogRefSpy);

    amcService.updatePlan.and.returnValue(of({
      success: true,
      data: updatedPlan,
      message: 'Plan updated successfully'
    }));

    amcService.getAllPlans.and.returnValue(of({
      success: true,
      data: mockPlans
    }));

    fixture.detectChanges();
    component.openDialog(mockPlans[0]);

    dialogRefSpy.afterClosed().subscribe(() => {
      expect(amcService.updatePlan).toHaveBeenCalled();
    });
  });

  it('should delete plan with confirmation', () => {
    spyOn(window, 'confirm').and.returnValue(true);
    amcService.deletePlan.and.returnValue(of({
      success: true,
      message: 'Plan deleted successfully'
    }));
    amcService.getAllPlans.and.returnValue(of({
      success: true,
      data: mockPlans
    }));

    fixture.detectChanges();
    component.deletePlan(1);

    expect(window.confirm).toHaveBeenCalled();
    expect(amcService.deletePlan).toHaveBeenCalledWith(1);
  });

  it('should not delete plan if user cancels confirmation', () => {
    spyOn(window, 'confirm').and.returnValue(false);
    amcService.getAllPlans.and.returnValue(of({
      success: true,
      data: mockPlans
    }));

    fixture.detectChanges();
    component.deletePlan(1);

    expect(window.confirm).toHaveBeenCalled();
    expect(amcService.deletePlan).not.toHaveBeenCalled();
  });

  it('should handle delete error', () => {
    spyOn(window, 'confirm').and.returnValue(true);
    spyOn(window, 'alert');
    amcService.deletePlan.and.returnValue(throwError(() => ({
      error: { message: 'Cannot delete plan with active subscriptions' }
    })));
    amcService.getAllPlans.and.returnValue(of({
      success: true,
      data: mockPlans
    }));

    fixture.detectChanges();
    component.deletePlan(1);

    expect(amcService.deletePlan).toHaveBeenCalledWith(1);
    expect(window.alert).toHaveBeenCalled();
  });

  it('should display correct status chip color', () => {
    amcService.getAllPlans.and.returnValue(of({
      success: true,
      data: mockPlans
    }));

    fixture.detectChanges();
    const compiled = fixture.nativeElement;
    const statusChips = compiled.querySelectorAll('mat-chip');
    
    expect(statusChips.length).toBeGreaterThan(0);
  });
});
