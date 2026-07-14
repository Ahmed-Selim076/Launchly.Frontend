import {
  Component,
  ChangeDetectionStrategy,
  OnInit,
  AfterViewInit,
  OnDestroy,
  inject,
  signal,
  computed,
  ViewChildren,
  QueryList,
  ElementRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink }   from '@angular/router';

import {
  RestaurantStoreService,
  IPublicMenuItem,
  IPublicMenuCategory,
} from '../../../../../core/storefront/restaurant-store.service';
import { RestaurantNavComponent }    from '../../layout/restaurant-nav/restaurant-nav.component';
import { RestaurantFooterComponent } from '../../layout/restaurant-footer/restaurant-footer.component';
import { CurrencyFormatPipe }   from '../../../../../shared/pipes/pipes';

/**
 * Phase 7 — Restaurant Storefront, Template 1 (Editorial)
 * Menu View Page  (/menu)
 *
 * API contract (confirmed against Launchly_fixed.zip — same as Home):
 *   GET /api/v1/store/menu  →  ApiResponse<PublicMenuCategoryDto[]>
 *   PublicMenuCategoryDto:  { id, name, sortOrder, items: PublicMenuItemDto[] }
 *   PublicMenuItemDto:      { id, name, description, price, imageUrl }
 *   — items are pre-filtered to isActive=true server-side; no client filtering needed.
 *   — no categoryId / categoryName on items (already nested inside category).
 *
 * Difference from Home: this page is the full, detailed menu browser —
 * every category is rendered as its own scrollable section (not hidden
 * behind a single-category filter like Home), items show their full
 * description (no line-clamp), and items already in the cart show a
 * quantity stepper instead of a one-shot "Add" button. A search box lets
 * the customer filter items by name across all categories.
 *
 * Layout:
 *   ① Page header   — title + search box.
 *   ② Sticky tabs   — one per category, click → smooth-scroll to section.
 *                      Active tab tracked via IntersectionObserver scroll-spy.
 *   ③ Menu sections — one per category, full-width item rows.
 *   ④ Floating cart — sticky bottom bar when cartCount > 0 (same as Home).
 *
 * States: loading (skeletons), error (retry), empty menu, empty search result.
 */
