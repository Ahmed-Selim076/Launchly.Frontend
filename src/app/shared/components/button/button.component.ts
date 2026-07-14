import {
  Component, Input, Output, EventEmitter,
  ChangeDetectionStrategy, HostListener, ElementRef, inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type ButtonSize    = 'sm' | 'md' | 'lg';
type ButtonType    = 'button' | 'submit' | 'reset';

@Component({
  selector: 'app-button',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button
      [type]="type"
      [disabled]="disabled || loading"
      [class]="buttonClasses"
      (click)="!disabled && !loading && clicked.emit($event)"
      (mousemove)="onMouseMove($event)"
      (mouseleave)="onMouseLeave()"
    >
      <!-- Spinner -->
      <span
        *ngIf="loading"
        class="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2"
        aria-hidden="true"
      ></span>

      <ng-content></ng-content>
    </button>
  `,
})
export class ButtonComponent {
  @Input() variant: ButtonVariant = 'primary';
  @Input() size: ButtonSize = 'md';
  @Input() type: ButtonType = 'button';
  @Input() loading = false;
  @Input() disabled = false;
  @Input() fullWidth = false;
  @Input({ required: false }) magnetStrength = 4;
  /** true for admin (espresso/dark) surfaces. Only affects 'secondary' and 'ghost' —
   *  'primary' and 'danger' are already theme-neutral. Same convention as SkeletonComponent. */
  @Input() dark = false;

  @Output() clicked = new EventEmitter<MouseEvent>();

  private readonly el = inject(ElementRef);

  get buttonClasses(): string {
    const base = [
      'relative inline-flex items-center justify-center',
      'font-body font-medium rounded-md',
      'transition-all duration-[120ms] ease-[cubic-bezier(0.4,0,0.2,1)]',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2',
      'disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none',
      'select-none',
    ];

    const sizes: Record<ButtonSize, string> = {
      sm: 'px-3 py-1.5 text-sm gap-1.5',
      md: 'px-5 py-2.5 text-base gap-2',
      lg: 'px-7 py-3.5 text-lg gap-2.5',
    };

    const variants: Record<ButtonVariant, string> = {
      primary:
        'bg-accent text-white hover:bg-accent-hover shadow-accent/30 hover:shadow-accent active:scale-[0.98]',
      secondary: this.dark
        ? 'bg-ad-surface text-ad-text-1 border border-ad-border hover:bg-ad-surface-2 hover:border-ad-border-2'
        : 'bg-sf-surface text-sf-text-1 border border-sf-border hover:bg-sf-surface-2 hover:border-sf-border-2',
      ghost: this.dark
        ? 'bg-transparent text-ad-text-2 hover:bg-ad-surface hover:text-ad-text-1'
        : 'bg-transparent text-sf-text-2 hover:bg-sf-surface hover:text-sf-text-1',
      danger:
        'bg-[var(--color-danger)] text-white hover:opacity-90 active:scale-[0.98]',
    };

    return [
      ...base,
      sizes[this.size],
      variants[this.variant],
      this.fullWidth ? 'w-full' : '',
    ].filter(Boolean).join(' ');
  }

  // ─── Magnetic Hover ───────────────────────────────────────────────────────
  // Follows cursor ±magnetStrength px, springs back on leave.

  @HostListener('mousemove', ['$event'])
  onMouseMove(e: MouseEvent): void {
    if (this.disabled || this.loading) return;
    const rect   = (this.el.nativeElement as HTMLElement).getBoundingClientRect();
    const centerX = rect.left + rect.width  / 2;
    const centerY = rect.top  + rect.height / 2;
    const dx = ((e.clientX - centerX) / (rect.width  / 2)) * this.magnetStrength;
    const dy = ((e.clientY - centerY) / (rect.height / 2)) * this.magnetStrength;
    (this.el.nativeElement as HTMLElement).style.transform = `translate(${dx}px, ${dy}px)`;
  }

  @HostListener('mouseleave')
  onMouseLeave(): void {
    (this.el.nativeElement as HTMLElement).style.transform = '';
    (this.el.nativeElement as HTMLElement).style.transition =
      `transform 380ms cubic-bezier(0.34, 1.56, 0.64, 1)`;
  }
}
