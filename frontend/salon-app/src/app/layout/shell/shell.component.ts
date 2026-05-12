import { Component, computed, inject, signal } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { IconComponent } from '../../shared/components/icon/icon.component';

interface NavItem { id: string; label: string; icon: string; route: string; roles?: string[]; badge?: string; }

const NAV_OWNER: NavItem[] = [
  { id:'dashboard',      label:'Dashboard',       icon:'home',     route:'/dashboard' },
  { id:'ventas',         label:'Punto de venta',  icon:'pos',      route:'/ventas' },
  { id:'historial',      label:'Historial',        icon:'history',  route:'/historial' },
  { id:'servicios',      label:'Servicios',        icon:'scissors', route:'/servicios' },
  { id:'inventario',     label:'Inventario',       icon:'box',      route:'/inventario', badge:'Stock bajo' },
  { id:'liquidaciones',  label:'Liquidaciones',    icon:'wallet',   route:'/liquidaciones' },
  { id:'caja',           label:'Caja',             icon:'cash',     route:'/caja' },
  { id:'reportes',       label:'Reportes',         icon:'chart',    route:'/reportes' },
  { id:'configuracion',  label:'Configuración',    icon:'gear',     route:'/configuracion' },
];

const NAV_CASHIER: NavItem[] = [
  { id:'ventas',         label:'Punto de venta',  icon:'pos',      route:'/ventas' },
  { id:'historial',      label:'Historial',        icon:'history',  route:'/historial' },
  { id:'inventario',     label:'Inventario',       icon:'box',      route:'/inventario' },
  { id:'caja',           label:'Caja',             icon:'cash',     route:'/caja' },
];

const NAV_STYLIST: NavItem[] = [
  { id:'mi-resumen',     label:'Mi resumen',       icon:'home',     route:'/mi-resumen' },
];

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, IconComponent],
  templateUrl: './shell.component.html',
  styleUrl: './shell.component.scss'
})
export class ShellComponent {
  private readonly authService = inject(AuthService);
  readonly user = this.authService.currentUser;

  readonly navItems = computed<NavItem[]>(() => {
    const role = this.user()?.role ?? '';
    if (role === 'TenantOwner') return NAV_OWNER;
    if (role === 'Cashier') return NAV_CASHIER;
    if (role === 'Stylist') return NAV_STYLIST;
    return NAV_OWNER;
  });

  get userInitials(): string {
    return (this.user()?.fullName ?? '').split(' ').slice(0,2).map((w:string) => w[0]).join('').toUpperCase();
  }

  get avatarColor(): string {
    const colors = ['oklch(0.45 0.10 30)','oklch(0.55 0.07 25)','oklch(0.50 0.09 115)','oklch(0.50 0.16 250)'];
    const idx = (this.user()?.id ?? 0) % colors.length;
    return colors[idx];
  }

  logout(): void { this.authService.logout(); }
}
