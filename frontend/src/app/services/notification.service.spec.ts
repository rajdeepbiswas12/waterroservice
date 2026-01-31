import { TestBed } from '@angular/core/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { NotificationService } from './notification.service';

describe('NotificationService', () => {
  let service: NotificationService;
  let snackBarSpy: jasmine.SpyObj<MatSnackBar>;

  beforeEach(() => {
    const spy = jasmine.createSpyObj('MatSnackBar', ['open']);

    TestBed.configureTestingModule({
      providers: [
        NotificationService,
        { provide: MatSnackBar, useValue: spy }
      ]
    });

    service = TestBed.inject(NotificationService);
    snackBarSpy = TestBed.inject(MatSnackBar) as jasmine.SpyObj<MatSnackBar>;
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('showSuccess', () => {
    it('should show success notification with default duration', () => {
      const message = 'Operation successful';
      
      service.showSuccess(message);

      expect(snackBarSpy.open).toHaveBeenCalledWith(
        message,
        'Close',
        jasmine.objectContaining({
          duration: 3000,
          horizontalPosition: 'end',
          verticalPosition: 'top',
          panelClass: ['success-snackbar']
        })
      );
    });

    it('should show success notification with custom duration', () => {
      const message = 'Custom success';
      const duration = 5000;

      service.showSuccess(message, duration);

      expect(snackBarSpy.open).toHaveBeenCalledWith(
        message,
        'Close',
        jasmine.objectContaining({
          duration: 5000
        })
      );
    });
  });

  describe('showError', () => {
    it('should show error notification with default duration', () => {
      const message = 'An error occurred';

      service.showError(message);

      expect(snackBarSpy.open).toHaveBeenCalledWith(
        message,
        'Close',
        jasmine.objectContaining({
          duration: 5000,
          panelClass: ['error-snackbar']
        })
      );
    });

    it('should show error notification with custom duration', () => {
      const message = 'Critical error';
      const duration = 10000;

      service.showError(message, duration);

      expect(snackBarSpy.open).toHaveBeenCalledWith(
        message,
        'Close',
        jasmine.objectContaining({
          duration: 10000
        })
      );
    });
  });

  describe('showWarning', () => {
    it('should show warning notification with default duration', () => {
      const message = 'Warning message';

      service.showWarning(message);

      expect(snackBarSpy.open).toHaveBeenCalledWith(
        message,
        'Close',
        jasmine.objectContaining({
          duration: 4000,
          panelClass: ['warning-snackbar']
        })
      );
    });

    it('should show warning notification with custom duration', () => {
      const message = 'Important warning';
      const duration = 6000;

      service.showWarning(message, duration);

      expect(snackBarSpy.open).toHaveBeenCalledWith(
        message,
        'Close',
        jasmine.objectContaining({
          duration: 6000
        })
      );
    });
  });

  describe('showInfo', () => {
    it('should show info notification with default duration', () => {
      const message = 'Information message';

      service.showInfo(message);

      expect(snackBarSpy.open).toHaveBeenCalledWith(
        message,
        'Close',
        jasmine.objectContaining({
          duration: 3000,
          panelClass: ['info-snackbar']
        })
      );
    });

    it('should show info notification with custom duration', () => {
      const message = 'Detailed info';
      const duration = 7000;

      service.showInfo(message, duration);

      expect(snackBarSpy.open).toHaveBeenCalledWith(
        message,
        'Close',
        jasmine.objectContaining({
          duration: 7000
        })
      );
    });
  });

  it('should position notifications at top-end', () => {
    service.showSuccess('Test');

    expect(snackBarSpy.open).toHaveBeenCalledWith(
      'Test',
      'Close',
      jasmine.objectContaining({
        horizontalPosition: 'end',
        verticalPosition: 'top'
      })
    );
  });

  it('should include close button in all notifications', () => {
    service.showSuccess('Success');
    service.showError('Error');
    service.showWarning('Warning');
    service.showInfo('Info');

    expect(snackBarSpy.open).toHaveBeenCalledTimes(4);
    snackBarSpy.open.calls.all().forEach(call => {
      expect(call.args[1]).toBe('Close');
    });
  });
});
