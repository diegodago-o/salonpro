import { Component, inject, signal } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

interface NavItem {
  label: string;
  icon: string;
  route: string;
  roles?: string[];
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard',     icon: '📊', route: '/dashboard' },
  { label: 'Caja',          icon: '🏧', route: '/caja' },
  { label: 'Ventas (POS)',  icon: '🛒', route: '/ventas' },
  { label: 'Clientes',      icon: '👤', route: '/clientes' },
  { label: 'Servicios',     icon: '✂',  route: '/servicios',   roles: ['TenantOwner'] },
  { label: 'Productos',     icon: '📦', route: '/productos',   roles: ['TenantOwner'] },
  { label: 'Anticipos',     icon: '💵', route: '/anticipos' },
  { label: 'Liquidaciones', icon: '📋', route: '/liquidaciones', roles: ['TenantOwner'] },
  { label: 'Reportes',      icon: '📈', route: '/reportes',    roles: ['TenantOwner'] },
];

@Component({
  selector: 'app-shell',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './shell.component.html',
  styleUrl: './shell.component.scss'
})
export class ShellComponent {
  private readonly authService = inject(AuthService);

  readonly user = this.authService.currentUser;
  readonly sidebarOpen = signal(true);
  readonly navItems = NAV_ITEMS;

  get visibleNavItems(): NavItem[] {
    const role = this.user()?.role;
    return this.navItems.filter(item =>
      !item.roles || (role && item.roles.includes(role))
    );
  }

  toggleSidebar(): void {
    this.sidebarOpen.update(v => !v);
  }

  logout(): void {
    this.authService.logout();
  }

  get userInitials(): string {
    const name = this.user()?.fullName ?? '';
    return name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
  }
}
