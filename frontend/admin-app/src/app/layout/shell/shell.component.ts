import { Component, signal } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';
import { ToastContainerComponent } from '../../core/components/toast-container/toast-container.component';
import { ConfirmDialogComponent } from '../../core/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule, ToastContainerComponent, ConfirmDialogComponent],
  template: `
    <div class="shell">
      <!-- Sidebar -->
      <aside class="sidebar" [class.collapsed]="sidebarCollapsed()">
        <div class="sidebar-header">
          <div class="logo">
            <span class="logo-icon">✂️</span>
            @if (!sidebarCollapsed()) {
              <span class="logo-text">SalonPro</span>
            }
          </div>
          <button class="collapse-btn" (click)="toggleSidebar()">
            {{ sidebarCollapsed() ? '›' : '‹' }}
          </button>
        </div>

        <nav class="sidebar-nav">
          <a routerLink="/dashboard" routerLinkActive="active" class="nav-item">
            <span class="nav-icon">📊</span>
            @if (!sidebarCollapsed()) { <span>Dashboard</span> }
          </a>
          <a routerLink="/tenants" routerLinkActive="active" class="nav-item">
            <span class="nav-icon">🏪</span>
            @if (!sidebarCollapsed()) { <span>Salones</span> }
          </a>
          <a routerLink="/plans" routerLinkActive="active" class="nav-item">
            <span class="nav-icon">📋</span>
            @if (!sidebarCollapsed()) { <span>Planes</span> }
          </a>
        </nav>

        <div class="sidebar-footer">
          @if (!sidebarCollapsed()) {
            <div class="user-info">
              <div class="user-name">{{ auth.user()?.fullName }}</div>
              <div class="user-role">{{ auth.user()?.role }}</div>
            </div>
          }
          <button class="logout-btn" (click)="auth.logout()" title="Cerrar sesión">🚪</button>
        </div>
      </aside>

      <!-- Main content -->
      <main class="main-content">
        <router-outlet />
      </main>
    </div>

    <!-- Global overlays -->
    <app-toast-container />
    <app-confirm-dialog />
  `,
  styles: [`
    .shell { display: flex; height: 100vh; background: #f4f6f9; }

    .sidebar {
      width: 240px; min-height: 100vh; background: #1a1f2e;
      display: flex; flex-direction: column; transition: width 0.25s ease;
      position: relative; z-index: 10;
    }
    .sidebar.collapsed { width: 64px; }

    .sidebar-header {
      display: flex; align-items: center; justify-content: space-between;
      padding: 20px 16px; border-bottom: 1px solid #2d3448;
    }
    .logo { display: flex; align-items: center; gap: 10px; overflow: hidden; }
    .logo-icon { font-size: 22px; flex-shrink: 0; }
    .logo-text { color: #fff; font-size: 18px; font-weight: 700; white-space: nowrap; }
    .collapse-btn {
      background: none; border: none; color: #8892a4; cursor: pointer;
      font-size: 20px; padding: 4px 8px; border-radius: 4px; flex-shrink: 0;
    }
    .collapse-btn:hover { background: #2d3448; color: #fff; }

    .sidebar-nav { flex: 1; padding: 16px 8px; display: flex; flex-direction: column; gap: 4px; }
    .nav-item {
      display: flex; align-items: center; gap: 12px; padding: 10px 12px;
      color: #8892a4; text-decoration: none; border-radius: 8px;
      transition: all 0.2s; white-space: nowrap; overflow: hidden;
    }
    .nav-item:hover { background: #2d3448; color: #fff; }
    .nav-item.active { background: #6c63ff; color: #fff; }
    .nav-icon { font-size: 18px; flex-shrink: 0; }

    .sidebar-footer {
      padding: 16px; border-top: 1px solid #2d3448;
      display: flex; align-items: center; justify-content: space-between; gap: 8px;
    }
    .user-info { overflow: hidden; }
    .user-name { color: #fff; font-size: 13px; font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .user-role { color: #8892a4; font-size: 11px; }
    .logout-btn {
      background: none; border: none; cursor: pointer; font-size: 18px;
      padding: 6px; border-radius: 6px; flex-shrink: 0;
    }
    .logout-btn:hover { background: #2d3448; }

    .main-content { flex: 1; overflow-y: auto; padding: 24px; }
  `]
})
export class ShellComponent {
  sidebarCollapsed = signal(false);
  constructor(public auth: AuthService) {}
  toggleSidebar() { this.sidebarCollapsed.update(v => !v); }
}
