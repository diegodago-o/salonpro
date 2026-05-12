import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () =>
      import('./features/auth/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: '',
    loadComponent: () =>
      import('./layout/shell/shell.component').then(m => m.ShellComponent),
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent)
      },
      {
        path: 'caja',
        loadComponent: () =>
          import('./features/caja/caja.component').then(m => m.CajaComponent)
      },
      {
        path: 'ventas',
        loadComponent: () =>
          import('./features/ventas/ventas.component').then(m => m.VentasComponent)
      },
      {
        path: 'clientes',
        loadComponent: () =>
          import('./features/clientes/clientes.component').then(m => m.ClientesComponent)
      },
      {
        path: 'servicios',
        loadComponent: () =>
          import('./features/servicios/servicios.component').then(m => m.ServiciosComponent)
      },
      {
        path: 'productos',
        loadComponent: () =>
          import('./features/productos/productos.component').then(m => m.ProductosComponent)
      },
      {
        path: 'anticipos',
        loadComponent: () =>
          import('./features/anticipos/anticipos.component').then(m => m.AnticiposComponent)
      },
      {
        path: 'liquidaciones',
        loadComponent: () =>
          import('./features/liquidaciones/liquidaciones.component').then(m => m.LiquidacionesComponent)
      },
      {
        path: 'reportes',
        loadComponent: () =>
          import('./features/reportes/reportes.component').then(m => m.ReportesComponent)
      },
      {
        path: 'historial',
        loadComponent: () =>
          import('./features/historial/historial.component').then(m => m.HistorialComponent)
      },
      {
        path: 'inventario',
        loadComponent: () =>
          import('./features/inventario/inventario.component').then(m => m.InventarioComponent)
      },
      {
        path: 'configuracion',
        loadComponent: () =>
          import('./features/configuracion/configuracion.component').then(m => m.ConfiguracionComponent)
      },
      {
        path: 'mi-resumen',
        loadComponent: () =>
          import('./features/mi-resumen/mi-resumen.component').then(m => m.MiResumenComponent)
      }
    ]
  },
  { path: '**', redirectTo: 'login' }
];
