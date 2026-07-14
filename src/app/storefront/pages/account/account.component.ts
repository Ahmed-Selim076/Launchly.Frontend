import { Component, ChangeDetectionStrategy, OnInit, inject, signal, viewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { AuthService } from '../../../core/auth/auth.service';
import { UploadService } from '../../../core/admin/upload.service';
import { ToastService } from '../../../shared/components/toast/toast.service';
import { StoreNavComponent } from '../../layout/store-nav/store-nav.component';
import { StoreFooterComponent } from '../../layout/store-footer/store-footer.component';

function passwordsMatchValidator(control: AbstractControl): ValidationErrors | null {
  const pw = control.get('newPassword')?.value;
  const confirm = control.get('confirmPassword')?.value;
  return pw && confirm && pw !== confirm ? { mismatch: true } : null;
}

/**
 * Shared "My Account" page — used by every store type/template. Previously
 * this route ("/account", linked from every nav and footer) had no
 * component at all registered for it anywhere, so it 404'd unconditionally.
 * Lives at the top level of storefront.routes.ts (not inside any one
 * template's routes.ts) so it works identically no matter which of the 9
 * template combinations a tenant picked.
 *
 * Also the home for two other previously-missing pieces:
 *  - Avatar upload/remove (needed a new backend column + endpoints; the
 *    JWT only carries name/email/role from login time, so avatarUrl can't
 *    live there — it's fetched separately via GET /auth/me).
 *  - Change password for a signed-in user (distinct from the "forgot
 *    password" email-link flow, which already existed but had no UI).
 */
@Component({
  selector: 'app-storefront-account',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule, StoreNavComponent, StoreFooterComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="min-h-screen bg-sf-bg flex flex-col">
      <app-store-nav />

      <main class="flex-1 mx-auto max-w-2xl w-full px-4 sm:px-6 py-16 sm:py-20">
        @if (auth.currentUser(); as user) {
          <!-- ── Avatar + identity ── -->
          <div class="flex items-center gap-5 mb-10">
            <div class="relative group flex-shrink-0">
              <div
                class="h-16 w-16 rounded-full overflow-hidden flex items-center justify-center text-white font-display text-xl font-semibold"
                style="background: var(--tenant-primary, #15140F);"
              >
                @if (auth.avatarUrl(); as url) {
                  <img [src]="url" alt="" class="h-full w-full object-cover" />
                } @else {
                  {{ user.firstName.charAt(0) }}{{ user.lastName.charAt(0) }}
                }
              </div>

              <!-- Upload overlay -->
              <button
                type="button"
                (click)="fileInput().nativeElement.click()"
                [disabled]="uploadingAvatar()"
                class="absolute inset-0 rounded-full flex items-center justify-center
                       bg-black/0 group-hover:bg-black/40 transition-colors
                       opacity-0 group-hover:opacity-100 focus-visible:opacity-100"
                aria-label="Change profile photo"
              >
                @if (uploadingAvatar()) {
                  <svg viewBox="0 0 24 24" class="w-5 h-5 text-white animate-spin">
                    <circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="3" fill="none" opacity=".25"/>
                    <path d="M21 12a9 9 0 00-9-9" stroke="currentColor" stroke-width="3" fill="none" stroke-linecap="round"/>
                  </svg>
                } @else {
                  <svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="1.8" class="w-5 h-5">
                    <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/>
                    <circle cx="12" cy="13" r="4"/>
                  </svg>
                }
              </button>
              <input
                #avatarFileInput type="file" accept="image/*" class="hidden"
                (change)="onAvatarSelected($event)"
              />
            </div>

            <div class="flex-1 min-w-0">
              <h1 class="font-display text-2xl text-sf-text-1 truncate">{{ user.firstName }} {{ user.lastName }}</h1>
              <p class="text-sf-text-3 text-sm truncate">{{ user.email }}</p>
              @if (auth.avatarUrl()) {
                <button
                  type="button" (click)="onRemoveAvatar()" [disabled]="uploadingAvatar()"
                  class="text-xs font-medium text-red-500 hover:text-red-600 mt-1 disabled:opacity-50"
                >
                  Remove photo
                </button>
              }
            </div>
          </div>

          <!-- ── Quick links ── -->
          <div class="rounded-xl border border-sf-border divide-y divide-sf-border mb-10">
            <a routerLink="/orders" class="flex items-center justify-between px-5 py-4 hover:bg-sf-surface transition-colors">
              <span class="flex items-center gap-3 text-sf-text-1 text-sm font-medium">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" class="w-5 h-5 text-sf-text-3">
                  <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
                </svg>
                My orders
              </span>
              <svg viewBox="0 0 20 20" fill="currentColor" class="w-4 h-4 text-sf-text-3">
                <path fill-rule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clip-rule="evenodd"/>
              </svg>
            </a>
            <a routerLink="/products" class="flex items-center justify-between px-5 py-4 hover:bg-sf-surface transition-colors">
              <span class="flex items-center gap-3 text-sf-text-1 text-sm font-medium">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" class="w-5 h-5 text-sf-text-3">
                  <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
                  <path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 001.97-1.67L23 6H6"/>
                </svg>
                Continue shopping
              </span>
              <svg viewBox="0 0 20 20" fill="currentColor" class="w-4 h-4 text-sf-text-3">
                <path fill-rule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clip-rule="evenodd"/>
              </svg>
            </a>
          </div>

          <!-- ── Change password ── -->
          <div class="rounded-xl border border-sf-border p-6 mb-10">
            <h2 class="font-display text-lg text-sf-text-1 mb-1">Change password</h2>
            <p class="text-sf-text-3 text-sm mb-5">Update the password you use to sign in.</p>

            <form [formGroup]="pwForm" (ngSubmit)="onChangePassword()" class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-sf-text-1 mb-1.5">Current password</label>
                <input
                  type="password" formControlName="currentPassword" autocomplete="current-password"
                  class="w-full rounded-lg border border-sf-border bg-sf-bg px-3.5 py-2.5 text-sm text-sf-text-1
                         focus:outline-none focus:ring-2 focus:ring-offset-1"
                  style="--tw-ring-color: var(--tenant-primary, #15140F);"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-sf-text-1 mb-1.5">New password</label>
                <input
                  type="password" formControlName="newPassword" autocomplete="new-password"
                  class="w-full rounded-lg border border-sf-border bg-sf-bg px-3.5 py-2.5 text-sm text-sf-text-1
                         focus:outline-none focus:ring-2 focus:ring-offset-1"
                  style="--tw-ring-color: var(--tenant-primary, #15140F);"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-sf-text-1 mb-1.5">Confirm new password</label>
                <input
                  type="password" formControlName="confirmPassword" autocomplete="new-password"
                  class="w-full rounded-lg border border-sf-border bg-sf-bg px-3.5 py-2.5 text-sm text-sf-text-1
                         focus:outline-none focus:ring-2 focus:ring-offset-1"
                  style="--tw-ring-color: var(--tenant-primary, #15140F);"
                />
                @if (pwForm.errors?.['mismatch'] && pwForm.get('confirmPassword')?.touched) {
                  <p class="text-xs text-red-500 mt-1">Passwords don't match.</p>
                }
              </div>
              <button
                type="submit"
                [disabled]="pwForm.invalid || changingPassword()"
                class="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold text-white
                       disabled:opacity-40 transition-opacity"
                style="background: var(--tenant-primary, #15140F);"
              >
                {{ changingPassword() ? 'Updating…' : 'Update password' }}
              </button>
            </form>
          </div>

          <button
            type="button"
            (click)="onLogout()"
            [disabled]="loggingOut()"
            class="text-sm font-medium text-red-500 hover:text-red-600 transition-colors disabled:opacity-50"
          >
            {{ loggingOut() ? 'Signing out…' : 'Sign out' }}
          </button>
        } @else {
          <div class="text-center py-16">
            <h1 class="font-display text-2xl text-sf-text-1 mb-3">You're not signed in</h1>
            <p class="text-sf-text-3 text-sm mb-8">Sign in to view your account and order history.</p>
            <a
              routerLink="/login"
              class="inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm font-semibold text-white"
              style="background: var(--tenant-primary, #15140F);"
            >
              Sign in
            </a>
          </div>
        }
      </main>

      <app-store-footer />
    </div>
  `,
})
export class StorefrontAccountComponent implements OnInit {
  readonly auth   = inject(AuthService);
  private readonly uploadSvc = inject(UploadService);
  private readonly toast     = inject(ToastService);
  private readonly fb        = inject(FormBuilder);

  readonly fileInput = viewChild.required<ElementRef<HTMLInputElement>>('avatarFileInput');

  readonly loggingOut       = signal(false);
  readonly uploadingAvatar  = signal(false);
  readonly changingPassword = signal(false);

  readonly pwForm = this.fb.nonNullable.group({
    currentPassword: ['', Validators.required],
    newPassword:     ['', [Validators.required, Validators.minLength(8)]],
    confirmPassword: ['', Validators.required],
  }, { validators: passwordsMatchValidator });

  ngOnInit(): void {
    if (this.auth.isAuthenticated()) {
      this.auth.getMe().subscribe({ error: () => {} });
    }
  }

  onAvatarSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;

    this.uploadingAvatar.set(true);
    this.uploadSvc.upload(file, 'avatar').subscribe({
      next: url => {
        this.auth.updateAvatar(url).subscribe({
          next:  () => { this.uploadingAvatar.set(false); this.toast.success('Profile photo updated.'); },
          error: () => { this.uploadingAvatar.set(false); this.toast.error('Could not save your photo. Please try again.'); },
        });
      },
      error: () => { this.uploadingAvatar.set(false); this.toast.error('Upload failed. Please try again.'); },
    });
  }

  onRemoveAvatar(): void {
    this.uploadingAvatar.set(true);
    this.auth.updateAvatar(null).subscribe({
      next:  () => { this.uploadingAvatar.set(false); this.toast.success('Profile photo removed.'); },
      error: () => { this.uploadingAvatar.set(false); this.toast.error('Could not remove your photo.'); },
    });
  }

  onChangePassword(): void {
    if (this.pwForm.invalid) return;
    const { currentPassword, newPassword } = this.pwForm.getRawValue();

    this.changingPassword.set(true);
    this.auth.changePassword(currentPassword, newPassword).subscribe({
      next: res => {
        this.changingPassword.set(false);
        if (res.success) {
          this.toast.success('Password updated.');
          this.pwForm.reset();
        } else {
          this.toast.error(res.message ?? 'Could not update password.');
        }
      },
      error: err => {
        this.changingPassword.set(false);
        this.toast.error(err?.error?.message ?? 'Could not update password.');
      },
    });
  }

  onLogout(): void {
    this.loggingOut.set(true);
    this.auth.logout().subscribe({
      next:  () => location.reload(),
      error: () => location.reload(),
    });
  }
}
