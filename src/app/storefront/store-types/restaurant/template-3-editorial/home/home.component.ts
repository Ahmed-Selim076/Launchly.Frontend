import {
  Component, ChangeDetectionStrategy, OnInit, inject, signal, computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink }   from '@angular/router';

import { TenantService } from '../../../../../core/tenant/tenant.service';
import {
  RestaurantStoreService, IPublicMenuItem,
} from '../../../../../core/storefront/restaurant-store.service';
import { RestaurantNavComponent }    from '../../layout/restaurant-nav/restaurant-nav.component';
import { RestaurantFooterComponent } from '../../layout/restaurant-footer/restaurant-footer.component';
import { CurrencyFormatPipe }        from '../../../../../shared/pipes/pipes';

/**
 * Restaurant — Template 1 — Home
 *
 * Visual reference: an editorial, fine-dining site (script wordmark, full
 * bleed food photography, warm cream background, an elegant dotted-leader
 * menu listing rather than app-style product cards). Tenant data comes
 * directly from TenantService — the previous version of this page read
 * --tenant-store-name/--tenant-hero-text/--tenant-about-text CSS custom
 * properties that nothing in the app ever set, so storeName/hero/about
 * always rendered empty. That's fixed here.
 */
@Component({
  selector: 'app-restaurant-editorial-home',
  standalone: true,
  imports: [CommonModule, RouterLink, RestaurantNavComponent, RestaurantFooterComponent, CurrencyFormatPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="min-h-screen flex flex-col bg-sf-bg">
      <app-restaurant-nav />

      <!-- ══════════════════════════════════════════════════════════
           HERO — full-bleed food photography, script wordmark
      ══════════════════════════════════════════════════════════ -->
      <section class="relative h-[86vh] min-h-[520px] flex items-center justify-center overflow-hidden">
        @if (heroImage(); as img) {
          <img [src]="img" alt="" class="absolute inset-0 w-full h-full object-cover" />
          <div class="absolute inset-0 bg-black/35"></div>
        } @else {
          <div class="absolute inset-0 bg-tenant-mesh"></div>
        }

        <div class="relative text-center px-4" [class.text-white]="!!heroImage()">
          <p class="font-mono text-[11px] font-medium tracking-[0.3em] uppercase mb-5 opacity-80">
            An evening at
          </p>
          <h1 class="font-script text-6xl sm:text-8xl leading-none mb-6"
              [style.color]="heroImage() ? '#fff' : 'var(--tenant-primary)'">
            {{ tenant()?.storeName ?? 'Restaurant' }}
          </h1>
          @if (tenant()?.heroText) {
            <p class="text-base sm:text-lg max-w-md mx-auto leading-relaxed mb-9"
               [class.text-sf-text-2]="!heroImage()" [class.opacity-90]="!!heroImage()">
              {{ tenant()!.heroText }}
            </p>
          }
          <div class="flex flex-col sm:flex-row gap-3 justify-center">
            <a href="#menu"
               class="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-full
                      text-sm font-bold uppercase tracking-wide text-white transition-opacity hover:opacity-90"
               style="background: var(--tenant-primary);">
              View menu
            </a>
            <a routerLink="/order-type"
               class="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-full
                      text-sm font-bold uppercase tracking-wide border transition-colors"
               [class.border-white]="!!heroImage()" [class.text-white]="!!heroImage()"
               [class.border-sf-border]="!heroImage()" [class.text-sf-text-1]="!heroImage()">
              Order online
            </a>
          </div>
        </div>
      </section>

      <!-- ══════════════════════════════════════════════════════════
           MENU — editorial dotted-leader listing, tabbed by category
      ══════════════════════════════════════════════════════════ -->
      <section id="menu" class="flex-1">
        <div class="mx-auto max-w-3xl px-4 sm:px-6 py-20 sm:py-28">
          <div class="text-center mb-14">
            <p class="font-mono text-[11px] font-medium tracking-[0.3em] uppercase text-sf-text-3 mb-3">
              Our menu
            </p>
            <h2 class="font-editorial italic text-3xl sm:text-4xl text-sf-text-1">
              Tonight's selection
            </h2>
          </div>

          @if (menuSvc.menuLoading()) {
            <div class="space-y-8">
              @for (_ of [1,2,3,4]; track $index) {
                <div class="flex justify-between gap-4">
                  <div class="h-4 w-40 rounded bg-sf-surface animate-pulse"></div>
                  <div class="h-4 w-12 rounded bg-sf-surface animate-pulse"></div>
                </div>
              }
            </div>
          } @else if (menuSvc.menuError()) {
            <div class="text-center py-16">
              <p class="text-sf-text-2 text-sm mb-4">{{ menuSvc.menuError() }}</p>
              <button (click)="loadMenu()"
                      class="px-6 py-2.5 rounded-full text-sm font-semibold border border-sf-border
                             text-sf-text-1 hover:bg-sf-surface transition-colors">
                Try again
              </button>
            </div>
          } @else if (menuSvc.categories().length) {

            <!-- Category tabs -->
            <div class="flex gap-2 justify-center flex-wrap mb-14">
              @for (cat of menuSvc.categories(); track cat.id) {
                <button
                  (click)="selectCategory(cat.id)"
                  class="px-5 h-9 rounded-full text-xs font-semibold uppercase tracking-wide transition-colors border"
                  [style.background]="activeCategory() === cat.id ? 'var(--tenant-primary)' : 'transparent'"
                  [style.color]="activeCategory() === cat.id ? '#fff' : 'var(--color-sf-text-2)'"
                  [style.border-color]="activeCategory() === cat.id ? 'transparent' : 'var(--color-sf-border)'"
                >
                  {{ cat.name }}
                </button>
              }
            </div>

            <!-- Dotted-leader item list -->
            @if (activeItems().length) {
              <ul class="space-y-8">
                @for (item of activeItems(); track item.id) {
                  <li class="flex gap-4">
                    @if (item.imageUrl) {
                      <a [routerLink]="['/menu']" class="flex-shrink-0 w-16 h-16 rounded-xl overflow-hidden bg-sf-surface">
                        <img [src]="item.imageUrl" [alt]="item.name" class="w-full h-full object-cover" />
                      </a>
                    }
                    <div class="flex-1 min-w-0">
                      <div class="flex items-baseline gap-2">
                        <h3 class="font-editorial text-lg text-sf-text-1 flex-shrink-0">{{ item.name }}</h3>
                        <span class="flex-1 border-b border-dotted border-sf-border-2 translate-y-[-3px]"></span>
                        <span class="font-semibold text-sm flex-shrink-0" style="color: var(--tenant-primary);">
                          {{ item.price | currencyFormat }}
                        </span>
                      </div>
                      @if (item.description) {
                        <p class="text-sf-text-3 text-sm leading-relaxed mt-1">{{ item.description }}</p>
                      }
                    </div>
                    <button
                      (click)="addToCart(item)"
                      class="flex-shrink-0 self-start mt-1 h-8 w-8 rounded-full border border-sf-border
                             flex items-center justify-center text-sf-text-2 hover:border-transparent hover:text-white transition-colors"
                      [style.background]="'transparent'"
                      onmouseover="this.style.background='var(--tenant-primary)'"
                      onmouseout="this.style.background='transparent'"
                      aria-label="Add to cart"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" class="w-3.5 h-3.5">
                        <path d="M12 4.5v15m7.5-7.5h-15"/>
                      </svg>
                    </button>
                  </li>
                }
              </ul>
            } @else {
              <p class="text-center text-sf-text-3 text-sm py-12">No items in this category right now.</p>
            }
          } @else {
            <p class="text-center text-sf-text-3 text-sm py-16">The menu isn't available yet. Check back soon.</p>
          }
        </div>
      </section>

      <app-restaurant-footer />

      <!-- Floating cart bar -->
      @if (menuSvc.cartCount > 0) {
        <div class="fixed bottom-4 inset-x-4 sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 sm:w-[420px]
                    flex items-center justify-between gap-4 rounded-2xl px-5 py-4 shadow-2xl text-white z-50"
             style="background: var(--tenant-primary);">
          <div class="flex items-center gap-3">
            <span class="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold">
              {{ menuSvc.cartCount }}
            </span>
            <span class="text-sm font-medium">
              {{ menuSvc.cartCount === 1 ? '1 item' : menuSvc.cartCount + ' items' }}
            </span>
          </div>
          <a routerLink="/cart" class="flex items-center gap-2 font-bold text-sm hover:opacity-90 transition-opacity">
            {{ menuSvc.cartTotal | currencyFormat }}
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" class="w-4 h-4">
              <path d="M9 5l7 7-7 7"/>
            </svg>
          </a>
        </div>
      }
    </div>
  `,
})
export class RestaurantEditorialHomeComponent implements OnInit {
  readonly menuSvc = inject(RestaurantStoreService);
  readonly tenant  = inject(TenantService).currentTenant;

  readonly activeCategory = signal<string | null>(null);

  /** First menu item with a photo — used as the hero backdrop. */
  readonly heroImage = computed(() => {
    for (const cat of this.menuSvc.categories()) {
      const withImage = cat.items.find(i => i.imageUrl);
      if (withImage) return withImage.imageUrl;
    }
    return null;
  });

  readonly activeItems = computed<IPublicMenuItem[]>(() => {
    const catId = this.activeCategory();
    return catId ? this.menuSvc.itemsByCategory(catId) : [];
  });

  ngOnInit(): void {
    this.loadMenu();
  }

  async loadMenu(): Promise<void> {
    await this.menuSvc.loadMenu();
    const cats = this.menuSvc.categories();
    if (cats.length > 0 && !this.activeCategory()) {
      this.activeCategory.set(cats[0].id);
    }
  }

  selectCategory(id: string): void { this.activeCategory.set(id); }

  addToCart(item: IPublicMenuItem): void { this.menuSvc.addToCart(item); }
}
