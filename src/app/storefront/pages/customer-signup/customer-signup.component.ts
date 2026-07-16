import {
  Component, inject, signal,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { AuthService } from '../../../core/auth/auth.service';
import { UploadService } from '../../../core/admin/upload.service';
import { ToastService } from '../../../shared/components/toast/toast.service';
import { ButtonComponent } from '../../../shared/components/button/button.component';
import { InputComponent } from '../../../shared/components/input/input.component';
import { PASSWORD_VALIDATORS } from '../../../shared/validators/password.validator';

/**
 * CustomerSignupComponent
 *
 * Lets a customer create a storefront account directly, without going
 * through checkout first. This is genuinely optional — guest checkout still
 * auto-creates an account the first time someone orders (see checkout.component.ts)
 * — but some customers want an account up front (e.g. to browse their order
 * history before their first purchase, or because they just prefer signing
 * up before buying). Uses AuthService.registerCustomer(), the same endpoint
 * checkout uses, which now returns real access/refresh tokens on success —
 * so unlike the old checkout-only path, this one leaves the customer
 * properly signed in immediately. That new token is also what makes the
 * optional profile-photo picker below possible: the avatar upload endpoint
 * requires an authenticated request, so the photo (if chosen) is uploaded
 * right after registration succeeds, using the token that registration
 * itself just returned — same upload flow the account page already uses.
 *
 * Only ever registered under a tenant subdomain's route table (see
 * app.config.ts) — there's no equivalent "sign up a customer" concept at
 * the platform root, that's what the multi-step store-creation wizard
 * (signup.component.ts) is for.
 */
@Component({
  selector: 'app-customer-signup',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule, ButtonComponent, InputComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="min-h-screen bg-sf-bg flex flex-col">
      <!-- Top bar -->
      <div class="h-16 border-b border-sf-border flex items-center px-6 justify-between">
        <a routerLink="/" class="font-display font-bold text-xl text-sf-text-1">Launchly</a>
        <span class="text-sm text-sf-text-3">
          Already have an account?
          <a routerLink="/login" class="text-accent hover:underline ml-1">Sign in</a>
        </span>
      </div>

      <!-- Form area -->
      <div class="flex-1 flex items-center justify-center py-12 px-6">
        <div class="w-full max-w-sm">
          <h1 class="font-display text-3xl font-bold text-sf-text-1 mb-2">Create an account</h1>
          <p class="text-sf-text-3 mb-8">
            Sign up to track orders and check out faster next time.
          </p>

          <!-- Optional profile photo -->
          <div class="flex items-center gap-4 mb-6">
            <div
              class="h-14 w-14 rounded-full overflow-hidden flex items-center justify-center
                     shrink-0 text-white font-display text-lg font-semibold"
              style="background: var(--tenant-primary, #15140F);"
            >
              @if (photoPreview(); as preview) {
                <img [src]="preview" alt="" class="h-full w-full object-cover" />
              } @else {
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" class="w-6 h-6 opacity-70">
                  <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/>
                  <circle cx="12" cy="13" r="4"/>
                </svg>
              }
            </div>
            <div>
              <button
                type="button" (click)="fileInput.click()"
                class="text-sm font-medium text-accent hover:underline"
              >
                {{ photoPreview() ? 'Change photo' : 'Add a profile photo' }}
              </button>
              <p class="text-xs text-sf-text-3">Optional — you can always add one later.</p>
            </div>
            <input
              #fileInput type="file" accept="image/*" class="hidden"
              (change)="onPhotoSelected($event)"
            />
          </div>

          <form [formGroup]="form" (ngSubmit)="onSubmit()" class="flex flex-col gap-5">
            <div class="grid grid-cols-2 gap-4">
              <app-input
                formControlName="firstName"
                label="First name"
                placeholder="Ahmed"
                [required]="true"
                [error]="fieldError('firstName')"
              ></app-input>
              <app-input
                formControlName="lastName"
                label="Last name"
                placeholder="Hassan"
                [required]="true"
                [error]="fieldError('lastName')"
              ></app-input>
            </div>

            <app-input
              formControlName="email"
              label="Email address"
              type="email"
              placeholder="you@example.com"
              [required]="true"
              autocomplete="email"
              [error]="fieldError('email')"
            ></app-input>

            <app-input
              formControlName="password"
              label="Password"
              type="password"
              placeholder="8+ characters"
              [required]="true"
              autocomplete="new-password"
              [error]="fieldError('password')"
            ></app-input>

            <!-- Server error -->
            @if (serverError()) {
              <p class="text-sm text-[var(--color-danger)] bg-[var(--color-danger-dim)]
                         rounded-md px-3 py-2" role="alert">
                {{ serverError() }}
              </p>
            }

            <app-button
              variant="primary" type="submit" [fullWidth]="true" size="lg"
              [loading]="loading()"
            >
              Create account
            </app-button>
          </form>
        </div>
      </div>
    </div>
  `,
})
export class CustomerSignupComponent {
  private readonly fb        = inject(FormBuilder);
  private readonly auth      = inject(AuthService);
  private readonly uploadSvc = inject(UploadService);
  private readonly toast     = inject(ToastService);
  private readonly router    = inject(Router);

  readonly loading      = signal(false);
  readonly serverError  = signal('');
  readonly photoPreview = signal<string | null>(null);

  private selectedPhoto: File | null = null;

  readonly form = this.fb.group({
    firstName: ['', [Validators.required, Validators.minLength(2)]],
    lastName:  ['', [Validators.required, Validators.minLength(2)]],
    email:     ['', [Validators.required, Validators.email]],
    password:  ['', [Validators.required, Validators.minLength(8), ...PASSWORD_VALIDATORS]],
  });

  fieldError(field: string): string {
    const c = this.form.get(field);
    if (!c || !c.touched || !c.errors) return '';
    if (c.errors['required'])     return 'This field is required.';
    if (c.errors['email'])        return 'Please enter a valid email.';
    if (c.errors['minlength'])    return `Minimum ${c.errors['minlength'].requiredLength} characters.`;
    if (c.errors['hasUpperCase']) return 'Password must contain at least one uppercase letter.';
    if (c.errors['hasLowerCase']) return 'Password must contain at least one lowercase letter.';
    if (c.errors['hasDigit'])     return 'Password must contain at least one number.';
    return 'Invalid value.';
  }

  onPhotoSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.selectedPhoto = file;

    const reader = new FileReader();
    reader.onload = () => this.photoPreview.set(reader.result as string);
    reader.readAsDataURL(file);
  }

  onSubmit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    if (this.loading()) return;

    this.serverError.set('');
    this.loading.set(true);

    const v = this.form.getRawValue();

    this.auth.registerCustomer({
      firstName: v.firstName!.trim(),
      lastName:  v.lastName!.trim(),
      email:     v.email!.trim(),
      password:  v.password!,
    }).subscribe({
      next: res => {
        if (!res.success || !res.data) {
          this.loading.set(false);
          this.serverError.set(res.message ?? 'Could not create account. Please try again.');
          return;
        }
        // Account exists and the session is stored (AuthService did that in
        // its own tap()) — a chosen photo can now be uploaded, since that
        // endpoint needs the auth token we just got. No photo picked just
        // skips straight to the same place.
        if (this.selectedPhoto) {
          this.uploadSvc.upload(this.selectedPhoto, 'avatar').subscribe({
            next: url => {
              this.auth.updateAvatar(url).subscribe({
                next:  () => this.finishSignup(),
                // Account itself is fine either way — a failed photo save
                // shouldn't block someone from finishing signup.
                error: () => this.finishSignup(),
              });
            },
            error: () => this.finishSignup(),
          });
        } else {
          this.finishSignup();
        }
      },
      error: (err: unknown) => {
        this.loading.set(false);
        const message = (err as { error?: { message?: string } })?.error?.message;
        this.serverError.set(message ?? 'Could not create account. Please try again.');
      },
    });
  }

  private finishSignup(): void {
    this.loading.set(false);
    this.toast.success('Account created!');
    this.router.navigate(['/account']);
  }
}
