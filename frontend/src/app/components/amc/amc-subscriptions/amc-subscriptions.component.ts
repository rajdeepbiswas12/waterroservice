import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AmcService, AmcSubscription } from '../../../services/amc.service';
import { NotificationService } from '../../../services/notification.service';

@Component({
  selector: 'app-amc-subscriptions',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatPaginatorModule,
    MatFormFieldModule,
    MatSelectModule,
    MatChipsModule,
    MatTooltipModule
  ],
  templateUrl: './amc-subscriptions.component.html',
  styleUrls: ['./amc-subscriptions.component.css']
})
export class AmcSubscriptionsComponent implements OnInit {
  subscriptions: AmcSubscription[] = [];
  displayedColumns: string[] = ['subscriptionNumber', 'customer', 'plan', 'startDate', 'endDate', 'status', 'visitsRemaining', 'actions'];
  
  totalSubscriptions = 0;
  pageSize = 10;
  pageIndex = 0;
  
  statusFilter = '';
  loading = false;

  constructor(
    private amcService: AmcService,
    private notificationService: NotificationService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadSubscriptions();
  }

  loadSubscriptions(): void {
    this.loading = true;
    const page = this.pageIndex + 1;
    
    this.amcService.getAllSubscriptions(page, this.pageSize, this.statusFilter)
      .subscribe({
        next: (response) => {
          this.subscriptions = response.data;
          this.totalSubscriptions = response.pagination.total;
          this.loading = false;
        },
        error: (error) => {
          console.error('Error loading subscriptions:', error);
          this.notificationService.showError('Failed to load subscriptions');
          this.loading = false;
        }
      });
  }

  onPageChange(event: PageEvent): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.loadSubscriptions();
  }

  onFilterChange(): void {
    this.pageIndex = 0;
    this.loadSubscriptions();
  }

  viewSubscription(subscription: AmcSubscription): void {
    this.router.navigate(['/admin/amc/subscriptions', subscription.id]);
  }

  cancelSubscription(subscription: AmcSubscription): void {
    const reason = prompt('Enter cancellation reason:');
    if (reason) {
      this.amcService.cancelSubscription(subscription.id!, reason).subscribe({
        next: () => {
          this.notificationService.showSuccess('Subscription cancelled successfully');
          this.loadSubscriptions();
        },
        error: (error) => {
          console.error('Error cancelling subscription:', error);
          this.notificationService.showError('Failed to cancel subscription');
        }
      });
    }
  }

  addSubscription(): void {
    this.router.navigate(['/admin/amc/subscriptions/new']);
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'active': return 'primary';
      case 'expired': return 'warn';
      case 'cancelled': return 'accent';
      case 'suspended': return 'warn';
      default: return '';
    }
  }

  formatDate(date: any): string {
    return date ? new Date(date).toLocaleDateString() : '-';
  }
}
