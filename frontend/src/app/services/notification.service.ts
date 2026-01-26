import { Injectable } from '@angular/core';
import { MatSnackBar, MatSnackBarConfig } from '@angular/material/snack-bar';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  constructor(private snackBar: MatSnackBar) {}

  showSuccess(message: string, duration: number = 3000) {
    this.show(message, 'success-snackbar', duration);
  }

  showError(message: string, duration: number = 5000) {
    this.show(message, 'error-snackbar', duration);
  }

  showWarning(message: string, duration: number = 4000) {
    this.show(message, 'warning-snackbar', duration);
  }

  showInfo(message: string, duration: number = 3000) {
    this.show(message, 'info-snackbar', duration);
  }

  private show(message: string, panelClass: string, duration: number) {
    const config: MatSnackBarConfig = {
      duration: duration,
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: [panelClass]
    };
    
    this.snackBar.open(message, 'Close', config);
  }
}
