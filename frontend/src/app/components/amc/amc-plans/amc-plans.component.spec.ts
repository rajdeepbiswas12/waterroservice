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
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { of, throwError } from 'rxjs';

import { AmcPlansComponent } from './amc-plans.component';
import { AmcService, AmcPlan } from '../../../services/amc.service';
import { NotificationService } from '../../../services/notification.service';

describe('AmcPlansComponent', () => {
  let component: AmcPlansComponent;
  let fixture: ComponentFixture<AmcPlansComponent>;
  let amcService: jasmine.SpyObj<AmcService>;
  let notificationService: jasmine.SpyObj<NotificationService>;
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
    const notificationServiceSpy = jasmine.createSpyObj('NotificationService', [
      'showSuccess',
      'showError'
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
        MatCheckboxModule,
        MatProgressSpinnerModule,
        MatTooltipModule
      ],
      providers: [
        { provide: AmcService, useValue: amcServiceSpy },
        { provide: NotificationService, useValue: notificationServiceSpy },
        { provide: MatDialog, useValue: dialogSpy }
      ]
    }).compileComponents();

    amcService = TestBed.inject(AmcService) as jasmine.SpyObj<AmcService>;
    notificationService = TestBed.inject(NotificationService) as jasmine.SpyObj<NotificationService>;
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

  describe('Loading State', () => {
    it('should show loading spinner initially', () => {
      expect(component.loading).toBeTrue();
    });

    it('should hide loading spinner after data loads', () => {
      amcService.getAllPlans.and.returnValue(of({
        success: true,
        data: mockPlans
      }));

      fixture.detectChanges();
      expect(component.loading).toBeFalse();
    });

    it('should display loading spinner in template', () => {
      component.loading = true;
      fixture.detectChanges();
      
      const compiled = fixture.nativeElement;
      const spinner = compiled.querySelector('mat-spinner');
      expect(spinner).toBeTruthy();
    });

    it('should hide table when loading', () => {
      component.loading = true;
      fixture.detectChanges();
      
      const compiled = fixture.nativeElement;
      const table = compiled.querySelector('table');
      expect(table).toBeFalsy();
    });
  });

  describe('Empty State', () => {
    it('should show empty state when no plans exist', () => {
      amcService.getAllPlans.and.returnValue(of({
        success: true,
        data: []
      }));

      fixture.detectChanges();
      expect(component.dataSource.data.length).toBe(0);
      
      const compiled = fixture.nativeElement;
      const emptyState = compiled.querySelector('.empty-state');
      expect(emptyState).toBeTruthy();
    });

    it('should display empty state message', () => {
      amcService.getAllPlans.and.returnValue(of({
        success: true,
        data: []
      }));

      fixture.detectChanges();
      
      const compiled = fixture.nativeElement;
      const emptyMessage = compiled.querySelector('.empty-state h3');
      expect(emptyMessage?.textContent).toContain('No Plans Found');
    });

    it('should not show empty state when plans exist', () => {
      amcService.getAllPlans.and.returnValue(of({
        success: true,
        data: mockPlans
      }));

      fixture.detectChanges();
      
      const compiled = fixture.nativeElement;
      const emptyState = compiled.querySelector('.empty-state');
      expect(emptyState).toBeFalsy();
    });

    it('should show table when plans exist', () => {
      amcService.getAllPlans.and.returnValue(of({
        success: true,
        data: mockPlans
      }));

      fixture.detectChanges();
      
      const compiled = fixture.nativeElement;
      const table = compiled.querySelector('table');
      expect(table).toBeTruthy();
    });
  });

  describe('Error Handling', () => {
    it('should handle API error when loading plans', () => {
      amcService.getAllPlans.and.returnValue(
        throwError(() => new Error('API error'))
      );

      fixture.detectChanges();
      
      expect(notificationService.showError).toHaveBeenCalledWith(
        'Failed to load plans'
      );
      expect(component.loading).toBeFalse();
    });

    it('should handle create plan error', () => {
      const newPlan = {
        planName: 'Test Plan',
        serviceType: 'Basic',
        duration: 12,
        numberOfVisits: 4,
        price: 5000,
        gst: 18,
        description: 'Test',
        isActive: true
      };

      const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      dialogRefSpy.afterClosed.and.returnValue(of(newPlan));
      dialog.open.and.returnValue(dialogRefSpy);

      amcService.createPlan.and.returnValue(
        throwError(() => new Error('Create failed'))
      );

      amcService.getAllPlans.and.returnValue(of({
        success: true,
        data: []
      }));

      fixture.detectChanges();
      component.openDialog();

      dialogRefSpy.afterClosed().subscribe(() => {
        expect(notificationService.showError).toHaveBeenCalledWith(
          'Failed to create plan'
        );
      });
    });

    it('should handle update plan error', () => {
      const updatedPlan = { ...mockPlans[0] };

      const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      dialogRefSpy.afterClosed.and.returnValue(of(updatedPlan));
      dialog.open.and.returnValue(dialogRefSpy);

      amcService.updatePlan.and.returnValue(
        throwError(() => new Error('Update failed'))
      );

      amcService.getAllPlans.and.returnValue(of({
        success: true,
        data: mockPlans
      }));

      fixture.detectChanges();
      component.openDialog(mockPlans[0]);

      dialogRefSpy.afterClosed().subscribe(() => {
        expect(notificationService.showError).toHaveBeenCalledWith(
          'Failed to update plan'
        );
      });
    });
  });

  describe('Data Display', () => {
    beforeEach(() => {
      amcService.getAllPlans.and.returnValue(of({
        success: true,
        data: mockPlans
      }));
      fixture.detectChanges();
    });

    it('should display all plan columns', () => {
      const compiled = fixture.nativeElement;
      const headers = compiled.querySelectorAll('th');
      const headerTexts = Array.from(headers).map((h: any) => h.textContent.trim());
      
      expect(headerTexts).toContain('Plan Code');
      expect(headerTexts).toContain('Plan Name');
      expect(headerTexts).toContain('Service Type');
      expect(headerTexts).toContain('Duration');
      expect(headerTexts).toContain('Visits');
      expect(headerTexts).toContain('Price');
      expect(headerTexts).toContain('GST %');
      expect(headerTexts).toContain('Total');
      expect(headerTexts).toContain('Status');
      expect(headerTexts).toContain('Actions');
    });

    it('should display correct plan data', () => {
      expect(component.dataSource.data[0].planName).toBe('Gold Plan');
      expect(component.dataSource.data[0].price).toBe(5000);
      expect(component.dataSource.data[0].gst).toBe(18);
    });

    it('should display active status for active plans', () => {
      const compiled = fixture.nativeElement;
      const activeChips = compiled.querySelectorAll('.status-active');
      expect(activeChips.length).toBeGreaterThan(0);
    });
  });
