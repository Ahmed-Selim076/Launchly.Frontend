import {
  Component, ChangeDetectionStrategy, OnInit, inject, signal, computed,
} from '@angular/core';
import { CommonModule }   from '@angular/common';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, Validators, ReactiveFormsModule, AbstractControl } from '@angular/forms';

import {
  BookingStoreService,
  IPublicService,
}                              from '../../../../../core/storefront/booking-store.service';
import { BookingTranslationService } from '../../../../../core/storefront/booking-translation.service';
import { AuthService }         from '../../../../../core/auth/auth.service';
import { BookingNavComponent }   from '../../layout/booking-nav/booking-nav.component';
import { BookingFooterComponent} from '../../layout/booking-footer/booking-footer.component';
import { CurrencyFormatPipe }  from '../../../../../shared/pipes/pipes';

/**
 * Phase 6 — Booking Storefront, Template 1 (Editorial)
 * Booking Confirm Page  (/book/:serviceId/confirm?slot=<ISO startTime>)
 *
 * Flow:
 *   1. Parse serviceId from route + slot (ISO datetime) from query param
 *   2. Load service details (name, price, duration)
 *   3. If customer is already authenticated → show summary + Notes field + Confirm button
 *   4. If NOT authenticated → show inline Register / Login tabs first,
 *      then on success proceed to booking
 *
 * Booking endpoint (confirmed from BookingStoreController.cs):
 *   POST /api/v1/store/booking/appointments
 *   [Authorize(Policy = "Customer")]
 *   Body: BookAppointmentRequest { ServiceId: Guid, StartTime: DateTime, Notes?: string }
 *
 * Customer register (confirmed from StoreController.cs):
 *   POST /api/v1/store/register
 *   Body: RegisterCustomerRequest { FirstName, LastName, Email, Password }
 *
 * Customer login (confirmed from AuthController.cs):
 *   POST /api/v1/auth/login-customer
 *   Body: LoginRequest { Email, Password }
 *
 * StartTime sent to the server: the raw ISO string from query param
 *   (it was stored as slot.startTime which is already a full ISO datetime from the server)
 */

type AuthTab  = 'register' | 'login';
type PageStep = 'auth' | 'confirm' | 'success';

