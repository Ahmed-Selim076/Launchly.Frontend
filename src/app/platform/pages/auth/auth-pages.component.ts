import { Component, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators, AbstractControl, ValidatorFn } from '@angular/forms';
import { AuthService } from '../../../core/auth/auth.service';
import { ButtonComponent } from '../../../shared/components/button/button.component';
import { InputComponent } from '../../../shared/components/input/input.component';

// ─── Forgot Password ─────────────────────────────────────────────────────────

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule, ButtonComponent, InputComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="min-h-screen bg-sf-bg flex items-center justify-center px-6">
      <div class="w-full max-w-sm">
        <a routerLink="/" class="font-display font-bold text-xl text-sf-text-1 block mb-10">Launchly</a>

        @if (!sent()) {
          <h1 class="font-display text-3xl font-bold text-sf-text-1 mb-2">Forgot password?</h1>
          <p class="text-sf-text-3 mb-8">Enter your email and we'll send you a reset link.</p>

          <form [formGroup]="form" (ngSubmit)="onSubmit()" class="flex flex-col gap-5">
            <app-input
              formControlName="email"
              label="Email address"
              type="email"
              placeholder="you@example.com"
              [required]="true"
            ></app-input>
            <app-button variant="primary" type="submit" [fullWidth]="true" [loading]="loading()">
              Send reset link
            </app-button>
          </form>
          <p class="text-center mt-6 text-sm text-sf-text-3">
            <a routerLink="/login" class="text-accent hover:underline">Back to sign in</a>
          </p>
        } @else {
          <div class="text-center">
            <div class="w-14 h-14 rounded-full bg-[var(--color-success-dim)] flex items-center
                        justify-center text-2xl mx-auto mb-4">✓</div>
            <h2 class="font-display text-2xl font-bold text-sf-text-1 mb-2">Check your inbox</h2>
            <p class="text-sf-text-3 text-sm mb-6">
              We sent a reset link to <strong>{{ form.value.email }}</strong>.
              It expires in 1 hour.
            </p>
            <a routerLink="/login" class="text-accent hover:underline text-sm">Back to sign in</a>
          </div>
        }
      </div>
    </div>
  `,
})
export class ForgotPasswordComponent {
  private readonly fb   = inject(FormBuilder);
  private readonly auth = inject(AuthService);

  readonly loading = signal(false);
  readonly sent    = signal(false);

  readonly form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
  });

  onSubmit(): void {
    if (this.form.invalid || this.loading()) return;
    this.loading.set(true);
    this.auth.forgotPassword(this.form.value.email!).subscribe({
      next: () => { this.loading.set(false); this.sent.set(true); },
      error: () => { this.loading.set(false); this.sent.set(true); }, // don't reveal if email exists
    });
  }
}

// ─── Reset Password ───────────────────────────────────────────────────────────

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule, ButtonComponent, InputComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="min-h-screen bg-sf-bg flex items-center justify-center px-6">
      <div class="w-full max-w-sm">
        <a routerLink="/" class="font-display font-bold text-xl text-sf-text-1 block mb-10">Launchly</a>

        @if (!done()) {
          <h1 class="font-display text-3xl font-bold text-sf-text-1 mb-2">Set new password</h1>
          <p class="text-sf-text-3 mb-8">Choose a strong password for your account.</p>

          <form [formGroup]="form" (ngSubmit)="onSubmit()" class="flex flex-col gap-5">
            <app-input
              formControlName="password"
              label="New password"
              type="password"
              placeholder="8+ characters"
              [required]="true"
              [error]="passwordError()"
            ></app-input>
            @if (error()) {
              <p class="text-sm text-[var(--color-danger)]" role="alert">{{ error() }}</p>
            }
            <app-button variant="primary" type="submit" [fullWidth]="true" [loading]="loading()">
              Reset password
            </app-button>
          </form>
        } @else {
          <div class="text-center">
            <div class="w-14 h-14 rounded-full bg-[var(--color-success-dim)] flex items-center
                        justify-center text-2xl mx-auto mb-4">✓</div>
            <h2 class="font-display text-2xl font-bold text-sf-text-1 mb-2">Password updated</h2>
            <p class="text-sf-text-3 text-sm mb-6">You can now sign in with your new password.</p>
            <a routerLink="/login" class="text-accent hover:underline text-sm">Sign in</a>
          </div>
        }
      </div>
    </div>
  `,
})
export class ResetPasswordComponent {
  private readonly fb    = inject(FormBuilder);
  private readonly auth  = inject(AuthService);
  private readonly route = inject(ActivatedRoute);

