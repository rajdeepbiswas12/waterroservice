import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { RouterModule } from '@angular/router';
import { Chart, registerables } from 'chart.js';
import { OrderService } from '../../../services/order.service';
import { DashboardStats } from '../../../models/order.model';

Chart.register(...registerables);

@Component({
  selector: 'app-dashboard-overview',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './dashboard-overview.component.html',
  styleUrls: ['./dashboard-overview.component.scss']
})
export class DashboardOverviewComponent implements OnInit {
  loading = true;
  stats: DashboardStats | null = null;
  statusChart: any;
  priorityChart: any;

  statsCards = [
    { title: 'Total Orders', icon: 'assignment', color: '#667eea', value: 0 },
    { title: 'Recent Orders (7 days)', icon: 'new_releases', color: '#f093fb', value: 0 },
    { title: 'Completed This Month', icon: 'check_circle', color: '#4CAF50', value: 0 },
    { title: 'Active Employees', icon: 'people', color: '#FF9800', value: 0 }
  ];

  constructor(private orderService: OrderService) {}

  ngOnInit(): void {
    this.loadDashboardStats();
  }

  loadDashboardStats(): void {
    this.loading = true;
    this.orderService.getDashboardStats().subscribe({
      next: (response) => {
        this.stats = response.data;
        this.updateStatsCards();
        setTimeout(() => {
          this.createCharts();
        }, 100);
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading dashboard stats:', error);
        this.loading = false;
      }
    });
  }

  updateStatsCards(): void {
    if (this.stats) {
      this.statsCards[0].value = this.stats.totalOrders;
      this.statsCards[1].value = this.stats.recentOrders;
      this.statsCards[2].value = this.stats.completedThisMonth;
      this.statsCards[3].value = this.stats.activeEmployees;
    }
  }

  createCharts(): void {
    if (!this.stats) return;

    // Status Chart
    const statusCtx = document.getElementById('statusChart') as HTMLCanvasElement;
    if (statusCtx) {
      const statusLabels = this.stats.ordersByStatus.map(s => s.status.toUpperCase());
      const statusData = this.stats.ordersByStatus.map(s => s.count);

      this.statusChart = new Chart(statusCtx, {
        type: 'doughnut',
        data: {
          labels: statusLabels,
          datasets: [{
            data: statusData,
            backgroundColor: [
              '#FFC107',
              '#2196F3',
              '#FF9800',
              '#4CAF50',
              '#F44336'
            ]
          }]
        },
        options: {
          responsive: true,
          plugins: {
            legend: {
              position: 'bottom'
            },
            title: {
              display: true,
              text: 'Orders by Status'
            }
          }
        }
      });
    }

    // Priority Chart
    const priorityCtx = document.getElementById('priorityChart') as HTMLCanvasElement;
    if (priorityCtx) {
      const priorityLabels = this.stats.ordersByPriority.map(p => p.priority.toUpperCase());
      const priorityData = this.stats.ordersByPriority.map(p => p.count);

      this.priorityChart = new Chart(priorityCtx, {
        type: 'bar',
        data: {
          labels: priorityLabels,
          datasets: [{
            label: 'Orders',
            data: priorityData,
            backgroundColor: [
              '#4CAF50',
              '#2196F3',
              '#FF9800',
              '#F44336'
            ]
          }]
        },
        options: {
          responsive: true,
          plugins: {
            legend: {
              display: false
            },
            title: {
              display: true,
              text: 'Orders by Priority'
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                stepSize: 1
              }
            }
          }
        }
      });
    }
  }

  ngOnDestroy(): void {
    if (this.statusChart) {
      this.statusChart.destroy();
    }
    if (this.priorityChart) {
      this.priorityChart.destroy();
    }
  }
}
