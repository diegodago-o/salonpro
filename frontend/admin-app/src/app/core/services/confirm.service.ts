import { Injectable, signal } from '@angular/core';

export interface ConfirmConfig {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  resolve: (value: boolean) => void;
}

@Injectable({ providedIn: 'root' })
export class ConfirmService {
  private _config = signal<ConfirmConfig | null>(null);
  readonly config = this._config.asReadonly();

  confirm(message: string, options?: Partial<Omit<ConfirmConfig, 'resolve'>>): Promise<boolean> {
    return new Promise(resolve => {
      this._config.set({
        title: options?.title ?? 'Confirmar acción',
        message,
        confirmLabel: options?.confirmLabel ?? 'Confirmar',
        cancelLabel: options?.cancelLabel ?? 'Cancelar',
        danger: options?.danger ?? false,
        resolve
      });
    });
  }

  respond(value: boolean) {
    const cfg = this._config();
    if (cfg) {
      this._config.set(null);
      cfg.resolve(value);
    }
  }
}
