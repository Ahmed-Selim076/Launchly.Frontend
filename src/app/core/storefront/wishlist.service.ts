import { Injectable, inject, signal } from '@angular/core';
import { ProductStoreService } from './store.service';
import { AuthService } from '../auth/auth.service';

/**
 * WishlistService — thin client-side cache over the server-backed wishlist
 * (unlike CartService, this is NOT localStorage — wishlist requires a
 * logged-in customer and lives in the Wishlist table, tenant + customer
 * scoped). This service just holds a Set<productId> signal so any product
 * card can synchronously check `isWishlisted(id)` without an API round trip
 * per card, and keeps that Set in sync with optimistic toggle() calls.
 */
@Injectable({ providedIn: 'root' })
export class WishlistService {
  private readonly productSvc = inject(ProductStoreService);
  private readonly authSvc    = inject(AuthService);

  readonly ids     = signal<Set<string>>(new Set());
  readonly loaded   = signal(false);

  isWishlisted(productId: string): boolean {
    return this.ids().has(productId);
  }

  /** Call once after the shell/storefront knows auth state (e.g. app init or nav). */
  load(): void {
    if (!this.authSvc.isAuthenticated() || this.loaded()) return;
    this.productSvc.getWishlist().subscribe({
      next: res => {
        if (res.success && res.data) {
          this.ids.set(new Set(res.data.map(i => i.productId)));
        }
        this.loaded.set(true);
      },
      error: () => this.loaded.set(true),
    });
  }

  /** Optimistic toggle — flips locally immediately, reverts on API failure. */
  toggle(productId: string): void {
    const wasWishlisted = this.isWishlisted(productId);

    this.ids.update(curr => {
      const next = new Set(curr);
      wasWishlisted ? next.delete(productId) : next.add(productId);
      return next;
    });

    const call = wasWishlisted
      ? this.productSvc.removeFromWishlist(productId)
      : this.productSvc.addToWishlist(productId);

    call.subscribe({
      error: () => {
        // Revert on failure so the UI never lies about server state.
        this.ids.update(curr => {
          const next = new Set(curr);
          wasWishlisted ? next.add(productId) : next.delete(productId);
          return next;
        });
      },
    });
  }
}
