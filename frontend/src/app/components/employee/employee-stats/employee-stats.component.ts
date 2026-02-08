import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonModule } from '@angular/material/button';
import { Router } from '@angular/router';
import { OrderService } from '../../../services/order.service';

interface DashboardStats {
  daily: {
    assignments: number;
    completed: number;
  };
  monthly: {
    assignments: number;
    completed: number;
  };
  current: {
    active: number;
  };
  ordersByStatus: {
    [key: string]: number;
  };
}

@Component({
  selector: 'app-employee-stats',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatButtonModule
  ],
  templateUrl: './employee-stats.component.html',
  styleUrls: ['./employee-stats.component.scss']
})
export class EmployeeStatsComponent implements OnInit {
  stats: DashboardStats | null = null;
  loading = true;
  error = '';

  constructor(
    private orderService: OrderService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadStats();
  }

  loadStats(): void {
    this.loading = true;
    this.orderService.getEmployeeDashboardStats().subscribe({
      next: (response: any) => {
        this.stats = response;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading dashboard stats:', error);
        this.error = 'Failed to load dashboard statistics';
        this.loading = false;
      }
    });
  }

  navigateToOrders(): void {
    this.router.navigate(['/employee/orders']);
  }

  getStatusKeys(): string[] {
    return this.stats?.ordersByStatus ? Object.keys(this.stats.ordersByStatus) : [];
  }

  getStatusCount(status: string): number {
    return this.stats?.ordersByStatus[status] || 0;
  }

  getCompletionRate(type: 'daily' | 'monthly'): number {
    if (!this.stats) return 0;
    const stat = this.stats[type];
    if (stat.assignments === 0) return 0;
    return Math.round((stat.completed / stat.assignments) * 100);
  }
}
