import {
  Component, Input, Output, EventEmitter, ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonComponent } from '../button/button.component';
import { ModalComponent } from '../modal/modal.component';

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [CommonModule, ButtonComponent, ModalComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-modal [title]="title" size="sm" [dark]="dark" (closed)="cancelled.emit()">
      <p [class]="messageClasses">{{ message }}</p>

      <div modal-footer [class]="footerClasses">
        <app-button variant="ghost" [dark]="dark" (clicked)="cancelled.emit()">Cancel</app-button>
        <app-button
          [variant]="dangerous ? 'danger' : 'primary'"
          [dark]="dark"
          [loading]="loading"
          (clicked)="confirmed.emit()"
        >
          {{ confirmLabel }}
        </app-button>
      </div>
    </app-modal>
  `,
})
export class ConfirmDialogComponent {
  @Input() title        = 'Are you sure?';
  @Input() message      = 'This action cannot be undone.';
  @Input() confirmLabel = 'Confirm';
  @Input() dangerous    = true;
  @Input() loading      = false;
  /** true for admin (espresso/dark) surfaces — same convention as SkeletonComponent. */
  @Input() dark = false;

  @Output() confirmed = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();

  get messageClasses(): string {
    return `text-sm leading-relaxed ${this.dark ? 'text-ad-text-2' : 'text-sf-text-2'}`;
  }

  get footerClasses(): string {
    const border = this.dark ? 'border-ad-border' : 'border-sf-border';
    return `flex items-center justify-end gap-3 px-6 py-4 border-t ${border}`;
  }
}
