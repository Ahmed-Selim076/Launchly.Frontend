import {
  Component, ChangeDetectionStrategy, inject, signal,
  HostListener, OnInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { TenantService }  from '../../../core/tenant/tenant.service';
import { CartService }    from '../../../core/storefront/cart.service';
import { AuthService }    from '../../../core/auth/auth.service';

/**
 * StorefrontNavComponent
 *
 * Tenant-branded top navigation for all Ecommerce template pages.
 * - Logo + store name from TenantService
 * - Tenant primary colour applied via --tenant-primary CSS var
 * - Cart icon with item count badge
 * - Dark/Light toggle stored in localStorage
 * - Sticky on scroll with backdrop blur
 * - Mobile: hamburger menu that expands to full-width links
 */
/**
 * StorefrontNavComponent
 *
 * Shared across all three Ecommerce templates (Minimal / Bold / Editorial).
 * Design intent: the platform canvas stays quiet — a paper-white bar with a
 * single hairline rule — so the *tenant's* brand color is what actually reads
 * as color on the page (active link, cart badge, wordmark mark). A full
 * solid-color header block was the old approach; it made every tenant's
 * storefront look like the same colored template with a different name
 * pasted in. This version lets the merchant's palette do the work instead.
 */
@Component({
  selector: 'app-store-nav',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header
      class="sticky top-0 z-50 w-full bg-sf-bg/90 backdrop-blur-md
             border-b border-sf-border transition-shadow duration-220"
      [class.shadow-sm]="scrolled()"
    >
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div class="flex h-[68px] items-center justify-between gap-4">

          <!-- ── Brand ── -->
          <a
            routerLink="/"
            class="flex items-center gap-2.5 flex-shrink-0 focus-visible:outline-none
                   focus-visible:ring-2 focus-visible:ring-offset-2 rounded"
            style="--tw-ring-color: var(--tenant-primary, #15140F);"
            [attr.aria-label]="tenant()?.storeName ?? 'Home'"
          >
            @if (tenant()?.logoUrl) {
              <img
                [src]="tenant()!.logoUrl!"
                [alt]="tenant()!.storeName"
                class="h-8 w-8 rounded-md object-cover"
              />
            } @else {
              <span
                class="h-2 w-2 rounded-full flex-shrink-0"
                style="background: var(--tenant-primary, #15140F);"
                aria-hidden="true"
              ></span>
            }
            <span class="font-display italic font-medium text-xl leading-none text-sf-text-1">
              {{ tenant()?.storeName ?? 'Store' }}
            </span>
          </a>

          <!-- ── Desktop nav links ── -->
          <nav class="hidden md:flex items-center gap-8" aria-label="Main navigation">
            @for (link of navLinks; track link.route) {
              <a
                [routerLink]="link.route"
                routerLinkActive="text-sf-text-1 nav-link-active"
                [routerLinkActiveOptions]="{ exact: link.exact }"
                class="relative py-2 text-[13px] font-medium tracking-wide uppercase
                       text-sf-text-3 hover:text-sf-text-1 transition-colors duration-120
                       focus-visible:outline-none"
                style="--nav-accent: var(--tenant-primary, #15140F);"
              >
                {{ link.label }}
              </a>
            }
          </nav>

          <!-- ── Actions ── -->
          <div class="flex items-center gap-1">

            <!-- Admin shortcut — only visible when the person browsing the
                 storefront is signed in as this tenant's own admin/owner. -->
            @if (authSvc.isTenantAdmin()) {
              <a
                routerLink="/admin"
                class="hidden sm:inline-flex items-center gap-1.5 h-9 px-3.5 rounded-full text-xs font-semibold
                       border border-sf-border text-sf-text-2 hover:bg-sf-surface transition-colors mr-1"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"
                     stroke-linecap="round" stroke-linejoin="round" class="w-3.5 h-3.5">
                  <path d="M12 2l8 4v6c0 5-3.4 8-8 10-4.6-2-8-5-8-10V6z"/>
                </svg>
                Admin panel
              </a>
            }

            <!-- Dark/Light toggle -->
            <button
              type="button"
              (click)="toggleTheme()"
              class="relative h-9 w-9 rounded-full flex items-center justify-center
                     text-sf-text-2 transition-colors duration-120 hover:bg-sf-surface
                     focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sf-border-2"
              [attr.aria-label]="isDark() ? 'Switch to light mode' : 'Switch to dark mode'"
            >
              @if (isDark()) {
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"
                     stroke-linecap="round" stroke-linejoin="round" class="w-[18px] h-[18px]">
                  <circle cx="12" cy="12" r="5"/>
                  <line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
                  <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
                  <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
                  <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
                </svg>
              } @else {
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"
                     stroke-linecap="round" stroke-linejoin="round" class="w-[18px] h-[18px]">
                  <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/>
                </svg>
              }
            </button>

            <!-- Wishlist button -->
            <a
              routerLink="/wishlist"
              class="hidden sm:flex h-9 w-9 rounded-full items-center justify-center relative
                     text-sf-text-2 transition-colors duration-120 hover:bg-sf-surface
                     focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sf-border-2"
              aria-label="My wishlist"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"
                   stroke-linecap="round" stroke-linejoin="round" class="w-[18px] h-[18px]">
                <path d="M12 20s-7-4.35-9.5-8.5C.8 8.2 2.3 5 5.5 5c1.8 0 3 1 4 2.3C10.5 6 11.7 5 13.5 5 16.7 5 18.2 8.2 21.5 11.5 19 15.65 12 20 12 20z"/>
              </svg>
            </a>

            <!-- Cart button -->
            <a
              routerLink="/cart"
              class="relative h-9 w-9 rounded-full flex items-center justify-center
                     text-sf-text-2 transition-colors duration-120 hover:bg-sf-surface
                     focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sf-border-2"
              aria-label="View cart"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"
                   stroke-linecap="round" stroke-linejoin="round" class="w-[18px] h-[18px]">
                <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
                <path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 001.97-1.67L23 6H6"/>
              </svg>
              @if (cartCount() > 0) {
                <span
                  class="absolute -top-0.5 -right-0.5 min-w-[16px] h-[16px] rounded-full
                         text-white text-[10px] font-semibold leading-none
                         flex items-center justify-center px-1"
                  style="background: var(--tenant-primary, #15140F);"
                >
                  {{ cartCount() > 99 ? '99+' : cartCount() }}
                </span>
              }
            </a>

            <!-- Account link -->
            <a
              routerLink="/account"
              class="hidden sm:flex h-9 w-9 rounded-full items-center justify-center
                     overflow-hidden text-sf-text-2 transition-colors duration-120
                     hover:bg-sf-surface focus-visible:outline-none focus-visible:ring-2
                     focus-visible:ring-sf-border-2"
              aria-label="My account"
            >
              @if (authSvc.avatarUrl(); as url) {
                <img [src]="url" alt="" class="h-full w-full object-cover rounded-full" />
              } @else if (authSvc.currentUser()) {
                <div
                  class="h-full w-full rounded-full flex items-center justify-center
                         text-white text-xs font-semibold"
                  style="background: var(--tenant-primary, #15140F);"
                >
                  {{ authSvc.currentUser()?.firstName?.charAt(0) }}{{ authSvc.currentUser()?.lastName?.charAt(0) }}
                </div>
              } @else {
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"
                     stroke-linecap="round" stroke-linejoin="round" class="w-[18px] h-[18px]">
                  <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
                  <circle cx="12" cy="7" r="4"/>
                </svg>
              }
            </a>

            <!-- Mobile hamburger -->
            <button
              type="button"
              class="md:hidden h-9 w-9 rounded-full flex items-center justify-center
                     text-sf-text-2 transition-colors duration-120 hover:bg-sf-surface
                     focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sf-border-2"
              (click)="mobileOpen.set(!mobileOpen())"
              [attr.aria-expanded]="mobileOpen()"
              aria-label="Toggle menu"
            >
              @if (mobileOpen()) {
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"
                     stroke-linecap="round" class="w-[18px] h-[18px]">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              } @else {
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"
                     stroke-linecap="round" class="w-[18px] h-[18px]">
                  <line x1="3" y1="12" x2="21" y2="12"/>
                  <line x1="3" y1="6" x2="21" y2="6"/>
                  <line x1="3" y1="18" x2="21" y2="18"/>
                </svg>
              }
            </button>
          </div>
        </div>
      </div>

      <!-- Mobile menu drawer -->
      @if (mobileOpen()) {
        <div class="md:hidden border-t border-sf-border bg-sf-bg">
          <nav class="flex flex-col px-4 py-3 gap-1">
            @for (link of navLinks; track link.route) {
              <a
                [routerLink]="link.route"
                routerLinkActive="text-sf-text-1 font-semibold bg-sf-surface"
                [routerLinkActiveOptions]="{ exact: link.exact }"
                class="px-3 py-2.5 rounded-lg text-sm text-sf-text-2 transition-colors hover:bg-sf-surface"
                (click)="mobileOpen.set(false)"
              >
                {{ link.label }}
              </a>
            }
            <a
              routerLink="/wishlist"
              routerLinkActive="text-sf-text-1 font-semibold bg-sf-surface"
              class="px-3 py-2.5 rounded-lg text-sm text-sf-text-2 transition-colors hover:bg-sf-surface"
              (click)="mobileOpen.set(false)"
            >
              Wishlist
            </a>
          </nav>
        </div>
      }
    </header>

    <style>
      .nav-link-active::after {
        content: '';
        position: absolute;
        left: 0; right: 0; bottom: -1px;
        height: 2px;
        background: var(--nav-accent);
        border-radius: 2px;
      }
    </style>
  `,
})
export class StoreNavComponent implements OnInit {
  private readonly tenantSvc = inject(TenantService);
  private readonly cartSvc   = inject(CartService);
  readonly authSvc = inject(AuthService);

  readonly tenant    = this.tenantSvc.currentTenant;
  readonly cartCount = this.cartSvc.totalItems;
  readonly scrolled  = signal(false);
  readonly mobileOpen = signal(false);
  readonly isDark    = signal(this.#loadDark());

  readonly navLinks = [
    { label: 'Home',     route: '/',         exact: true },
    { label: 'Products', route: '/products', exact: false },
    { label: 'About',    route: '/about',    exact: false },
    { label: 'Contact',  route: '/contact',  exact: false },
  ];

  ngOnInit(): void {
    if (this.authSvc.isAuthenticated()) {
      this.authSvc.getMe().subscribe({ error: () => {} });
    }
  }

  @HostListener('window:scroll')
  onScroll(): void {
    this.scrolled.set(window.scrollY > 8);
  }

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
