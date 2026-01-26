import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipModule } from '@angular/material/chip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { OrderService } from '../../../services/order.service';
import { GoogleMapComponent } from '../../shared/google-map/google-map.component';

@Component({
  selector: 'app-track-order',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipModule,
    MatProgressSpinnerModule,
    MatDividerModule,
    MatTooltipModule,
    GoogleMapComponent
  ],
  templateUrl: './track-order.component.html',
  styleUrl: './track-order.component.scss'
})
export class TrackOrderComponent implements OnInit {
  order: any = null;
  loading = true;
  orderId!: number;
  orderHistory: any[] = [];

  statusConfig: any = {
    'pending': { color: 'warn', icon: 'schedule', label: 'Pending' },
    'assigned': { color: 'primary', icon: 'assignment_ind', label: 'Assigned' },
    'in-progress': { color: 'accent', icon: 'build', label: 'In Progress' },
    'completed': { color: 'primary', icon: 'check_circle', label: 'Completed' },
    'cancelled': { color: 'warn', icon: 'cancel', label: 'Cancelled' }
  };

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private orderService: OrderService
  ) {}

  ngOnInit() {
    this.orderId = Number(this.route.snapshot.paramMap.get('id'));
    this.loadOrder();
    
    // Auto-refresh every 30 seconds
    setInterval(() => this.loadOrder(), 30000);
  }

  loadOrder() {
    this.orderService.getOrder(this.orderId).subscribe({
      next: (response) => {
        this.order = response.data;
        this.orderHistory = response.data.history || [];
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading order:', error);
        this.loading = false;
      }
    });
  }

  getStatusInfo(status: string) {
    return this.statusConfig[status] || this.statusConfig['pending'];
  }

  getProgressPercentage(): number {
    if (!this.order) return 0;
    
    const statusProgress: any = {
      'pending': 0,
      'assigned': 25,
      'in-progress': 50,
      'completed': 100,
      'cancelled': 0
    };
    
    return statusProgress[this.order.status] || 0;
  }

  formatDate(date: string): string {
    if (!date) return 'N/A';
    return new Date(date).toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getTimelineIcon(status: string): string {
    const icons: any = {
      'pending': 'schedule',
      'assigned': 'assignment_ind',
      'in-progress': 'build',
      'completed': 'check_circle',
      'cancelled': 'cancel'
    };
    return icons[status] || 'circle';
  }

  refreshTracking() {
    this.loading = true;
    this.loadOrder();
  }
}
