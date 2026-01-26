import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
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
    MatProgressSpinnerModule,
    MatSelectModule,
    MatFormFieldModule
  ],
  templateUrl: './dashboard-overview.component.html',
  styleUrls: ['./dashboard-overview.component.scss']
})
export class DashboardOverviewComponent implements OnInit {
  loading = true;
  loadingMonthly = false;
  stats: DashboardStats | null = null;
  monthlyStats: any = null;
  selectedMonths = 6;
  
  statusChart: any;
  priorityChart: any;
  monthlyOrdersChart: any;
  monthlyRevenueChart: any;
  serviceTypeChart: any;
  completionRateChart: any;

  statsCards = [
    { title: 'Total Orders', icon: 'assignment', color: '#667eea', value: 0 },
    { title: 'Recent Orders (7 days)', icon: 'new_releases', color: '#f093fb', value: 0 },
    { title: 'Completed This Month', icon: 'check_circle', color: '#4CAF50', value: 0 },
    { title: 'Active Employees', icon: 'people', color: '#FF9800', value: 0 }
  ];

  constructor(private orderService: OrderService) {}

  ngOnInit(): void {
    this.loadDashboardStats();
    this.loadMonthlyStats();
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

  loadMonthlyStats(): void {
    this.loadingMonthly = true;
    this.orderService.getMonthlyStats(this.selectedMonths).subscribe({
      next: (response) => {
        this.monthlyStats = response.data;
        setTimeout(() => {
          this.createMonthlyCharts();
        }, 100);
        this.loadingMonthly = false;
      },
      error: (error) => {
        console.error('Error loading monthly stats:', error);
        this.loadingMonthly = false;
      }
    });
  }

  onMonthsChange(months: number): void {
    this.selectedMonths = months;
    this.destroyMonthlyCharts();
    this.loadMonthlyStats();
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
    this.destroyMonthlyCharts();
  }

  destroyMonthlyCharts(): void {
    if (this.monthlyOrdersChart) {
      this.monthlyOrdersChart.destroy();
    }
    if (this.monthlyRevenueChart) {
      this.monthlyRevenueChart.destroy();
    }
    if (this.serviceTypeChart) {
      this.serviceTypeChart.destroy();
    }
    if (this.completionRateChart) {
      this.completionRateChart.destroy();
    }
  }

  createMonthlyCharts(): void {
    if (!this.monthlyStats) return;

    // Monthly Orders Trend Chart
    const monthlyOrdersCtx = document.getElementById('monthlyOrdersChart') as HTMLCanvasElement;
    if (monthlyOrdersCtx && this.monthlyStats.ordersPerMonth) {
      const months = this.monthlyStats.ordersPerMonth.map((item: any) => this.formatMonth(item.month));
      const orderCounts = this.monthlyStats.ordersPerMonth.map((item: any) => parseInt(item.count));
      
      const completedData = this.monthlyStats.completedPerMonth.map((item: any) => {
        return {
          month: item.month,
          count: parseInt(item.count)
        };
      });

      const completedCounts = months.map((month: string, idx: number) => {
        const monthKey = this.monthlyStats.ordersPerMonth[idx]?.month;
        const completed = completedData.find((c: any) => c.month === monthKey);
        return completed ? completed.count : 0;
      });

      this.monthlyOrdersChart = new Chart(monthlyOrdersCtx, {
        type: 'line',
        data: {
          labels: months,
          datasets: [
            {
              label: 'Total Orders',
              data: orderCounts,
              borderColor: '#667eea',
              backgroundColor: 'rgba(102, 126, 234, 0.1)',
              tension: 0.4,
              fill: true
            },
            {
              label: 'Completed Orders',
              data: completedCounts,
              borderColor: '#4CAF50',
              backgroundColor: 'rgba(76, 175, 80, 0.1)',
              tension: 0.4,
              fill: true
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'top'
            },
            title: {
              display: true,
              text: 'Monthly Orders Trend'
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

    // Monthly Revenue Chart
    const monthlyRevenueCtx = document.getElementById('monthlyRevenueChart') as HTMLCanvasElement;
    if (monthlyRevenueCtx && this.monthlyStats.revenuePerMonth && this.monthlyStats.revenuePerMonth.length > 0) {
      const months = this.monthlyStats.revenuePerMonth.map((item: any) => this.formatMonth(item.month));
      const revenue = this.monthlyStats.revenuePerMonth.map((item: any) => parseFloat(item.revenue || 0));

      this.monthlyRevenueChart = new Chart(monthlyRevenueCtx, {
        type: 'bar',
        data: {
          labels: months,
          datasets: [{
            label: 'Revenue (₹)',
            data: revenue,
            backgroundColor: '#f093fb',
            borderColor: '#c471ed',
            borderWidth: 1
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: false
            },
            title: {
              display: true,
              text: 'Monthly Revenue'
            }
          },
          scales: {
            y: {
              beginAtZero: true
            }
          }
        }
      });
    }

    // Service Type Distribution Chart
    const serviceTypeCtx = document.getElementById('serviceTypeChart') as HTMLCanvasElement;
    if (serviceTypeCtx && this.monthlyStats.serviceTypePerMonth) {
      // Aggregate service types across all months
      const serviceTypeMap = new Map<string, number>();
      this.monthlyStats.serviceTypePerMonth.forEach((item: any) => {
        const type = item.serviceType || 'Unknown';
        const count = parseInt(item.count);
        serviceTypeMap.set(type, (serviceTypeMap.get(type) || 0) + count);
      });

      const serviceTypes = Array.from(serviceTypeMap.keys());
      const serviceCounts = Array.from(serviceTypeMap.values());

      this.serviceTypeChart = new Chart(serviceTypeCtx, {
        type: 'pie',
        data: {
          labels: serviceTypes,
          datasets: [{
            data: serviceCounts,
            backgroundColor: [
              '#FF6384',
              '#36A2EB',
              '#FFCE56',
              '#4BC0C0',
              '#9966FF',
              '#FF9F40'
            ]
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'right'
            },
            title: {
              display: true,
              text: 'Service Type Distribution'
            }
          }
        }
      });
    }

    // Completion Rate Chart
    const completionRateCtx = document.getElementById('completionRateChart') as HTMLCanvasElement;
    if (completionRateCtx && this.monthlyStats.ordersPerMonth) {
      const months = this.monthlyStats.ordersPerMonth.map((item: any) => this.formatMonth(item.month));
      const completionRates = months.map((month: string, idx: number) => {
        const monthKey = this.monthlyStats.ordersPerMonth[idx]?.month;
        const totalOrders = parseInt(this.monthlyStats.ordersPerMonth[idx]?.count || 0);
        const completed = this.monthlyStats.completedPerMonth.find((c: any) => c.month === monthKey);
        const completedCount = completed ? parseInt(completed.count) : 0;
        return totalOrders > 0 ? Math.round((completedCount / totalOrders) * 100) : 0;
      });

      this.completionRateChart = new Chart(completionRateCtx, {
        type: 'line',
        data: {
          labels: months,
          datasets: [{
            label: 'Completion Rate (%)',
            data: completionRates,
            borderColor: '#4CAF50',
            backgroundColor: 'rgba(76, 175, 80, 0.2)',
            tension: 0.4,
            fill: true,
            pointRadius: 5,
            pointBackgroundColor: '#4CAF50'
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: false
            },
            title: {
              display: true,
              text: 'Monthly Completion Rate'
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              max: 100,
              ticks: {
                callback: function(value) {
                  return value + '%';
                }
              }
            }
          }
        }
      });
    }
  }

  formatMonth(monthStr: string): string {
    const [year, month] = monthStr.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  }
}
