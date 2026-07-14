import {
  Component, Input, forwardRef, ChangeDetectionStrategy, signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-input',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => InputComponent),
      multi: true,
    },
  ],
  template: `
    <div class="flex flex-col gap-1.5">
      <label
        *ngIf="label"
        [for]="inputId"
        [class]="labelClasses"
      >
        {{ label }}
        <span *ngIf="required" class="text-[var(--color-danger)] ml-0.5" aria-hidden="true">*</span>
      </label>

      <div class="relative">
        <input
          [id]="inputId"
          [type]="type"
          [placeholder]="placeholder"
          [disabled]="isDisabled()"
          [value]="value()"
          [attr.autocomplete]="autocomplete"
          [attr.aria-invalid]="!!error"
          [attr.aria-describedby]="error ? inputId + '-error' : hint ? inputId + '-hint' : null"
          (input)="onInput($event)"
          (blur)="onTouched()"
          [class]="inputClasses"
          [class.border-[var(--color-danger)]]="!!error"
          [class.focus:ring-[var(--color-danger-dim)]]="!!error"
        />
      </div>

      <p
        *ngIf="error"
        [id]="inputId + '-error'"
        class="text-xs text-[var(--color-danger)] flex items-center gap-1"
        role="alert"
      >
        {{ error }}
      </p>

      <p
        *ngIf="hint && !error"
        [id]="inputId + '-hint'"
        [class]="hintClasses"
      >
        {{ hint }}
      </p>
    </div>
  `,
})
export class InputComponent implements ControlValueAccessor {
  @Input() label    = '';
  @Input() type     = 'text';
  @Input() error    = '';
  @Input() hint     = '';
  @Input() placeholder = '';
  @Input() required = false;
  @Input() autocomplete = '';
  /** true for admin (espresso/dark) surfaces — same convention as SkeletonComponent. */
  @Input() dark = false;

  get labelClasses(): string {
    return `text-sm font-medium ${this.dark ? 'text-ad-text-2' : 'text-sf-text-2'}`;
  }

  get inputClasses(): string {
    const base = [
      'w-full px-3.5 py-2.5 rounded-md text-base font-body',
      'transition-colors duration-[120ms]',
      'focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20',
      'disabled:opacity-50 disabled:cursor-not-allowed',
    ];
    const theme = this.dark
      ? 'bg-ad-surface-2 border border-ad-border text-ad-text-1 placeholder:text-ad-text-3'
      : 'bg-sf-surface-2 border border-sf-border text-sf-text-1 placeholder:text-sf-text-3';
    return [...base, theme].join(' ');
  }

  get hintClasses(): string {
    return `text-xs ${this.dark ? 'text-ad-text-3' : 'text-sf-text-3'}`;
  }

  private static counter = 0;
  readonly inputId = `lnch-input-${++InputComponent.counter}`;

  readonly value      = signal('');
  readonly isDisabled = signal(false);

  private onChange: (v: string) => void = () => {};
  onTouched: () => void = () => {};

  writeValue(val: string): void     { this.value.set(val ?? ''); }
  registerOnChange(fn: (v: string) => void): void { this.onChange = fn; }
  registerOnTouched(fn: () => void): void         { this.onTouched = fn; }
  setDisabledState(disabled: boolean): void        { this.isDisabled.set(disabled); }

  onInput(event: Event): void {
    const val = (event.target as HTMLInputElement).value;
    this.value.set(val);
    this.onChange(val);
  }
}
