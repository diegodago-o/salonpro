import { Component, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, CommonModule],
  template: `
    <div class="login-page">
      <div class="login-card">
        <div class="login-logo">
          <span class="logo-icon">✂️</span>
          <span class="logo-text">SalonPro</span>
        </div>
        <h2 class="login-title">Panel de Administración</h2>

        @if (error()) {
          <div class="alert-error">{{ error() }}</div>
        }

        <form (ngSubmit)="submit()" #f="ngForm">
          <div class="field">
            <label for="email">Correo electrónico</label>
            <input
              id="email"
              type="email"
              [(ngModel)]="email"
              name="email"
              placeholder="admin@salonpro.com.co"
              required
              autocomplete="username"
            />
          </div>
          <div class="field">
            <label for="password">Contraseña</label>
            <input
              id="password"
              type="password"
              [(ngModel)]="password"
              name="password"
              placeholder="••••••••"
              required
              autocomplete="current-password"
            />
          </div>
          <button type="submit" class="btn-login" [disabled]="loading() || !f.valid">
            @if (loading()) {
              <span class="spinner"></span> Ingresando…
            } @else {
              Iniciar sesión
            }
          </button>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .login-page {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #1a1f2e 0%, #2d3448 100%);
    }
    .login-card {
      background: #fff;
      border-radius: 16px;
      padding: 40px;
      width: 100%;
      max-width: 400px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
    }
    .login-logo {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      margin-bottom: 8px;
    }
    .logo-icon { font-size: 32px; }
    .logo-text { font-size: 26px; font-weight: 800; color: #1a1f2e; }
    .login-title {
      text-align: center;
      font-size: 15px;
      color: #8892a4;
      margin: 0 0 28px;
      font-weight: 400;
    }
    .alert-error {
      background: #fef2f2;
      border: 1px solid #fecaca;
      color: #b91c1c;
      border-radius: 8px;
      padding: 10px 14px;
      font-size: 13px;
      margin-bottom: 16px;
    }
    .field { margin-bottom: 18px; }
    .field label {
      display: block;
      font-size: 13px;
      font-weight: 600;
      color: #374151;
      margin-bottom: 6px;
    }
    .field input {
      width: 100%;
      padding: 10px 14px;
      border: 1.5px solid #e5e7eb;
      border-radius: 8px;
      font-size: 14px;
      outline: none;
      transition: border-color 0.2s;
      box-sizing: border-box;
    }
    .field input:focus { border-color: #6c63ff; }
    .btn-login {
      width: 100%;
      padding: 12px;
      background: #6c63ff;
      color: #fff;
      border: none;
      border-radius: 8px;
      font-size: 15px;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.2s;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      margin-top: 4px;
    }
    .btn-login:hover:not(:disabled) { background: #5a52d5; }
    .btn-login:disabled { opacity: 0.65; cursor: not-allowed; }
    .spinner {
      width: 16px; height: 16px;
      border: 2px solid rgba(255,255,255,0.4);
      border-top-color: #fff;
      border-radius: 50%;
      animation: spin 0.7s linear infinite;
      display: inline-block;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
  `]
})
export class LoginComponent {
  email = '';
  password = '';
  loading = signal(false);
  error = signal('');

  constructor(private auth: AuthService, private router: Router) {}

  submit() {
    this.loading.set(true);
    this.error.set('');
    this.auth.login({ email: this.email, password: this.password }).subscribe({
      next: () => this.router.navigate(['/dashboard']),
      error: (err) => {
        this.error.set(err.error?.message || 'Credenciales incorrectas. Intenta de nuevo.');
        this.loading.set(false);
      }
    });
  }
}
