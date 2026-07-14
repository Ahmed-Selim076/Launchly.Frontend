import { Component, ChangeDetectionStrategy, inject, signal, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { TenantService } from '../../../../../core/tenant/tenant.service';
import { RestaurantStoreService } from '../../../../../core/storefront/restaurant-store.service';
import { AuthService } from '../../../../../core/auth/auth.service';

/**
 * RestaurantNavComponent — a dedicated nav for the Restaurant store type.
 * The shared StoreNavComponent (ecommerce) has a "Products" link, a
 * wishlist icon, and links to /products — none of which exist or make
 * sense for a restaurant (menu items aren't wishlist-able, there's no
 * /products route here). This nav uses the restaurant's actual routes
 * (/menu, /order-type, /cart) and a script-style wordmark, matching a
 * refined restaurant site rather than a generic storefront.
 */
@Component({
  selector: 'app-restaurant-nav',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header
      class="sticky top-0 z-50 w-full bg-sf-bg/95 backdrop-blur-md
             border-b border-sf-border transition-shadow duration-220"
      [class.shadow-sm]="scrolled()"
    >
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div class="flex h-[76px] items-center justify-between gap-4">

          <!-- Brand — script wordmark, the Molina-style signature logo -->
          <a routerLink="/" class="flex items-center gap-2.5 flex-shrink-0"
             [attr.aria-label]="tenant()?.storeName ?? 'Home'">
            @if (tenant()?.logoUrl) {
              <img [src]="tenant()!.logoUrl!" [alt]="tenant()!.storeName" class="h-9 w-9 rounded-full object-cover" />
            }
            <span class="font-script text-3xl leading-none" style="color: var(--tenant-primary);">
              {{ tenant()?.storeName ?? 'Restaurant' }}
            </span>
          </a>

          <!-- Desktop links -->
          <nav class="hidden md:flex items-center gap-9" aria-label="Main navigation">
            @for (link of navLinks; track link.route) {
              <a
                [routerLink]="link.route"
                routerLinkActive="text-sf-text-1 nav-link-active"
                [routerLinkActiveOptions]="{ exact: link.exact }"
                class="relative py-2 text-[13px] font-medium tracking-wide uppercase
                       text-sf-text-3 hover:text-sf-text-1 transition-colors duration-120"
                style="--nav-accent: var(--tenant-primary);"
              >
                {{ link.label }}
              </a>
            }
          </nav>

          <!-- Actions -->
          <div class="flex items-center gap-3">
            @if (authSvc.isTenantAdmin()) {
              <a
                routerLink="/admin"
                class="hidden sm:inline-flex items-center gap-1.5 h-9 px-3.5 rounded-full text-xs font-semibold
                       border border-sf-border text-sf-text-2 hover:bg-sf-surface transition-colors"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"
                     stroke-linecap="round" stroke-linejoin="round" class="w-3.5 h-3.5">
                  <path d="M12 2l8 4v6c0 5-3.4 8-8 10-4.6-2-8-5-8-10V6z"/>
                </svg>
                Admin panel
              </a>
            }

            <button
              type="button"
              (click)="toggleTheme()"
              class="h-9 w-9 rounded-full flex items-center justify-center text-sf-text-2 hover:bg-sf-surface transition-colors"
              [attr.aria-label]="isDark() ? 'Switch to light mode' : 'Switch to dark mode'"
            >
              @if (isDark()) {
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" class="w-[18px] h-[18px]">
                  <circle cx="12" cy="12" r="5"/>
                  <line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
                  <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
                </svg>
              } @else {
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" class="w-[18px] h-[18px]">
                  <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/>
                </svg>
              }
            </button>

            <a
              routerLink="/order-type"
              class="hidden sm:inline-flex items-center gap-2 px-5 h-10 rounded-full text-xs font-bold
                     uppercase tracking-wide text-white transition-opacity hover:opacity-90"
              style="background: var(--tenant-primary);"
            >
              Order online
            </a>

            <a routerLink="/cart" class="relative h-9 w-9 rounded-full flex items-center justify-center
                   text-sf-text-2 hover:bg-sf-surface transition-colors" aria-label="View cart">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"
                   stroke-linecap="round" stroke-linejoin="round" class="w-[18px] h-[18px]">
                <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
                <path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 001.97-1.67L23 6H6"/>
              </svg>
              @if (cartCount() > 0) {
                <span class="absolute -top-0.5 -right-0.5 min-w-[16px] h-[16px] rounded-full
                             text-white text-[10px] font-semibold leading-none flex items-center justify-center px-1"
                      style="background: var(--tenant-primary);">
                  {{ cartCount() > 99 ? '99+' : cartCount() }}
                </span>
              }
            </a>

            <button
              type="button"
              class="md:hidden h-9 w-9 rounded-full flex items-center justify-center text-sf-text-2 hover:bg-sf-surface"
              (click)="mobileOpen.set(!mobileOpen())"
              [attr.aria-expanded]="mobileOpen()" aria-label="Toggle menu"
            >
              @if (mobileOpen()) {
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" class="w-[18px] h-[18px]">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              } @else {
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" class="w-[18px] h-[18px]">
                  <line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/>
                </svg>
              }
            </button>
          </div>
        </div>
      </div>

      @if (mobileOpen()) {
        <div class="md:hidden border-t border-sf-border bg-sf-bg">
          <nav class="flex flex-col px-4 py-3 gap-1">
            @for (link of navLinks; track link.route) {
              <a
                [routerLink]="link.route"
                routerLinkActive="text-sf-text-1 font-semibold bg-sf-surface"
                [routerLinkActiveOptions]="{ exact: link.exact }"
                class="px-3 py-2.5 rounded-lg text-sm text-sf-text-2 hover:bg-sf-surface"
                (click)="mobileOpen.set(false)"
              >
                {{ link.label }}
              </a>
            }
            <a routerLink="/order-type" class="mt-2 px-3 py-2.5 rounded-lg text-sm font-bold text-white text-center"
               style="background: var(--tenant-primary);" (click)="mobileOpen.set(false)">
              Order online
            </a>
          </nav>
        </div>
      }
    </header>

    <style>
      .nav-link-active::after {
        content: '';
        position: absolute; left: 0; right: 0; bottom: -1px;
        height: 2px; background: var(--nav-accent); border-radius: 2px;
      }
    </style>
  `,
})
export class RestaurantNavComponent {
  private readonly tenantSvc = inject(TenantService);
  private readonly menuSvc   = inject(RestaurantStoreService);
  readonly authSvc = inject(AuthService);

  readonly tenant   = this.tenantSvc.currentTenant;
  readonly scrolled = signal(false);
  readonly mobileOpen = signal(false);
  readonly isDark    = signal(this.#loadDark());
  readonly cartCount  = () => this.menuSvc.cartCount;

  readonly navLinks = [
    { label: 'Home',    route: '/',        exact: true },
    { label: 'Menu',    route: '/menu',    exact: false },
    { label: 'About',   route: '/about',   exact: false },
    { label: 'Contact', route: '/contact', exact: false },
  ];

  @HostListener('window:scroll')
  onScroll(): void { this.scrolled.set(window.scrollY > 8); }

  toggleTheme(): void {
    const next = !this.isDark();
    this.isDark.set(next);
    document.documentElement.classList.toggle('dark', next);
    try { localStorage.setItem('sf_dark', next ? '1' : '0'); } catch {}
  }

  #loadDark(): boolean {
    try {
      const val = localStorage.getItem('sf_dark') === '1';
      if (val) document.documentElement.classList.add('dark');
      return val;
    } catch { return false; }
  }
}
