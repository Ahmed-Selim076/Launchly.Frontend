import {
  Component, ChangeDetectionStrategy, OnInit, inject,
  signal, computed, OnDestroy, viewChild, ElementRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule, FormBuilder, Validators, AbstractControl,
} from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';

import { SettingsService }     from '../../../core/admin/settings.service';
import { TenantService }       from '../../../core/tenant/tenant.service';
import { TenantThemeService }  from '../../../core/tenant/tenant-theme.service';
import { AuthService }         from '../../../core/auth/auth.service';
import { UploadService }       from '../../../core/admin/upload.service';
import { ToastService }        from '../../../shared/components/toast/toast.service';
import { ISettings }           from '../../../core/models';

import { ButtonComponent }         from '../../../shared/components/button/button.component';
import { InputComponent }          from '../../../shared/components/input/input.component';
import { SkeletonComponent }       from '../../../shared/components/skeleton/skeleton.component';
import { ImageUploaderComponent }  from '../../components/image-uploader/image-uploader.component';

// ─── Hex colour validator ──────────────────────────────────────────────────────

const HEX_RE = /^#([A-Fa-f0-9]{6})$/;

function hexColor(ctrl: AbstractControl): { hexColor: true } | null {
  return !ctrl.value || HEX_RE.test(ctrl.value) ? null : { hexColor: true };
}

// ─── Component ────────────────────────────────────────────────────────────────

