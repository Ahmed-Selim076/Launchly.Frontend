import {
  Component, ChangeDetectionStrategy, OnInit, inject, signal, computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TenantService }       from '../../../../../core/tenant/tenant.service';
import { ProductStoreService } from '../../../../../core/storefront/store.service';
import { WishlistService }     from '../../../../../core/storefront/wishlist.service';
import { CartService }         from '../../../../../core/storefront/cart.service';
import { AuthService }         from '../../../../../core/auth/auth.service';
import { ToastService }        from '../../../../../shared/components/toast/toast.service';
import { StoreNavComponent }   from '../../../../layout/store-nav/store-nav.component';
import { StoreFooterComponent } from '../../../../layout/store-footer/store-footer.component';
import { IPublicProduct, ICategory } from '../../../../../core/models';
import { CurrencyFormatPipe }  from '../../../../../shared/pipes/pipes';

type FeaturedTab = 'all' | 'new' | 'bestseller' | 'sale';

/**
 * Template 1 — Minimal Home Page
 *
 * Section order and feature set are a 1:1 port of the smart-vibe reference
 * site: Hero → Categories → Featured Products (tabbed) → Newsletter.
 * All color still derives from --tenant-primary/secondary via color-mix()
 * (see globals.css) — smart-vibe's crimson/cream is applied as this
 * template's *default* tenant color, not a hardcoded value, so merchants
 * can still restyle from Settings without touching this component.
 */
