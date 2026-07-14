import { Injectable, signal, computed } from '@angular/core';
import { ICartItem } from '../models';

const CART_KEY = 'launchly_cart';

/**
 * CartService — client-side only, persisted in localStorage.
 *
 * Scoped per tenant via the key (tenant subdomain is part of the domain,
 * so localStorage is already isolated per origin — no extra scoping needed).
 *
 * All mutations are synchronous; Angular Signals handle change propagation.
 */
@Injectable({ providedIn: 'root' })
export class CartService {
  // ─── State ────────────────────────────────────────────────────────────────

  readonly items = signal<ICartItem[]>(this.#load());

  /** Computed subtotal in cents-level precision */
  readonly subtotal = computed(() =>
    this.items().reduce((sum, i) => sum + i.price * i.quantity, 0)
  );

  readonly totalItems = computed(() =>
    this.items().reduce((sum, i) => sum + i.quantity, 0)
  );

  readonly isEmpty = computed(() => this.items().length === 0);

  // ─── Mutations ────────────────────────────────────────────────────────────

  add(item: Omit<ICartItem, 'quantity'>): void {
    this.items.update(current => {
      const idx = current.findIndex(i => i.productId === item.productId);
      if (idx >= 0) {
        const updated = [...current];
        updated[idx] = { ...updated[idx], quantity: updated[idx].quantity + 1 };
        return updated;
      }
      return [...current, { ...item, quantity: 1 }];
    });
    this.#save();
  }

  remove(productId: string): void {
    this.items.update(curr => curr.filter(i => i.productId !== productId));
    this.#save();
  }

  updateQty(productId: string, qty: number): void {
    if (qty <= 0) { this.remove(productId); return; }
    this.items.update(curr =>
      curr.map(i => i.productId === productId ? { ...i, quantity: qty } : i)
    );
    this.#save();
  }

  clear(): void {
    this.items.set([]);
    this.#save();
  }

  // ─── Private ──────────────────────────────────────────────────────────────

  #load(): ICartItem[] {
    try {
      const raw = localStorage.getItem(CART_KEY);
      return raw ? (JSON.parse(raw) as ICartItem[]) : [];
    } catch {
      return [];
    }
  }

  #save(): void {
    try {
      localStorage.setItem(CART_KEY, JSON.stringify(this.items()));
    } catch {
      // localStorage unavailable (private browsing quota exceeded) — silent fail
    }
  }
}
