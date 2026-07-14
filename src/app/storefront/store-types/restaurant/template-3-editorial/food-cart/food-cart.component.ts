import {
  Component,
  ChangeDetectionStrategy,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink }   from '@angular/router';

import { CartService }            from '../../../../../core/storefront/cart.service';
import { ICartItem }              from '../../../../../core/models';
import { RestaurantNavComponent }      from '../../layout/restaurant-nav/restaurant-nav.component';
import { RestaurantFooterComponent }   from '../../layout/restaurant-footer/restaurant-footer.component';
import { CurrencyFormatPipe }     from '../../../../../shared/pipes/pipes';

/**
 * Phase 7 — Restaurant Storefront, Template 1 (Editorial)
 * Food Cart Page  (/cart)
 *
 * Wired directly to the real, shared CartService (core/storefront/
 * cart.service.ts) — the same one used by the Ecommerce templates.
 * itemId = menuItem.id (set by RestaurantStoreService.addToCart, called
 * from Home / Menu View). RestaurantStoreService's cart methods are now a
 * thin facade over this exact service, so this page, Home, and Menu View
 * all read/write one shared cart — no separate restaurant-only cart state.
 *
 * This page makes no new API calls. It only reads/mutates the cart
 * already populated by Menu View / Home. Order notes are kept as local
 * page state (PlaceOrderRequest.Notes exists server-side as string? —
 * confirmed in StoreDTOs.cs — but submission is a future Order Type /
 * checkout step, out of scope here).
 *
 * Layout:
 *   ① Header        — "Your Order" + item count.
 *   ② Cart list     — one row per item: image, name, price, qty stepper, remove.
 *   ③ Notes         — optional free-text textarea for the kitchen.
 *   ④ Summary bar   — total + "Continue" → /order-type, "Clear cart".
 *   ⑤ Empty state   — icon + CTA back to /menu.
 */
