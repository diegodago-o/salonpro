import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ConfirmService } from '../../services/confirm.service';

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (svc.config(); as cfg) {
      <div class="backdrop" (click)="svc.respond(false)">
        <div class="dialog" (click)="$event.stopPropagation()">
          <div class="dialog-icon" [class.danger]="cfg.danger">
            {{ cfg.danger ? '⚠️' : '❓' }}
          </div>
          <h3 class="dialog-title">{{ cfg.title }}</h3>
          <p class="dialog-msg">{{ cfg.message }}</p>
          <div class="dialog-footer">
            <button class="btn-cancel" (click)="svc.respond(false)">
              {{ cfg.cancelLabel ?? 'Cancelar' }}
            </button>
            <button
              class="btn-confirm"
              [class.danger]="cfg.danger"
              (click)="svc.respond(true)"
            >
              {{ cfg.confirmLabel ?? 'Confirmar' }}
            </button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .backdrop {
      position: fixed; inset: 0;
      background: rgba(0,0,0,0.5);
      display: flex; align-items: center; justify-content: center;
      z-index: 9998;
      animation: fade-in 0.15s ease;
    }
    @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }

    .dialog {
      background: #fff;
      border-radius: 16px;
      padding: 32px 28px 24px;
      width: 100%;
      max-width: 400px;
      text-align: center;
      box-shadow: 0 20px 60px rgba(0,0,0,0.25);
      animation: pop-in 0.2s ease;
    }
    @keyframes pop-in {
      from { transform: scale(0.92); opacity: 0; }
      to   { transform: scale(1);    opacity: 1; }
    }

    .dialog-icon {
      font-size: 40px;
      margin-bottom: 12px;
      line-height: 1;
    }
    .dialog-title {
      font-size: 18px;
      font-weight: 700;
      color: #1a1f2e;
      margin: 0 0 8px;
    }
    .dialog-msg {
      font-size: 14px;
      color: #6b7280;
      margin: 0 0 24px;
      line-height: 1.5;
    }
    .dialog-footer {
      display: flex;
      gap: 12px;
      justify-content: center;
    }
    .btn-cancel {
      flex: 1;
      padding: 10px 20px;
      background: #f3f4f6;
      color: #374151;
      border: none;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
    }
    .btn-cancel:hover { background: #e5e7eb; }

    .btn-confirm {
      flex: 1;
      padding: 10px 20px;
      background: #6c63ff;
      color: #fff;
      border: none;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
    }
    .btn-confirm:hover { background: #5a52d5; }
    .btn-confirm.danger { background: #ef4444; }
    .btn-confirm.danger:hover { background: #dc2626; }
  `]
})
export class ConfirmDialogComponent {
  constructor(public svc: ConfirmService) {}
}
