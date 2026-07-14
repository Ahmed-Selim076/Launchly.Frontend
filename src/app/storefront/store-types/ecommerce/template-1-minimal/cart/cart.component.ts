import {
  Component, ChangeDetectionStrategy, inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

import { CartService }          from '../../../../../core/storefront/cart.service';
import { StoreNavComponent }    from '../../../../layout/store-nav/store-nav.component';
import { StoreFooterComponent } from '../../../../layout/store-footer/store-footer.component';
import { CurrencyFormatPipe }   from '../../../../../shared/pipes/pipes';

@Component({
  selector: 'app-minimal-cart',
  standalone: true,
  imports: [CommonModule, RouterLink, StoreNavComponent, StoreFooterComponent, CurrencyFormatPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="min-h-screen bg-sf-bg">
      <app-store-nav />

      <main class="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-12">

        <h1 class="font-display font-bold text-sf-text-1 text-3xl mb-2">Your Cart</h1>
        <p class="text-sf-text-3 text-sm mb-10">
          {{ cartSvc.totalItems() }} item{{ cartSvc.totalItems() === 1 ? '' : 's' }}
        </p>

        @if (cartSvc.isEmpty()) {

          <!-- Empty state -->
          <div class="rounded-2xl bg-sf-surface border border-sf-border py-24 text-center">
            <div class="w-16 h-16 rounded-full bg-sf-surface-2 flex items-center justify-center mx-auto mb-5">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"
                   class="w-8 h-8 text-sf-text-3">
                <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
                <path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 001.97-1.67L23 6H6"/>
              </svg>
            </div>
            <h2 class="font-display font-bold text-sf-text-1 text-xl mb-2">Your cart is empty</h2>
            <p class="text-sf-text-3 text-sm mb-6">Browse our products and add something you love.</p>
            <a
              routerLink="/products"
              class="inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm font-semibold text-white transition-all duration-220 hover:-translate-y-0.5"
              style="background: var(--tenant-primary, #C1522A); box-shadow: 0 4px 16px rgba(0,0,0,.12);"
            >
              Shop Now
            </a>
          </div>

        } @else {

          <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">

            <!-- ── Line items ── -->
            <div class="lg:col-span-2 space-y-4">
              @for (item of cartSvc.items(); track item.productId) {
                <div class="flex items-start gap-4 p-4 rounded-xl bg-sf-surface border border-sf-border">

                  <!-- Thumbnail -->
                  <div class="w-20 h-20 rounded-lg overflow-hidden bg-sf-surface-2 flex-shrink-0">
                    @if (item.imageUrl) {
                      <img [src]="item.imageUrl" [alt]="item.name"
                           class="w-full h-full object-cover" loading="lazy" />
                    } @else {
                      <div class="w-full h-full flex items-center justify-center">
                        <svg viewBox="0 0 32 32" fill="none" class="w-7 h-7 text-sf-border-2">
                          <rect width="32" height="32" rx="6" fill="currentColor" opacity=".12"/>
                          <path d="M8 24l6-8 4.5 5.5 3-4L24 24H8z" fill="currentColor" opacity=".35"/>
                          <circle cx="12" cy="14" r="2.5" fill="currentColor" opacity=".35"/>
                        </svg>
                      </div>
                    }
                  </div>

                  <!-- Details -->
                  <div class="flex-1 min-w-0">
                    <p class="font-medium text-sf-text-1 text-sm leading-snug mb-1 truncate">
                      {{ item.name }}
                    </p>
                    <p class="text-sm font-semibold"
                       style="color: var(--tenant-primary, #C1522A);">
                      {{ item.price | currencyFormat }}
                    </p>
                  </div>

                  <!-- Qty controls -->
                  <div class="flex items-center gap-2 flex-shrink-0">
                    <div class="flex items-center rounded-lg border border-sf-border overflow-hidden">
                      <button
                        type="button"
                        (click)="cartSvc.updateQty(item.productId, item.quantity - 1)"
                        class="w-8 h-8 flex items-center justify-center text-sf-text-2
                               hover:bg-sf-surface-2 transition-colors text-base"
                        aria-label="Decrease quantity"
                      >−</button>
                      <span class="w-8 h-8 flex items-center justify-center text-sm
                                   font-medium text-sf-text-1 border-x border-sf-border select-none">
                        {{ item.quantity }}
                      </span>
                      <button
                        type="button"
                        (click)="cartSvc.updateQty(item.productId, item.quantity + 1)"
                        class="w-8 h-8 flex items-center justify-center text-sf-text-2
                               hover:bg-sf-surface-2 transition-colors text-base"
                        aria-label="Increase quantity"
                      >+</button>
                    </div>

                    <!-- Remove -->
                    <button
                      type="button"
                      (click)="cartSvc.remove(item.productId)"
                      class="w-8 h-8 rounded-lg flex items-center justify-center text-sf-text-3
                             hover:text-[var(--color-danger)] hover:bg-[var(--color-danger-dim)]
                             transition-colors"
                      aria-label="Remove item"
                    >
                      <svg viewBox="0 0 20 20" fill="currentColor" class="w-4 h-4">
                        <path fill-rule="evenodd" d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.52.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 00-1.5.06l.3 7.5a.75.75 0 101.5-.06l-.3-7.5zm4.34.06a.75.75 0 10-1.5-.06l-.3 7.5a.75.75 0 101.5.06l.3-7.5z" clip-rule="evenodd"/>
                      </svg>
                    </button>
                  </div>
                </div>
              }

              <button
                type="button"
                (click)="cartSvc.clear()"
                class="text-xs text-sf-text-3 hover:text-[var(--color-danger)] transition-colors mt-2"
              >
                Clear cart
              </button>
            </div>

            <!-- ── Order summary ── -->
            <div class="lg:col-span-1">
              <div class="sticky top-24 rounded-xl bg-sf-surface border border-sf-border p-6">
                <h2 class="font-display font-bold text-sf-text-1 text-lg mb-5">Order Summary</h2>

                <!-- Line totals -->
                <ul class="space-y-3 mb-5">
                  @for (item of cartSvc.items(); track item.productId) {
                    <li class="flex items-baseline justify-between text-sm">
                      <span class="text-sf-text-2 line-clamp-1 flex-1 mr-2">
                        {{ item.name }}
                        @if (item.quantity > 1) {
                          <span class="text-sf-text-3"> × {{ item.quantity }}</span>
                        }
                      </span>
                      <span class="text-sf-text-1 font-medium flex-shrink-0">
                        {{ (item.price * item.quantity) | currencyFormat }}
                      </span>
                    </li>
                  }
                </ul>

                <div class="border-t border-sf-border pt-4 mb-6">
                  <div class="flex items-baseline justify-between">
                    <span class="font-semibold text-sf-text-1">Subtotal</span>
                    <span class="font-bold text-xl text-sf-text-1">
                      {{ cartSvc.subtotal() | currencyFormat }}
                    </span>
                  </div>
                  <p class="text-xs text-sf-text-3 mt-1">Shipping calculated at checkout</p>
                </div>

                <a
                  routerLink="/checkout"
                  class="block w-full text-center py-3.5 rounded-full text-sm font-semibold
                         text-white transition-all duration-220 hover:-translate-y-0.5"
                  style="background: var(--tenant-primary, #C1522A);
                         box-shadow: 0 4px 16px rgba(0,0,0,.12);"
                >
                  Proceed to Checkout →
                </a>

                <a
                  routerLink="/products"
                  class="block text-center mt-3 text-sm text-sf-text-3 hover:text-sf-text-2 transition-colors"
                >
                  ← Continue Shopping
                </a>
              </div>
            </div>

          </div>
        }

      </main>

      <app-store-footer />
    </div>
  `,
})
export class MinimalCartComponent {
  readonly cartSvc = inject(CartService);
}
