import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-toast-container',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="toast-container">
      @for (toast of svc.toasts(); track toast.id) {
        <div class="toast" [class]="'toast-' + toast.type" (click)="svc.dismiss(toast.id)">
          <span class="toast-icon">
            @switch (toast.type) {
              @case ('success') { ✅ }
              @case ('error')   { ❌ }
              @case ('info')    { ℹ️ }
            }
          </span>
          <span class="toast-msg">{{ toast.message }}</span>
          <button class="toast-close">×</button>
        </div>
      }
    </div>
  `,
  styles: [`
    .toast-container {
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 9999;
      display: flex;
      flex-direction: column;
      gap: 10px;
      max-width: 360px;
      width: 100%;
      pointer-events: none;
    }
    .toast {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 12px 16px;
      border-radius: 10px;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      pointer-events: all;
      box-shadow: 0 4px 20px rgba(0,0,0,0.15);
      animation: slide-in 0.25s ease;
    }
    @keyframes slide-in {
      from { transform: translateX(110%); opacity: 0; }
      to   { transform: translateX(0);    opacity: 1; }
    }
    .toast-success { background: #d1fae5; color: #065f46; border: 1px solid #6ee7b7; }
    .toast-error   { background: #fee2e2; color: #991b1b; border: 1px solid #fca5a5; }
    .toast-info    { background: #eff6ff; color: #1e40af; border: 1px solid #93c5fd; }
    .toast-icon    { font-size: 16px; flex-shrink: 0; }
    .toast-msg     { flex: 1; }
    .toast-close   {
      background: none; border: none; font-size: 18px;
      cursor: pointer; opacity: 0.6; flex-shrink: 0;
      color: inherit; line-height: 1;
    }
    .toast-close:hover { opacity: 1; }
  `]
})
export class ToastContainerComponent {
  constructor(public svc: ToastService) {}
}
