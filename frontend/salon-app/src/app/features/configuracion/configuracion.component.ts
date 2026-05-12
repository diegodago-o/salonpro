import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IconComponent } from '../../shared/components/icon/icon.component';

type Tab = 'salon' | 'users' | 'commissions' | 'policies' | 'payments';

@Component({
  selector: 'app-configuracion',
  standalone: true,
  imports: [FormsModule, IconComponent],
  templateUrl: './configuracion.component.html',
  styleUrl: './configuracion.component.scss'
})
export class ConfiguracionComponent {
  readonly tab = signal<Tab>('salon');

  readonly salonForm = {
    nombre: 'Studio 54 Hair & Beauty',
    razonSocial: 'Estudio 54 SAS',
    direccion: 'Cra. 11 #93-07, Chapinero',
    ciudad: 'Bogotá',
    telefono: '+57 320 555 0154',
    nit: '900.123.456-7',
  };

  readonly policies = signal({
    descontarConsumoInterno: true,
    clienteObligatorio: false,
    editarPrecioEnPOS: true,
    imprimirReciboAuto: false,
  });

  togglePolicy(key: keyof ReturnType<typeof this.policies>): void {
    this.policies.update(p => ({ ...p, [key]: !p[key] }));
  }

  readonly tabs: { key: Tab; label: string; icon: string }[] = [
    { key: 'salon', label: 'Datos del salón', icon: 'building' },
    { key: 'users', label: 'Usuarios', icon: 'user' },
    { key: 'commissions', label: 'Comisiones', icon: 'sliders' },
    { key: 'policies', label: 'Políticas', icon: 'gear' },
    { key: 'payments', label: 'Métodos de pago', icon: 'card' },
  ];
}