@Component({
  selector: 'app-booking-editorial-confirm',
  standalone: true,
  imports: [
    CommonModule, RouterLink, ReactiveFormsModule,
    BookingNavComponent, BookingFooterComponent, CurrencyFormatPipe,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="min-h-screen bg-sf-bg">
      <app-booking-nav />

      <main class="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8 py-12">

        <!-- ══════════════════════════════════════════════════════════════
             BACK LINK
        ══════════════════════════════════════════════════════════════ -->
        @if (step() !== 'success') {
          <a
            [routerLink]="['/book', serviceId]"
            class="inline-flex items-center gap-1.5 text-sm text-sf-text-3
                   hover:text-sf-text-1 transition-colors mb-8 group"
          >
            <svg class="w-4 h-4 transition-transform group-hover:-translate-x-0.5"
                 [style.transform]="i18n.isRtl() ? 'scaleX(-1)' : null"
                 viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M10 3L5 8l5 5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            {{ i18n.t('confirm.changeDateTime') }}
          </a>
        }

        <!-- ══════════════════════════════════════════════════════════════
             BOOKING SUMMARY CARD  (always visible unless success)
        ══════════════════════════════════════════════════════════════ -->
        @if (step() !== 'success') {

          @if (serviceLoading()) {
            <div class="bg-sf-surface rounded-xl border border-sf-border p-6 mb-8 space-y-3 animate-pulse">
              <div class="h-5 bg-sf-surface-2 rounded w-48"></div>
              <div class="h-4 bg-sf-surface-2 rounded w-64"></div>
              <div class="h-4 bg-sf-surface-2 rounded w-40"></div>
            </div>
          } @else if (service()) {
            <div class="bg-sf-surface rounded-xl border border-sf-border p-6 mb-8">
              <!-- Coloured top strip -->
              <div class="h-1 w-full -mt-6 -mx-6 mb-6 rounded-t-xl"
                   style="background: var(--tenant-primary, #C1522A); opacity: 0.75; width: calc(100% + 3rem);"></div>

              <p class="text-xs font-semibold uppercase tracking-widest text-sf-text-3 mb-4"
                 style="letter-spacing: .12em;">
                {{ i18n.t('confirm.summary') }}
              </p>

              <h2 class="font-display font-black text-sf-text-1 text-2xl tracking-tight mb-4">
                {{ service()!.name }}
              </h2>

              <div class="space-y-2 text-sm">
                <!-- Date + time -->
                <div class="flex items-center gap-2.5 text-sf-text-1">
                  <svg class="w-4 h-4 shrink-0 text-sf-text-3" viewBox="0 0 16 16" fill="none"
                       stroke="currentColor" stroke-width="1.5">
                    <rect x="2" y="3" width="12" height="12" rx="1.5"/>
                    <path d="M11 1.5V4M5 1.5V4M2 6.5h12" stroke-linecap="round"/>
                  </svg>
                  <span>{{ fmtDay(slotDate) }}</span>
                </div>
                <!-- Time -->
                <div class="flex items-center gap-2.5 text-sf-text-1">
                  <svg class="w-4 h-4 shrink-0 text-sf-text-3" viewBox="0 0 16 16" fill="none"
                       stroke="currentColor" stroke-width="1.5">
                    <circle cx="8" cy="8" r="6.5"/>
                    <path d="M8 4.5V8l2.5 1.5" stroke-linecap="round"/>
                  </svg>
                  <span>
                    {{ fmtTime(slotDate) }}
                    <span class="text-sf-text-3">
                      ({{ service()!.durationMins }} {{ i18n.t('services.duration') }})
                    </span>
                  </span>
                </div>
                <!-- Price -->
                <div class="flex items-center gap-2.5 text-sf-text-1">
                  <svg class="w-4 h-4 shrink-0 text-sf-text-3" viewBox="0 0 16 16" fill="none"
                       stroke="currentColor" stroke-width="1.5">
                    <circle cx="8" cy="8" r="6.5"/>
                    <path d="M8 4.5v7M5.5 6a2.5 1.5 0 015 0c0 .83-1.12 1.5-2.5 1.5S5.5 8.33 5.5 9.5a2.5 1.5 0 005 0"
                          stroke-linecap="round"/>
                  </svg>
                  <span class="font-semibold">{{ service()!.price | currencyFormat }}</span>
                </div>
              </div>
            </div>
          } @else {
            <div class="bg-sf-surface rounded-xl border border-sf-border p-5 mb-8">
              <p class="text-sf-text-3 text-sm">{{ i18n.t('confirm.serviceError') }}</p>
            </div>
          }

        }

        <!-- ══════════════════════════════════════════════════════════════
             STEP: AUTH  (register / login)
        ══════════════════════════════════════════════════════════════ -->
        @if (step() === 'auth') {
          <div class="bg-sf-surface rounded-xl border border-sf-border p-6 sm:p-8">

            <p class="text-xs font-semibold uppercase tracking-widest text-sf-text-3 mb-5"
               style="letter-spacing: .12em;">
              {{ i18n.t('confirm.signIn') }}
            </p>

            <!-- Tabs -->
            <div class="flex border-b border-sf-border mb-6">
              <button
                type="button"
                (click)="authTab.set('register')"
                class="pb-3 text-sm font-semibold transition-colors mr-6"
                [style.color]="authTab() === 'register' ? 'var(--tenant-primary, #C1522A)' : ''"
                [style.borderBottom]="authTab() === 'register' ? '2px solid var(--tenant-primary, #C1522A)' : '2px solid transparent'"
              >
                {{ i18n.t('confirm.createAccount') }}
              </button>
              <button
                type="button"
                (click)="authTab.set('login')"
                class="pb-3 text-sm font-semibold transition-colors"
                [style.color]="authTab() === 'login' ? 'var(--tenant-primary, #C1522A)' : ''"
                [style.borderBottom]="authTab() === 'login' ? '2px solid var(--tenant-primary, #C1522A)' : '2px solid transparent'"
              >
                {{ i18n.t('confirm.logIn') }}
              </button>
            </div>

            <!-- ─── Register form ──────────────────────────────── -->
            @if (authTab() === 'register') {
              <div class="space-y-4">
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label class="block text-xs font-semibold text-sf-text-3 mb-1.5">
                      {{ i18n.t('confirm.firstName') }}
                    </label>
                    <input
                      [formControl]="$any(registerForm.get('firstName'))"
                      type="text"
                      autocomplete="given-name"
                      placeholder="Jane"
                      class="w-full px-3 py-2.5 bg-sf-bg border border-sf-border rounded-lg
                             text-sf-text-1 text-sm placeholder:text-sf-text-3
                             focus:outline-none focus:border-sf-border-2 transition-colors"
                      [class.border-red-400]="fieldInvalid(registerForm, 'firstName')"
                    />
                    @if (fieldInvalid(registerForm, 'firstName')) {
                      <p class="text-xs text-red-400 mt-1">{{ i18n.t('confirm.required') }}</p>
                    }
                  </div>
                  <div>
                    <label class="block text-xs font-semibold text-sf-text-3 mb-1.5">
                      {{ i18n.t('confirm.lastName') }}
                    </label>
                    <input
                      [formControl]="$any(registerForm.get('lastName'))"
                      type="text"
                      autocomplete="family-name"
                      placeholder="Doe"
                      class="w-full px-3 py-2.5 bg-sf-bg border border-sf-border rounded-lg
                             text-sf-text-1 text-sm placeholder:text-sf-text-3
                             focus:outline-none focus:border-sf-border-2 transition-colors"
                      [class.border-red-400]="fieldInvalid(registerForm, 'lastName')"
                    />
                    @if (fieldInvalid(registerForm, 'lastName')) {
                      <p class="text-xs text-red-400 mt-1">{{ i18n.t('confirm.required') }}</p>
                    }
                  </div>
                </div>

                <div>
                  <label class="block text-xs font-semibold text-sf-text-3 mb-1.5">
                    {{ i18n.t('confirm.email') }}
                  </label>
                  <input
                    [formControl]="$any(registerForm.get('email'))"
                    type="email"
                    autocomplete="email"
                    placeholder="jane@example.com"
                    class="w-full px-3 py-2.5 bg-sf-bg border border-sf-border rounded-lg
                           text-sf-text-1 text-sm placeholder:text-sf-text-3
                           focus:outline-none focus:border-sf-border-2 transition-colors"
                    [class.border-red-400]="fieldInvalid(registerForm, 'email')"
                  />
                  @if (fieldInvalid(registerForm, 'email')) {
                    <p class="text-xs text-red-400 mt-1">{{ i18n.t('confirm.validEmail') }}</p>
                  }
                </div>

                <div>
                  <label class="block text-xs font-semibold text-sf-text-3 mb-1.5">
                    {{ i18n.t('confirm.password') }}
                  </label>
                  <input
                    [formControl]="$any(registerForm.get('password'))"
                    type="password"
                    autocomplete="new-password"
                    placeholder="Min 8 characters"
                    class="w-full px-3 py-2.5 bg-sf-bg border border-sf-border rounded-lg
                           text-sf-text-1 text-sm placeholder:text-sf-text-3
                           focus:outline-none focus:border-sf-border-2 transition-colors"
                    [class.border-red-400]="fieldInvalid(registerForm, 'password')"
                  />
                  @if (fieldInvalid(registerForm, 'password')) {
                    <p class="text-xs text-red-400 mt-1">{{ i18n.t('confirm.min8') }}</p>
                  }
                </div>

                @if (authError()) {
                  <p class="text-sm text-red-400 bg-red-50 rounded-lg px-3 py-2.5">
                    {{ authError() }}
                  </p>
                }

                <button
                  type="button"
                  (click)="submitRegister()"
                  [disabled]="authLoading()"
                  class="w-full py-3 text-sm font-semibold rounded-md text-white
                         transition-all duration-150 active:scale-95
                         disabled:opacity-60 disabled:cursor-not-allowed"
                  style="background: var(--tenant-primary, #C1522A);"
                >
                  @if (authLoading()) {
                    <span class="inline-flex items-center gap-2">
                      <svg class="w-4 h-4 animate-spin" viewBox="0 0 16 16" fill="none">
                        <circle cx="8" cy="8" r="6" stroke="currentColor"
                                stroke-width="2" stroke-dasharray="28" stroke-dashoffset="10"/>
                      </svg>
                      {{ i18n.t('confirm.creating') }}
                    </span>
                  } @else {
                    {{ i18n.t('confirm.createBtn') }}
                  }
                </button>

                <p class="text-center text-xs text-sf-text-3">
                  {{ i18n.t('confirm.alreadyHave') }}
                  <button type="button" (click)="authTab.set('login')"
                          class="underline underline-offset-2 hover:text-sf-text-1 transition-colors">
                    {{ i18n.t('confirm.logIn') }}
                  </button>
                </p>
              </div>
            }

            <!-- ─── Login form ─────────────────────────────────── -->
            @if (authTab() === 'login') {
              <div class="space-y-4">
                <div>
                  <label class="block text-xs font-semibold text-sf-text-3 mb-1.5">
                    {{ i18n.t('confirm.email') }}
                  </label>
                  <input
                    [formControl]="$any(loginForm.get('email'))"
                    type="email"
                    autocomplete="email"
                    placeholder="jane@example.com"
                    class="w-full px-3 py-2.5 bg-sf-bg border border-sf-border rounded-lg
                           text-sf-text-1 text-sm placeholder:text-sf-text-3
                           focus:outline-none focus:border-sf-border-2 transition-colors"
                    [class.border-red-400]="fieldInvalid(loginForm, 'email')"
                  />
                  @if (fieldInvalid(loginForm, 'email')) {
                    <p class="text-xs text-red-400 mt-1">{{ i18n.t('confirm.validEmail') }}</p>
                  }
                </div>

                <div>
                  <label class="block text-xs font-semibold text-sf-text-3 mb-1.5">
                    {{ i18n.t('confirm.password') }}
                  </label>
                  <input
                    [formControl]="$any(loginForm.get('password'))"
                    type="password"
                    autocomplete="current-password"
                    placeholder="Your password"
                    class="w-full px-3 py-2.5 bg-sf-bg border border-sf-border rounded-lg
                           text-sf-text-1 text-sm placeholder:text-sf-text-3
                           focus:outline-none focus:border-sf-border-2 transition-colors"
                    [class.border-red-400]="fieldInvalid(loginForm, 'password')"
                  />
                  @if (fieldInvalid(loginForm, 'password')) {
                    <p class="text-xs text-red-400 mt-1">{{ i18n.t('confirm.required') }}</p>
                  }
                </div>

                @if (authError()) {
                  <p class="text-sm text-red-400 bg-red-50 rounded-lg px-3 py-2.5">
                    {{ authError() }}
                  </p>
                }

                <button
                  type="button"
                  (click)="submitLogin()"
                  [disabled]="authLoading()"
                  class="w-full py-3 text-sm font-semibold rounded-md text-white
                         transition-all duration-150 active:scale-95
                         disabled:opacity-60 disabled:cursor-not-allowed"
                  style="background: var(--tenant-primary, #C1522A);"
                >
                  @if (authLoading()) {
                    <span class="inline-flex items-center gap-2">
                      <svg class="w-4 h-4 animate-spin" viewBox="0 0 16 16" fill="none">
                        <circle cx="8" cy="8" r="6" stroke="currentColor"
                                stroke-width="2" stroke-dasharray="28" stroke-dashoffset="10"/>
                      </svg>
                      {{ i18n.t('confirm.loggingIn') }}
                    </span>
                  } @else {
                    {{ i18n.t('confirm.logInBtn') }}
                  }
                </button>

                <p class="text-center text-xs text-sf-text-3">
                  {{ i18n.t('confirm.noAccount') }}
                  <button type="button" (click)="authTab.set('register')"
                          class="underline underline-offset-2 hover:text-sf-text-1 transition-colors">
                    {{ i18n.t('confirm.createOne') }}
                  </button>
                </p>
              </div>
            }

          </div>
        }

        <!-- ══════════════════════════════════════════════════════════════
             STEP: CONFIRM  (authenticated — show notes + submit)
        ══════════════════════════════════════════════════════════════ -->
        @if (step() === 'confirm') {
          <div class="bg-sf-surface rounded-xl border border-sf-border p-6 sm:p-8">

            <p class="text-xs font-semibold uppercase tracking-widest text-sf-text-3 mb-5"
               style="letter-spacing: .12em;">
              {{ i18n.t('confirm.confirmTitle') }}
            </p>

            <!-- Notes field -->
            <div class="mb-6">
              <label class="block text-xs font-semibold text-sf-text-3 mb-1.5">
                {{ i18n.t('confirm.notes') }} <span class="font-normal">{{ i18n.t('confirm.optional') }}</span>
              </label>
              <textarea
                [formControl]="notesCtrl"
                rows="3"
                placeholder="{{ i18n.t('confirm.notesPlaceholder') }}"
                class="w-full px-3 py-2.5 bg-sf-bg border border-sf-border rounded-lg
                       text-sf-text-1 text-sm placeholder:text-sf-text-3 resize-none
                       focus:outline-none focus:border-sf-border-2 transition-colors"
              ></textarea>
            </div>

            @if (bookingError()) {
              <p class="text-sm text-red-400 bg-red-50 rounded-lg px-3 py-2.5 mb-5">
                {{ bookingError() }}
              </p>
            }

            <button
              type="button"
              (click)="submitBooking()"
              [disabled]="bookingLoading()"
              class="w-full py-3 text-sm font-semibold rounded-md text-white
                     transition-all duration-150 active:scale-95
                     disabled:opacity-60 disabled:cursor-not-allowed"
              style="background: var(--tenant-primary, #C1522A);"
            >
              @if (bookingLoading()) {
                <span class="inline-flex items-center justify-center gap-2">
                  <svg class="w-4 h-4 animate-spin" viewBox="0 0 16 16" fill="none">
                    <circle cx="8" cy="8" r="6" stroke="currentColor"
                            stroke-width="2" stroke-dasharray="28" stroke-dashoffset="10"/>
                  </svg>
                  {{ i18n.t('confirm.confirming') }}
                </span>
              } @else {
                {{ i18n.t('confirm.confirmBtn') }}
              }
            </button>

            <!-- Signed-in note -->
            <p class="text-center text-xs text-sf-text-3 mt-4">
              {{ i18n.t('confirm.bookingAs') }} <span class="text-sf-text-1 font-medium">{{ customerEmail() }}</span>
            </p>
          </div>
        }

        <!-- ══════════════════════════════════════════════════════════════
             STEP: SUCCESS
        ══════════════════════════════════════════════════════════════ -->
        @if (step() === 'success') {
          <div class="py-10 text-center">

            <!-- Checkmark -->
            <div class="w-16 h-16 rounded-full mx-auto mb-6 flex items-center justify-center"
                 style="background: var(--tenant-primary, #C1522A);">
              <svg class="w-8 h-8 text-white" viewBox="0 0 24 24" fill="none"
                   stroke="currentColor" stroke-width="2.5">
                <path d="M5 13l4 4L19 7" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>

            <h1 class="font-display font-black text-sf-text-1 text-3xl tracking-tight mb-2">
              {{ i18n.t('confirm.success.title') }}
            </h1>
            <p class="text-sf-text-3 text-sm mb-8">
              {{ i18n.t('confirm.success.desc') }}
            </p>

            <!-- Confirmed summary -->
            @if (service()) {
              <div class="inline-block text-left bg-sf-surface border border-sf-border
                          rounded-xl px-6 py-5 mb-8 min-w-[260px]">
                <p class="font-semibold text-sf-text-1 mb-3">{{ service()!.name }}</p>
                <div class="space-y-1.5 text-sm text-sf-text-3">
                  <p>{{ fmtDay(slotDate) }}</p>
                  <p>{{ fmtTime(slotDate) }} · {{ service()!.durationMins }} {{ i18n.t('services.duration') }}</p>
                  <p class="font-semibold text-sf-text-1 pt-1">
                    {{ service()!.price | currencyFormat }}
                  </p>
                </div>
              </div>
            }

            <div class="flex flex-col sm:flex-row items-center justify-center gap-3">
              <a
                routerLink="/services"
                class="inline-block px-6 py-2.5 text-sm font-semibold rounded-md
                       border transition-all duration-150 active:scale-95"
                style="border-color: var(--tenant-primary, #C1522A);
                       color: var(--tenant-primary, #C1522A);"
              >
                {{ i18n.t('confirm.bookAnother') }}
              </a>
              <a
                routerLink="/"
                class="inline-block px-6 py-2.5 text-sm font-semibold rounded-md
                       text-sf-text-3 hover:text-sf-text-1 transition-colors"
              >
                {{ i18n.t('confirm.backHome') }}
              </a>
            </div>
          </div>
        }

      </main>

      <app-booking-footer />
    </div>
  `,
})
export class BookingEditorialConfirmComponent implements OnInit {

  private readonly bookingSvc = inject(BookingStoreService);
  private readonly authSvc    = inject(AuthService);
  private readonly route      = inject(ActivatedRoute);
  private readonly router     = inject(Router);
  private readonly fb         = inject(FormBuilder);
  readonly i18n = inject(BookingTranslationService);

  // ─── Route params ─────────────────────────────────────────────────────────
  serviceId!: string;
  slotIso!: string;           // raw ISO datetime from query param
  slotDate!: Date;            // parsed for display

  // ─── Service meta ─────────────────────────────────────────────────────────
  readonly service        = signal<IPublicService | null>(null);
  readonly serviceLoading = signal(true);

  // ─── Page flow ────────────────────────────────────────────────────────────
  readonly step         = signal<PageStep>('auth');
  readonly customerEmail = signal<string>('');

  // ─── Auth state ───────────────────────────────────────────────────────────
  readonly authTab     = signal<AuthTab>('register');
  readonly authLoading = signal(false);
  readonly authError   = signal('');

  readonly registerForm = this.fb.group({
    firstName: ['', Validators.required],
    lastName:  ['', Validators.required],
    email:     ['', [Validators.required, Validators.email]],
    password:  ['', [Validators.required, Validators.minLength(8)]],
  });

  readonly loginForm = this.fb.group({
    email:    ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });

  // ─── Booking state ────────────────────────────────────────────────────────
  readonly bookingLoading = signal(false);
  readonly bookingError   = signal('');
  readonly notesCtrl      = this.fb.control('');

  // ─── Lifecycle ────────────────────────────────────────────────────────────
  ngOnInit(): void {
    this.serviceId = this.route.snapshot.paramMap.get('serviceId') ?? '';
    this.slotIso   = this.route.snapshot.queryParamMap.get('slot') ?? '';

    if (!this.serviceId || !this.slotIso) {
      this.router.navigate(['/services']);
      return;
    }

    this.slotDate = new Date(this.slotIso);

    // If already authenticated as customer → skip auth step


    if (this.authSvc.isCustomer()) {
      this.customerEmail.set(this.authSvc.currentUser()?.email ?? '');
      this.step.set('confirm');
    }

    // Load service details
    this.bookingSvc.getServiceById(this.serviceId).subscribe({
      next: res => {
        this.serviceLoading.set(false);
        if (res.success && res.data) this.service.set(res.data);
      },
      error: () => this.serviceLoading.set(false),
    });
  }

  // ─── Locale-aware date/time formatting (see booking-calendar for why
  //     this bypasses Angular's static-locale DatePipe) ─────────────────────
  fmtDay(date: Date): string {
    const locale = this.i18n.locale() === 'ar' ? 'ar-EG' : 'en-US';
    return date.toLocaleDateString(locale, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  }

  fmtTime(date: Date): string {
    const locale = this.i18n.locale() === 'ar' ? 'ar-EG' : 'en-US';
    return date.toLocaleTimeString(locale, { hour: 'numeric', minute: '2-digit' });
  }

  // ─── Auth: Register ───────────────────────────────────────────────────────
  submitRegister(): void {
    this.registerForm.markAllAsTouched();
    if (this.registerForm.invalid) return;

    this.authLoading.set(true);
    this.authError.set('');

    const { firstName, lastName, email, password } = this.registerForm.value;

    this.authSvc.registerCustomer({ firstName: firstName!, lastName: lastName!, email: email!, password: password! })
      .subscribe({
        next: res => {
          if (res.success) {
            // Auto-login after register
            this.authSvc.loginCustomer({ email: email!, password: password! })
              .subscribe({
                next: loginRes => {
                  this.authLoading.set(false);
                  if (loginRes.success) {
                    this.customerEmail.set(email!);
                    this.step.set('confirm');
                  } else {
                    // Register succeeded but auto-login failed → switch to login tab
                    this.authTab.set('login');
                    this.authError.set('Account created. Please log in.');
                  }
                },
                error: () => {
                  this.authLoading.set(false);
                  this.authTab.set('login');
                  this.authError.set('Account created. Please log in.');
                },
              });
          } else {
            this.authLoading.set(false);
            this.authError.set(res.message ?? 'Registration failed. Please try again.');
          }
        },
        error: () => {
          this.authLoading.set(false);
          this.authError.set('Something went wrong. Please try again.');
        },
      });
  }

  // ─── Auth: Login ──────────────────────────────────────────────────────────
  submitLogin(): void {
    this.loginForm.markAllAsTouched();
    if (this.loginForm.invalid) return;

    this.authLoading.set(true);
    this.authError.set('');

    const { email, password } = this.loginForm.value;

    this.authSvc.loginCustomer({ email: email!, password: password! })
      .subscribe({
        next: res => {
          this.authLoading.set(false);
          if (res.success) {
            this.customerEmail.set(email!);
            this.step.set('confirm');
          } else {
            this.authError.set(res.message ?? 'Invalid email or password.');
          }
        },
        error: () => {
          this.authLoading.set(false);
          this.authError.set('Invalid email or password.');
        },
      });
  }

  // ─── Booking: Submit ──────────────────────────────────────────────────────
  // POST /api/v1/store/booking/appointments
  // Body: { ServiceId: guid, StartTime: ISO datetime, Notes?: string }
  // StartTime = slotIso (already a full ISO datetime from the server's AvailableSlotDto.StartTime)
  submitBooking(): void {
    this.bookingLoading.set(true);
    this.bookingError.set('');

    this.bookingSvc.bookAppointment({
      serviceId: this.serviceId,
      startTime: this.slotIso,
      notes:     this.notesCtrl.value ?? undefined,
    }).subscribe({
      next: res => {
        this.bookingLoading.set(false);
        if (res.success) {
          this.step.set('success');
        } else {
          this.bookingError.set(res.message ?? 'Booking failed. Please try again.');
        }
      },
      error: () => {
        this.bookingLoading.set(false);
        this.bookingError.set('Something went wrong. Please try again.');
      },
    });
  }

  // ─── Form validation helper ───────────────────────────────────────────────
  fieldInvalid(form: ReturnType<FormBuilder['group']>, name: string): boolean {
    const ctrl = form.get(name) as AbstractControl | null;
    return !!(ctrl && ctrl.invalid && (ctrl.dirty || ctrl.touched));
  }
}
