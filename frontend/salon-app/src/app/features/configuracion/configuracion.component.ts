import { Component, signal, inject, OnInit } from '@angular/core';
import { toObservable, takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { map } from 'rxjs/operators';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { UserService, SalonUser, CreateUserRequest } from '../../core/services/user.service';
import { AuthService } from '../../core/services/auth.service';
import { BranchService } from '../../core/services/branch.service';
import { environment } from '../../../environments/environment';

interface PaymentMethod { id: number; name: string; hasDeduction: boolean; deductionPercent: number; isActive: boolean; }
interface ApiResp<T> { success: boolean; data: T; message: string; }

type Tab = 'salon' | 'users' | 'commissions' | 'policies' | 'payments';

@Component({
  selector: 'app-configuracion',
  standalone: true,
  imports: [FormsModule, CommonModule, IconComponent],
  templateUrl: './configuracion.component.html',
  styleUrl: './configuracion.component.scss'
})
export class ConfiguracionComponent implements OnInit {
  private readonly userSvc = inject(UserService);
  private readonly authSvc = inject(AuthService);
  private readonly branchSvc = inject(BranchService);
  private readonly http = inject(HttpClient);
  private readonly pmBase = `${environment.apiUrl}/payment-methods`;

  // ── Payment methods tab ────────────────────────────────
  readonly paymentMethods = signal<PaymentMethod[]>([]);
  readonly loadingPayments = signal(false);

  readonly tab = signal<Tab>('salon');

  // ── Users tab ──────────────────────────────────────────
  readonly users = signal<SalonUser[]>([]);
  readonly loadingUsers = signal(false);
  readonly showUserModal = signal(false);
  readonly saving = signal(false);
  readonly modalError = signal('');

  readonly userForm = signal<CreateUserRequest>({
    fullName: '', email: '', password: '', role: 'Cashier',
    branchId: null, branchName: null,
    documentType: null, documentNumber: null, phone: null,
    commissionPercent: 0, employeeCode: null
  });

  get branches() { return this.branchSvc.branches(); }

  // ── Salon form (static for now) ─────────────────────────
  readonly salonForm = {
    nombre: '', razonSocial: '', direccion: '', ciudad: '', telefono: '', nit: ''
  };

  readonly policies = signal({
    descontarConsumoInterno: true,
    clienteObligatorio: false,
    editarPrecioEnPOS: true,
    imprimirReciboAuto: false,
  });

  readonly tabs: { key: Tab; label: string; icon: string }[] = [
    { key: 'salon',       label: 'Datos del salón', icon: 'building' },
    { key: 'users',       label: 'Usuarios',         icon: 'user' },
    { key: 'commissions', label: 'Comisiones',        icon: 'sliders' },
    { key: 'policies',    label: 'Políticas',          icon: 'gear' },
    { key: 'payments',    label: 'Métodos de pago',   icon: 'card' },
  ];

  constructor() {
    // Reload users whenever the selected branch changes
    toObservable(this.branchSvc.selectedBranch)
      .pipe(takeUntilDestroyed())
      .subscribe(() => {
        if (this.tab() === 'users') this.loadUsers();
      });
  }

  ngOnInit(): void {
    this.loadUsers();
  }

  onTabChange(t: Tab) {
    this.tab.set(t);
    if (t === 'users') this.loadUsers();
    if (t === 'payments') this.loadPaymentMethods();
  }

  // ── Payment methods ─────────────────────────────────────
  loadPaymentMethods() {
    this.loadingPayments.set(true);
    this.http.get<ApiResp<PaymentMethod[]>>(`${this.pmBase}/all`).pipe(map(r => r.data))
      .subscribe({
        next: (m) => { this.paymentMethods.set(m); this.loadingPayments.set(false); },
        error: ()  => this.loadingPayments.set(false)
      });
  }

  seedPaymentMethods() {
    this.loadingPayments.set(true);
    this.http.post<ApiResp<void>>(`${this.pmBase}/seed`, {}).subscribe({
      next: () => this.loadPaymentMethods(),
      error: ()  => this.loadingPayments.set(false)
    });
  }

  togglePaymentMethod(m: PaymentMethod) {
    this.http.patch<ApiResp<PaymentMethod>>(`${this.pmBase}/${m.id}/toggle`, {}).pipe(map(r => r.data))
      .subscribe({
        next: (updated) => {
          this.paymentMethods.update(list => list.map(x => x.id === updated.id ? updated : x));
        }
      });
  }

  paymentIcon(name: string): string {
    const n = name.toLowerCase();
    if (n.includes('tarjeta')) return 'card';
    if (n.includes('nequi') || n.includes('daviplata') || n.includes('plata')) return 'phone';
    if (n.includes('transfer')) return 'transfer';
    return 'cash';
  }

  loadUsers() {
    this.loadingUsers.set(true);
    const branchId = this.branchSvc.currentBranchId;
    this.userSvc.getAll(undefined, branchId).subscribe({
      next: (u) => { this.users.set(u); this.loadingUsers.set(false); },
      error: ()  => this.loadingUsers.set(false)
    });
  }

  openCreate() {
    const branch = this.branchSvc.selectedBranch();
    this.userForm.set({
      fullName: '', email: '', password: '', role: 'Cashier',
      branchId: branch?.id ?? null,
      branchName: branch?.name ?? null,
      documentType: null, documentNumber: null, phone: null,
      commissionPercent: 0, employeeCode: null
    });
    this.modalError.set('');
    this.showUserModal.set(true);
  }

  closeModal() { this.showUserModal.set(false); }

  updateForm(field: keyof CreateUserRequest, value: any) {
    this.userForm.update(f => ({ ...f, [field]: value }));
  }

  onBranchSelect(id: string) {
    const b = this.branches.find(b => b.id === Number(id));
    this.userForm.update(f => ({ ...f, branchId: b?.id ?? null, branchName: b?.name ?? null }));
  }

  save() {
    const f = this.userForm();
    if (!f.fullName.trim() || !f.email.trim() || !f.password.trim()) {
      this.modalError.set('Nombre, correo y contraseña son obligatorios.');
      return;
    }
    this.saving.set(true);
    this.modalError.set('');
    this.userSvc.create(f).subscribe({
      next: (user) => {
        this.users.update(list => [...list, user]);
        this.saving.set(false);
        this.closeModal();
      },
      error: (err) => {
        this.saving.set(false);
        this.modalError.set(err.error?.message || 'Error al crear el usuario.');
      }
    });
  }

  toggle(u: SalonUser) {
    this.userSvc.toggle(u.id).subscribe({
      next: (res) => {
        this.users.update(list => list.map(x => x.id === u.id ? { ...x, isActive: res.isActive } : x));
      }
    });
  }

  roleLabel(role: string): string {
    const m: Record<string,string> = {
      TenantOwner: 'Dueño/a', Cashier: 'Cajero/a', Stylist: 'Estilista'
    };
    return m[role] ?? role;
  }

  togglePolicy(key: keyof ReturnType<typeof this.policies>): void {
    this.policies.update(p => ({ ...p, [key]: !p[key] }));
  }
}
