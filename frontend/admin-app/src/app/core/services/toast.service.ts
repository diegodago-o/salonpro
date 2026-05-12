import { Injectable, signal } from '@angular/core';

export type ToastType = 'success' | 'error' | 'info';

export interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private _next = 0;
  private _toasts = signal<Toast[]>([]);
  readonly toasts = this._toasts.asReadonly();

  success(message: string, duration = 3500) { this._add(message, 'success', duration); }
  error(message: string, duration = 5000)   { this._add(message, 'error',   duration); }
  info(message: string,  duration = 3500)   { this._add(message, 'info',    duration); }

  dismiss(id: number) {
    this._toasts.update(list => list.filter(t => t.id !== id));
  }

  private _add(message: string, type: ToastType, duration: number) {
    const id = ++this._next;
    this._toasts.update(list => [...list, { id, message, type }]);
    setTimeout(() => this.dismiss(id), duration);
  }
}