@Component({
  selector: 'app-restaurant-editorial-menu-view',
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

      <!-- ═══════════════════════════════════════════════════════════════
           ① HEADER + SEARCH
      ═══════════════════════════════════════════════════════════════ -->
      <section class="border-b border-sf-border">
        <div class="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 pt-12 pb-6 sm:pt-16">
          <p class="text-xs font-bold uppercase tracking-[.2em] text-sf-text-3 mb-3">
            Full Menu
          </p>
          <h1 class="font-display font-bold text-sf-text-1 text-3xl sm:text-4xl tracking-tight mb-6">
            {{ storeName() || 'Our Menu' }}
          </h1>

          <div class="relative max-w-md">
            <svg class="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-sf-text-3"
                 fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round"
                    d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"/>
            </svg>
            <input
              type="text"
              [value]="searchQuery()"
              (input)="onSearch($event)"
              placeholder="Search the menu…"
              class="w-full pl-10 pr-9 py-2.5 rounded-full text-sm
                     bg-sf-surface border border-sf-border text-sf-text-1
                     placeholder:text-sf-text-3
                     focus:outline-none focus-visible:outline focus-visible:outline-2"
            />
            @if (searchQuery()) {
              <button
                (click)="clearSearch()"
                aria-label="Clear search"
                class="absolute right-3 top-1/2 -translate-y-1/2 text-sf-text-3 hover:text-sf-text-1"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            }
          </div>
        </div>
      </section>

      <!-- ═══════════════════════════════════════════════════════════════
           ② STICKY CATEGORY TABS
      ═══════════════════════════════════════════════════════════════ -->
      @if (!menuSvc.menuLoading() && !menuSvc.menuError() && filteredCategories().length > 0) {
        <div class="sticky top-0 z-20 bg-sf-bg/95 backdrop-blur border-b border-sf-border">
          <div class="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
            <div class="flex gap-1 overflow-x-auto py-3 scrollbar-none">
              @for (cat of filteredCategories(); track cat.id) {
                <button
                  (click)="scrollToCategory(cat.id)"
                  class="shrink-0 px-5 py-2 text-sm font-medium rounded-full
                         whitespace-nowrap transition-colors
                         focus-visible:outline focus-visible:outline-2"
                  [class.bg-sf-surface]="activeCategory() !== cat.id"
                  [class.text-sf-text-1]="activeCategory() !== cat.id"
                  [class.text-white]="activeCategory() === cat.id"
                  [style.backgroundColor]="activeCategory() === cat.id ? tenantPrimary() : ''"
                >
                  {{ cat.name }}
                  <span class="ml-1.5 text-xs opacity-60">({{ cat.items.length }})</span>
                </button>
              }
            </div>
          </div>
        </div>
      }

      <!-- ═══════════════════════════════════════════════════════════════
           ③ MENU BODY
      ═══════════════════════════════════════════════════════════════ -->
      <section class="flex-1">
        <div class="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-10 sm:py-12">

          <!-- Loading skeletons -->
          @if (menuSvc.menuLoading()) {
            <div class="space-y-12">
              @for (_ of [1,2]; track $index) {
                <div>
                  <div class="h-4 w-32 rounded bg-sf-surface-2 animate-pulse mb-5"></div>
                  <div class="space-y-3">
                    @for (_ of [1,2,3]; track $index) {
                      <div class="flex gap-4 p-4 rounded-2xl border border-sf-border bg-sf-surface">
                        <div class="w-24 h-24 rounded-xl bg-sf-surface-2 animate-pulse shrink-0"></div>
                        <div class="flex-1 space-y-2 py-1">
                          <div class="h-4 w-1/3 rounded bg-sf-surface-2 animate-pulse"></div>
                          <div class="h-3 w-full rounded bg-sf-surface-2 animate-pulse"></div>
                          <div class="h-3 w-2/3 rounded bg-sf-surface-2 animate-pulse"></div>
                        </div>
                      </div>
                    }
                  </div>
                </div>
              }
            </div>
          }
          @else if (menuSvc.menuError()) {
            <div class="flex flex-col items-center gap-4 py-20 text-center">
              <div class="w-12 h-12 rounded-full bg-sf-surface-2 flex items-center justify-center">
                <svg class="w-6 h-6 text-sf-text-3" fill="none" stroke="currentColor"
                     stroke-width="1.5" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round"
                        d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"/>
                </svg>
              </div>
              <p class="text-sf-text-2 text-sm">{{ menuSvc.menuError() }}</p>
              <button
                (click)="loadMenu()"
                class="px-6 py-2.5 rounded-full text-sm font-semibold
                       border border-sf-border text-sf-text-1
                       hover:bg-sf-surface transition-colors"
              >
                Try again
              </button>
            </div>
          }
          @else if (menuSvc.categories().length === 0) {
            <div class="flex flex-col items-center gap-4 py-20 text-center">
              <div class="w-14 h-14 rounded-full bg-sf-surface-2 flex items-center justify-center">
                <svg class="w-7 h-7 text-sf-text-3 opacity-50" fill="none"
                     stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round"
                        d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"/>
                </svg>
              </div>
              <p class="text-sf-text-2 text-sm">The menu isn't available yet. Check back soon.</p>
            </div>
          }
          @else if (filteredCategories().length === 0) {
            <div class="flex flex-col items-center gap-3 py-20 text-center">
              <p class="text-sf-text-2 text-sm">
                No items match "<span class="font-medium text-sf-text-1">{{ searchQuery() }}</span>".
              </p>
              <button
                (click)="clearSearch()"
                class="px-5 py-2 rounded-full text-sm font-semibold
                       border border-sf-border text-sf-text-1
                       hover:bg-sf-surface transition-colors"
              >
                Clear search
              </button>
            </div>
          }
          @else {
            <div class="space-y-14">
              @for (cat of filteredCategories(); track cat.id) {
                <section
                  #catSection
                  [id]="'cat-' + cat.id"
                  [attr.data-cat-id]="cat.id"
                  class="scroll-mt-32"
                >
                  <h2 class="font-display font-bold text-sf-text-1 text-xl mb-5">
                    {{ cat.name }}
                  </h2>

                  <div class="space-y-3">
                    @for (item of cat.items; track item.id) {
                      <div class="flex gap-4 p-4 rounded-2xl border border-sf-border bg-sf-surface">

                        <!-- Thumbnail -->
                        @if (item.imageUrl) {
                          <div class="w-24 h-24 sm:w-28 sm:h-28 shrink-0 rounded-xl overflow-hidden bg-sf-surface-2">
                            <img
                              [src]="item.imageUrl"
                              [alt]="item.name"
                              class="w-full h-full object-cover"
                              loading="lazy"
                            />
                          </div>
                        } @else {
                          <div class="w-24 h-24 sm:w-28 sm:h-28 shrink-0 rounded-xl bg-sf-surface-2
                                      flex items-center justify-center">
                            <svg class="w-8 h-8 text-sf-text-3 opacity-30"
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
                            <span class="font-bold text-sm sm:text-base shrink-0" [style.color]="tenantPrimary()">
                              {{ item.price | currencyFormat }}
                            </span>
                          </div>

                          @if (item.description) {
                            <p class="text-xs sm:text-sm text-sf-text-2 leading-relaxed mt-1.5">
                              {{ item.description }}
                            </p>
                          }

                          <div class="mt-auto pt-3 flex justify-end">
                            @if (quantityFor(item.id) === 0) {
                              <button
                                (click)="addToCart(item)"
                                class="flex items-center gap-1.5 px-3.5 py-1.5
                                       rounded-full text-xs font-semibold text-white
                                       transition-opacity hover:opacity-90
                                       focus-visible:outline focus-visible:outline-2"
                                [style.backgroundColor]="tenantPrimary()"
                              >
                                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor"
                                     stroke-width="2.5" viewBox="0 0 24 24">
                                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15"/>
                                </svg>
                                Add
                              </button>
                            } @else {
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
                                  {{ quantityFor(item.id) }}
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
                            }
                          </div>
                        </div>

                      </div>
                    }
                  </div>
                </section>
              }
            </div>
          }

        </div>
      </section>

      <app-restaurant-footer />

      <!-- ═══════════════════════════════════════════════════════════════
           ④ FLOATING CART BAR
      ═══════════════════════════════════════════════════════════════ -->
      @if (menuSvc.cartCount > 0) {
        <div
          class="fixed bottom-4 inset-x-4 sm:inset-x-auto sm:left-1/2
                 sm:-translate-x-1/2 sm:w-[420px]
                 flex items-center justify-between gap-4
                 rounded-2xl px-5 py-4 shadow-2xl text-white z-50"
          [style.backgroundColor]="tenantPrimary()"
        >
          <div class="flex items-center gap-3">
            <span class="w-7 h-7 rounded-full bg-white/20 flex items-center
                         justify-center text-xs font-bold">
              {{ menuSvc.cartCount }}
            </span>
            <span class="text-sm font-medium">
              {{ menuSvc.cartCount === 1 ? '1 item' : menuSvc.cartCount + ' items' }}
            </span>
          </div>
          <a
            routerLink="/cart"
            class="flex items-center gap-2 font-bold text-sm hover:opacity-90 transition-opacity"
          >
            {{ menuSvc.cartTotal | currencyFormat }}
            <svg class="w-4 h-4" fill="none" stroke="currentColor"
                 stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/>
            </svg>
          </a>
        </div>
      }
    </div>
  `,
})
export class RestaurantEditorialMenuViewComponent implements OnInit, AfterViewInit, OnDestroy {
  readonly menuSvc = inject(RestaurantStoreService);

  @ViewChildren('catSection') private catSections!: QueryList<ElementRef<HTMLElement>>;
  private observer: IntersectionObserver | null = null;

  readonly storeName     = signal('');
  readonly tenantPrimary = signal('#C1522A');

  readonly activeCategory = signal<string | null>(null);
  readonly searchQuery    = signal('');

  readonly filteredCategories = computed<IPublicMenuCategory[]>(() => {
    const q = this.searchQuery().trim().toLowerCase();
    const cats = this.menuSvc.categories();
    if (!q) return cats;
    return cats
      .map(c => ({ ...c, items: c.items.filter(i => i.name.toLowerCase().includes(q)) }))
      .filter(c => c.items.length > 0);
  });

  ngOnInit(): void {
    this.readTenantCssVars();
    this.loadMenu();
  }

  ngAfterViewInit(): void {
    this.catSections.changes.subscribe(() => this.setupScrollSpy());
    this.setupScrollSpy();
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
  }

  private readTenantCssVars(): void {
    const s = getComputedStyle(document.documentElement);
    const primary = s.getPropertyValue('--tenant-primary').trim();
    const name    = s.getPropertyValue('--tenant-store-name').trim();
    if (primary) this.tenantPrimary.set(primary);
    if (name)    this.storeName.set(name);
  }

  async loadMenu(): Promise<void> {
    await this.menuSvc.loadMenu();
    const cats = this.menuSvc.categories();
    if (cats.length > 0 && !this.activeCategory()) {
      this.activeCategory.set(cats[0].id);
    }
  }

  private setupScrollSpy(): void {
    this.observer?.disconnect();
    if (!this.catSections || this.catSections.length === 0) return;

    this.observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter(e => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        const topMost = visible[0]?.target.getAttribute('data-cat-id');
        if (topMost) this.activeCategory.set(topMost);
      },
      { rootMargin: '-130px 0px -55% 0px', threshold: [0, 0.1, 0.5, 1] }
    );
    this.catSections.forEach(ref => this.observer!.observe(ref.nativeElement));
  }

  scrollToCategory(id: string): void {
    this.activeCategory.set(id);
    document.getElementById('cat-' + id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  onSearch(event: Event): void {
    this.searchQuery.set((event.target as HTMLInputElement).value);
  }

  clearSearch(): void {
    this.searchQuery.set('');
  }

  quantityFor(itemId: string): number {
    return this.menuSvc.quantityOf(itemId);
  }

  addToCart(item: IPublicMenuItem): void {
    this.menuSvc.addToCart(item);
  }

  increment(item: IPublicMenuItem): void {
    this.menuSvc.addToCart(item);
  }

  decrement(item: IPublicMenuItem): void {
    this.menuSvc.updateQuantity(item.id, this.quantityFor(item.id) - 1);
  }
}
