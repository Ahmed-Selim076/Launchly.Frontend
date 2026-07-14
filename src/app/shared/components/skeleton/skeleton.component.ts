import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

type SkeletonVariant = 'text' | 'card' | 'table' | 'avatar' | 'custom';

@Component({
  selector: 'app-skeleton',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      [class]="skeletonClasses"
      [style.width]="width"
      [style.height]="height"
      role="status"
      aria-label="Loading…"
    ></div>
  `,
})
export class SkeletonComponent {
  @Input() variant: SkeletonVariant = 'text';
  @Input() width  = '';
  @Input() height = '';
  @Input() dark   = false; // true for admin (espresso) surfaces

  get skeletonClasses(): string {
    const base = [
      'skeleton-shimmer rounded',
      this.dark ? 'bg-ad-surface-2' : 'bg-sf-surface-2',
    ];

    const variants: Record<SkeletonVariant, string> = {
      text:   'h-4 w-full',
      card:   'h-48 w-full rounded-md',
      table:  'h-10 w-full rounded-sm',
      avatar: 'h-10 w-10 rounded-full',
      custom: '',
    };

    return [...base, variants[this.variant]].join(' ');
  }
}