  readonly loading = signal(false);
  readonly done    = signal(false);
  readonly error   = signal('');

  readonly form = this.fb.group({
    password: ['', [Validators.required, Validators.minLength(8), strongPasswordValidator()]],
  });

  /** Mirrors backend ApplyPasswordRules — shown inline, before the API call. */
  passwordError(): string {
    const ctrl = this.form.get('password');
    if (!ctrl || !ctrl.touched || !ctrl.errors) return '';
    if (ctrl.errors['required'])    return 'Password is required.';
    if (ctrl.errors['minlength'])   return 'Password must be at least 8 characters.';
    if (ctrl.errors['noUppercase']) return 'Password must contain at least one uppercase letter.';
    if (ctrl.errors['noLowercase']) return 'Password must contain at least one lowercase letter.';
    if (ctrl.errors['noDigit'])     return 'Password must contain at least one number.';
    return '';
  }

  onSubmit(): void {
    if (this.form.invalid || this.loading()) return;
    const token = this.route.snapshot.queryParamMap.get('token') ?? '';
    if (!token) { this.error.set('Invalid or expired reset link.'); return; }

    this.loading.set(true);
    this.auth.resetPassword(token, this.form.value.password!).subscribe({
      next: res => {
        this.loading.set(false);
        if (res.success) this.done.set(true);
        else this.error.set(res.message ?? 'Reset failed. Please try again.');
      },
      error: () => {
        this.loading.set(false);
        this.error.set('Link expired or invalid. Please request a new one.');
      },
    });
  }
}

/**
 * Mirrors backend ApplyPasswordRules() in AuthValidators.cs.
 * Validates presence of uppercase, lowercase, and digit beyond the
 * minLength(8) check that Angular's built-in validator already covers.
 */
function strongPasswordValidator(): ValidatorFn {
  return (control: AbstractControl) => {
    const v: string = control.value ?? '';
    if (!v) return null; // required validator handles empty
    if (!/[A-Z]/.test(v)) return { noUppercase: true };
    if (!/[a-z]/.test(v)) return { noLowercase: true };
    if (!/[0-9]/.test(v)) return { noDigit: true };
    return null;
  };
}

@Component({
  selector: 'app-verify-email',
  standalone: true,
  imports: [CommonModule, RouterLink, ButtonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="min-h-screen bg-sf-bg flex items-center justify-center px-6">
      <div class="w-full max-w-sm text-center">
        <a routerLink="/" class="font-display font-bold text-xl text-sf-text-1 block mb-10">Launchly</a>

        @if (loading()) {
          <p class="text-sf-text-3">Verifying your email…</p>
        } @else if (success()) {
          <div class="w-14 h-14 rounded-full bg-[var(--color-success-dim)] flex items-center
                      justify-center text-2xl mx-auto mb-4">✓</div>
          <h2 class="font-display text-2xl font-bold text-sf-text-1 mb-2">Email verified!</h2>
          <p class="text-sf-text-3 text-sm mb-6">Your account is now active.</p>
          <app-button variant="primary" routerLink="/login">Sign in</app-button>
        } @else {
          <div class="w-14 h-14 rounded-full bg-[var(--color-danger-dim)] flex items-center
                      justify-center text-2xl mx-auto mb-4">✕</div>
          <h2 class="font-display text-2xl font-bold text-sf-text-1 mb-2">Verification failed</h2>
          <p class="text-sf-text-3 text-sm mb-6">
            This link is invalid or has expired. Please request a new one.
          </p>
          <app-button variant="secondary" routerLink="/login">Back to sign in</app-button>
        }
      </div>
    </div>
  `,
})
export class VerifyEmailComponent {
  private readonly auth  = inject(AuthService);
  private readonly route = inject(ActivatedRoute);

  readonly loading = signal(true);
  readonly success = signal(false);

  constructor() {
    const token = this.route.snapshot.queryParamMap.get('token') ?? '';
    if (!token) { this.loading.set(false); return; }

    this.auth.verifyEmail(token).subscribe({
      next: res => {
        this.loading.set(false);
        this.success.set(res.success);
      },
      error: () => {
        this.loading.set(false);
        this.success.set(false);
      },
    });
  }
}
