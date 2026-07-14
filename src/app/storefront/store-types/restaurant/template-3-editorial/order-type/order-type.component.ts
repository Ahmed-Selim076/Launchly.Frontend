import {
  Component,
  ChangeDetectionStrategy,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { environment } from '../../../../../../environments/environment';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';

import { CartService } from '../../../../../core/storefront/cart.service';
import { AuthService } from '../../../../../core/auth/auth.service';
import { IApiResponse } from '../../../../../core/models';
import { RestaurantNavComponent }    from '../../layout/restaurant-nav/restaurant-nav.component';
import { RestaurantFooterComponent } from '../../layout/restaurant-footer/restaurant-footer.component';
import { CurrencyFormatPipe }   from '../../../../../shared/pipes/pipes';

type OrderType = 'Delivery' | 'Pickup';
type Step = 'form' | 'placing' | 'success';

/** Matches PlaceOrderRequest + OrderLineRequest in StoreDTOs.cs */
interface PlaceOrderRequest {
  items: Array<{ menuItemId: string; quantity: number }>;
  notes: string | null;
  orderType: 0 | 1;   // 0 = Delivery, 1 = Pickup — required for menu-item orders
}

/** Matches PlacedOrderDto in StoreDTOs.cs */
interface PlacedOrderDto {
  orderId: string;
  totalAmount: number;
  status: string;
  createdAt: string;
}

/**
 * Phase 7 — Restaurant Storefront, Template 1 (Editorial)
 * Order Type Select Page  (/order-type) — last page of Template 1.
 *
 * Wires the previously-stubbed Place Order button to the real endpoint:
 *   POST /api/v1/store/orders
 *   Auth: Customer JWT (Authorization: Bearer <token>)
 *   Body: PlaceOrderRequest — items use menuItemId (not productId),
 *         orderType is required (0 = Delivery, 1 = Pickup).
 *
 * On success  → cart is cleared, confirmation receipt shown inline (same page,
 *               step = 'success'). No /order-confirmation route exists in the
 *               project — the pattern used across Ecommerce and Booking is a
 *               local step machine, not a separate route.
 * On API error → message is surfaced inline; cart is preserved so the
 *               customer can try again.
 *
 * Note on Notes: this page owns the final notes field. The Food Cart page
 * has its own local notes that does not persist across navigation (separate
 * component instance, no shared draft state). This is the capture point
 * that actually reaches the backend.
 *
 * Layout:
 *   ① Empty-cart guard — can't choose order type with nothing in the cart.
 *   ② Order type cards — Delivery / Pickup, single-select.
 *   ③ Order summary    — items + total, read from the shared CartService.
 *   ④ Notes            — optional, own local state.
 *   ⑤ Place Order      — calls POST /api/v1/store/orders.
 */
@Component({
  selector: 'app-restaurant-editorial-order-type',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    RestaurantNavComponent,
    RestaurantFooterComponent,
    CurrencyFormatPipe,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="min-h-screen flex flex-col bg-sf-bg">
      <app-restaurant-nav />

      <section class="flex-1">
        <div class="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16">

          <!-- ✅ SUCCESS RECEIPT — shown in-place after a confirmed order -->
          @if (step() === 'success' && placedOrder()) {

            <div class="flex flex-col items-center text-center py-8">
              <div class="w-16 h-16 rounded-full flex items-center justify-center mb-6"
                   [style.backgroundColor]="tenantPrimaryTint()">
                <svg class="w-8 h-8" [style.color]="tenantPrimary()" fill="none"
                     stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5"/>
                </svg>
              </div>
              <p class="text-xs font-bold uppercase tracking-[.2em] text-sf-text-3 mb-2">
                Order confirmed
              </p>
              <h1 class="font-display font-bold text-sf-text-1 text-3xl sm:text-4xl tracking-tight mb-4">
                You're all set!
              </h1>
              <p class="text-sm text-sf-text-2 mb-8">
                Your {{ placedOrder()!.orderType }} order has been received and is being prepared.
              </p>
            </div>

            <!-- Receipt card -->
            <div class="rounded-2xl border border-sf-border bg-sf-surface p-5 sm:p-6 mb-8">
              <h2 class="font-semibold text-sf-text-1 text-sm mb-4">Order receipt</h2>

              <div class="space-y-2 mb-4 text-sm">
                <div class="flex justify-between">
                  <span class="text-sf-text-3">Order ID</span>
                  <span class="font-mono text-sf-text-2 text-xs">{{ placedOrder()!.orderId }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-sf-text-3">Type</span>
                  <span class="text-sf-text-1">{{ placedOrder()!.orderType }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-sf-text-3">Status</span>
                  <span class="text-sf-text-1 capitalize">{{ placedOrder()!.status }}</span>
                </div>
              </div>

              <div class="flex items-center justify-between pt-4 border-t border-sf-border">
                <span class="font-semibold text-sf-text-1">Total paid</span>
                <span class="font-bold text-lg" [style.color]="tenantPrimary()">
                  {{ placedOrder()!.totalAmount | currencyFormat }}
                </span>
              </div>
            </div>

            <a
              routerLink="/menu"
              class="w-full flex items-center justify-center gap-2
                     px-6 py-3.5 rounded-full font-semibold text-sm text-white
                     transition-opacity hover:opacity-90"
              [style.backgroundColor]="tenantPrimary()"
            >
              Back to menu
            </a>

          } @else {

            <p class="text-xs font-bold uppercase tracking-[.2em] text-sf-text-3 mb-3">
              Last Step
            </p>
            <h1 class="font-display font-bold text-sf-text-1 text-3xl sm:text-4xl tracking-tight mb-2">
              How would you like your order?
            </h1>

            @if (cartSvc.items().length === 0) {

              <!-- ① Empty-cart guard -->
              <div class="flex flex-col items-center gap-4 py-20 text-center">
                <p class="text-sf-text-2 text-sm">
                  Your cart is empty — add something from the menu first.
                </p>
                <a
                  routerLink="/menu"
                  class="inline-flex items-center justify-center gap-2
                         px-6 py-2.5 rounded-full font-semibold text-sm text-white
                         transition-opacity hover:opacity-90"
                  [style.backgroundColor]="tenantPrimary()"
                >
                  Browse the menu
                </a>
              </div>

            } @else {

              <p class="text-sm text-sf-text-2 mb-8">
                Choose delivery or pickup, review your order, and you're set.
              </p>

              <!-- ② Order type cards -->
              <div class="grid grid-cols-2 gap-3 mb-10">
                <button
                  type="button"
                  (click)="select('Delivery')"
                  class="flex flex-col items-center gap-2.5 rounded-2xl border-2 p-5 sm:p-6
                         transition-colors text-left"
                  [class.border-sf-border]="orderType() !== 'Delivery'"
                  [style.borderColor]="orderType() === 'Delivery' ? tenantPrimary() : ''"
                  [style.backgroundColor]="orderType() === 'Delivery' ? tenantPrimaryTint() : ''"
                >
                  <svg class="w-7 h-7" [style.color]="tenantPrimary()" fill="none"
                       stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round"
                          d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.25h5.25l3 4.5v6.75M14.25 7.5v9.75M14.25 7.5H9.375"/>
                  </svg>
                  <span class="font-semibold text-sm text-sf-text-1">Delivery</span>
                  <span class="text-xs text-sf-text-3 text-center">Brought to your door</span>
                </button>

                <button
                  type="button"
                  (click)="select('Pickup')"
                  class="flex flex-col items-center gap-2.5 rounded-2xl border-2 p-5 sm:p-6
                         transition-colors text-left"
                  [class.border-sf-border]="orderType() !== 'Pickup'"
                  [style.borderColor]="orderType() === 'Pickup' ? tenantPrimary() : ''"
                  [style.backgroundColor]="orderType() === 'Pickup' ? tenantPrimaryTint() : ''"
                >
                  <svg class="w-7 h-7" [style.color]="tenantPrimary()" fill="none"
                       stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round"
                          d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21"/>
                  </svg>
                  <span class="font-semibold text-sm text-sf-text-1">Pickup</span>
                  <span class="text-xs text-sf-text-3 text-center">Collect at the store</span>
                </button>
              </div>

              <!-- ③ Order summary -->
              <div class="rounded-2xl border border-sf-border bg-sf-surface p-5 sm:p-6 mb-6">
                <h2 class="font-semibold text-sf-text-1 text-sm mb-4">Order summary</h2>
                <div class="space-y-2 mb-4">
                  @for (item of cartSvc.items(); track item.productId) {
                    <div class="flex items-center justify-between text-sm">
                      <span class="text-sf-text-2">
                        <span class="font-medium text-sf-text-1">{{ item.quantity }}×</span>
                        {{ item.name }}
                      </span>
                      <span class="text-sf-text-1">{{ item.price * item.quantity | currencyFormat }}</span>
                    </div>
                  }
                </div>
                <div class="flex items-center justify-between pt-4 border-t border-sf-border">
                  <span class="font-semibold text-sf-text-1">Total</span>
                  <span class="font-bold text-lg" [style.color]="tenantPrimary()">
                    {{ cartSvc.subtotal() | currencyFormat }}
                  </span>
                </div>
              </div>

              <!-- ④ Contact details — guests need an account to place an order;
                   this mirrors the same guest-checkout pattern used by the
                   Ecommerce Checkout page. Skipped entirely if already signed in. -->
              @if (!authSvc.isCustomer()) {
                <div class="rounded-2xl border border-sf-border bg-sf-surface p-5 sm:p-6 mb-6">
                  <h2 class="font-semibold text-sf-text-1 text-sm mb-4">Your details</h2>
                  <div class="grid grid-cols-2 gap-3 mb-3">
                    <div>
                      <label class="block text-xs font-medium text-sf-text-2 mb-1.5">First name</label>
                      <input type="text" [value]="firstName()" (input)="firstName.set(getInputValue($event))"
                             class="w-full rounded-xl border border-sf-border bg-sf-bg text-sf-text-1 text-sm px-3.5 py-2.5
                                    focus:outline-none focus-visible:outline focus-visible:outline-2" />
                    </div>
                    <div>
                      <label class="block text-xs font-medium text-sf-text-2 mb-1.5">Last name</label>
                      <input type="text" [value]="lastName()" (input)="lastName.set(getInputValue($event))"
                             class="w-full rounded-xl border border-sf-border bg-sf-bg text-sf-text-1 text-sm px-3.5 py-2.5
                                    focus:outline-none focus-visible:outline focus-visible:outline-2" />
                    </div>
                  </div>
                  <div class="mb-3">
                    <label class="block text-xs font-medium text-sf-text-2 mb-1.5">Email</label>
                    <input type="email" [value]="email()" (input)="email.set(getInputValue($event))"
                           class="w-full rounded-xl border border-sf-border bg-sf-bg text-sf-text-1 text-sm px-3.5 py-2.5
                                  focus:outline-none focus-visible:outline focus-visible:outline-2" />
                  </div>
                  <div>
                    <label class="block text-xs font-medium text-sf-text-2 mb-1.5">Password</label>
                    <input type="password" [value]="password()" (input)="password.set(getInputValue($event))"
                           placeholder="At least 8 characters"
                           class="w-full rounded-xl border border-sf-border bg-sf-bg text-sf-text-1 text-sm px-3.5 py-2.5
                                  focus:outline-none focus-visible:outline focus-visible:outline-2" />
                    <p class="text-xs text-sf-text-3 mt-1.5">
                      We'll create your account so you can track this order.
                      Already have one? <a routerLink="/account" class="underline">Sign in</a> first.
                    </p>
                  </div>
                </div>
              }

              <!-- ⑤ Notes -->
              <div class="mb-8">
                <label for="order-notes" class="block text-xs font-bold uppercase tracking-[.15em] text-sf-text-3 mb-2">
                  Note for the kitchen <span class="font-normal opacity-70">(optional)</span>
                </label>
                <textarea
                  id="order-notes"
                  rows="3"
                  maxlength="280"
                  [value]="notes()"
                  (input)="onNotesInput($event)"
                  placeholder="e.g. No onions, extra spicy, allergic to peanuts…"
                  class="w-full rounded-2xl border border-sf-border bg-sf-surface
                         text-sf-text-1 text-sm placeholder:text-sf-text-3
                         px-4 py-3 resize-none
                         focus:outline-none focus-visible:outline focus-visible:outline-2"
                ></textarea>
                <p class="text-xs text-sf-text-3 mt-1.5 text-right">{{ notes().length }}/280</p>
              </div>

              <!-- API error message -->
              @if (errorMessage()) {
                <div class="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {{ errorMessage() }}
                </div>
              }

              <!-- ⑤ Place Order -->
              <button
                type="button"
                [disabled]="!orderType() || step() === 'placing'"
                (click)="placeOrder()"
                class="w-full flex items-center justify-center gap-2
                       px-6 py-3.5 rounded-full font-semibold text-sm text-white
                       transition-opacity
                       disabled:opacity-40 disabled:cursor-not-allowed
                       enabled:hover:opacity-90
                       focus-visible:outline focus-visible:outline-2"
                [style.backgroundColor]="tenantPrimary()"
              >
                @if (step() === 'placing') {
                  <svg class="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10"
                            stroke="currentColor" stroke-width="4"/>
                    <path class="opacity-75" fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                  Placing order…
                } @else if (!orderType()) {
                  Choose delivery or pickup to continue
                } @else {
                  Place Order — {{ cartSvc.subtotal() | currencyFormat }}
                }
              </button>

              <div class="text-center mt-6">
                <a routerLink="/cart" class="text-xs font-medium text-sf-text-2 hover:text-sf-text-1 transition-colors">
                  ← Back to cart
                </a>
              </div>

            }

          }
        </div>
      </section>

      <app-restaurant-footer />
    </div>
  `,
})
export class RestaurantEditorialOrderTypeComponent implements OnInit {
  readonly cartSvc = inject(CartService);
  readonly authSvc = inject(AuthService);
  private readonly http = inject(HttpClient);

  readonly tenantPrimary = signal('#C1522A');
  readonly orderType     = signal<OrderType | null>(null);
  readonly notes         = signal('');
  readonly step          = signal<Step>('form');
  readonly errorMessage  = signal<string | null>(null);
  readonly placedOrder   = signal<(PlacedOrderDto & { orderType: string }) | null>(null);

  // Guest account fields — only relevant when !authSvc.isCustomer()
  readonly firstName = signal('');
  readonly lastName  = signal('');
  readonly email     = signal('');
  readonly password  = signal('');

  getInputValue(event: Event): string {
    return (event.target as HTMLInputElement).value;
  }

  ngOnInit(): void {
    this.readTenantCssVars();
  }

  private readTenantCssVars(): void {
    const s = getComputedStyle(document.documentElement);
    const primary = s.getPropertyValue('--tenant-primary').trim();
    if (primary) this.tenantPrimary.set(primary);
  }

  /** A faint tint of the tenant primary color for the selected card background. */
  tenantPrimaryTint(): string {
    return `${this.tenantPrimary()}14`; // ~8% alpha, works for hex colors
  }

  select(type: OrderType): void {
    this.orderType.set(type);
  }

  onNotesInput(event: Event): void {
    this.notes.set((event.target as HTMLTextAreaElement).value);
  }

  /**
   * POST /api/v1/store/orders
   * Auth: Customer JWT (set by the HTTP interceptor — same as Ecommerce flow).
   *
   * Request shape (PlaceOrderRequest / OrderLineRequest in StoreDTOs.cs):
   *   {
   *     items:     [{ menuItemId: string (Guid), quantity: number }],
   *     notes:     string | null,
   *     orderType: 0 | 1   // 0 = Delivery, 1 = Pickup — required for menu-item orders
   *   }
   *
   * Rules enforced by the backend (PlaceOrderRequestValidator):
   *   - Each line has exactly one of productId / menuItemId (never both).
   *   - All lines in one request must be the same kind (all menu items here).
   *   - orderType must be present when any line has menuItemId.
   *
   * On success: clear cart → step = 'success' (receipt shown inline, same page).
   * On failure: surface the API error message inline; leave cart intact.
   */
  placeOrder(): void {
    const type = this.orderType();
    if (!type || this.step() === 'placing') return;

    // Guest checkout requires an account — validate the fields shown above
    // before doing anything (mirrors Ecommerce Checkout's guest flow).
    if (!this.authSvc.isCustomer()) {
      if (!this.firstName().trim() || !this.lastName().trim() ||
          !this.email().trim() || this.password().length < 8) {
        this.errorMessage.set('Please fill in your details (password must be at least 8 characters) to place your order.');
        return;
      }
    }

    this.step.set('placing');
    this.errorMessage.set(null);

    const doPlaceOrder = () => {
      const body: PlaceOrderRequest = {
        items: this.cartSvc.items().map(item => ({
          menuItemId: item.productId,
          quantity:   item.quantity,
        })),
        notes:     this.notes().trim() || null,
        orderType: type === 'Delivery' ? 0 : 1,
      };

      this.http
        .post<IApiResponse<PlacedOrderDto>>(`${environment.apiUrl}/v1/store/orders`, body)
        .subscribe({
          next: (result) => {
            if (result.success && result.data) {
              this.cartSvc.clear();
              this.placedOrder.set({ ...result.data, orderType: type });
              this.step.set('success');
            } else {
              this.step.set('form');
              this.errorMessage.set(
                result.message ?? 'Something went wrong. Please try again.'
              );
            }
          },
          error: (err: HttpErrorResponse) => {
            this.step.set('form');
            const apiError = err.error?.message as string | undefined;
            this.errorMessage.set(
              apiError ?? 'Could not place your order. Please check your connection and try again.'
            );
          },
        });
    };

    if (!this.authSvc.isCustomer()) {
      this.authSvc.registerCustomer({
        firstName: this.firstName().trim(),
        lastName:  this.lastName().trim(),
        email:     this.email().trim(),
        password:  this.password(),
      }).subscribe({
        next: res => {
          if (res.success) {
            doPlaceOrder();
          } else {
            this.step.set('form');
            this.errorMessage.set(res.message ?? 'Could not create your account.');
          }
        },
        error: () => {
          this.step.set('form');
          this.errorMessage.set('Network error. Please try again.');
        },
      });
    } else {
      doPlaceOrder();
    }
  }
}
