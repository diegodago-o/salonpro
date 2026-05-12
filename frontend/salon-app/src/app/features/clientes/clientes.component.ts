import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { ClientesService } from '../../core/services/clientes.service';
import { Cliente, CreateClienteRequest } from '../../core/models/clientes.models';

type Vista = 'lista' | 'nuevo' | 'detalle';

@Component({
  selector: 'app-clientes',
  imports: [ReactiveFormsModule, CurrencyPipe, DatePipe],
  templateUrl: './clientes.component.html',
  styleUrl: './clientes.component.scss'
})
export class ClientesComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly clientesService = inject(ClientesService);

  readonly vista = signal<Vista>('lista');
  readonly clientes = signal<Cliente[]>([]);
  readonly clienteSeleccionado = signal<Cliente | null>(null);
  readonly filtro = signal('');
  readonly guardando = signal(false);
  readonly msg = signal<{ type: 'ok' | 'err'; text: string } | null>(null);

  readonly clientesFiltrados = computed(() => {
    const f = this.filtro().toLowerCase();
    if (!f) return this.clientes();
    return this.clientes().filter(c =>
      c.fullName.toLowerCase().includes(f) ||
      c.documentNumber.includes(f) ||
      c.phone.includes(f)
    );
  });

  readonly form = this.fb.group({
    documentType:   ['CC', Validators.required],
    documentNumber: ['', Validators.required],
    fullName:       ['', Validators.required],
    email:          ['', Validators.email],
    phone:          ['', Validators.required],
  });

  ngOnInit(): void {
    this.cargar();
  }

  private cargar(): void {
    this.clientesService.getClientes().subscribe(r => this.clientes.set(r.data));
  }

  abrirNuevo(): void {
    this.form.reset({ documentType: 'CC' });
    this.clienteSeleccionado.set(null);
    this.msg.set(null);
    this.vista.set('nuevo');
  }

  abrirDetalle(c: Cliente): void {
    this.clienteSeleccionado.set(c);
    this.form.patchValue({ ...c });
    this.msg.set(null);
    this.vista.set('detalle');
  }

  volver(): void { this.vista.set('lista'); }

  guardar(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.guardando.set(true);
    const req = this.form.value as CreateClienteRequest;
    const sel = this.clienteSeleccionado();

    const obs = sel
      ? this.clientesService.actualizarCliente(sel.id, req)
      : this.clientesService.crearCliente(req);

    obs.subscribe({
      next: () => {
        this.cargar();
        this.mostrarMsg('ok', sel ? 'Cliente actualizado' : 'Cliente creado');
        this.guardando.set(false);
        if (!sel) this.vista.set('lista');
      },
      error: () => {
        this.mostrarMsg('err', 'Error al guardar. Intenta de nuevo.');
        this.guardando.set(false);
      }
    });
  }

  private mostrarMsg(type: 'ok' | 'err', text: string): void {
    this.msg.set({ type, text });
    setTimeout(() => this.msg.set(null), 4000);
  }
}
