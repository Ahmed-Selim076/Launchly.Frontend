import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonComponent } from '../button/button.component';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [CommonModule, ButtonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-col items-center justify-center py-16 px-6 text-center">
      <div
        [class]="iconWrapClasses"
        class="w-16 h-16 rounded-xl flex items-center justify-center text-3xl mb-5 border"
        aria-hidden="true"
      >
        {{ icon }}
      </div>

      <h3 [class]="titleClasses">
        {{ title }}
      </h3>

      <p *ngIf="description" [class]="descriptionClasses">
        {{ description }}
      </p>

      <app-button
        *ngIf="actionLabel"
        variant="primary"
        (clicked)="actionClicked.emit()"
      >
        {{ actionLabel }}
      </app-button>
    </div>
  `,
})
export class EmptyStateComponent {
  @Input() icon        = '📭';
  @Input() title       = 'Nothing here yet';
  @Input() description = '';
  @Input() actionLabel = '';
  /** true for admin (espresso/dark) surfaces — same convention as SkeletonComponent. */
  @Input() dark = false;
  @Output() actionClicked = new EventEmitter<void>();

  get iconWrapClasses(): string {
    return this.dark ? 'bg-ad-surface border-ad-border' : 'bg-sf-surface border-sf-border';
  }

  get titleClasses(): string {
    return `font-display text-xl font-semibold mb-2 ${this.dark ? 'text-ad-text-1' : 'text-sf-text-1'}`;
  }

  get descriptionClasses(): string {
    return `text-sm max-w-sm mb-6 ${this.dark ? 'text-ad-text-3' : 'text-sf-text-3'}`;
  }
}
