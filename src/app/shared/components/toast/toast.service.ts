import { Injectable, signal } from '@angular/core';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface IToast {
  id: number;
  type: ToastType;
  message: string;
  duration: number;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private counter = 0;
  readonly toasts = signal<IToast[]>([]);

  success(message: string, duration = 4000): void {
    this.#add({ type: 'success', message, duration });
  }

  error(message: string, duration = 5000): void {
    this.#add({ type: 'error', message, duration });
  }

  info(message: string, duration = 4000): void {
    this.#add({ type: 'info', message, duration });
  }

  warning(message: string, duration = 4500): void {
    this.#add({ type: 'warning', message, duration });
  }

  dismiss(id: number): void {
    this.toasts.update(ts => ts.filter(t => t.id !== id));
  }

  #add(partial: Omit<IToast, 'id'>): void {
    const toast: IToast = { ...partial, id: ++this.counter };
    this.toasts.update(ts => [...ts, toast]);
    setTimeout(() => this.dismiss(toast.id), toast.duration);
  }
}
