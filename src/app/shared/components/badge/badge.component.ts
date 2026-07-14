import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info' | 'accent';

@Component({
  selector: 'app-badge',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span [class]="badgeClasses">
      <ng-content></ng-content>
    </span>
  `,
})
export class BadgeComponent {
  @Input() variant: BadgeVariant = 'default';
  @Input() dot = false;

  get badgeClasses(): string {
    const base = 'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium animate-badge-pop';

    const variants: Record<BadgeVariant, string> = {
      default: 'bg-sf-surface text-sf-text-2 border border-sf-border',
      success: 'bg-[var(--color-success-dim)] text-[var(--color-success)]',
      warning: 'bg-[var(--color-warning-dim)] text-[var(--color-warning)]',
      danger:  'bg-[var(--color-danger-dim)]  text-[var(--color-danger)]',
      info:    'bg-[var(--color-info-dim)]    text-[var(--color-info)]',
      accent:  'bg-accent-dim text-accent-dim-txt',
    };

    const dotColors: Record<BadgeVariant, string> = {
      default: 'bg-sf-text-3',
      success: 'bg-[var(--color-success)]',
      warning: 'bg-[var(--color-warning)]',
      danger:  'bg-[var(--color-danger)]',
      info:    'bg-[var(--color-info)]',
      accent:  'bg-accent',
    };

    return [base, variants[this.variant]].join(' ');
  }
}
