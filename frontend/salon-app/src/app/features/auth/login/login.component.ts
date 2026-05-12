import { Component, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { IconComponent } from '../../../shared/components/icon/icon.component';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, IconComponent],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly step = signal<'login' | 'loading'>('login');
  readonly error = signal<string | null>(null);
  readonly loading = signal(false);

  readonly form = this.fb.group({
    email:    ['dueno@demo.com', [Validators.required, Validators.email]],
    password: ['Owner2026!', Validators.required],
  });

  submit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.loading.set(true);
    this.error.set(null);

    this.authService.login({
      email:    this.form.value.email!,
      password: this.form.value.password!,
    }).subscribe({
      next: (res) => {
        if (res.success) {
          this.router.navigate(['/dashboard']);
        } else {
          this.error.set(res.message ?? 'Credenciales inválidas');
          this.loading.set(false);
        }
      },
      error: () => {
        this.error.set('Error de conexión. Verifica que el servidor esté activo.');
        this.loading.set(false);
      }
    });
  }
}
