import {
  Component, ChangeDetectionStrategy, OnInit, inject, signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { ProductStoreService } from '../../../../../core/storefront/store.service';
import { CartService }         from '../../../../../core/storefront/cart.service';
import { AuthService }         from '../../../../../core/auth/auth.service';
import { StoreNavComponent }   from '../../../../layout/store-nav/store-nav.component';
import { StoreFooterComponent } from '../../../../layout/store-footer/store-footer.component';
import { IPlacedOrder }        from '../../../../../core/models';
import { CurrencyFormatPipe }  from '../../../../../shared/pipes/pipes';
import { PASSWORD_VALIDATORS } from '../../../../../shared/validators/password.validator';

type CheckoutStep = 'form' | 'placing' | 'success';

/**
 * Template 1 Minimal — Checkout
 *
 * Flow:
 *   1. Customer fills name/email/notes (no auth required — guest order)
 *   2. POST /store/orders
 *   3. On success: receipt unfolds (Animation #5 from Design System 2.5)
 *      Each line item appears with 40ms stagger using clip-path.
 *   4. Cart is cleared.
 *
 * Auth note: The backend `POST /store/orders` requires a Customer JWT
 * (policy = "Customer"). The plan supports both guest checkout (register
 * inline) and logged-in customers. To keep this implementation clean and
 * non-blocking, we show the checkout form and if the user isn't logged in,
 * we first register them as a customer (POST /store/register), then place
 * the order. This matches the backend DTOs (RegisterCustomerRequest +
 * PlaceOrderRequest).
 */
@Component({
  selector: 'app-minimal-checkout',
  standalone: true,
  imports: [
    CommonModule, RouterLink, ReactiveFormsModule,
    StoreNavComponent, StoreFooterComponent, CurrencyFormatPipe,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="min-h-screen bg-sf-bg">
      <app-store-nav />

      <main class="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-12">

        <!-- ── Guard: empty cart ── -->
        @if (cartSvc.isEmpty() && step() === 'form') {
          <div class="rounded-2xl bg-sf-surface border border-sf-border py-24 text-center">
            <h2 class="font-display font-bold text-sf-text-1 text-xl mb-3">Nothing to check out</h2>
            <a routerLink="/products"
               class="text-sm font-medium"
               style="color: var(--tenant-primary, #C1522A);">
              ← Shop products
            </a>
          </div>
        }

        <!-- ══════════════════════════════════════════════════════════
             STEP 1 — Checkout form
        ══════════════════════════════════════════════════════════ -->
        @if (step() === 'form' && !cartSvc.isEmpty()) {
          <div class="grid grid-cols-1 lg:grid-cols-5 gap-10">

            <!-- LEFT — form -->
            <div class="lg:col-span-3">
              <h1 class="font-display font-bold text-sf-text-1 text-3xl mb-8">Checkout</h1>

              <form [formGroup]="form" (ngSubmit)="submit()" novalidate class="space-y-5">

                <!-- Contact -->
                <div>
                  <h2 class="font-medium text-sf-text-1 text-sm uppercase tracking-wide mb-4">
                    Contact
                  </h2>
                  <div class="grid grid-cols-2 gap-4">
                    <div>
                      <label class="block text-sm text-sf-text-2 mb-1.5">First Name *</label>
                      <input
                        formControlName="firstName"
                        type="text"
                        autocomplete="given-name"
                        class="input-sf"
                        [class.ring-2]="f['firstName'].touched && f['firstName'].invalid"
                        style="--ring-color: var(--color-danger)"
                      />
                      @if (f['firstName'].touched && f['firstName'].errors?.['required']) {
                        <p class="mt-1 text-xs text-[var(--color-danger)]">Required</p>
                      }
                    </div>
                    <div>
                      <label class="block text-sm text-sf-text-2 mb-1.5">Last Name *</label>
                      <input
                        formControlName="lastName"
                        type="text"
                        autocomplete="family-name"
                        class="input-sf"
                        [class.ring-2]="f['lastName'].touched && f['lastName'].invalid"
                      />
                      @if (f['lastName'].touched && f['lastName'].errors?.['required']) {
                        <p class="mt-1 text-xs text-[var(--color-danger)]">Required</p>
                      }
                    </div>
                  </div>

                  <div class="mt-4">
                    <label class="block text-sm text-sf-text-2 mb-1.5">Email *</label>
                    <input
                      formControlName="email"
                      type="email"
                      autocomplete="email"
                      class="input-sf w-full"
                      [class.ring-2]="f['email'].touched && f['email'].invalid"
                    />
                    @if (f['email'].touched && f['email'].errors?.['required']) {
                      <p class="mt-1 text-xs text-[var(--color-danger)]">Required</p>
                    }
                    @if (f['email'].touched && f['email'].errors?.['email']) {
                      <p class="mt-1 text-xs text-[var(--color-danger)]">Enter a valid email</p>
                    }
                  </div>

                  <!-- Password — only shown if not logged in (needed to register as customer) -->
                  @if (!authSvc.isCustomer()) {
                    <div class="mt-4">
                      <label class="block text-sm text-sf-text-2 mb-1.5">
                        Password *
                        <span class="text-sf-text-3 font-normal ml-1">(creates your account)</span>
                      </label>
                      <input
                        formControlName="password"
                        type="password"
                        autocomplete="new-password"
                        class="input-sf w-full"
                        [class.ring-2]="f['password'].touched && f['password'].invalid"
                      />
                      @if (f['password'].touched && f['password'].errors?.['required']) {
                        <p class="mt-1 text-xs text-[var(--color-danger)]">Required</p>
                      }
                      @if (f['password'].touched && f['password'].errors?.['minlength']) {
                        <p class="mt-1 text-xs text-[var(--color-danger)]">At least 8 characters</p>
                      }
                    </div>
                  }
                </div>

                <!-- Order notes -->
                <div>
                  <label class="block text-sm text-sf-text-2 mb-1.5">
                    Order Notes
                    <span class="text-sf-text-3 font-normal ml-1">(optional)</span>
                  </label>
                  <textarea
                    formControlName="notes"
                    rows="3"
                    placeholder="Special instructions, delivery preferences…"
                    class="input-sf w-full resize-none"
                  ></textarea>
                </div>

                <!-- Error -->
                @if (submitError()) {
                  <div class="rounded-lg bg-[var(--color-danger-dim)] border border-[var(--color-danger)]/20
                              px-4 py-3 text-sm text-[var(--color-danger)]">
                    {{ submitError() }}
                  </div>
                }

                <!-- Submit -->
                <button
                  type="submit"
                  [disabled]="placing()"
                  class="w-full flex items-center justify-center gap-2 py-3.5 rounded-full
                         text-sm font-semibold text-white transition-all duration-220
                         disabled:opacity-60 hover:-translate-y-0.5"
                  style="background: var(--tenant-primary, #C1522A);
                         box-shadow: 0 4px 16px rgba(0,0,0,.12);"
                >
                  @if (placing()) {
                    <span class="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin"></span>
                    Placing order…
                  } @else {
                    Place Order →
                  }
                </button>

              </form>
            </div>

            <!-- RIGHT — order summary -->
            <div class="lg:col-span-2">
              <div class="sticky top-24 rounded-xl bg-sf-surface border border-sf-border p-5">
                <h2 class="font-display font-bold text-sf-text-1 text-base mb-4">Order Summary</h2>

                <ul class="space-y-3 mb-4">
                  @for (item of cartSvc.items(); track item.productId) {
                    <li class="flex items-start gap-3">
                      <!-- Thumbnail -->
                      <div class="w-12 h-12 rounded-lg bg-sf-surface-2 overflow-hidden flex-shrink-0">
                        @if (item.imageUrl) {
                          <img [src]="item.imageUrl" [alt]="item.name"
                               class="w-full h-full object-cover" loading="lazy"/>
                        }
                      </div>
                      <div class="flex-1 min-w-0">
                        <p class="text-sm text-sf-text-1 leading-snug line-clamp-2">{{ item.name }}</p>
                        <p class="text-xs text-sf-text-3">Qty: {{ item.quantity }}</p>
                      </div>
                      <span class="text-sm font-medium text-sf-text-1 flex-shrink-0">
                        {{ (item.price * item.quantity) | currencyFormat }}
                      </span>
                    </li>
                  }
                </ul>

                <div class="border-t border-sf-border pt-4 flex items-baseline justify-between">
                  <span class="font-semibold text-sf-text-1">Total</span>
                  <span class="font-bold text-xl text-sf-text-1">
                    {{ cartSvc.subtotal() | currencyFormat }}
                  </span>
                </div>
              </div>
            </div>

          </div>
        }

        <!-- ══════════════════════════════════════════════════════════
             STEP 2 — Placing (full-page loading)
        ══════════════════════════════════════════════════════════ -->
        @if (step() === 'placing') {
          <div class="flex flex-col items-center justify-center py-32 gap-4">
            <div class="w-12 h-12 rounded-full border-4 border-sf-border animate-spin"
                 style="border-top-color: var(--tenant-primary, #C1522A);"></div>
            <p class="text-sf-text-2 text-sm">Placing your order…</p>
          </div>
        }

        <!-- ══════════════════════════════════════════════════════════
             STEP 3 — Success / Receipt Unfold
        ══════════════════════════════════════════════════════════ -->
        @if (step() === 'success' && placedOrder()) {
          <div class="max-w-lg mx-auto">

            <!-- Header -->
            <div class="text-center mb-10">
              <!-- Animated checkmark circle -->
              <div
                class="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5"
                style="background: var(--color-success-dim);"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"
                     stroke-linecap="round" stroke-linejoin="round"
                     class="w-8 h-8" style="color: var(--color-success);">
                  <path d="M20 6L9 17l-5-5"/>
                </svg>
              </div>
              <h1 class="font-display font-bold text-sf-text-1 text-3xl mb-2">Order Placed!</h1>
              <p class="text-sf-text-2 text-sm">
                Thank you. Your order
                <span class="font-mono font-medium text-sf-text-1">
                  #{{ placedOrder()!.orderId.slice(0,8).toUpperCase() }}
                </span>
                has been received.
              </p>
            </div>

            <!-- Receipt card — unfolds with stagger -->
            <div class="rounded-2xl bg-sf-surface border border-sf-border overflow-hidden receipt-card">

              <!-- Status band -->
              <div
                class="px-6 py-3 flex items-center justify-between"
                style="background: var(--tenant-secondary, #F2EDE6);"
              >
                <span class="text-xs font-semibold uppercase tracking-wider text-sf-text-3">Status</span>
                <span class="text-xs font-semibold px-2.5 py-1 rounded-full bg-[var(--color-warning-dim)]
                             text-[var(--color-warning)]">
                  {{ placedOrder()!.status }}
                </span>
              </div>

              <!-- Line items — staggered unfold -->
              <ul class="divide-y divide-sf-border">
                @for (item of receiptItems(); track item; let i = $index) {
                  <li
                    class="receipt-item flex items-baseline justify-between px-6 py-3.5"
                    [style.animation-delay]="(i * 40) + 'ms'"
                  >
                    <div>
                      <p class="text-sm text-sf-text-1 font-medium">{{ item.name }}</p>
                      <p class="text-xs text-sf-text-3">
                        {{ item.unitPrice | currencyFormat }} × {{ item.quantity }}
                      </p>
                    </div>
                    <span class="text-sm font-semibold text-sf-text-1">
                      {{ item.lineTotal | currencyFormat }}
                    </span>
                  </li>
                }
              </ul>

              <!-- Total -->
              <div class="px-6 py-4 border-t border-sf-border bg-sf-bg flex items-baseline justify-between">
                <span class="font-semibold text-sf-text-1">Total</span>
                <span class="font-bold text-xl text-sf-text-1">
                  {{ placedOrder()!.totalAmount | currencyFormat }}
                </span>
              </div>
            </div>

            <!-- CTA -->
            <div class="flex flex-col sm:flex-row items-center gap-3 mt-8">
              <a
                routerLink="/products"
                class="flex-1 block text-center py-3.5 rounded-full text-sm font-semibold text-white
                       transition-all hover:-translate-y-0.5"
                style="background: var(--tenant-primary, #C1522A);"
              >
                Continue Shopping
              </a>
              <a
                routerLink="/account"
                class="flex-1 block text-center py-3.5 rounded-full text-sm font-semibold
                       border border-sf-border text-sf-text-2 hover:bg-sf-surface transition-colors"
              >
                View My Orders
              </a>
            </div>
          </div>
        }

      </main>

      <!-- Receipt unfold keyframes -->
      <style>
        .receipt-card {
          animation: receiptReveal 380ms cubic-bezier(0.16,1,0.3,1) both;
        }
        .receipt-item {
          opacity: 0;
          clip-path: inset(0 0 100% 0);
          animation: lineReveal 220ms cubic-bezier(0.16,1,0.3,1) forwards;
          animation-delay: 200ms;
        }
        @keyframes receiptReveal {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes lineReveal {
          to { opacity: 1; clip-path: inset(0 0 0% 0); }
        }
        @media (prefers-reduced-motion: reduce) {
          .receipt-card, .receipt-item {
            animation: none; opacity: 1; clip-path: none;
          }
        }
        .input-sf {
          @apply block w-full rounded-lg border border-sf-border bg-sf-surface text-sf-text-1
                 text-sm px-3 py-2.5 placeholder:text-sf-text-3
                 focus:outline-none focus:ring-2 focus:border-transparent transition;
          --tw-ring-color: var(--tenant-primary, #C1522A);
        }
      </style>

      <app-store-footer />
    </div>
  `,
})
export class MinimalCheckoutComponent implements OnInit {
  readonly cartSvc = inject(CartService);
  readonly authSvc = inject(AuthService);
  private readonly storeSvc = inject(ProductStoreService);
  private readonly fb       = inject(FormBuilder);

  readonly step         = signal<CheckoutStep>('form');
  readonly placing      = signal(false);
  readonly submitError  = signal('');
  readonly placedOrder  = signal<IPlacedOrder | null>(null);
  readonly receiptItems = signal<Array<{ name: string; unitPrice: number; quantity: number; lineTotal: number }>>([]);

  readonly form = this.fb.group({
    firstName: ['', Validators.required],
    lastName:  ['', Validators.required],
    email:     ['', [Validators.required, Validators.email]],
    password:  ['', [Validators.minLength(8), ...PASSWORD_VALIDATORS]],
    notes:     [''],
  });

  get f() { return this.form.controls; }

  ngOnInit(): void {
    // Pre-fill email if logged in
    const user = this.authSvc.currentUser();
    if (user) {
      this.form.patchValue({ email: user.email ?? '' });
      this.f['email'].disable();
      this.f['password'].clearValidators();
      this.f['password'].updateValueAndValidity();
    } else {
      this.f['password'].addValidators(Validators.required);
      this.f['password'].updateValueAndValidity();
    }
  }

  submit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    if (this.cartSvc.isEmpty()) return;

    this.submitError.set('');
    this.step.set('placing');
    this.placing.set(true);

    const doPlaceOrder = () => {
      const items = this.cartSvc.items().map(i => ({
        productId: i.productId,
        quantity:  i.quantity,
      }));
      this.storeSvc.placeOrder({
        items,
        notes: this.f['notes'].value?.trim() ?? null,
      }).subscribe({
        next: res => {
          this.placing.set(false);
          if (res.success && res.data) {
            // Capture cart items for receipt BEFORE clearing
            const snapshot = this.cartSvc.items().map(i => ({
              name:      i.name,
              unitPrice: i.price,
              quantity:  i.quantity,
              lineTotal: i.price * i.quantity,
            }));
            this.receiptItems.set(snapshot);
            this.placedOrder.set(res.data);
            this.cartSvc.clear();
            this.step.set('success');
          } else {
            this.step.set('form');
            this.submitError.set(res.message ?? 'Could not place order. Please try again.');
          }
        },
        error: () => {
          this.placing.set(false);
          this.step.set('form');
          this.submitError.set('Network error. Please try again.');
        },
      });
    };

    // Guest → register first, then place order
    if (!this.authSvc.isCustomer()) {
      const v = this.form.getRawValue();
      this.authSvc.registerCustomer({
        firstName: v.firstName!.trim(),
        lastName:  v.lastName!.trim(),
        email:     v.email!.trim(),
        password:  v.password!,
      }).subscribe({
        next: res => {
          if (res.success) { doPlaceOrder(); }
          else {
            this.placing.set(false);
            this.step.set('form');
            this.submitError.set(res.message ?? 'Could not create account.');
          }
        },
        error: () => {
          this.placing.set(false);
          this.step.set('form');
          this.submitError.set('Network error. Please try again.');
        },
      });
    } else {
      doPlaceOrder();
    }
  }
}
