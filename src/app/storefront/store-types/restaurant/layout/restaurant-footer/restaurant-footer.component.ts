import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TenantService } from '../../../../../core/tenant/tenant.service';

/**
 * RestaurantFooterComponent — brand + hours + contact + social, no "Shop"
 * column (there's no product catalog to link to in a restaurant). Kept
 * deliberately quiet: one column of essentials, not a dense sitemap.
 */
@Component({
  selector: 'app-restaurant-footer',
  standalone: true,
  imports: [CommonModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <footer class="border-t border-sf-border mt-24 bg-sf-surface">
      <div class="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-16">
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-10 text-center sm:text-left">

          <div>
            <p class="font-script text-3xl mb-3" style="color: var(--tenant-primary);">
              {{ tenant()?.storeName ?? 'Restaurant' }}
            </p>
            <p class="text-sf-text-3 text-sm leading-relaxed max-w-xs mx-auto sm:mx-0">
              {{ tenant()?.aboutText ?? 'Thoughtful food, made with care.' }}
            </p>
          </div>

          <div>
            <p class="font-mono text-[11px] font-medium uppercase tracking-widest text-sf-text-3 mb-3">
              Visit
            </p>
            <ul class="space-y-1.5 text-sm text-sf-text-2">
              @if (tenant()?.contactAddress) {
                <li>{{ tenant()!.contactAddress }}</li>
              }
              @if (tenant()?.contactPhone) {
                <li><a [href]="'tel:' + tenant()!.contactPhone" class="hover:text-sf-text-1">{{ tenant()!.contactPhone }}</a></li>
              }
              @if (tenant()?.contactEmail) {
                <li><a [href]="'mailto:' + tenant()!.contactEmail" class="hover:text-sf-text-1">{{ tenant()!.contactEmail }}</a></li>
              }
            </ul>
          </div>

          <div>
            <p class="font-mono text-[11px] font-medium uppercase tracking-widest text-sf-text-3 mb-3">
              Explore
            </p>
            <ul class="space-y-1.5 text-sm text-sf-text-2">
              <li><a routerLink="/menu" class="hover:text-sf-text-1">Menu</a></li>
              <li><a routerLink="/order-type" class="hover:text-sf-text-1">Order online</a></li>
              <li><a routerLink="/about" class="hover:text-sf-text-1">About</a></li>
              <li><a routerLink="/contact" class="hover:text-sf-text-1">Contact</a></li>
            </ul>
          </div>
        </div>

        <div class="mt-12 pt-6 border-t border-sf-border text-center">
          <p class="text-sf-text-3 text-xs">© {{ year }} {{ tenant()?.storeName }}. All rights reserved.</p>
        </div>
      </div>
    </footer>
  `,
})
export class RestaurantFooterComponent {
  readonly tenant = inject(TenantService).currentTenant;
  readonly year   = new Date().getFullYear();
}
