import { Injectable, inject, signal } from '@angular/core';
import { HttpClient }                  from '@angular/common/http';
import { firstValueFrom }              from 'rxjs';
import { environment }                 from '../../../environments/environment';
import { CartService }                 from './cart.service';

// ─── Public API shapes ────────────────────────────────────────────────────────
// Derived from RestaurantDTOs.cs — PublicMenuItemDto / PublicMenuCategoryDto.
// Source: GET /api/v1/store/menu (StoreController.GetMenu → StoreService.GetPublicMenuAsync)
//
// Items are pre-filtered to isActive=true server-side; the storefront never
// needs to filter again. categoryId / categoryName are absent from the public
// DTO — items are already nested inside their category.

export interface IPublicMenuItem {
  id:          string;
  name:        string;
  description: string | null;
  price:       number;
  imageUrl:    string | null;
}

export interface IPublicMenuCategory {
  id:        string;
  name:      string;
  sortOrder: number;
  items:     IPublicMenuItem[];
}

interface ApiResponse<T> {
  success: boolean;
  data:    T;
  message: string | null;
}

@Injectable({ providedIn: 'root' })
export class RestaurantStoreService {
  private readonly http    = inject(HttpClient);
  private readonly cartSvc = inject(CartService);
  private readonly base    = `${environment.apiUrl}/v1/store`;

  // ─── Menu state ─────────────────────────────────────────────────────────────

  readonly categories  = signal<IPublicMenuCategory[]>([]);
  readonly menuLoading = signal(false);
  readonly menuError   = signal<string | null>(null);

  // ─── Cart — thin proxy over the shared CartService ─────────────────────────
  // Menu Home/MenuView used to write to a separate in-memory cart here while
  // the Cart/Checkout page read from CartService — two disconnected carts,
  // so anything added on Home silently never showed up at checkout. Both
  // sides now go through the same CartService; this class just exposes it
  // under the names the restaurant components already call.

  get cartCount(): number {
    return this.cartSvc.totalItems();
  }

  get cartTotal(): number {
    return this.cartSvc.subtotal();
  }

  // ─── API ──────────────────────────────────────────────────────────────────

  /**
   * GET /api/v1/store/menu
   * Returns all menu categories (ordered by sortOrder) with their active
   * items already nested. Public — no auth required.
   */
  async loadMenu(): Promise<void> {
    if (this.menuLoading()) return;
    this.menuLoading.set(true);
    this.menuError.set(null);

    try {
      const res = await firstValueFrom(
        this.http.get<ApiResponse<IPublicMenuCategory[]>>(`${this.base}/menu`)
      );
      this.categories.set(res.data ?? []);
    } catch {
      this.menuError.set('Could not load menu. Please try again.');
    } finally {
      this.menuLoading.set(false);
    }
  }

  itemsByCategory(categoryId: string): IPublicMenuItem[] {
    return this.categories().find(c => c.id === categoryId)?.items ?? [];
  }

  // ─── Cart mutations — delegate straight to CartService ─────────────────────

  addToCart(item: IPublicMenuItem): void {
    this.cartSvc.add({
      productId: item.id,
      name:      item.name,
      price:     item.price,
      imageUrl:  item.imageUrl,
    });
  }

  removeFromCart(menuItemId: string): void {
    this.cartSvc.remove(menuItemId);
  }

  updateQuantity(menuItemId: string, quantity: number): void {
    this.cartSvc.updateQty(menuItemId, quantity);
  }

  clearCart(): void { this.cartSvc.clear(); }

  /** Current quantity of a given menu item in the cart (0 if not present). */
  quantityOf(menuItemId: string): number {
    return this.cartSvc.items().find(i => i.productId === menuItemId)?.quantity ?? 0;
  }
}
