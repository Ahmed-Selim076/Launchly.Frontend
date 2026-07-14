import {
  Component, ChangeDetectionStrategy, OnInit, OnDestroy, inject,
  signal, computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { Subject, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs';

import { ProductStoreService, IProductQuery } from '../../../../../core/storefront/store.service';
import { StoreNavComponent }    from '../../../../layout/store-nav/store-nav.component';
import { StoreFooterComponent } from '../../../../layout/store-footer/store-footer.component';
import { IPublicProduct, ICategory, IPagedResult } from '../../../../../core/models';
import { CurrencyFormatPipe }   from '../../../../../shared/pipes/pipes';

@Component({
  selector: 'app-bold-product-grid',
  standalone: true,
  imports: [
    CommonModule, RouterLink, ReactiveFormsModule,
    StoreNavComponent, StoreFooterComponent, CurrencyFormatPipe,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="min-h-screen bg-sf-bg">
      <app-store-nav />

      <main class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">

        <!-- ── Page header ── -->
        <div class="mb-8">
          <h1 class="font-display font-bold text-sf-text-1 text-3xl sm:text-4xl mb-1">
            Products
          </h1>
          <p class="text-sf-text-3 text-sm">
            @if (result()) {
              {{ result()!.totalCount }} product{{ result()!.totalCount === 1 ? '' : 's' }}
            }
          </p>
        </div>

        <div class="flex flex-col lg:flex-row gap-8">

          <!-- ══════════════════════════════
               SIDEBAR — filters
          ══════════════════════════════ -->
          <aside class="w-full lg:w-56 flex-shrink-0" aria-label="Filters">

            <!-- Search -->
            <div class="mb-6">
              <label class="block text-xs font-semibold uppercase tracking-wider text-sf-text-3 mb-2">
                Search
              </label>
              <div class="relative">
                <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5"
                     class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-sf-text-3 pointer-events-none">
                  <circle cx="9" cy="9" r="5.5"/><path d="M14.5 14.5l3 3"/>
                </svg>
                <input
                  type="search"
                  placeholder="Search products…"
                  [formControl]="searchCtrl"
                  class="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-sf-border
                         bg-sf-surface text-sf-text-1 placeholder:text-sf-text-3
                         focus:outline-none focus:ring-2 focus:border-transparent transition"
                  style="--tw-ring-color: var(--tenant-primary, #C1522A);"
                />
              </div>
            </div>

            <!-- Categories -->
            @if (categories().length) {
              <div class="mb-6">
                <p class="text-xs font-semibold uppercase tracking-wider text-sf-text-3 mb-3">Category</p>
                <ul class="space-y-1">
                  <li>
                    <button
                      type="button"
                      (click)="selectCategory(null)"
                      class="w-full text-left px-3 py-1.5 rounded text-sm transition-colors"
                      [class.font-semibold]="!activeCategoryId()"
                      [style.color]="!activeCategoryId() ? 'var(--tenant-primary,#C1522A)' : ''"
                      [class.text-sf-text-2]="activeCategoryId() !== null"
                    >
                      All categories
                    </button>
                  </li>
                  @for (cat of categories(); track cat.id) {
                    <li>
                      <button
                        type="button"
                        (click)="selectCategory(cat.id)"
                        class="w-full text-left px-3 py-1.5 rounded text-sm transition-colors"
                        [class.font-semibold]="activeCategoryId() === cat.id"
                        [style.color]="activeCategoryId() === cat.id ? 'var(--tenant-primary,#C1522A)' : ''"
                        [class.text-sf-text-2]="activeCategoryId() !== cat.id"
                      >
                        {{ cat.name }}
                      </button>
                    </li>
                  }
                </ul>
              </div>
            }

            <!-- Price Range -->
            <div class="mb-6">
              <p class="text-xs font-semibold uppercase tracking-wider text-sf-text-3 mb-3">Price</p>
              <div class="flex items-center gap-2">
                <input
                  type="number"
                  [formControl]="minPriceCtrl"
                  placeholder="Min"
                  min="0"
                  class="w-full px-3 py-2 text-sm rounded-lg border border-sf-border
                         bg-sf-surface text-sf-text-1 placeholder:text-sf-text-3
                         focus:outline-none focus:ring-2 focus:border-transparent"
                  style="--tw-ring-color: var(--tenant-primary, #C1522A);"
                />
                <span class="text-sf-text-3 flex-shrink-0">–</span>
                <input
                  type="number"
                  [formControl]="maxPriceCtrl"
                  placeholder="Max"
                  min="0"
                  class="w-full px-3 py-2 text-sm rounded-lg border border-sf-border
                         bg-sf-surface text-sf-text-1 placeholder:text-sf-text-3
                         focus:outline-none focus:ring-2 focus:border-transparent"
                  style="--tw-ring-color: var(--tenant-primary, #C1522A);"
                />
              </div>
            </div>

            <!-- Clear filters -->
            @if (hasActiveFilters()) {
              <button
                type="button"
                (click)="clearFilters()"
                class="text-xs font-medium text-sf-text-3 hover:text-sf-text-2 transition-colors"
              >
                ✕ Clear all filters
              </button>
            }
          </aside>

          <!-- ══════════════════════════════
               PRODUCT GRID
          ══════════════════════════════ -->
          <div class="flex-1 min-w-0">

            @if (loading()) {
              <!-- Skeleton -->
              <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                @for (_ of [1,2,3,4,5,6,7,8,9]; track $index) {
                  <div class="rounded-xl bg-sf-surface animate-pulse">
                    <div class="aspect-[4/3] rounded-t-xl bg-sf-surface-2"></div>
                    <div class="p-4 space-y-2">
                      <div class="h-3 bg-sf-border rounded w-1/3"></div>
                      <div class="h-4 bg-sf-border rounded w-3/4"></div>
                      <div class="h-3 bg-sf-border rounded w-1/4"></div>
                    </div>
                  </div>
                }
              </div>
            } @else if (error()) {
              <div class="rounded-xl bg-sf-surface border border-sf-border py-20 text-center">
                <p class="text-sf-text-3 mb-3">Something went wrong loading products.</p>
                <button
                  (click)="load()"
                  class="text-sm font-medium"
                  style="color: var(--tenant-primary, #C1522A);"
                >
                  Try again
                </button>
              </div>
            } @else if (!result()?.items?.length) {
              <div class="rounded-xl bg-sf-surface border border-sf-border py-20 text-center">
                <p class="text-sf-text-1 font-medium mb-2">No products found</p>
                <p class="text-sf-text-3 text-sm mb-4">Try adjusting your filters.</p>
                @if (hasActiveFilters()) {
                  <button
                    (click)="clearFilters()"
                    class="text-sm font-medium"
                    style="color: var(--tenant-primary, #C1522A);"
                  >
                    Clear filters
                  </button>
                }
              </div>
            } @else {
              <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                @for (product of result()!.items; track product.id) {
                  <a
                    [routerLink]="['/products', product.slug]"
                    class="group block rounded-xl overflow-hidden bg-sf-surface
                           transition-all duration-220 hover:shadow-md hover:-translate-y-0.5
                           focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                    style="--tw-ring-color: var(--tenant-primary, #C1522A);"
                  >
                    <!-- Image -->
                    <div class="aspect-[4/3] overflow-hidden bg-sf-surface-2">
                      @if (product.imageUrl) {
                        <img
                          [src]="product.imageUrl"
                          [alt]="product.name"
                          loading="lazy"
                          class="w-full h-full object-cover transition-transform duration-380
                                 group-hover:scale-104"
                        />
                      } @else {
                        <div class="w-full h-full flex items-center justify-center">
                          <svg viewBox="0 0 48 48" fill="none" class="w-12 h-12 text-sf-border-2">
                            <rect width="48" height="48" rx="8" fill="currentColor" opacity=".12"/>
                            <path d="M14 34l8-10 6 7.5 4-5L38 34H14z" fill="currentColor" opacity=".35"/>
                            <circle cx="18" cy="20" r="3" fill="currentColor" opacity=".35"/>
                          </svg>
                        </div>
                      }
                    </div>

                    <!-- Info -->
                    <div class="p-4">
                      @if (product.categoryName) {
                        <p class="text-[11px] font-medium uppercase tracking-wider text-sf-text-3 mb-1">
                          {{ product.categoryName }}
                        </p>
                      }
                      <h3 class="font-medium text-sf-text-1 text-sm leading-snug line-clamp-2 mb-2">
                        {{ product.name }}
                      </h3>
                      <div class="flex items-center justify-between">
                        <p
                          class="text-sm font-semibold"
                          style="color: var(--tenant-primary, #C1522A);"
                        >
                          {{ product.price | currencyFormat }}
                        </p>
                        @if (product.stock === 0) {
                          <span class="text-[10px] font-medium text-[var(--color-danger)]
                                       bg-[var(--color-danger-dim)] px-2 py-0.5 rounded-full">
                            Out of stock
                          </span>
                        }
                      </div>
                    </div>
                  </a>
                }
              </div>

              <!-- Pagination -->
              @if (result() && result()!.totalPages > 1) {
                <div class="mt-10 flex items-center justify-center gap-2 flex-wrap">
                  <button
                    type="button"
                    (click)="goToPage(currentPage() - 1)"
                    [disabled]="currentPage() <= 1"
                    class="px-4 py-2 text-sm rounded-lg border border-sf-border text-sf-text-2
                           disabled:opacity-40 hover:bg-sf-surface transition-colors"
                  >
                    ← Prev
                  </button>

                  @for (pg of pageNumbers(); track pg) {
                    @if (pg === -1) {
                      <span class="px-2 text-sf-text-3">…</span>
                    } @else {
                      <button
                        type="button"
                        (click)="goToPage(pg)"
                        class="w-9 h-9 text-sm rounded-lg border transition-colors font-medium"
                        [class.text-white]="pg === currentPage()"
                        [class.border-transparent]="pg === currentPage()"
                        [class.border-sf-border]="pg !== currentPage()"
                        [class.text-sf-text-2]="pg !== currentPage()"
                        [class.hover:bg-sf-surface]="pg !== currentPage()"
                        [style.background]="pg === currentPage() ? 'var(--tenant-primary,#C1522A)' : ''"
                      >
                        {{ pg }}
                      </button>
                    }
                  }

                  <button
                    type="button"
                    (click)="goToPage(currentPage() + 1)"
                    [disabled]="currentPage() >= result()!.totalPages"
                    class="px-4 py-2 text-sm rounded-lg border border-sf-border text-sf-text-2
                           disabled:opacity-40 hover:bg-sf-surface transition-colors"
                  >
                    Next →
                  </button>
                </div>
              }
            }
          </div>
        </div>
      </main>

      <app-store-footer />
    </div>
  `,
})
export class BoldProductGridComponent implements OnInit, OnDestroy {
  private readonly productSvc = inject(ProductStoreService);
  private readonly route      = inject(ActivatedRoute);
  private readonly router     = inject(Router);
  private readonly fb         = inject(FormBuilder);
  private readonly destroy$   = new Subject<void>();

  // ─── Form controls ────────────────────────────────────────────────────────

  readonly searchCtrl   = this.fb.control('');
  readonly minPriceCtrl = this.fb.control<number | null>(null);
  readonly maxPriceCtrl = this.fb.control<number | null>(null);

  // ─── State ────────────────────────────────────────────────────────────────

  readonly result           = signal<IPagedResult<IPublicProduct> | null>(null);
  readonly categories       = signal<ICategory[]>([]);
  readonly loading          = signal(true);
  readonly error            = signal(false);
  readonly currentPage      = signal(1);
  readonly activeCategoryId = signal<string | null>(null);

  readonly hasActiveFilters = computed(() =>
    !!this.searchCtrl.value ||
    this.activeCategoryId() !== null ||
    this.minPriceCtrl.value != null ||
    this.maxPriceCtrl.value != null
  );

  readonly pageNumbers = computed<number[]>(() => {
    const total = this.result()?.totalPages ?? 0;
    const cur   = this.currentPage();
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
    const pages: number[] = [1];
    if (cur > 3) pages.push(-1);
    for (let p = Math.max(2, cur - 1); p <= Math.min(total - 1, cur + 1); p++) pages.push(p);
    if (cur < total - 2) pages.push(-1);
    pages.push(total);
    return pages;
  });

  // ─── Lifecycle ────────────────────────────────────────────────────────────

  ngOnInit(): void {
    // Load categories once
    this.productSvc.getCategories().subscribe({
      next: res => { if (res.success && res.data) this.categories.set(res.data); },
      error: () => {},
    });

    // Debounce search input
    this.searchCtrl.valueChanges.pipe(
      debounceTime(380),
      distinctUntilChanged(),
      takeUntil(this.destroy$),
    ).subscribe(() => { this.currentPage.set(1); this.load(); });

    // Debounce price changes
    this.minPriceCtrl.valueChanges.pipe(debounceTime(500), takeUntil(this.destroy$))
      .subscribe(() => { this.currentPage.set(1); this.load(); });
    this.maxPriceCtrl.valueChanges.pipe(debounceTime(500), takeUntil(this.destroy$))
      .subscribe(() => { this.currentPage.set(1); this.load(); });

    // Read initial query params
    const qp = this.route.snapshot.queryParamMap;
    if (qp.get('search'))   this.searchCtrl.setValue(qp.get('search')!,        { emitEvent: false });
    if (qp.get('category')) this.activeCategoryId.set(qp.get('category'));
    if (qp.get('page'))     this.currentPage.set(Number(qp.get('page')) || 1);

    this.load();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ─── Actions ──────────────────────────────────────────────────────────────

  load(): void {
    this.loading.set(true);
    this.error.set(false);

    const q: IProductQuery = {
      page:       this.currentPage(),
      pageSize:   12,
      search:     this.searchCtrl.value ?? undefined,
      categoryId: this.activeCategoryId() ?? undefined,
      minPrice:   this.minPriceCtrl.value ?? undefined,
      maxPrice:   this.maxPriceCtrl.value ?? undefined,
    };

    this.productSvc.getProducts(q).subscribe({
      next: res => {
        this.loading.set(false);
        if (res.success && res.data) this.result.set(res.data);
        else this.error.set(true);
      },
      error: () => { this.loading.set(false); this.error.set(true); },
    });
  }

  selectCategory(id: string | null): void {
    this.activeCategoryId.set(id);
    this.currentPage.set(1);
    this.load();
  }

  goToPage(pg: number): void {
    if (!this.result()) return;
    if (pg < 1 || pg > this.result()!.totalPages) return;
    this.currentPage.set(pg);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    this.load();
  }

  clearFilters(): void {
    this.searchCtrl.setValue('',   { emitEvent: false });
    this.minPriceCtrl.setValue(null, { emitEvent: false });
    this.maxPriceCtrl.setValue(null, { emitEvent: false });
    this.activeCategoryId.set(null);
    this.currentPage.set(1);
    this.load();
  }
}