@Component({
  selector: 'app-admin-settings',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule,
    ButtonComponent, InputComponent, SkeletonComponent,
    ImageUploaderComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-8 max-w-5xl">

      <!-- ── Page header ── -->
      <div>
        <h1 class="font-display text-2xl font-bold text-ad-text-1">Store Settings</h1>
        <p class="text-ad-text-3 text-sm mt-1">
          Customise your store's appearance and content. Changes are previewed live on the right.
        </p>
      </div>

      <!-- ── Your profile photo (admin's own avatar — separate from store logo) ── -->
      <div class="rounded-lg bg-ad-surface border border-ad-border p-5 flex items-center gap-5">
        <div class="relative group flex-shrink-0">
          <div
            class="h-14 w-14 rounded-full overflow-hidden flex items-center justify-center text-white font-display text-lg font-semibold"
            style="background: var(--color-accent);"
          >
            @if (auth.avatarUrl(); as url) {
              <img [src]="url" alt="" class="h-full w-full object-cover" />
            } @else {
              {{ adminInitial() }}
            }
          </div>
          <button
            type="button"
            (click)="avatarInputRef().nativeElement.click()"
            [disabled]="uploadingAvatar()"
            class="absolute inset-0 rounded-full flex items-center justify-center
                   bg-black/0 group-hover:bg-black/40 transition-colors
                   opacity-0 group-hover:opacity-100 focus-visible:opacity-100"
            aria-label="Change your profile photo"
          >
            @if (uploadingAvatar()) {
              <svg viewBox="0 0 24 24" class="w-4 h-4 text-white animate-spin">
                <circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="3" fill="none" opacity=".25"/>
                <path d="M21 12a9 9 0 00-9-9" stroke="currentColor" stroke-width="3" fill="none" stroke-linecap="round"/>
              </svg>
            } @else {
              <svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="1.8" class="w-4 h-4">
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
        <div class="min-w-0">
          <p class="text-ad-text-1 font-semibold text-sm">{{ adminName() }}</p>
          <p class="text-ad-text-3 text-xs mb-2">{{ adminEmail() }}</p>
          @if (auth.avatarUrl()) {
            <button
              type="button" (click)="onRemoveAvatar()" [disabled]="uploadingAvatar()"
              class="text-xs font-medium text-danger hover:opacity-75 disabled:opacity-50"
            >
              Remove photo
            </button>
          } @else {
            <p class="text-xs text-ad-text-3">This is your own profile photo — not the store logo.</p>
          }
        </div>
      </div>

      @if (loading()) {
        <!-- Loading skeletons -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div class="space-y-4">
            @for (_ of [1,2,3,4,5]; track $index) {
              <app-skeleton [dark]="true" height="56px" />
            }
          </div>
          <app-skeleton [dark]="true" height="360px" />
        </div>
      } @else if (loadError()) {
        <div class="rounded-lg bg-ad-surface border border-ad-border p-8 text-center">
          <p class="text-ad-text-3 mb-4">{{ loadError() }}</p>
          <app-button variant="secondary" size="sm" (clicked)="load()">Retry</app-button>
        </div>
      } @else {

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">

          <!-- ══════════════════════════════════════════════════════════
               LEFT COLUMN — form
          ══════════════════════════════════════════════════════════ -->
          <form [formGroup]="form" (ngSubmit)="save()" class="space-y-6" novalidate>

            <!-- ── Store Name ── -->
            <div>
              <label class="block text-sm font-medium text-ad-text-2 mb-1.5">Store Name</label>
              <app-input
                formControlName="storeName"
                placeholder="My Awesome Store"
                [dark]="true"
              />
              @if (f['storeName'].touched && f['storeName'].errors?.['required']) {
                <p class="mt-1 text-xs text-[var(--color-danger)]">Store name is required.</p>
              }
              @if (f['storeName'].touched && f['storeName'].errors?.['maxlength']) {
                <p class="mt-1 text-xs text-[var(--color-danger)]">Max 100 characters.</p>
              }
            </div>

            <!-- ── Logo ── -->
            <div>
              <label class="block text-sm font-medium text-ad-text-2 mb-1.5">Store Logo</label>
              <app-image-uploader
                type="logo"
                [currentUrl]="currentLogoUrl()"
                (uploaded)="onLogoUploaded($event)"
              />
              @if (logoSaving()) {
                <p class="mt-1.5 text-xs text-ad-text-3">Saving logo…</p>
              }
            </div>

            <!-- ── Brand Colours ── -->
            <div>
              <label class="block text-sm font-medium text-ad-text-2 mb-3">Brand Colours</label>
              <div class="grid grid-cols-2 gap-4">

                <!-- Primary -->
                <div>
                  <p class="text-xs text-ad-text-3 mb-2">Primary</p>
                  <div class="flex items-center gap-3">
                    <!-- Swatch — clicking it also opens the native picker -->
                    <label
                      class="w-9 h-9 rounded-md border-2 border-ad-border cursor-pointer flex-shrink-0
                             shadow-sm transition-transform hover:scale-105"
                      [style.background]="previewPrimary()"
                      title="Pick primary colour"
                    >
                      <input
                        type="color"
                        formControlName="primaryColor"
                        class="sr-only"
                        (input)="onColorInput()"
                      />
                    </label>
                    <app-input
                      formControlName="primaryColor"
                      placeholder="#C1522A"
                      [dark]="true"
                      (inputChange)="onColorInput()"
                    />
                  </div>
                  @if (f['primaryColor'].touched && f['primaryColor'].errors?.['required']) {
                    <p class="mt-1 text-xs text-[var(--color-danger)]">Required.</p>
                  }
                  @if (f['primaryColor'].touched && f['primaryColor'].errors?.['hexColor']) {
                    <p class="mt-1 text-xs text-[var(--color-danger)]">Must be a valid hex (e.g. #C1522A).</p>
                  }
                </div>

                <!-- Secondary -->
                <div>
                  <p class="text-xs text-ad-text-3 mb-2">Secondary</p>
                  <div class="flex items-center gap-3">
                    <label
                      class="w-9 h-9 rounded-md border-2 border-ad-border cursor-pointer flex-shrink-0
                             shadow-sm transition-transform hover:scale-105"
                      [style.background]="previewSecondary()"
                      title="Pick secondary colour"
                    >
                      <input
                        type="color"
                        formControlName="secondaryColor"
                        class="sr-only"
                        (input)="onColorInput()"
                      />
                    </label>
                    <app-input
                      formControlName="secondaryColor"
                      placeholder="#F2EDE6"
                      [dark]="true"
                      (inputChange)="onColorInput()"
                    />
                  </div>
                  @if (f['secondaryColor'].touched && f['secondaryColor'].errors?.['required']) {
                    <p class="mt-1 text-xs text-[var(--color-danger)]">Required.</p>
                  }
                  @if (f['secondaryColor'].touched && f['secondaryColor'].errors?.['hexColor']) {
                    <p class="mt-1 text-xs text-[var(--color-danger)]">Must be a valid hex (e.g. #F2EDE6).</p>
                  }
                </div>

              </div>
            </div>

            <!-- ── Hero Text ── -->
            <div>
              <label class="block text-sm font-medium text-ad-text-2 mb-1.5">
                Hero Text
                <span class="ml-1 text-ad-text-3 font-normal">(optional)</span>
              </label>
              <textarea
                formControlName="heroText"
                rows="2"
                placeholder="Welcome to our store — discover amazing products."
                class="w-full rounded-lg border border-ad-border bg-ad-surface-2 text-ad-text-1
                       text-sm px-3 py-2.5 placeholder:text-ad-text-3
                       focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]
                       resize-none transition-shadow"
              ></textarea>
              @if (f['heroText'].errors?.['maxlength']) {
                <p class="mt-1 text-xs text-[var(--color-danger)]">Max 200 characters.</p>
              }
              <p class="mt-1 text-xs text-ad-text-3 text-right">
                {{ (f['heroText'].value?.length ?? 0) }}/200
              </p>
            </div>

            <!-- ── About Text ── -->
            <div>
              <label class="block text-sm font-medium text-ad-text-2 mb-1.5">
                About Text
                <span class="ml-1 text-ad-text-3 font-normal">(optional)</span>
              </label>
              <textarea
                formControlName="aboutText"
                rows="4"
                placeholder="A short paragraph about your business, story, or values."
                class="w-full rounded-lg border border-ad-border bg-ad-surface-2 text-ad-text-1
                       text-sm px-3 py-2.5 placeholder:text-ad-text-3
                       focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]
                       resize-none transition-shadow"
              ></textarea>
              @if (f['aboutText'].errors?.['maxlength']) {
                <p class="mt-1 text-xs text-[var(--color-danger)]">Max 2000 characters.</p>
              }
              <p class="mt-1 text-xs text-ad-text-3 text-right">
                {{ (f['aboutText'].value?.length ?? 0) }}/2000
              </p>
            </div>

            <!-- ── Google Analytics ID ── -->
            <div>
              <label class="block text-sm font-medium text-ad-text-2 mb-1.5">
                Google Analytics ID
                <span class="ml-1 text-ad-text-3 font-normal">(optional)</span>
              </label>
              <app-input
                formControlName="googleAnalyticsId"
                placeholder="G-XXXXXXXXXX"
                [dark]="true"
              />
              @if (f['googleAnalyticsId'].errors?.['maxlength']) {
                <p class="mt-1 text-xs text-[var(--color-danger)]">Max 20 characters.</p>
              }
            </div>

            <!-- ── Contact channels (used by the storefront Contact page + Footer) ── -->
            <div class="pt-2 border-t border-ad-border">
              <h3 class="text-sm font-semibold text-ad-text-1 mb-3">Contact info</h3>
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-ad-text-2 mb-1.5">Phone</label>
                  <app-input formControlName="contactPhone" placeholder="+20 100 123 4567" [dark]="true" />
                </div>
                <div>
                  <label class="block text-sm font-medium text-ad-text-2 mb-1.5">WhatsApp number</label>
                  <app-input formControlName="whatsappNumber" placeholder="+20 100 123 4567" [dark]="true" />
                </div>
                <div>
                  <label class="block text-sm font-medium text-ad-text-2 mb-1.5">Contact email</label>
                  <app-input formControlName="contactEmail" placeholder="support@yourstore.com" [dark]="true" />
                  @if (f['contactEmail'].errors?.['email']) {
                    <p class="mt-1 text-xs text-[var(--color-danger)]">Enter a valid email address.</p>
                  }
                </div>
                <div>
                  <label class="block text-sm font-medium text-ad-text-2 mb-1.5">Address</label>
                  <app-input formControlName="contactAddress" placeholder="City, area" [dark]="true" />
                </div>
              </div>
            </div>

            <!-- ── Social links ── -->
            <div class="pt-2 border-t border-ad-border">
              <h3 class="text-sm font-semibold text-ad-text-1 mb-3">Social links</h3>
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-ad-text-2 mb-1.5">Facebook URL</label>
                  <app-input formControlName="facebookUrl" placeholder="https://facebook.com/yourstore" [dark]="true" />
                </div>
                <div>
                  <label class="block text-sm font-medium text-ad-text-2 mb-1.5">Instagram URL</label>
                  <app-input formControlName="instagramUrl" placeholder="https://instagram.com/yourstore" [dark]="true" />
                </div>
              </div>
            </div>

            <!-- ── Actions ── -->
            <div class="flex items-center gap-3 pt-2">
              <app-button
                type="submit"
                variant="primary"
                size="md"
                [disabled]="saving() || form.invalid"
                [loading]="saving()"
              >
                Save Changes
              </app-button>
              <app-button
                type="button"
                variant="ghost"
                size="md"
                [disabled]="saving()"
                (clicked)="resetForm()"
              >
                Discard
              </app-button>
            </div>

          </form>

          <!-- ══════════════════════════════════════════════════════════
               RIGHT COLUMN — Live Preview Panel
          ══════════════════════════════════════════════════════════ -->
          <div class="sticky top-6">
            <p class="text-xs font-semibold uppercase tracking-wider text-ad-text-3 mb-3">
              Live Preview
            </p>

            <!-- Simulated storefront card -->
            <div
              class="rounded-xl overflow-hidden border border-ad-border shadow-md
                     transition-all duration-300"
              [style.--preview-primary]="previewPrimary()"
              [style.--preview-secondary]="previewSecondary()"
            >
              <!-- Fake navbar -->
              <div
                class="flex items-center justify-between px-5 py-3"
                [style.background]="previewPrimary()"
              >
                <!-- Logo / name -->
                <div class="flex items-center gap-2">
                  @if (previewLogoUrl()) {
                    <img
                      [src]="previewLogoUrl()!"
                      alt="Store logo"
                      class="w-7 h-7 rounded object-cover"
                    />
                  } @else {
                    <div
                      class="w-7 h-7 rounded flex items-center justify-center
                             text-xs font-bold"
                      [style.background]="adjustedAccent(previewPrimary())"
                      [style.color]="contrastColor(previewPrimary())"
                    >
                      {{ storeInitial() }}
                    </div>
                  }
                  <span
                    class="text-sm font-semibold truncate max-w-[120px]"
                    [style.color]="contrastColor(previewPrimary())"
                  >
                    {{ previewStoreName() || 'My Store' }}
                  </span>
                </div>
                <!-- Fake nav links -->
                <div class="flex items-center gap-4">
                  @for (lnk of ['Home','Shop','About']; track lnk) {
                    <span
                      class="text-xs opacity-80"
                      [style.color]="contrastColor(previewPrimary())"
                    >{{ lnk }}</span>
                  }
                </div>
              </div>

              <!-- Hero band -->
              <div
                class="px-6 py-10 text-center"
                [style.background]="previewSecondary()"
              >
                <p
                  class="text-lg font-bold leading-snug"
                  [style.color]="contrastColor(previewSecondary())"
                >
                  {{ previewHeroText() || 'Welcome to our store' }}
                </p>
                <!-- CTA button sample -->
                <button
                  class="mt-4 px-5 py-2 rounded-full text-xs font-semibold shadow-sm
                         transition-opacity hover:opacity-90"
                  [style.background]="previewPrimary()"
                  [style.color]="contrastColor(previewPrimary())"
                >
                  Shop Now
                </button>
              </div>

              <!-- Product card row mock -->
              <div class="px-4 py-5 bg-white flex gap-3">
                @for (card of [1,2,3]; track card) {
                  <div class="flex-1 rounded-lg overflow-hidden border border-gray-100 shadow-sm">
                    <div
                      class="h-16"
                      [style.background]="previewSecondary()"
                    ></div>
                    <div class="p-2">
                      <div class="h-2 bg-gray-200 rounded mb-1.5 w-3/4"></div>
                      <div
                        class="h-2 rounded w-1/2"
                        [style.background]="previewPrimary()"
                        style="opacity:.6"
                      ></div>
                    </div>
                  </div>
                }
              </div>

              <!-- Footer -->
              <div
                class="px-5 py-3 text-center text-xs"
                [style.background]="previewPrimary()"
                [style.color]="contrastColor(previewPrimary())"
              >
                <span class="opacity-70">© 2025 {{ previewStoreName() || 'My Store' }}</span>
              </div>
            </div>

            <!-- About snippet -->
            @if (previewAboutText()) {
              <div class="mt-4 rounded-lg bg-ad-surface border border-ad-border p-4">
                <p class="text-xs font-semibold text-ad-text-3 uppercase tracking-wide mb-2">About</p>
                <p class="text-sm text-ad-text-2 leading-relaxed line-clamp-4">
                  {{ previewAboutText() }}
                </p>
              </div>
            }

            <!-- Colour chips legend -->
            <div class="mt-4 flex items-center gap-4">
              <div class="flex items-center gap-2">
                <span
                  class="w-4 h-4 rounded-sm border border-ad-border"
                  [style.background]="previewPrimary()"
                ></span>
                <span class="text-xs text-ad-text-3">Primary {{ previewPrimary() }}</span>
              </div>
              <div class="flex items-center gap-2">
                <span
                  class="w-4 h-4 rounded-sm border border-ad-border"
                  [style.background]="previewSecondary()"
                ></span>
                <span class="text-xs text-ad-text-3">Secondary {{ previewSecondary() }}</span>
              </div>
            </div>
          </div>

        </div>
      }

    </div>
  `,
})
export class SettingsComponent implements OnInit, OnDestroy {

  // ─── DI ───────────────────────────────────────────────────────────────────

  private readonly settingsSvc  = inject(SettingsService);
  private readonly tenantSvc    = inject(TenantService);
  private readonly themeSvc     = inject(TenantThemeService);
  readonly auth                 = inject(AuthService);
  private readonly uploadSvc    = inject(UploadService);
  private readonly toast        = inject(ToastService);
  private readonly fb           = inject(FormBuilder);
  private readonly destroy$     = new Subject<void>();

  readonly avatarInputRef = viewChild.required<ElementRef<HTMLInputElement>>('avatarFileInput');
  readonly uploadingAvatar = signal(false);

  readonly adminName = computed(() => {
    const u = this.auth.currentUser();
    return u ? `${u.firstName} ${u.lastName}`.trim() : '';
  });
  readonly adminEmail   = computed(() => this.auth.currentUser()?.email ?? '');
  readonly adminInitial = computed(() => (this.auth.currentUser()?.firstName?.[0] ?? 'A').toUpperCase());

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

  // ─── State ────────────────────────────────────────────────────────────────

  readonly loading       = signal(true);
  readonly loadError     = signal('');
  readonly saving        = signal(false);
  readonly logoSaving    = signal(false);
  readonly currentLogoUrl = signal<string | null>(null);
  readonly previewLogoUrl = signal<string | null>(null);

  // ─── Form ─────────────────────────────────────────────────────────────────

  readonly form = this.fb.group({
    storeName:         ['', [Validators.required, Validators.maxLength(100)]],
    primaryColor:      ['', [Validators.required, hexColor]],
    secondaryColor:    ['', [Validators.required, hexColor]],
    heroText:          ['', [Validators.maxLength(200)]],
    aboutText:         ['', [Validators.maxLength(2000)]],
    googleAnalyticsId: ['', [Validators.maxLength(20)]],
    contactPhone:      ['', [Validators.maxLength(30)]],
    whatsappNumber:    ['', [Validators.maxLength(30)]],
    contactEmail:      ['', [Validators.email, Validators.maxLength(150)]],
    contactAddress:    ['', [Validators.maxLength(300)]],
    facebookUrl:       ['', [Validators.maxLength(300)]],
    instagramUrl:      ['', [Validators.maxLength(300)]],
  });

  get f() { return this.form.controls; }

  // ─── Live-preview computed values ─────────────────────────────────────────

  readonly previewPrimary   = computed(() => this.#safeHex(this.f['primaryColor'].value,   '#C1522A'));
  readonly previewSecondary = computed(() => this.#safeHex(this.f['secondaryColor'].value, '#F2EDE6'));
  readonly previewStoreName = computed(() => this.f['storeName'].value ?? '');
  readonly previewHeroText  = computed(() => this.f['heroText'].value ?? '');
  readonly previewAboutText = computed(() => this.f['aboutText'].value ?? '');
  readonly storeInitial     = computed(() => (this.f['storeName'].value ?? 'S').charAt(0).toUpperCase());

  // ─── Lifecycle ────────────────────────────────────────────────────────────

  ngOnInit(): void {
    // Keep preview reactive to form changes
    this.form.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.#applyPreview());

    // JWT only carries name/email/role from login time — avatarUrl needs a
    // fresh /auth/me fetch (same reasoning as StorefrontAccountComponent).
    this.auth.getMe().subscribe({ error: () => {} });

    this.load();
  }

  ngOnDestroy(): void {
    // Restore the real saved theme when leaving the page
    const tenant = this.tenantSvc.currentTenant();
    if (tenant) this.themeSvc.applyTheme(tenant);
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ─── Load ─────────────────────────────────────────────────────────────────

  load(): void {
    this.loading.set(true);
    this.loadError.set('');
    this.settingsSvc.getSettings().subscribe({
      next: res => {
        this.loading.set(false);
        if (!res.success || !res.data) {
          this.loadError.set(res.message ?? 'Failed to load settings.');
          return;
        }
        this.#patchForm(res.data);
      },
      error: () => {
        this.loading.set(false);
        this.loadError.set('Network error. Please try again.');
      },
    });
  }

  // ─── Save ─────────────────────────────────────────────────────────────────

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.saving.set(true);
    const v = this.form.getRawValue();
    this.settingsSvc.updateSettings({
      storeName:         v.storeName!.trim(),
      primaryColor:      v.primaryColor!.trim(),
      secondaryColor:    v.secondaryColor!.trim(),
      heroText:          v.heroText?.trim() ?? null,
      aboutText:         v.aboutText?.trim() ?? null,
      googleAnalyticsId: v.googleAnalyticsId?.trim() ?? null,
      contactPhone:      v.contactPhone?.trim() ?? null,
      whatsappNumber:    v.whatsappNumber?.trim() ?? null,
      contactEmail:      v.contactEmail?.trim() ?? null,
      contactAddress:    v.contactAddress?.trim() ?? null,
      facebookUrl:       v.facebookUrl?.trim() ?? null,
      instagramUrl:      v.instagramUrl?.trim() ?? null,
    }).subscribe({
      next: res => {
        this.saving.set(false);
        if (res.success && res.data) {
          this.#patchForm(res.data);
          // Commit the theme globally
          this.themeSvc.applyTheme({
            primaryColor:   res.data.primaryColor,
            secondaryColor: res.data.secondaryColor,
          });
          this.toast.success('Settings saved successfully.');
        } else {
          this.toast.error(res.message ?? 'Could not save settings.');
        }
      },
      error: () => {
        this.saving.set(false);
        this.toast.error('Network error. Please try again.');
      },
    });
  }

  // ─── Logo upload callback ─────────────────────────────────────────────────

  onLogoUploaded(secureUrl: string): void {
    this.logoSaving.set(true);
    this.previewLogoUrl.set(secureUrl);
    this.settingsSvc.patchLogo(secureUrl).subscribe({
      next: res => {
        this.logoSaving.set(false);
        if (res.success && res.data) {
          this.currentLogoUrl.set(res.data.logoUrl);
          this.toast.success('Logo updated.');
        } else {
          this.toast.error(res.message ?? 'Could not save logo.');
        }
      },
      error: () => {
        this.logoSaving.set(false);
        this.toast.error('Network error saving logo.');
      },
    });
  }

  // ─── Discard ──────────────────────────────────────────────────────────────

  resetForm(): void {
    this.load();
  }

  // ─── Colour event (native picker fires 'input', not valueChanges) ─────────

  onColorInput(): void {
    // Angular reactive forms pick up native picker changes via valueChanges
    // but we call this explicitly for the <input type="color"> binding
    this.#applyPreview();
  }

  // ─── Live preview helper ──────────────────────────────────────────────────

  #applyPreview(): void {
    const p = this.#safeHex(this.f['primaryColor'].value,   '#C1522A');
    const s = this.#safeHex(this.f['secondaryColor'].value, '#F2EDE6');
    this.themeSvc.previewTheme(p, s);
  }

  // ─── Colour utilities (used in template) ──────────────────────────────────

  /** Return a slightly darker/lighter variant of the primary for inner accents */
  adjustedAccent(hex: string): string {
    return this.#shiftLightness(hex, -15);
  }

  /**
   * Returns '#ffffff' or '#1a1a1a' depending on hex background luminance.
   * Uses the WCAG relative-luminance formula so text is always readable.
   */
  contrastColor(hex: string): string {
    const rgb = this.#hexToRgb(hex);
    if (!rgb) return '#ffffff';
    // sRGB linearise
    const lin = (c: number) => {
      const s = c / 255;
      return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
    };
    const L = 0.2126 * lin(rgb.r) + 0.7152 * lin(rgb.g) + 0.0722 * lin(rgb.b);
    return L > 0.179 ? '#1a1a1a' : '#ffffff';
  }

  // ─── Private helpers ──────────────────────────────────────────────────────

  #patchForm(s: ISettings): void {
    this.form.patchValue({
      storeName:         s.storeName,
      primaryColor:      s.primaryColor,
      secondaryColor:    s.secondaryColor,
      heroText:          s.heroText ?? '',
      aboutText:         s.aboutText ?? '',
      googleAnalyticsId: s.googleAnalyticsId ?? '',
      contactPhone:      s.contactPhone ?? '',
      whatsappNumber:    s.whatsappNumber ?? '',
      contactEmail:      s.contactEmail ?? '',
      contactAddress:    s.contactAddress ?? '',
      facebookUrl:       s.facebookUrl ?? '',
      instagramUrl:      s.instagramUrl ?? '',
    });
    this.currentLogoUrl.set(s.logoUrl);
    this.previewLogoUrl.set(s.logoUrl);
    this.form.markAsPristine();
    this.#applyPreview();
  }

  #safeHex(val: string | null | undefined, fallback: string): string {
    return val && HEX_RE.test(val) ? val : fallback;
  }

  #hexToRgb(hex: string): { r: number; g: number; b: number } | null {
    const m = /^#([A-Fa-f0-9]{6})$/.exec(hex);
    if (!m) return null;
    const n = parseInt(m[1], 16);
    return { r: (n >> 16) & 0xff, g: (n >> 8) & 0xff, b: n & 0xff };
  }

  #shiftLightness(hex: string, delta: number): string {
    const rgb = this.#hexToRgb(hex);
    if (!rgb) return hex;
    const clamp = (v: number) => Math.max(0, Math.min(255, v));
    const r = clamp(rgb.r + delta);
    const g = clamp(rgb.g + delta);
    const b = clamp(rgb.b + delta);
    return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`;
  }
}
