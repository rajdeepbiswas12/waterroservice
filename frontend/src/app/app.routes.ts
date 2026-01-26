import { Routes } from '@angular/router';
import { AuthGuard } from './guards/auth.guard';
import { LoginComponent } from './components/login/login.component';
import { AdminDashboardComponent } from './components/admin/admin-dashboard/admin-dashboard.component';
import { DashboardOverviewComponent } from './components/admin/dashboard-overview/dashboard-overview.component';

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  {
    path: 'admin',
    component: AdminDashboardComponent,
    canActivate: [AuthGuard],
    data: { roles: ['admin'] },
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: DashboardOverviewComponent },
      // Additional routes can be lazy loaded
      // { path: 'orders', loadComponent: () => import('./components/admin/orders/orders.component') },
      // { path: 'employees', loadComponent: () => import('./components/admin/employees/employees.component') },
    ]
  },
  { path: '**', redirectTo: '/login' }
];
