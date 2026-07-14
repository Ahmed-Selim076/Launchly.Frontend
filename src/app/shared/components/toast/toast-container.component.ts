import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService, IToast } from './toast.service';

@Component({
  selector: 'app-toast-container',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="fixed bottom-6 right-6 z-[9999] flex flex-col-reverse gap-3 pointer-events-none"
      aria-live="polite"
      aria-atomic="false"
    >
      @for (toast of toastService.toasts(); track toast.id) {
        <div
          class="pointer-events-auto flex items-start gap-3 px-4 py-3 rounded-md shadow-lg
                 max-w-sm w-full animate-toast-enter font-body text-sm"
          [class]="toastClasses(toast)"
          role="alert"
        >
          <!-- Icon -->
          <span class="text-lg leading-none mt-0.5 shrink-0" aria-hidden="true">
            {{ toastIcon(toast.type) }}
          </span>

          <!-- Message -->
          <p class="flex-1 leading-snug">{{ toast.message }}</p>

          <!-- Dismiss -->
          <button
            (click)="toastService.dismiss(toast.id)"
            class="shrink-0 opacity-60 hover:opacity-100 transition-opacity text-lg leading-none"
            aria-label="Dismiss"
          >×</button>
        </div>
      }
    </div>
  `,
})
export class ToastContainerComponent {
  readonly toastService = inject(ToastService);

  toastClasses(toast: IToast): string {
    const map = {
      success: 'bg-[var(--color-success-dim)] text-[var(--color-success)] border border-[var(--color-success)]/30',
      error:   'bg-[var(--color-danger-dim)]  text-[var(--color-danger)]  border border-[var(--color-danger)]/30',
      info:    'bg-[var(--color-info-dim)]    text-[var(--color-info)]    border border-[var(--color-info)]/30',
      warning: 'bg-[var(--color-warning-dim)] text-[var(--color-warning)] border border-[var(--color-warning)]/30',
    };
    return map[toast.type];
  }

  toastIcon(type: IToast['type']): string {
    const map = { success: '✓', error: '✕', info: 'ℹ', warning: '⚠' };
    return map[type];
  }
}
