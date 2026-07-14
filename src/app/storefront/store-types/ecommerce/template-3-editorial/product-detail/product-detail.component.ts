import {
  Component, ChangeDetectionStrategy, OnInit, inject, signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';

import { ProductStoreService } from '../../../../../core/storefront/store.service';
import { CartService }         from '../../../../../core/storefront/cart.service';
import { StoreNavComponent }   from '../../../../layout/store-nav/store-nav.component';
import { StoreFooterComponent } from '../../../../layout/store-footer/store-footer.component';
import { IPublicProduct }      from '../../../../../core/models';
import { CurrencyFormatPipe }  from '../../../../../shared/pipes/pipes';

@Component({
  selector: 'app-editorial-product-detail',
  standalone: true,
  imports: [
    CommonModule, RouterLink,
    StoreNavComponent, StoreFooterComponent, CurrencyFormatPipe,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="min-h-screen bg-sf-bg">
      <app-store-nav />

      <main class="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-12">

        <!-- Breadcrumb -->
        <nav class="flex items-center gap-2 text-sm text-sf-text-3 mb-8" aria-label="Breadcrumb">
          <a routerLink="/"
             class="hover:text-sf-text-2 transition-colors">Home</a>
          <span>›</span>
          <a routerLink="/products"
             class="hover:text-sf-text-2 transition-colors">Products</a>
          @if (product()) {
            <span>›</span>
            <span class="text-sf-text-2 truncate max-w-[200px]">{{ product()!.name }}</span>
          }
        </nav>

        @if (loading()) {
          <!-- Skeleton layout -->
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div class="aspect-square rounded-2xl bg-sf-surface animate-pulse"></div>
            <div class="space-y-4 pt-4">
              <div class="h-4 bg-sf-surface rounded w-1/4 animate-pulse"></div>
              <div class="h-8 bg-sf-surface rounded w-3/4 animate-pulse"></div>
              <div class="h-6 bg-sf-surface rounded w-1/4 animate-pulse"></div>
              <div class="space-y-2 pt-4">
                <div class="h-3 bg-sf-surface rounded animate-pulse"></div>
                <div class="h-3 bg-sf-surface rounded w-5/6 animate-pulse"></div>
                <div class="h-3 bg-sf-surface rounded w-4/6 animate-pulse"></div>
              </div>
              <div class="h-12 bg-sf-surface rounded-full w-2/3 animate-pulse mt-6"></div>
            </div>
          </div>
        } @else if (notFound()) {
          <div class="py-32 text-center">
            <p class="text-sf-text-3 mb-3">Product not found.</p>
            <a routerLink="/products"
               class="text-sm font-medium"
               style="color: var(--tenant-primary, #C1522A);">
              ← Back to products
            </a>
          </div>
        } @else if (product()) {
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">

            <!-- ── Image panel ── -->
            <div>
              <div class="aspect-square rounded-2xl overflow-hidden bg-sf-surface shadow-sm">
                @if (product()!.imageUrl) {
                  <img
                    [src]="product()!.imageUrl!"
                    [alt]="product()!.name"
                    class="w-full h-full object-cover"
                    loading="eager"
                  />
                } @else {
                  <div class="w-full h-full flex items-center justify-center">
                    <svg viewBox="0 0 64 64" fill="none" class="w-16 h-16 text-sf-border-2">
                      <rect width="64" height="64" rx="12" fill="currentColor" opacity=".12"/>
                      <path d="M16 48l12-16 9 11.25 6-7.5L48 48H16z" fill="currentColor" opacity=".35"/>
                      <circle cx="24" cy="26" r="5" fill="currentColor" opacity=".35"/>
                    </svg>
                  </div>
                }
              </div>
            </div>

            <!-- ── Info panel ── -->
            <div class="flex flex-col py-2">

              <!-- Category -->
              @if (product()!.categoryName) {
                <p class="text-xs font-semibold uppercase tracking-wider mb-3"
                   style="color: var(--tenant-primary, #C1522A);">
                  {{ product()!.categoryName }}
                </p>
              }

              <!-- Name -->
              <h1 class="font-display font-bold text-sf-text-1 text-3xl sm:text-4xl
                          leading-tight tracking-tight mb-4">
                {{ product()!.name }}
              </h1>

              <!-- Price -->
              <p class="text-2xl font-bold mb-1"
                 style="color: var(--tenant-primary, #C1522A);">
                {{ product()!.price | currencyFormat }}
              </p>

              <!-- Stock indicator -->
              @if (product()!.stock === 0) {
                <p class="text-sm font-medium text-[var(--color-danger)] mb-6">
                  Out of stock
                </p>
              } @else if (product()!.stock <= 5) {
                <p class="text-sm font-medium text-[var(--color-warning)] mb-6">
                  Only {{ product()!.stock }} left in stock
                </p>
              } @else {
                <p class="text-sm text-[var(--color-success)] mb-6">
                  ✓ In stock
                </p>
              }

              <!-- Description -->
              @if (product()!.description) {
                <p class="text-sf-text-2 leading-relaxed mb-8">
                  {{ product()!.description }}
                </p>
              }

              <!-- Quantity selector -->
              @if (product()!.stock > 0) {
                <div class="flex items-center gap-3 mb-6">
                  <label class="text-sm font-medium text-sf-text-2">Qty</label>
                  <div class="flex items-center rounded-lg border border-sf-border overflow-hidden">
                    <button
                      type="button"
                      (click)="decQty()"
                      [disabled]="qty() <= 1"
                      class="w-10 h-10 flex items-center justify-center text-sf-text-2
                             hover:bg-sf-surface-2 disabled:opacity-40 transition-colors text-lg"
                    >−</button>
                    <span class="w-10 h-10 flex items-center justify-center text-sm
                                 font-medium text-sf-text-1 border-x border-sf-border select-none">
                      {{ qty() }}
                    </span>
                    <button
                      type="button"
                      (click)="incQty()"
                      [disabled]="qty() >= product()!.stock"
                      class="w-10 h-10 flex items-center justify-center text-sf-text-2
                             hover:bg-sf-surface-2 disabled:opacity-40 transition-colors text-lg"
                    >+</button>
                  </div>
                </div>
              }

              <!-- Add to cart CTA -->
              <div class="flex flex-wrap gap-3">
                <button
                  type="button"
                  (click)="addToCart()"
                  [disabled]="product()!.stock === 0 || addedFeedback()"
                  class="flex-1 sm:flex-none sm:min-w-[200px] flex items-center justify-center
                         gap-2 px-7 py-3.5 rounded-full text-sm font-semibold
                         transition-all duration-220 disabled:opacity-50 disabled:cursor-not-allowed"
                  [style.background]="addedFeedback() ? 'var(--color-success)' : 'var(--tenant-primary, #C1522A)'"
                  style="color: #fff;"
                >
                  @if (addedFeedback()) {
                    <svg viewBox="0 0 20 20" fill="currentColor" class="w-4 h-4">
                      <path fill-rule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clip-rule="evenodd"/>
                    </svg>
                    Added to cart!
                  } @else {
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" class="w-4 h-4">
                      <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
                      <path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 001.97-1.67L23 6H6"/>
                    </svg>
                    Add to Cart
                  }
                </button>

                <a
                  routerLink="/cart"
                  class="flex-1 sm:flex-none sm:min-w-[140px] flex items-center justify-center
                         px-6 py-3.5 rounded-full text-sm font-semibold border border-sf-border
                         text-sf-text-2 hover:bg-sf-surface transition-colors"
                >
                  View Cart
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
export class EditorialProductDetailComponent implements OnInit {
  private readonly productSvc = inject(ProductStoreService);
  private readonly cartSvc    = inject(CartService);
  private readonly route      = inject(ActivatedRoute);

  readonly product       = signal<IPublicProduct | null>(null);
  readonly loading       = signal(true);
  readonly notFound      = signal(false);
  readonly qty           = signal(1);
  readonly addedFeedback = signal(false);

  ngOnInit(): void {
    const slug = this.route.snapshot.paramMap.get('slug')!;
    this.productSvc.getProduct(slug).subscribe({
      next: res => {
        this.loading.set(false);
        if (res.success && res.data) this.product.set(res.data);
        else this.notFound.set(true);
      },
      error: () => { this.loading.set(false); this.notFound.set(true); },
    });
  }

  incQty(): void { if (this.qty() < (this.product()?.stock ?? 1)) this.qty.update(v => v + 1); }
  decQty(): void { if (this.qty() > 1) this.qty.update(v => v - 1); }

  addToCart(): void {
    const p = this.product();
    if (!p || p.stock === 0) return;
    for (let i = 0; i < this.qty(); i++) {
      this.cartSvc.add({
        productId: p.id,
        name:      p.name,
        price:     p.price,
        imageUrl:  p.imageUrl,
      });
    }
    this.addedFeedback.set(true);
    setTimeout(() => this.addedFeedback.set(false), 2200);
  }
}
