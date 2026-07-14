import {
  Component, ChangeDetectionStrategy, inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TenantService } from '../../../core/tenant/tenant.service';

/**
 * Footer — 1:1 layout port of smart-vibe's Footer.tsx:
 * Brand+social column, then Shop / Support / Company link columns,
 * then a bottom bar with copyright + payment badges.
 */
@Component({
  selector: 'app-store-footer',
  standalone: true,
  imports: [CommonModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <footer class="border-t border-sf-border mt-24">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr] gap-10">

          <!-- Brand column -->
          <div>
            <div class="flex items-center gap-2 mb-3">
              @if (tenant()?.logoUrl) {
                <img
                  [src]="tenant()!.logoUrl!"
                  [alt]="tenant()!.storeName"
                  class="h-7 w-7 rounded object-cover"
                />
              } @else {
                <span
                  class="h-2 w-2 rounded-full flex-shrink-0"
                  style="background: var(--tenant-primary, #15140F);"
                  aria-hidden="true"
                ></span>
              }
              <p class="font-display italic text-lg text-sf-text-1">
                {{ tenant()?.storeName ?? 'Store' }}
              </p>
            </div>
            <p class="text-sf-text-3 text-sm leading-relaxed max-w-xs mb-5">
              {{ tenant()?.aboutText ?? 'Quality products, delivered with care.' }}
            </p>

            <!-- Social icons -->
            @if (tenant()?.facebookUrl || tenant()?.instagramUrl) {
              <div class="flex items-center gap-3">
                @if (tenant()?.facebookUrl) {
                  <a [href]="tenant()!.facebookUrl!" target="_blank" rel="noopener noreferrer"
                     aria-label="Facebook"
                     class="w-8 h-8 rounded-full border border-sf-border flex items-center justify-center
                            text-sf-text-3 hover:text-white hover:border-transparent transition-colors"
                     [style.background]="'transparent'"
                     onmouseover="this.style.background='var(--tenant-primary)'"
                     onmouseout="this.style.background='transparent'">
                    <svg viewBox="0 0 24 24" fill="currentColor" class="w-4 h-4">
                      <path d="M22 12a10 10 0 10-11.6 9.9v-7H7.9V12h2.5V9.8c0-2.5 1.5-3.9 3.8-3.9 1.1 0 2.2.2 2.2.2v2.4h-1.2c-1.2 0-1.6.8-1.6 1.6V12h2.8l-.4 2.9h-2.4v7A10 10 0 0022 12z"/>
                    </svg>
                  </a>
                }
                @if (tenant()?.instagramUrl) {
                  <a [href]="tenant()!.instagramUrl!" target="_blank" rel="noopener noreferrer"
                     aria-label="Instagram"
                     class="w-8 h-8 rounded-full border border-sf-border flex items-center justify-center
                            text-sf-text-3 hover:text-white hover:border-transparent transition-colors"
                     onmouseover="this.style.background='var(--tenant-primary)'"
                     onmouseout="this.style.background='transparent'">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" class="w-4 h-4">
                      <rect x="3" y="3" width="18" height="18" rx="5"/>
                      <circle cx="12" cy="12" r="3.6"/>
                      <circle cx="17.3" cy="6.7" r="0.6" fill="currentColor" stroke="none"/>
                    </svg>
                  </a>
                }
              </div>
            }
          </div>

          <!-- Shop column -->
          <div>
            <p class="font-mono text-[11px] font-medium uppercase tracking-widest text-sf-text-3 mb-4">
              Shop
            </p>
            <ul class="space-y-2.5">
              @for (link of shopLinks; track link.route) {
                <li>
                  <a
                    [routerLink]="link.route"
                    class="text-sf-text-2 text-sm hover:text-sf-text-1 transition-colors"
                  >{{ link.label }}</a>
                </li>
              }
            </ul>
          </div>

          <!-- Support column -->
          <div>
            <p class="font-mono text-[11px] font-medium uppercase tracking-widest text-sf-text-3 mb-4">
              Support
            </p>
            <ul class="space-y-2.5">
              @for (link of supportLinks; track link.route) {
                <li>
                  <a
                    [routerLink]="link.route"
                    class="text-sf-text-2 text-sm hover:text-sf-text-1 transition-colors"
                  >{{ link.label }}</a>
                </li>
              }
              @if (tenant()?.contactEmail) {
                <li>
                  <a [href]="'mailto:' + tenant()!.contactEmail"
                     class="text-sf-text-2 text-sm hover:text-sf-text-1 transition-colors">
                    {{ tenant()!.contactEmail }}
                  </a>
                </li>
              }
            </ul>
          </div>

          <!-- Company column -->
          <div>
            <p class="font-mono text-[11px] font-medium uppercase tracking-widest text-sf-text-3 mb-4">
              Company
            </p>
            <ul class="space-y-2.5">
              <li>
                <a routerLink="/about"
                   class="text-sf-text-2 text-sm hover:text-sf-text-1 transition-colors">About</a>
              </li>
              <li>
                <a routerLink="/contact"
                   class="text-sf-text-2 text-sm hover:text-sf-text-1 transition-colors">Contact</a>
              </li>
            </ul>
          </div>
        </div>

        <!-- Bottom bar -->
        <div class="mt-14 pt-6 border-t border-sf-border flex flex-col sm:flex-row
                    items-center justify-between gap-4">
          <p class="text-sf-text-3 text-xs">
            © {{ year }} {{ tenant()?.storeName }}. All rights reserved.
          </p>

          <!-- Payment badges (illustrative — no live payment integration) -->
          <div class="flex items-center gap-2" aria-hidden="true">
            @for (badge of paymentBadges; track badge) {
              <span class="px-2.5 py-1 rounded border border-sf-border text-[10px] font-semibold
                           text-sf-text-3 tracking-wide">
                {{ badge }}
              </span>
            }
          </div>

          <p class="text-sf-text-3 text-xs">
            Powered by <span class="font-medium text-sf-text-2">Launchly</span>
          </p>
        </div>
      </div>
    </footer>
  `,
})
export class StoreFooterComponent {
  readonly tenant = inject(TenantService).currentTenant;
  readonly year   = new Date().getFullYear();

  readonly shopLinks    = [
    { label: 'All Products', route: '/products' },
    { label: 'Cart',         route: '/cart' },
  ];
  readonly supportLinks = [
    { label: 'Contact us',  route: '/contact' },
    { label: 'My Orders',   route: '/account' },
  ];

  readonly paymentBadges = ['VISA', 'MC', 'COD'];
}
