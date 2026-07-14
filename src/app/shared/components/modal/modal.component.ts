import {
  Component, Input, Output, EventEmitter,
  ChangeDetectionStrategy, HostListener,
} from '@angular/core';
import { CommonModule } from '@angular/common';

type ModalSize = 'sm' | 'md' | 'lg';

@Component({
  selector: 'app-modal',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- Backdrop -->
    <div
      class="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      [attr.aria-modal]="true"
      [attr.aria-labelledby]="titleId"
    >
      <!-- Overlay -->
      <div
        class="absolute inset-0 bg-black/50 backdrop-blur-sm animate-modal-backdrop-enter"
        (click)="closeOnBackdrop && closed.emit()"
      ></div>

      <!-- Panel -->
      <div
        [class]="panelClasses"
        class="relative z-10 w-full rounded-lg shadow-lg animate-modal-enter overflow-hidden"
      >
        <!-- Header -->
        <div [class]="headerClasses">
          <h2 [id]="titleId" [class]="titleClasses">
            {{ title }}
          </h2>
          <button
            (click)="closed.emit()"
            [class]="closeButtonClasses"
            aria-label="Close modal"
          >
            <svg class="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z"/>
            </svg>
          </button>
        </div>

        <!-- Body -->
        <div class="px-6 py-5">
          <ng-content></ng-content>
        </div>

        <!-- Footer (optional) -->
        <ng-content select="[modal-footer]"></ng-content>
      </div>
    </div>
  `,
})
export class ModalComponent {
  @Input({ required: true }) title = '';
  @Input() size: ModalSize = 'md';
  @Input() closeOnBackdrop = true;
  /** true for admin (espresso/dark) surfaces — same convention as SkeletonComponent. */
  @Input() dark = false;
  @Output() closed = new EventEmitter<void>();

  private static counter = 0;
  readonly titleId = `modal-title-${++ModalComponent.counter}`;

  get panelClasses(): string {
    const sizes: Record<ModalSize, string> = {
      sm: 'max-w-sm',
      md: 'max-w-lg',
      lg: 'max-w-2xl',
    };
    const theme = this.dark ? 'bg-ad-surface' : 'bg-white';
    return [sizes[this.size], theme].join(' ');
  }

  get headerClasses(): string {
    const border = this.dark ? 'border-ad-border' : 'border-sf-border';
    return `flex items-center justify-between px-6 py-4 border-b ${border}`;
  }

  get titleClasses(): string {
    return `font-display text-lg font-semibold ${this.dark ? 'text-ad-text-1' : 'text-sf-text-1'}`;
  }

  get closeButtonClasses(): string {
    const theme = this.dark
      ? 'text-ad-text-3 hover:text-ad-text-1'
      : 'text-sf-text-3 hover:text-sf-text-1';
    return `${theme} transition-colors rounded-md p-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent`;
  }

  @HostListener('keydown.escape')
  onEsc(): void { this.closed.emit(); }
}
