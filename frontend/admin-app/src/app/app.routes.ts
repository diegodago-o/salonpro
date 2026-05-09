import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { ShellComponent } from './layout/shell/shell.component';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () =>
      import('./features/auth/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: '',
    component: ShellComponent,
    canActivate: [authGuard],
    children: [
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent)
      },
      {
        path: 'tenants',
        loadComponent: () =>
          import('./features/tenants/tenants-list/tenants-list.component').then(m => m.TenantsListComponent)
      },
      {
        path: 'tenants/:id',
        loadComponent: () =>
          import('./features/tenants/tenant-detail/tenant-detail.component').then(m => m.TenantDetailComponent)
      },
      {
        path: 'plans',
        loadComponent: () =>
          import('./features/plans/plans-list/plans-list.component').then(m => m.PlansListComponent)
      },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
    ]
  },
  { path: '**', redirectTo: '' }
];
