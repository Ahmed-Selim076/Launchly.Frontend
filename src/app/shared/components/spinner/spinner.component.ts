import { Component, Input, ChangeDetectionStrategy } from '@angular/core';

type SpinnerSize = 'sm' | 'md' | 'lg';

@Component({
  selector: 'app-spinner',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span
      [class]="spinnerClasses"
      role="status"
      [attr.aria-label]="label"
    ></span>
  `,
})
export class SpinnerComponent {
  @Input() size: SpinnerSize = 'md';
  @Input() label = 'Loading…';
  @Input() dark  = false;

  get spinnerClasses(): string {
    const sizes: Record<SpinnerSize, string> = {
      sm: 'w-4 h-4 border-2',
      md: 'w-6 h-6 border-2',
      lg: 'w-10 h-10 border-[3px]',
    };

    const color = this.dark
      ? 'border-ad-text-3 border-t-accent-light'
      : 'border-sf-border-2 border-t-accent';

    return `inline-block rounded-full animate-spin ${sizes[this.size]} ${color}`;
  }
}