@Component({
  selector: 'app-restaurant-editorial-food-cart',
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
        <div class="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16">

          <!-- ① Header -->
          <p class="text-xs font-bold uppercase tracking-[.2em] text-sf-text-3 mb-3">
            Review &amp; Confirm
          </p>
          <h1 class="font-display font-bold text-sf-text-1 text-3xl sm:text-4xl tracking-tight mb-2">
            Your Order
          </h1>
          @if (cartSvc.items().length > 0) {
            <p class="text-sm text-sf-text-2 mb-10">
              {{ cartSvc.totalItems() === 1 ? '1 item' : cartSvc.totalItems() + ' items' }}
            </p>
          }

          @if (cartSvc.items().length === 0) {

            <!-- ⑤ Empty state -->
            <div class="flex flex-col items-center gap-4 py-20 text-center">
              <div class="w-14 h-14 rounded-full bg-sf-surface-2 flex items-center justify-center">
                <svg class="w-7 h-7 text-sf-text-3 opacity-50" fill="none"
                     stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round"
                        d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm14.25 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z"/>
                </svg>
              </div>
              <p class="text-sf-text-2 text-sm">Your cart is empty.</p>
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

            <!-- ② Cart list -->
            <div class="space-y-3 mb-10">
              @for (item of cartSvc.items(); track item.productId) {
                <div class="flex gap-4 p-4 rounded-2xl border border-sf-border bg-sf-surface">

                  <!-- Thumbnail -->
                  @if (item.imageUrl) {
                    <div class="w-20 h-20 sm:w-24 sm:h-24 shrink-0 rounded-xl overflow-hidden bg-sf-surface-2">
                      <img [src]="item.imageUrl" [alt]="item.name" class="w-full h-full object-cover" loading="lazy" />
                    </div>
                  } @else {
                    <div class="w-20 h-20 sm:w-24 sm:h-24 shrink-0 rounded-xl bg-sf-surface-2
                                flex items-center justify-center">
                      <svg class="w-7 h-7 text-sf-text-3 opacity-30"
                           fill="none" stroke="currentColor" stroke-width="1" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round"
                              d="M21 11.25v8.25a1.5 1.5 0 01-1.5 1.5H5.25a1.5 1.5 0 01-1.5-1.5v-8.25M12 4.875A2.625 2.625 0 109.375 7.5H12m0-2.625V7.5m0-2.625A2.625 2.625 0 1114.625 7.5H12m0 0V21m-8.625-9.75h18c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125h-18c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z"/>
                      </svg>
                    </div>
                  }

                  <!-- Details -->
                  <div class="flex-1 flex flex-col min-w-0">
                    <div class="flex items-start justify-between gap-3">
                      <h3 class="font-semibold text-sf-text-1 text-sm sm:text-base leading-snug">
                        {{ item.name }}
                      </h3>
                      <button
                        (click)="remove(item.productId)"
                        aria-label="Remove item"
                        class="shrink-0 text-sf-text-3 hover:text-sf-text-1 transition-colors"
                      >
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="1.75" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round"
                                d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"/>
                        </svg>
                      </button>
                    </div>

                    <span class="text-xs sm:text-sm text-sf-text-2 mt-0.5">
                      {{ item.price | currencyFormat }} each
                    </span>

                    <div class="mt-auto pt-3 flex items-center justify-between">
                      <!-- Quantity stepper -->
                      <div class="flex items-center gap-3 rounded-full border border-sf-border px-1 py-1">
                        <button
                          (click)="decrement(item)"
                          aria-label="Decrease quantity"
                          class="w-6 h-6 flex items-center justify-center rounded-full
                                 text-sf-text-1 hover:bg-sf-surface-2 transition-colors
                                 focus-visible:outline focus-visible:outline-2"
                        >
                          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 12h-15"/>
                          </svg>
                        </button>
                        <span class="text-xs font-semibold text-sf-text-1 w-4 text-center">
                          {{ item.quantity }}
                        </span>
                        <button
                          (click)="increment(item)"
                          aria-label="Increase quantity"
                          class="w-6 h-6 flex items-center justify-center rounded-full
                                 text-white transition-opacity hover:opacity-90
                                 focus-visible:outline focus-visible:outline-2"
                          [style.backgroundColor]="tenantPrimary()"
                        >
                          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15"/>
                          </svg>
                        </button>
                      </div>

                      <!-- Line total -->
                      <span class="font-bold text-sm sm:text-base" [style.color]="tenantPrimary()">
                        {{ item.price * item.quantity | currencyFormat }}
                      </span>
                    </div>
                  </div>

                </div>
              }
            </div>

            <!-- ③ Notes -->
            <div class="mb-10">
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

            <!-- ④ Summary -->
            <div class="rounded-2xl border border-sf-border bg-sf-surface p-5 sm:p-6">
              <div class="flex items-center justify-between mb-1">
                <span class="text-sm text-sf-text-2">Subtotal</span>
                <span class="text-sm font-medium text-sf-text-1">{{ cartSvc.subtotal() | currencyFormat }}</span>
              </div>
              <p class="text-xs text-sf-text-3 mb-5">
                Delivery fees or taxes (if any) are calculated at the next step.
              </p>

              <div class="flex items-center justify-between pt-4 border-t border-sf-border mb-6">
                <span class="font-semibold text-sf-text-1">Total</span>
                <span class="font-bold text-xl" [style.color]="tenantPrimary()">
                  {{ cartSvc.subtotal() | currencyFormat }}
                </span>
              </div>

              <a
                routerLink="/order-type"
                class="w-full flex items-center justify-center gap-2
                       px-6 py-3.5 rounded-full font-semibold text-sm text-white
                       transition-opacity hover:opacity-90
                       focus-visible:outline focus-visible:outline-2"
                [style.backgroundColor]="tenantPrimary()"
              >
                Continue
                <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3"/>
                </svg>
              </a>

              <div class="flex items-center justify-between mt-4">
                <a routerLink="/menu" class="text-xs font-medium text-sf-text-2 hover:text-sf-text-1 transition-colors">
                  ← Continue browsing the menu
                </a>
                <button
                  (click)="clearCart()"
                  class="text-xs font-medium text-sf-text-3 hover:text-sf-text-1 transition-colors"
                >
                  Clear cart
                </button>
              </div>
            </div>

          }
        </div>
      </section>

      <app-restaurant-footer />
    </div>
  `,
})
export class RestaurantEditorialFoodCartComponent implements OnInit {
  readonly cartSvc = inject(CartService);

  readonly tenantPrimary = signal('#C1522A');
  readonly notes         = signal('');

  ngOnInit(): void {
    this.readTenantCssVars();
  }

  private readTenantCssVars(): void {
    const s = getComputedStyle(document.documentElement);
    const primary = s.getPropertyValue('--tenant-primary').trim();
    if (primary) this.tenantPrimary.set(primary);
  }

  onNotesInput(event: Event): void {
    this.notes.set((event.target as HTMLTextAreaElement).value);
  }

  increment(item: ICartItem): void {
    this.cartSvc.updateQty(item.productId, item.quantity + 1);
  }

  decrement(item: ICartItem): void {
    this.cartSvc.updateQty(item.productId, item.quantity - 1);
  }

  remove(itemId: string): void {
    this.cartSvc.remove(itemId);
  }

  clearCart(): void {
    this.cartSvc.clear();
    this.notes.set('');
  }
}
