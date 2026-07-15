import {
  Component, inject, signal, computed,
  ChangeDetectionStrategy, OnDestroy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators, AbstractControl, ValidatorFn } from '@angular/forms';
import { debounceTime, distinctUntilChanged, switchMap, Subject, takeUntil, catchError, of } from 'rxjs';

import { AuthService } from '../../../core/auth/auth.service';
import { TenantService } from '../../../core/tenant/tenant.service';
import { ToastService } from '../../../shared/components/toast/toast.service';
import { ButtonComponent } from '../../../shared/components/button/button.component';
import { InputComponent } from '../../../shared/components/input/input.component';
import { SpinnerComponent } from '../../../shared/components/spinner/spinner.component';
import { StoreType, ITemplateOption } from '../../../core/models';
import { HttpClient } from '@angular/common/http';
import { environment } from '@env/environment';
import { IApiResponse } from '../../../core/models';

// ─── Step definitions ─────────────────────────────────────────────────────────

type Step = 1 | 2 | 3 | 4 | 5;

interface StoreTypeOption {
  type: StoreType;
  label: string;
  icon: string;
  description: string;
}

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [
    CommonModule, RouterLink, ReactiveFormsModule,
    ButtonComponent, InputComponent, SpinnerComponent,
  ],
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

      <!-- Progress bar -->
      <div class="h-1 bg-sf-surface-2">
        <div
          class="h-full bg-accent transition-all duration-[600ms] ease-[cubic-bezier(0.4,0,0.2,1)]"
          [style.width]="progressWidth()"
        ></div>
      </div>

      <!-- Content -->
      <div class="flex-1 flex items-start justify-center py-12 px-6">
        <div class="w-full max-w-lg">

          <!-- Step indicators -->
          <div class="flex items-center gap-2 mb-8 justify-center">
            @for (s of [1,2,3,4,5]; track s) {
              <div class="flex items-center gap-2">
                <div
                  class="w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold
                         transition-colors duration-[220ms]"
                  [class.bg-accent]="currentStep() >= s"
                  [class.text-white]="currentStep() >= s"
                  [class.bg-sf-surface-2]="currentStep() < s"
                  [class.text-sf-text-3]="currentStep() < s"
                >
                  {{ currentStep() > s ? '✓' : s }}
                </div>
                @if (s < 5) {
                  <div class="w-8 h-px transition-colors duration-[220ms]"
                    [class.bg-accent]="currentStep() > s"
                    [class.bg-sf-border]="currentStep() <= s">
                  </div>
                }
              </div>
            }
          </div>

          <!-- ── STEP 1: Personal Info ── -->
          @if (currentStep() === 1) {
            <div class="animate-reveal-in">
              <h1 class="font-display text-3xl font-bold text-sf-text-1 mb-2">Create your account</h1>
              <p class="text-sf-text-3 mb-8">Let's start with your personal details.</p>

              <form [formGroup]="step1Form" (ngSubmit)="goToStep(2)" class="flex flex-col gap-5">
                <div class="grid grid-cols-2 gap-4">
                  <app-input
                    formControlName="firstName"
                    label="First name"
                    placeholder="Ahmed"
                    [required]="true"
                    [error]="fieldError(step1Form, 'firstName')"
                  ></app-input>
                  <app-input
                    formControlName="lastName"
                    label="Last name"
                    placeholder="Hassan"
                    [required]="true"
                    [error]="fieldError(step1Form, 'lastName')"
                  ></app-input>
                </div>
                <app-input
                  formControlName="email"
                  label="Email address"
                  type="email"
                  placeholder="you@example.com"
                  [required]="true"
                  autocomplete="email"
                  [error]="fieldError(step1Form, 'email')"
                ></app-input>
                <app-input
                  formControlName="password"
                  label="Password"
                  type="password"
                  placeholder="8+ characters"
                  [required]="true"
                  autocomplete="new-password"
                  [error]="fieldError(step1Form, 'password')"
                ></app-input>
                <app-button variant="primary" type="submit" [fullWidth]="true" size="lg">
                  Continue
                </app-button>
              </form>
            </div>
          }

          <!-- ── STEP 2: Store Info + Subdomain ── -->
          @if (currentStep() === 2) {
            <div class="animate-reveal-in">
              <h1 class="font-display text-3xl font-bold text-sf-text-1 mb-2">Name your store</h1>
              <p class="text-sf-text-3 mb-8">Choose a name and a unique web address for your store.</p>

              <form [formGroup]="step2Form" (ngSubmit)="goToStep(3)" class="flex flex-col gap-5">
                <app-input
                  formControlName="storeName"
                  label="Store name"
                  placeholder="My Awesome Store"
                  [required]="true"
                  [error]="fieldError(step2Form, 'storeName')"
                ></app-input>

                <!-- Subdomain field with live check -->
                <div class="flex flex-col gap-1.5">
                  <label class="text-sm font-medium text-sf-text-2">
                    Subdomain <span class="text-[var(--color-danger)] ml-0.5">*</span>
                  </label>
                  <div class="flex items-center rounded-md border overflow-hidden
                              transition-colors duration-[120ms]"
                    [class.border-accent]="subdomainAvailable() === true"
                    [class.border-[var(--color-danger)]]="subdomainAvailable() === false"
                    [class.border-sf-border]="subdomainAvailable() === null"
                  >
                    <input
                      formControlName="subdomain"
                      placeholder="my-store"
                      class="flex-1 px-3.5 py-2.5 text-base bg-sf-surface-2 text-sf-text-1
                             placeholder:text-sf-text-3 focus:outline-none"
                    />
                    <span class="px-3 py-2.5 bg-sf-surface border-l border-sf-border
                                 text-sm text-sf-text-3 whitespace-nowrap font-mono-code">
                      .launchly.com
                    </span>
                    <div class="px-3">
                      @if (checkingSubdomain()) {
                        <app-spinner size="sm"></app-spinner>
                      } @else if (subdomainAvailable() === true) {
                        <span class="text-[var(--color-success)] text-sm">✓</span>
                      } @else if (subdomainAvailable() === false) {
                        <span class="text-[var(--color-danger)] text-sm">✕</span>
                      }
                    </div>
                  </div>
                  @if (subdomainAvailable() === false) {
                    <p class="text-xs text-[var(--color-danger)]">
                      This subdomain is taken — try another one.
                    </p>
                  } @else if (subdomainAvailable() === true) {
                    <p class="text-xs text-[var(--color-success)]">
                      Great, this one is available!
                    </p>
                  } @else {
                    <p class="text-xs text-sf-text-3">
                      Only lowercase letters, numbers, and hyphens.
                    </p>
                  }
                </div>

                <div class="flex gap-3 mt-2">
                  <app-button variant="secondary" [fullWidth]="true" (clicked)="goToStep(1)">
                    Back
                  </app-button>
                  <app-button
                    variant="primary" type="submit" [fullWidth]="true" size="lg"
                    [disabled]="subdomainAvailable() !== true"
                  >
                    Continue
                  </app-button>
                </div>
              </form>
            </div>
          }

          <!-- ── STEP 3: Store Type ── -->
          @if (currentStep() === 3) {
            <div class="animate-reveal-in">
              <h1 class="font-display text-3xl font-bold text-sf-text-1 mb-2">What do you sell?</h1>
              <p class="text-sf-text-3 mb-8">Pick the type of store that best fits your business.</p>

              <div class="flex flex-col gap-3 mb-8">
                @for (opt of storeTypeOptions; track opt.type) {
                  <button
                    type="button"
                    (click)="selectStoreType(opt.type)"
                    class="w-full text-left rounded-lg border p-4 transition-all duration-[120ms]
                           hover:border-sf-border-2 focus-visible:outline-none
                           focus-visible:ring-2 focus-visible:ring-accent"
                    [class.border-accent]="selectedStoreType() === opt.type"
                    [class.bg-accent-dim]="selectedStoreType() === opt.type"
                    [class.border-sf-border]="selectedStoreType() !== opt.type"
                    [class.bg-sf-surface]="selectedStoreType() !== opt.type"
                  >
                    <div class="flex items-center gap-4">
                      <span class="text-2xl">{{ opt.icon }}</span>
                      <div class="flex-1">
                        <p class="font-semibold text-sf-text-1">{{ opt.label }}</p>
                        <p class="text-sm text-sf-text-3 mt-0.5">{{ opt.description }}</p>
                      </div>
                      <div class="w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0"
                        [class.border-accent]="selectedStoreType() === opt.type"
                        [class.border-sf-border-2]="selectedStoreType() !== opt.type"
                      >
                        @if (selectedStoreType() === opt.type) {
                          <div class="w-2.5 h-2.5 rounded-full bg-accent"></div>
                        }
                      </div>
                    </div>
                  </button>
                }
              </div>

              <div class="flex gap-3">
                <app-button variant="secondary" [fullWidth]="true" (clicked)="goToStep(2)">
                  Back
                </app-button>
                <app-button
                  variant="primary" [fullWidth]="true" size="lg"
                  [disabled]="selectedStoreType() === null"
                  (clicked)="onStoreTypeNext()"
                >
                  Continue
                </app-button>
              </div>
            </div>
          }

          <!-- ── STEP 4: Template Picker ── -->
          @if (currentStep() === 4) {
            <div class="animate-reveal-in">
              <h1 class="font-display text-3xl font-bold text-sf-text-1 mb-2">Choose your layout</h1>
              <p class="text-sf-text-3 mb-8">
                Pick a starting template — each one has a completely different layout structure.
                You can't change this later, but you can customise everything else.
              </p>

              @if (loadingTemplates()) {
                <div class="flex justify-center py-12">
                  <app-spinner size="lg"></app-spinner>
                </div>
              } @else {
                <div class="flex flex-col gap-4 mb-8">
                  @for (tpl of templates(); track tpl.templateId) {
                    <button
                      type="button"
                      (click)="selectedTemplateId.set(tpl.templateId)"
                      class="w-full text-left rounded-lg border overflow-hidden
                             transition-all duration-[120ms] focus-visible:outline-none
                             focus-visible:ring-2 focus-visible:ring-accent"
                      [class.border-accent]="selectedTemplateId() === tpl.templateId"
                      [class.ring-2]="selectedTemplateId() === tpl.templateId"
                      [class.ring-accent]="selectedTemplateId() === tpl.templateId"
                      [class.border-sf-border]="selectedTemplateId() !== tpl.templateId"
                    >
                      <!-- Thumbnail -->
                      <div class="h-36 bg-sf-surface-2 flex items-center justify-center
                                  border-b border-sf-border">
                        @if (tpl.thumbnailUrl) {
                          <img
                            [src]="tpl.thumbnailUrl"
                            [alt]="tpl.name + ' template preview'"
                            class="w-full h-full object-cover"
                          />
                        } @else {
                          <div class="text-sf-text-3 text-sm font-medium">
                            {{ tpl.name }} Preview
                          </div>
                        }
                      </div>
                      <!-- Label -->
                      <div class="px-4 py-3 flex items-center justify-between bg-sf-bg">
                        <span class="font-semibold text-sf-text-1">{{ tpl.name }}</span>
                        @if (selectedTemplateId() === tpl.templateId) {
                          <span class="text-xs font-medium text-accent bg-accent-dim
                                       px-2 py-0.5 rounded-full">Selected</span>
                        }
                      </div>
                    </button>
                  }
                </div>

                <div class="flex gap-3">
                  <app-button variant="secondary" [fullWidth]="true" (clicked)="goToStep(3)">
                    Back
                  </app-button>
                  <app-button
                    variant="primary" [fullWidth]="true" size="lg"
                    [disabled]="selectedTemplateId() === null"
                    (clicked)="goToStep(5)"
                  >
                    Continue
                  </app-button>
                </div>
              }
            </div>
          }

          <!-- ── STEP 5: Confirm + Create ── -->
          @if (currentStep() === 5) {
            <div class="animate-reveal-in">
              <h1 class="font-display text-3xl font-bold text-sf-text-1 mb-2">
                You're all set!
              </h1>
              <p class="text-sf-text-3 mb-8">Review your details and launch your store.</p>

              <!-- Summary receipt -->
              <div class="rounded-lg border border-sf-border bg-sf-surface p-5 mb-8
                          animate-receipt-unfold divide-y divide-sf-border">
                <div class="flex justify-between py-2.5 text-sm">
                  <span class="text-sf-text-3">Name</span>
                  <span class="text-sf-text-1 font-medium">
                    {{ step1Form.value.firstName }} {{ step1Form.value.lastName }}
                  </span>
                </div>
                <div class="flex justify-between py-2.5 text-sm">
                  <span class="text-sf-text-3">Email</span>
                  <span class="text-sf-text-1 font-medium">{{ step1Form.value.email }}</span>
                </div>
                <div class="flex justify-between py-2.5 text-sm">
                  <span class="text-sf-text-3">Store</span>
                  <span class="text-sf-text-1 font-medium">{{ step2Form.value.storeName }}</span>
                </div>
                <div class="flex justify-between py-2.5 text-sm">
                  <span class="text-sf-text-3">URL</span>
                  <span class="text-sf-text-1 font-medium font-mono-code text-xs">
                    {{ step2Form.value.subdomain }}.launchly.com
                  </span>
                </div>
                <div class="flex justify-between py-2.5 text-sm">
                  <span class="text-sf-text-3">Store type</span>
                  <span class="text-sf-text-1 font-medium">{{ storeTypeLabel() }}</span>
                </div>
                <div class="flex justify-between py-2.5 text-sm">
                  <span class="text-sf-text-3">Template</span>
                  <span class="text-sf-text-1 font-medium">{{ templateLabel() }}</span>
                </div>
              </div>

              <div class="flex gap-3">
                <app-button variant="secondary" [fullWidth]="true" (clicked)="goToStep(4)">
                  Back
                </app-button>
                <app-button
                  variant="primary" [fullWidth]="true" size="lg"
                  [loading]="submitting()"
                  (clicked)="submit()"
                >
                  Launch my store 🚀
                </app-button>
              </div>
            </div>
          }

        </div>
      </div>
    </div>
  `,
})
export class SignupComponent implements OnDestroy {
  private readonly fb      = inject(FormBuilder);
  private readonly auth    = inject(AuthService);
  private readonly tenantService = inject(TenantService);
  private readonly toast   = inject(ToastService);
  private readonly http    = inject(HttpClient);
  private readonly destroy$ = new Subject<void>();

  // ─── Step State ───────────────────────────────────────────────────────────

  readonly currentStep = signal<Step>(1);

  readonly progressWidth = computed(() => `${((this.currentStep() - 1) / 4) * 100}%`);

  // ─── Forms ────────────────────────────────────────────────────────────────

  readonly step1Form = this.fb.group({
    firstName: ['', [Validators.required, Validators.minLength(2)]],
    lastName:  ['', [Validators.required, Validators.minLength(2)]],
    email:     ['', [Validators.required, Validators.email]],
    password:  ['', [Validators.required, Validators.minLength(8), strongPasswordValidator()]],
  });

  readonly step2Form = this.fb.group({
    storeName: ['', [Validators.required, Validators.minLength(2)]],
    subdomain: ['', [Validators.required, Validators.pattern(/^[a-z0-9-]{3,30}$/)]],
  });

  // ─── Subdomain Check ──────────────────────────────────────────────────────

  readonly checkingSubdomain  = signal(false);
  readonly subdomainAvailable = signal<boolean | null>(null);
  private readonly subdomainInput$ = new Subject<string>();

  constructor() {
    // Real-time subdomain availability check — debounced 400ms
    this.subdomainInput$.pipe(
      debounceTime(400),
      distinctUntilChanged(),
      takeUntil(this.destroy$),
      switchMap(subdomain => {
        this.checkingSubdomain.set(true);
        this.subdomainAvailable.set(null);
        return this.auth.checkSubdomain(subdomain).pipe(
          // A failed check (network blip, unexpected 4xx/5xx from the API)
          // must not kill this outer subscription — switchMap unsubscribes
          // the whole debounced pipeline when an inner observable errors,
          // which would silently stop checking every subdomain typed
          // afterwards for the rest of the session. Swallow it here instead.
          catchError(() => of({ success: false, data: false, message: undefined }))
        );
      })
    ).subscribe({
      next: res => {
        this.checkingSubdomain.set(false);
        // API returns true = available
        this.subdomainAvailable.set(res.success && (res.data ?? false));
      },
      error: () => {
        this.checkingSubdomain.set(false);
        this.subdomainAvailable.set(null);
      },
    });

    // Subscribe to subdomain control changes
    this.step2Form.get('subdomain')!.valueChanges.pipe(
      takeUntil(this.destroy$)
    ).subscribe(val => {
      const v = (val ?? '').toLowerCase().replace(/[^a-z0-9-]/g, '');
      if (v !== val) this.step2Form.patchValue({ subdomain: v }, { emitEvent: false });
      this.subdomainAvailable.set(null);
      if (v.length >= 3) this.subdomainInput$.next(v);
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ─── Store Type ───────────────────────────────────────────────────────────

  readonly selectedStoreType = signal<StoreType | null>(null);

  readonly storeTypeOptions: StoreTypeOption[] = [
    {
      type: StoreType.Ecommerce,
      label: 'Ecommerce',
      icon: '🛍️',
      description: 'Sell products online with cart, checkout, and inventory.',
    },
    {
      type: StoreType.Booking,
      label: 'Bookings',
      icon: '📅',
      description: 'Accept appointment bookings for your services.',
    },
    {
      type: StoreType.Restaurant,
      label: 'Restaurant',
      icon: '🍽️',
      description: 'Take online food orders with a customisable menu.',
    },
  ];

  selectStoreType(type: StoreType): void {
    this.selectedStoreType.set(type);
  }

  onStoreTypeNext(): void {
    if (this.selectedStoreType() === null) return;
    this.loadTemplates();
    this.goToStep(4);
  }

  storeTypeLabel(): string {
    return this.storeTypeOptions.find(o => o.type === this.selectedStoreType())?.label ?? '';
  }

  // ─── Templates ────────────────────────────────────────────────────────────

  readonly templates         = signal<ITemplateOption[]>([]);
  readonly loadingTemplates  = signal(false);
  readonly selectedTemplateId = signal<number | null>(null);

  loadTemplates(): void {
    const type = this.selectedStoreType();
    if (type === null) return;
    this.loadingTemplates.set(true);
    this.http
      .get<IApiResponse<ITemplateOption[]>>(
        `${environment.apiUrl}/v1/templates?storeType=${type}`
      )
      .subscribe({
        next: res => {
          this.loadingTemplates.set(false);
          const items = res.data ?? [];
          this.templates.set(items);
          if (items.length === 0) {
            // Shouldn't happen in production, but guard clearly
            this.toast.error(
              'No templates available for this store type. Please contact support.'
            );
          } else {
            // Auto-select first template
            this.selectedTemplateId.set(items[0].templateId);
          }
        },
        error: () => {
          this.loadingTemplates.set(false);
          this.toast.error('Failed to load templates. Please try again.');
        },
      });
  }

  templateLabel(): string {
    return this.templates().find(t => t.templateId === this.selectedTemplateId())?.name ?? '';
  }

  // ─── Navigation ───────────────────────────────────────────────────────────

  goToStep(step: number): void {
    if (step === 2 && this.step1Form.invalid) {
      this.step1Form.markAllAsTouched();
      return;
    }
    if (step === 3 && this.step2Form.invalid) {
      this.step2Form.markAllAsTouched();
      return;
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
    this.currentStep.set(step as Step);
  }

  // ─── Submit ───────────────────────────────────────────────────────────────

  readonly submitting = signal(false);

  submit(): void {
    if (this.submitting()) return;
    const s1 = this.step1Form.value;
    const s2 = this.step2Form.value;
    const storeType  = this.selectedStoreType();
    const templateId = this.selectedTemplateId();

    if (!s1.firstName || !s1.lastName || !s1.email || !s1.password ||
        !s2.storeName || !s2.subdomain || storeType === null || templateId === null) {
      this.toast.error('Please complete all steps before submitting.');
      return;
    }

    this.submitting.set(true);

    this.auth.register({
      firstName: s1.firstName,
      lastName:  s1.lastName,
      email:     s1.email,
      password:  s1.password,
      storeName: s2.storeName,
      subdomain: s2.subdomain,
      storeType,   // int — StoreType enum ordinal
      templateId,
    }).subscribe({
      next: res => {
        this.submitting.set(false);
        if (res.success && res.data) {
          this.toast.success('Store created! Welcome to Launchly 🎉');
          // Cross-origin redirect — NOT router.navigate(). The admin routes
          // only get registered by AppComponent once it boots on the
          // tenant's actual subdomain host (see TenantService.buildTenantUrl
          // doc comment). Staying on the platform host and calling
          // router.navigate(['/admin']) can never work: '/admin' isn't in
          // this host's route config at all.
          //
          // localStorage does NOT carry over in this redirect — the platform
          // root (localhost:4200) and the tenant subdomain
          // (smart-vipe.localhost:4200) are different origins as far as the
          // browser is concerned, even in dev. #storeSession() already wrote
          // the tokens to THIS origin's localStorage, which is useless on
          // the next page. So we also hand the tokens over via a URL
          // fragment (never sent to any server, unlike a query string) —
          // AppComponent's bootstrap reads it once on the new origin, saves
          // it to that origin's localStorage, and strips it from the URL.
          // Without this, every new tenant landed on /login right after
          // "successfully" creating their store.
          const authHandoff = encodeURIComponent(JSON.stringify({
            at: res.data.accessToken,
            rt: res.data.refreshToken,
          }));
          window.location.href =
            `${this.tenantService.buildTenantUrl(s2.subdomain!, '/admin')}#auth=${authHandoff}`;
        } else {
          this.toast.error(res.message ?? 'Registration failed. Please try again.');
        }
      },
      error: () => {
        this.submitting.set(false);
        this.toast.error('Something went wrong. Please try again.');
      },
    });
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────

  fieldError(form: ReturnType<FormBuilder['group']>, field: string): string {
    const ctrl: AbstractControl | null = form.get(field);
    if (!ctrl || !ctrl.touched || !ctrl.errors) return '';
    if (ctrl.errors['required'])       return 'This field is required.';
    if (ctrl.errors['email'])          return 'Please enter a valid email.';
    if (ctrl.errors['minlength'])      return `Minimum ${ctrl.errors['minlength'].requiredLength} characters.`;
    if (ctrl.errors['pattern'])        return 'Lowercase letters, numbers, and hyphens only (3–30 chars).';
    if (ctrl.errors['noUppercase'])    return 'Password must contain at least one uppercase letter.';
    if (ctrl.errors['noLowercase'])    return 'Password must contain at least one lowercase letter.';
    if (ctrl.errors['noDigit'])        return 'Password must contain at least one number.';
    return 'Invalid value.';
  }
}

/**
 * Mirrors the backend FluentValidation rules in AuthValidators.cs:
 * ApplyPasswordRules() requires uppercase + lowercase + digit (in addition
 * to minLength(8) which Angular's built-in Validators.minLength handles).
 * Keeping these in sync means the frontend rejects invalid passwords
 * before the API call, giving the user instant feedback.
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
