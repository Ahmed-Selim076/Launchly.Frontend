import { Component, ChangeDetectionStrategy, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ProductStoreService } from '../../../core/storefront/store.service';
import { WishlistService }     from '../../../core/storefront/wishlist.service';
import { CartService }         from '../../../core/storefront/cart.service';
import { AuthService }         from '../../../core/auth/auth.service';
import { ToastService }        from '../../../shared/components/toast/toast.service';
import { StoreNavComponent }    from '../../layout/store-nav/store-nav.component';
import { StoreFooterComponent } from '../../layout/store-footer/store-footer.component';
import { IWishlistItem } from '../../../core/models';
import { CurrencyFormatPipe } from '../../../shared/pipes/pipes';

/**
 * Wishlist page — the missing "view saved items" screen. Product cards
 * across the storefront already let a customer heart/un-heart a product
 * (WishlistService), but until now there was no page to see the saved
 * list. Customer-only: unauthenticated visitors get a sign-in prompt
 * instead of an empty list, since an anonymous wishlist isn't persisted.
 */
@Component({
  selector: 'app-storefront-wishlist',
  standalone: true,
  imports: [CommonModule, RouterLink, StoreNavComponent, StoreFooterComponent, CurrencyFormatPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="min-h-screen bg-sf-bg flex flex-col">
      <app-store-nav />

      <main class="flex-1 mx-auto max-w-5xl w-full px-4 sm:px-6 py-14 sm:py-20">
        <div class="mb-10">
          <h1 class="font-display text-3xl sm:text-4xl text-sf-text-1 mb-2">Your wishlist</h1>
          <p class="text-sf-text-2 text-sm">Items you've saved for later.</p>
        </div>

        @if (!auth.isAuthenticated()) {
          <div class="rounded-xl border border-dashed border-sf-border-2 py-20 text-center">
            <p class="text-sf-text-2 mb-4">Sign in to see items you've saved.</p>
            <a routerLink="/account"
               class="inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm font-semibold text-white
                      bg-tenant-gradient shadow-tenant-glow">
              Sign in
            </a>
          </div>
        } @else if (loading()) {
          <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
            @for (_ of [1,2,3,4]; track $index) {
              <div class="rounded-2xl bg-sf-surface animate-pulse h-64"></div>
            }
          </div>
        } @else if (items().length) {
          <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
            @for (item of items(); track item.productId) {
              <div class="group relative bg-sf-surface rounded-2xl overflow-hidden border border-sf-border
                          hover:border-tenant-primary/40 hover:shadow-tenant-glow transition-all">
                <a [routerLink]="['/products', item.slug]" class="block relative aspect-square overflow-hidden bg-sf-bg">
                  @if (item.imageUrl) {
                    <img [src]="item.imageUrl" [alt]="item.name" loading="lazy"
                         class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  } @else {
                    <div class="w-full h-full flex items-center justify-center">
                      <svg viewBox="0 0 48 48" fill="none" class="w-10 h-10 text-sf-border-2">
                        <rect width="48" height="48" rx="8" fill="currentColor" opacity=".2"/>
                        <path d="M14 34l8-10 6 7.5 4-5L38 34H14z" fill="currentColor" opacity=".5"/>
                      </svg>
                    </div>
                  }
                </a>

                <button
                  (click)="onRemove(item)"
                  class="absolute top-3 left-3 w-9 h-9 rounded-full bg-sf-bg/80 backdrop-blur
                         flex items-center justify-center hover:scale-110 transition-transform"
                  aria-label="Remove from wishlist"
                >
                  <svg viewBox="0 0 24 24" fill="var(--tenant-primary)" stroke="var(--tenant-primary)"
                       stroke-width="1.8" class="w-4 h-4">
                    <path d="M12 20s-7-4.35-9.5-8.5C.8 8.2 2.3 5 5.5 5c1.8 0 3 1 4 2.3C10.5 6 11.7 5 13.5 5 16.7 5 18.2 8.2 21.5 11.5 19 15.65 12 20 12 20z"/>
                  </svg>
                </button>

                <div class="p-4">
                  <a [routerLink]="['/products', item.slug]">
                    <h3 class="font-display text-sf-text-1 text-sm leading-snug min-h-10 line-clamp-2 hover:opacity-75 transition-opacity">
                      {{ item.name }}
                    </h3>
                  </a>
                  <div class="flex items-baseline gap-2 mt-3">
                    <span class="text-lg font-bold" style="color: var(--tenant-primary);">
                      {{ item.price | currencyFormat }}
                    </span>
                    @if (item.originalPrice) {
                      <span class="text-xs text-sf-text-3 line-through">
                        {{ item.originalPrice | currencyFormat }}
                      </span>
                    }
                  </div>
                  <button
                    (click)="onAddToCart(item)"
                    [disabled]="item.stock <= 0"
                    class="w-full mt-3 h-10 rounded-xl text-white font-bold text-sm
                           bg-tenant-gradient hover:shadow-tenant-glow transition-shadow
                           disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {{ item.stock > 0 ? 'Add to cart' : 'Out of stock' }}
                  </button>
                </div>
              </div>
            }
          </div>
        } @else {
          <div class="rounded-xl border border-dashed border-sf-border-2 py-20 text-center">
            <p class="text-sf-text-2 mb-4">Nothing saved yet — tap the heart on any product to add it here.</p>
            <a routerLink="/products"
               class="inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm font-semibold text-white
                      bg-tenant-gradient shadow-tenant-glow">
              Browse products
            </a>
          </div>
        }
      </main>

      <app-store-footer />
    </div>
  `,
})
export class StorefrontWishlistComponent implements OnInit {
  private readonly productSvc = inject(ProductStoreService);
  private readonly cartSvc    = inject(CartService);
  private readonly toast      = inject(ToastService);
  readonly wishlistSvc = inject(WishlistService);
  readonly auth        = inject(AuthService);

  readonly items   = signal<IWishlistItem[]>([]);
  readonly loading = signal(true);

  ngOnInit(): void {
    if (!this.auth.isAuthenticated()) { this.loading.set(false); return; }

    this.productSvc.getWishlist().subscribe({
      next: res => {
        this.loading.set(false);
        if (res.success && res.data) this.items.set(res.data);
      },
      error: () => this.loading.set(false),
    });
  }

  onRemove(item: IWishlistItem): void {
    this.items.update(list => list.filter(i => i.productId !== item.productId));
    this.wishlistSvc.toggle(item.productId); // keeps the shared heart-state signal in sync everywhere
    this.toast.success('Removed from wishlist');
  }

  onAddToCart(item: IWishlistItem): void {
    this.cartSvc.add({
      productId: item.productId,
      name: item.name,
      price: item.price,
      imageUrl: item.imageUrl,
    });
    this.toast.success(`${item.name} added to cart`);
  }
}
