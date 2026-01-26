import { Routes } from '@angular/router';
import { AuthGuard } from './guards/auth.guard';
import { LoginComponent } from './components/login/login.component';
import { AdminDashboardComponent } from './components/admin/admin-dashboard/admin-dashboard.component';
import { DashboardOverviewComponent } from './components/admin/dashboard-overview/dashboard-overview.component';
import { OrdersListComponent } from './components/admin/orders-list/orders-list.component';
import { CreateOrderComponent } from './components/admin/create-order/create-order.component';
import { EmployeesListComponent } from './components/admin/employees-list/employees-list.component';
import { CreateEmployeeComponent } from './components/admin/create-employee/create-employee.component';
import { AdminManagementComponent } from './components/admin/admin-management/admin-management.component';
import { CreateAdminComponent } from './components/admin/create-admin/create-admin.component';

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
      { path: 'orders', component: OrdersListComponent },
      { path: 'orders/create', component: CreateOrderComponent },
      { path: 'employees', component: EmployeesListComponent },
      { path: 'employees/create', component: CreateEmployeeComponent },
      { path: 'admins', component: AdminManagementComponent },
      { path: 'admins/create', component: CreateAdminComponent },
    ]
  },
  { path: '**', redirectTo: '/login' }
];