@Component({
  selector: 'app-minimal-home',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, StoreNavComponent, StoreFooterComponent, CurrencyFormatPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="min-h-screen bg-sf-bg overflow-x-clip">
      <app-store-nav />

      <!-- ══════════════════════════════════════════════════════════
           HERO — mesh gradient canvas + floating product cards
      ══════════════════════════════════════════════════════════ -->
      <section class="relative bg-tenant-mesh overflow-hidden" aria-label="Hero">
        <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div class="grid grid-cols-1 lg:grid-cols-5 gap-12 items-center py-16 sm:py-20 lg:py-24 min-h-[640px]">

            <!-- Copy -->
            <div class="lg:col-span-3">
              <span class="hero-item inline-flex items-center gap-2 mb-6">
                <span class="w-1.5 h-1.5 rounded-full flex-shrink-0" style="background: var(--tenant-primary);"></span>
                <span class="font-mono text-[11px] font-medium tracking-widest uppercase text-sf-text-3">
                  New arrivals weekly
                </span>
              </span>

              <h1 class="hero-item font-display font-semibold text-sf-text-1
                         text-[2.6rem] sm:text-6xl lg:text-[4.5rem] leading-[1.02] mb-6">
                {{ tenant()?.heroText ?? 'Considered pieces,' }}
                <span class="text-tenant-gradient">quietly</span>
                made well
              </h1>

              <p class="hero-item text-sf-text-2 text-lg leading-relaxed mb-9 max-w-lg">
                Handpicked for quality. Delivered with care.
              </p>

              <div class="hero-item flex items-center gap-3 flex-wrap mb-10">
                <a
                  routerLink="/products"
                  class="group inline-flex items-center gap-2.5 px-7 h-13 py-3.5 rounded-xl text-sm font-bold
                         text-white bg-tenant-gradient shadow-tenant-glow
                         transition-transform duration-220 hover:-translate-y-0.5"
                >
                  Shop now
                  <svg viewBox="0 0 20 20" fill="currentColor" class="w-4 h-4 transition-transform duration-220 group-hover:translate-x-0.5">
                    <path fill-rule="evenodd" d="M3 10a.75.75 0 01.75-.75h10.638L10.23 5.29a.75.75 0 111.04-1.08l5.5 5.25a.75.75 0 010 1.08l-5.5 5.25a.75.75 0 11-1.04-1.08l4.158-3.96H3.75A.75.75 0 013 10z" clip-rule="evenodd"/>
                  </svg>
                </a>
                <a
                  href="#categories"
                  class="inline-flex items-center gap-2 px-7 h-13 py-3.5 rounded-xl text-sm font-bold
                         text-sf-text-1 border border-sf-border bg-sf-bg/60 backdrop-blur
                         hover:border-sf-border-2 transition-colors"
                >
                  Browse categories
                </a>
              </div>

              <!-- Trust row -->
              <div class="hero-item flex flex-wrap gap-x-6 gap-y-2 text-sm text-sf-text-3">
                <span class="inline-flex items-center gap-2">
                  <svg viewBox="0 0 20 20" fill="currentColor" class="w-4 h-4 text-amber-400">
                    <path d="M10 1.5l2.6 5.7 6.2.6-4.7 4.2 1.4 6.1L10 15l-5.5 3.1 1.4-6.1-4.7-4.2 6.2-.6z"/>
                  </svg>
                  Loved by thousands
                </span>
                <span class="inline-flex items-center gap-2">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" class="w-4 h-4" style="color: var(--tenant-primary);">
                    <path d="M1 3h15v13H1zM16 8h4l3 3v5h-7V8zM5.5 21a2.5 2.5 0 100-5 2.5 2.5 0 000 5zM18.5 21a2.5 2.5 0 100-5 2.5 2.5 0 000 5z"/>
                  </svg>
                  Free shipping
                </span>
                <span class="inline-flex items-center gap-2">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" class="w-4 h-4" style="color: var(--tenant-primary);">
                    <path d="M3 12a9 9 0 106.7-8.7M3 4v5h5"/>
                  </svg>
                  30-day returns
                </span>
              </div>
            </div>

            <!-- Hero image — single clean product shot, not a mockup cluster -->
            <div class="hero-item lg:col-span-2 relative h-[420px] lg:h-[480px] hidden md:block
                        rounded-3xl overflow-hidden bg-sf-surface border border-sf-border shadow-tenant-glow">
              @if (loadingFeatured()) {
                <div class="absolute inset-0 bg-sf-surface animate-pulse"></div>
              } @else {
                @if (heroProducts()[0]; as product) {
                  <a [routerLink]="['/products', product.slug]" class="block w-full h-full group">
                    @if (product.imageUrl) {
                      <img [src]="product.imageUrl" [alt]="product.name"
                           class="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500" />
                    } @else {
                      <div class="w-full h-full flex items-center justify-center">
                        <svg viewBox="0 0 48 48" fill="none" class="w-16 h-16 text-sf-border-2">
                          <rect width="48" height="48" rx="8" fill="currentColor" opacity=".2"/>
                          <path d="M14 34l8-10 6 7.5 4-5L38 34H14z" fill="currentColor" opacity=".5"/>
                        </svg>
                      </div>
                    }
                    <div class="absolute bottom-0 inset-x-0 p-5 bg-gradient-to-t from-black/50 to-transparent">
                      <p class="text-white font-display text-lg">{{ product.name }}</p>
                      <p class="text-white/90 text-sm font-semibold">{{ product.price | currencyFormat }}</p>
                    </div>
                  </a>
                } @else {
                  <div class="absolute inset-0 flex items-center justify-center">
                    <p class="text-sf-text-3 text-sm px-6 text-center">Add a product to feature it here</p>
                  </div>
                }
              }
            </div>
          </div>
        </div>

        <!-- Ambient blur orbs -->
        <div
          class="pointer-events-none absolute -top-24 -left-24 w-72 h-72 rounded-full blur-3xl opacity-[0.15]"
          style="background: var(--tenant-primary);" aria-hidden="true"
        ></div>
        <div
          class="pointer-events-none absolute -bottom-32 -right-16 w-96 h-96 rounded-full blur-3xl opacity-[0.12]"
          style="background: var(--tenant-secondary, var(--tenant-primary));" aria-hidden="true"
        ></div>
      </section>

      <!-- ══════════════════════════════════════════════════════════
           CATEGORIES — shop by category grid
      ══════════════════════════════════════════════════════════ -->
      <section id="categories" class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 sm:py-20 border-t border-sf-border">
        <div class="text-center mb-12">
          <h2 class="font-display font-medium text-sf-text-1 text-3xl sm:text-4xl mb-3">Shop by category</h2>
          <p class="text-sf-text-2">Pick a category to start browsing</p>
        </div>

        @if (loadingCategories()) {
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
            @for (_ of [1,2,3,4]; track $index) {
              <div class="rounded-2xl bg-sf-surface animate-pulse h-32"></div>
            }
          </div>
        } @else if (categories().length) {
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
            @for (cat of categories(); track cat.id) {
              <a
                [routerLink]="['/products']"
                [queryParams]="{ categoryId: cat.id }"
                class="group relative rounded-2xl p-6 border border-sf-border bg-sf-surface
                       hover:border-tenant-primary/60 hover:shadow-tenant-glow transition-all
                       overflow-hidden flex flex-col"
              >
                <div class="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
                     style="background: linear-gradient(135deg, color-mix(in srgb, var(--tenant-primary) 6%, transparent), transparent);"></div>
                <div class="relative">
                  <div class="w-11 h-11 rounded-xl flex items-center justify-center mb-3"
                       style="background: color-mix(in srgb, var(--tenant-primary) 12%, var(--color-sf-bg));">
                    <svg viewBox="0 0 24 24" fill="none" stroke="var(--tenant-primary)" stroke-width="1.6" class="w-5 h-5">
                      <path d="M4 7h16l-1.5 12.5a2 2 0 01-2 1.5H7.5a2 2 0 01-2-1.5L4 7z"/>
                      <path d="M8 7V5a4 4 0 118 0v2"/>
                    </svg>
                  </div>
                  <h3 class="font-display font-medium text-sf-text-1 mb-1">{{ cat.name }}</h3>
                  <p class="text-sm text-sf-text-3">{{ cat.productCount ?? 0 }} products</p>
                </div>
              </a>
            }
          </div>
        } @else {
          <div class="rounded-xl border border-dashed border-sf-border-2 py-16 text-center">
            <p class="text-sf-text-3 text-sm">No categories yet.</p>
          </div>
        }
      </section>

      <!-- ══════════════════════════════════════════════════════════
           FEATURED PRODUCTS — tabbed grid with wishlist / rating / cart
      ══════════════════════════════════════════════════════════ -->
      <section class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 sm:py-20 border-t border-sf-border">

        <div class="text-center mb-8">
          <p class="font-mono text-[11px] font-medium tracking-widest uppercase text-sf-text-3 mb-2">
            Selected
          </p>
          <h2 class="font-display font-medium text-sf-text-1 text-3xl sm:text-4xl">
            Featured products
          </h2>
        </div>

        <!-- Tabs -->
        <div class="flex flex-wrap justify-center gap-2 mb-10">
          @for (t of tabs; track t.key) {
            <button
              (click)="setTab(t.key)"
              class="px-5 h-10 rounded-full text-sm font-semibold transition-all border"
              [class.text-white]="tab() === t.key"
              [class.border-transparent]="tab() === t.key"
              [class.bg-sf-surface]="tab() !== t.key"
              [class.border-sf-border]="tab() !== t.key"
              [style.background]="tab() === t.key ? 'var(--tenant-primary)' : null"
            >
              {{ t.label }}
            </button>
          }
        </div>

        @if (loadingFeatured()) {
          <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
            @for (_ of [1,2,3,4,5,6,7,8]; track $index) {
              <div class="rounded-2xl bg-sf-surface animate-pulse h-72"></div>
            }
          </div>
        } @else if (visibleProducts().length) {
          <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
            @for (product of visibleProducts(); track product.id) {
              <div
                class="group relative bg-sf-surface rounded-2xl overflow-hidden border border-sf-border
                       hover:border-tenant-primary/40 hover:shadow-tenant-glow transition-all"
              >
                <a [routerLink]="['/products', product.slug]" class="block relative aspect-square overflow-hidden bg-sf-bg">
                  @if (product.imageUrl) {
                    <img
                      [src]="product.imageUrl"
                      [alt]="product.name"
                      loading="lazy"
                      class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  } @else {
                    <div class="w-full h-full flex items-center justify-center">
                      <svg viewBox="0 0 48 48" fill="none" class="w-10 h-10 text-sf-border-2">
                        <rect width="48" height="48" rx="8" fill="currentColor" opacity=".2"/>
                        <path d="M14 34l8-10 6 7.5 4-5L38 34H14z" fill="currentColor" opacity=".5"/>
                      </svg>
                    </div>
                  }
                  @if (product.badge) {
                    <span class="absolute top-3 right-3 text-xs font-bold px-2.5 py-1 rounded-full text-white"
                          style="background: var(--tenant-primary);">
                      {{ product.badge }}
                    </span>
                  } @else if (product.originalPrice) {
                    <span class="absolute top-3 right-3 text-xs font-bold px-2.5 py-1 rounded-full bg-danger text-white">
                      Sale
                    </span>
                  }
                </a>

                <!-- Wishlist heart -->
                <button
                  (click)="onToggleWishlist(product)"
                  class="absolute top-3 left-3 w-9 h-9 rounded-full bg-sf-bg/80 backdrop-blur
                         flex items-center justify-center hover:scale-110 transition-transform"
                  aria-label="Wishlist"
                >
                  <svg viewBox="0 0 24 24" class="w-4 h-4"
                       [attr.fill]="wishlistSvc.isWishlisted(product.id) ? 'var(--tenant-primary)' : 'none'"
                       stroke="currentColor" stroke-width="1.8"
                       [style.color]="wishlistSvc.isWishlisted(product.id) ? 'var(--tenant-primary)' : 'var(--color-sf-text-2)'">
                    <path d="M12 20s-7-4.35-9.5-8.5C.8 8.2 2.3 5 5.5 5c1.8 0 3 1 4 2.3C10.5 6 11.7 5 13.5 5 16.7 5 18.2 8.2 21.5 11.5 19 15.65 12 20 12 20z"/>
                  </svg>
                </button>

                <div class="p-4">
                  <a [routerLink]="['/products', product.slug]">
                    <h3 class="font-display text-sf-text-1 text-sm leading-snug min-h-10 line-clamp-2 hover:opacity-75 transition-opacity">
                      {{ product.name }}
                    </h3>
                  </a>

                  @if (product.reviewCount > 0) {
                    <div class="flex items-center gap-1 mt-2 text-xs text-sf-text-3">
                      <svg viewBox="0 0 20 20" fill="currentColor" class="w-3.5 h-3.5 text-amber-400">
                        <path d="M10 1.5l2.6 5.7 6.2.6-4.7 4.2 1.4 6.1L10 15l-5.5 3.1 1.4-6.1-4.7-4.2 6.2-.6z"/>
                      </svg>
                      <span class="font-semibold text-sf-text-1">{{ product.averageRating }}</span>
                      <span>({{ product.reviewCount }})</span>
                    </div>
                  }

                  <div class="flex items-baseline gap-2 mt-3">
                    <span class="text-lg font-bold" style="color: var(--tenant-primary);">
                      {{ product.price | currencyFormat }}
                    </span>
                    @if (product.originalPrice) {
                      <span class="text-xs text-sf-text-3 line-through">
                        {{ product.originalPrice | currencyFormat }}
                      </span>
                    }
                  </div>

                  <button
                    (click)="onAddToCart(product)"
                    [disabled]="product.stock <= 0"
                    class="w-full mt-3 h-10 rounded-xl text-white font-bold text-sm
                           bg-tenant-gradient hover:shadow-tenant-glow transition-shadow
                           disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {{ product.stock > 0 ? 'Add to cart' : 'Out of stock' }}
                  </button>
                </div>
              </div>
            }
          </div>
        } @else {
          <div class="rounded-xl border border-dashed border-sf-border-2 py-24 text-center">
            <p class="text-sf-text-3 text-sm">No products in this tab yet.</p>
          </div>
        }

        <div class="text-center mt-10">
          <a routerLink="/products" class="text-sm font-semibold hover:opacity-75 transition-opacity"
             style="color: var(--tenant-primary);">
            View all products →
          </a>
        </div>
      </section>

      <!-- ══════════════════════════════════════════════════════════
           NEWSLETTER
      ══════════════════════════════════════════════════════════ -->
      <section class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
        <div class="rounded-3xl bg-tenant-gradient p-10 md:p-16 text-center relative overflow-hidden">
          <div class="absolute inset-0 bg-tenant-mesh opacity-40"></div>
          <div class="relative max-w-2xl mx-auto text-white">
            <h2 class="font-display font-medium text-3xl md:text-4xl mb-3">Stay in the loop</h2>
            <p class="opacity-90 mb-8">Get our latest drops and offers straight to your inbox</p>

            @if (subscribed()) {
              <p class="text-lg font-bold">✅ Subscribed! Check your inbox.</p>
            } @else {
              <form (submit)="onSubscribe($event)" class="flex flex-col sm:flex-row gap-3 max-w-lg mx-auto">
                <input
                  type="email"
                  required
                  [(ngModel)]="newsletterEmail"
                  name="newsletterEmail"
                  placeholder="Your email address"
                  class="flex-1 h-12 px-4 rounded-xl bg-white/15 border border-white/30 backdrop-blur
                         text-white placeholder:text-white/70 outline-none focus:border-white/60"
                />
                <button type="submit" class="h-12 px-8 rounded-xl bg-white font-bold hover:opacity-90 transition-opacity"
                        style="color: var(--tenant-primary);">
                  Subscribe
                </button>
              </form>
            }
          </div>
        </div>
      </section>

      <!-- ══════════════════════════════════════════════════════════
           ABOUT — quiet, no color band, just space + a rule
      ══════════════════════════════════════════════════════════ -->
      @if (tenant()?.aboutText) {
        <section id="about" class="border-t border-sf-border py-16 sm:py-20" aria-label="About">
          <div class="mx-auto max-w-2xl px-4 sm:px-6 text-center">
            <p class="font-mono text-[11px] font-medium tracking-widest uppercase text-sf-text-3 mb-4">
              About
            </p>
            <p class="font-display text-2xl sm:text-3xl leading-snug text-sf-text-1">
              {{ tenant()!.aboutText }}
            </p>
          </div>
        </section>
      }

      <app-store-footer />
    </div>

    <style>
      .hero-item {
        opacity: 0;
        transform: translateY(16px);
        animation: heroSettle 700ms cubic-bezier(0.16,1,0.3,1) forwards;
      }
      .hero-item:nth-child(1) { animation-delay: 0ms; }
      .hero-item:nth-child(2) { animation-delay: 90ms; }
      .hero-item:nth-child(3) { animation-delay: 180ms; }
      .hero-item:nth-child(4) { animation-delay: 270ms; }
      .hero-item:nth-child(5) { animation-delay: 360ms; }

      @keyframes heroSettle {
        to { opacity: 1; transform: translateY(0); }
      }

      @media (prefers-reduced-motion: reduce) {
        .hero-item, .float-anim { animation: none; opacity: 1; transform: none; }
      }
    </style>
  `,
})
export class MinimalHomeComponent implements OnInit {
  private readonly tenantSvc  = inject(TenantService);
  private readonly productSvc = inject(ProductStoreService);
  private readonly cartSvc    = inject(CartService);
  private readonly authSvc    = inject(AuthService);
  private readonly toastSvc   = inject(ToastService);
  readonly wishlistSvc        = inject(WishlistService);

  readonly tenant            = this.tenantSvc.currentTenant;
  readonly featured          = signal<IPublicProduct[]>([]);
  readonly loadingFeatured   = signal(true);
  readonly categories        = signal<ICategory[]>([]);
  readonly loadingCategories = signal(true);

  readonly tab = signal<FeaturedTab>('all');
  readonly tabs: { key: FeaturedTab; label: string }[] = [
    { key: 'all',        label: 'All' },
    { key: 'new',        label: 'New arrivals' },
    { key: 'bestseller', label: 'Best sellers' },
    { key: 'sale',       label: 'On sale' },
  ];

  newsletterEmail = '';
  readonly subscribed = signal(false);

  /** First product, used as the hero's single feature image. */
  readonly heroProducts = computed(() => this.featured().slice(0, 3));

  readonly visibleProducts = computed(() => {
    const items = this.featured();
    switch (this.tab()) {
      case 'new':        return [...items].sort((a, b) => a.name.localeCompare(b.name)).slice(0, 8);
      case 'bestseller':  return [...items].filter(p => p.reviewCount > 0).sort((a, b) => b.reviewCount - a.reviewCount);
      case 'sale':        return items.filter(p => p.originalPrice != null);
      default:             return items;
    }
  });

  ngOnInit(): void {
    this.wishlistSvc.load();

    this.productSvc.getProducts({ page: 1, pageSize: 16 }).subscribe({
      next: res => {
        this.loadingFeatured.set(false);
        if (res.success && res.data) this.featured.set(res.data.items);
      },
      error: () => this.loadingFeatured.set(false),
    });

    this.productSvc.getCategories().subscribe({
      next: res => {
        this.loadingCategories.set(false);
        if (res.success && res.data) this.categories.set(res.data);
      },
      error: () => this.loadingCategories.set(false),
    });
  }

  setTab(key: FeaturedTab): void {
    this.tab.set(key);
  }

  onAddToCart(product: IPublicProduct): void {
    this.cartSvc.add({
      productId: product.id,
      name: product.name,
      price: product.price,
      imageUrl: product.imageUrl,
    });
    this.toastSvc.success(`${product.name} added to cart`);
  }

  onToggleWishlist(product: IPublicProduct): void {
    if (!this.authSvc.isAuthenticated()) {
      this.toastSvc.info('Sign in to save items to your wishlist');
      return;
    }
    const wasWishlisted = this.wishlistSvc.isWishlisted(product.id);
    this.wishlistSvc.toggle(product.id);
    this.toastSvc.success(wasWishlisted ? 'Removed from wishlist' : 'Added to wishlist');
  }

  onSubscribe(event: Event): void {
    event.preventDefault();
    if (!this.newsletterEmail) return;
    // Front-end only for now — no newsletter-subscriber table/endpoint
    // exists yet on the backend. Flagged to the merchant separately;
    // wire this up to a real endpoint before relying on it for marketing.
    this.subscribed.set(true);
    this.toastSvc.success('Subscribed!');
  }
}
