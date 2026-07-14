import { Component, ChangeDetectionStrategy, inject, signal, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { TenantService } from '../../../../../core/tenant/tenant.service';
import { BookingTranslationService } from '../../../../../core/storefront/booking-translation.service';
import { AuthService } from '../../../../../core/auth/auth.service';

/**
 * BookingNavComponent — dedicated nav for the Booking store type, bilingual
 * (EN/AR with RTL) via BookingTranslationService. Links use the real
 * booking routes (/services, /book) rather than ecommerce's /products.
 */
@Component({
  selector: 'app-booking-nav',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header
      class="sticky top-0 z-50 w-full bg-sf-bg/95 backdrop-blur-md border-b border-sf-border
             transition-shadow duration-220"
      [class.shadow-sm]="scrolled()"
    >
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div class="flex h-[72px] items-center justify-between gap-4">

          <a routerLink="/" class="flex items-center gap-2.5 flex-shrink-0">
            @if (tenant()?.logoUrl) {
              <img [src]="tenant()!.logoUrl!" [alt]="tenant()!.storeName" class="h-8 w-8 rounded-full object-cover" />
            } @else {
              <span class="w-2 h-2 rounded-full" style="background: var(--tenant-primary);"></span>
            }
            <span class="font-display font-semibold text-lg text-sf-text-1">
              {{ tenant()?.storeName ?? 'Booking' }}
            </span>
          </a>

          <nav class="hidden md:flex items-center gap-8" aria-label="Main navigation">
            @for (link of navLinks(); track link.route) {
              <a
                [routerLink]="link.route"
                routerLinkActive="text-sf-text-1"
                [routerLinkActiveOptions]="{ exact: link.exact }"
                class="text-[13px] font-medium text-sf-text-3 hover:text-sf-text-1 transition-colors"
              >
                {{ link.label }}
              </a>
            }
          </nav>

          <div class="flex items-center gap-2">
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

            <!-- Language switcher -->
            <button
              type="button"
              (click)="i18n.toggle()"
              class="h-9 px-3.5 rounded-full text-xs font-semibold border border-sf-border
                     text-sf-text-2 hover:bg-sf-surface transition-colors"
            >
              {{ i18n.t('lang.switch') }}
            </button>

            <a
              routerLink="/services"
              class="hidden sm:inline-flex items-center gap-2 px-5 h-10 rounded-full text-xs font-bold
                     text-white transition-opacity hover:opacity-90"
              style="background: var(--tenant-primary);"
            >
              {{ i18n.t('nav.bookNow') }}
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
            @for (link of navLinks(); track link.route) {
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
            <a routerLink="/services" class="mt-2 px-3 py-2.5 rounded-lg text-sm font-bold text-white text-center"
               style="background: var(--tenant-primary);" (click)="mobileOpen.set(false)">
              {{ i18n.t('nav.bookNow') }}
            </a>
          </nav>
        </div>
      }
    </header>
  `,
})
export class BookingNavComponent {
  private readonly tenantSvc = inject(TenantService);
  readonly i18n = inject(BookingTranslationService);
  readonly authSvc = inject(AuthService);

  readonly tenant     = this.tenantSvc.currentTenant;
  readonly scrolled   = signal(false);
  readonly isDark     = signal(this.#loadDark());
  readonly mobileOpen = signal(false);

  readonly navLinks = () => [
    { label: this.i18n.t('nav.home'),     route: '/',         exact: true },
    { label: this.i18n.t('nav.services'), route: '/services', exact: false },
    { label: this.i18n.t('nav.about'),    route: '/about',    exact: false },
    { label: this.i18n.t('nav.contact'),  route: '/contact',  exact: false },
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
