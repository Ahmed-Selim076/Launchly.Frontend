import {
  Component, Input, forwardRef, ChangeDetectionStrategy, signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

export interface ISelectOption<T = string> {
  label: string;
  value: T;
}

@Component({
  selector: 'app-select',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SelectComponent),
      multi: true,
    },
  ],
  template: `
    <div class="flex flex-col gap-1.5">
      <label *ngIf="label" [for]="selectId" [class]="labelClasses">
        {{ label }}
        <span *ngIf="required" class="text-[var(--color-danger)] ml-0.5" aria-hidden="true">*</span>
      </label>

      <select
        [id]="selectId"
        [disabled]="isDisabled()"
        [value]="value()"
        (change)="onChange($event)"
        (blur)="onTouched()"
        [class]="selectClasses"
        [class.border-[var(--color-danger)]]="!!error"
      >
        <option *ngIf="placeholder" value="" disabled selected>{{ placeholder }}</option>
        <option *ngFor="let opt of options" [value]="opt.value">{{ opt.label }}</option>
      </select>

      <p *ngIf="error" class="text-xs text-[var(--color-danger)]" role="alert">{{ error }}</p>
    </div>
  `,
})
export class SelectComponent implements ControlValueAccessor {
  @Input() label       = '';
  @Input() placeholder = 'Select…';
  @Input() options: ISelectOption[] = [];
  @Input() error    = '';
  @Input() required = false;
  /** true for admin (espresso/dark) surfaces — same convention as SkeletonComponent. */
  @Input() dark = false;

  get labelClasses(): string {
    return `text-sm font-medium ${this.dark ? 'text-ad-text-2' : 'text-sf-text-2'}`;
  }

  get selectClasses(): string {
    const base = [
      'w-full px-3.5 py-2.5 rounded-md text-base font-body',
      'transition-colors duration-[120ms]',
      'focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20',
      'disabled:opacity-50 disabled:cursor-not-allowed appearance-none',
    ];
    const theme = this.dark
      ? 'bg-ad-surface-2 border border-ad-border text-ad-text-1'
      : 'bg-sf-surface-2 border border-sf-border text-sf-text-1';
    return [...base, theme].join(' ');
  }

  private static counter = 0;
  readonly selectId = `lnch-select-${++SelectComponent.counter}`;

  readonly value      = signal<string>('');
  readonly isDisabled = signal(false);

  private _onChange: (v: string) => void = () => {};
  onTouched: () => void = () => {};

  writeValue(val: string): void { this.value.set(val ?? ''); }
  registerOnChange(fn: (v: string) => void): void  { this._onChange = fn; }
  registerOnTouched(fn: () => void): void           { this.onTouched = fn; }
  setDisabledState(disabled: boolean): void          { this.isDisabled.set(disabled); }

  onChange(event: Event): void {
    const val = (event.target as HTMLSelectElement).value;
    this.value.set(val);
    this._onChange(val);
  }
}
