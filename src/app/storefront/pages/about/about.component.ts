import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TenantService }        from '../../../core/tenant/tenant.service';
import { StoreNavComponent }    from '../../layout/store-nav/store-nav.component';
import { StoreFooterComponent } from '../../layout/store-footer/store-footer.component';

/**
 * Shared "About" page — same tenant-driven mesh/glow visual language as the
 * Home page. Content comes entirely from TenantSettings.aboutText (already
 * editable in Admin → Settings); there's no separate "About" content field,
 * so this reuses what the merchant already wrote rather than inventing a
 * new copy field just for this page.
 */
@Component({
  selector: 'app-storefront-about',
  standalone: true,
  imports: [CommonModule, RouterLink, StoreNavComponent, StoreFooterComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="min-h-screen bg-sf-bg flex flex-col">
      <app-store-nav />

      <section class="bg-tenant-mesh border-b border-sf-border">
        <div class="mx-auto max-w-3xl px-4 sm:px-6 py-16 sm:py-24 text-center">
          <p class="font-mono text-[11px] font-medium tracking-widest uppercase text-sf-text-3 mb-3">
            About us
          </p>
          <h1 class="font-display text-3xl sm:text-5xl text-sf-text-1">
            {{ tenant()?.storeName ?? 'Our story' }}
          </h1>
        </div>
      </section>

      <main class="flex-1 mx-auto max-w-2xl w-full px-4 sm:px-6 py-16 sm:py-20">
        @if (tenant()?.aboutText) {
          <p class="font-display text-xl sm:text-2xl leading-relaxed text-sf-text-1 text-center mb-14">
            {{ tenant()!.aboutText }}
          </p>
        } @else {
          <p class="text-sf-text-2 text-center mb-14">
            {{ tenant()?.storeName ?? 'This store' }} hasn't added an about section yet —
            check back soon.
          </p>
        }

        <div class="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
          <div class="rounded-xl border border-sf-border p-6">
            <p class="font-display text-2xl mb-1" style="color: var(--tenant-primary);">✓</p>
            <p class="text-sm text-sf-text-2">Quality checked</p>
          </div>
          <div class="rounded-xl border border-sf-border p-6">
            <p class="font-display text-2xl mb-1" style="color: var(--tenant-primary);">↺</p>
            <p class="text-sm text-sf-text-2">Easy returns</p>
          </div>
          <div class="rounded-xl border border-sf-border p-6">
            <p class="font-display text-2xl mb-1" style="color: var(--tenant-primary);">♥</p>
            <p class="text-sm text-sf-text-2">Loved by customers</p>
          </div>
        </div>

        <div class="text-center mt-14">
          <a routerLink="/contact"
             class="inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm font-semibold text-white
                    bg-tenant-gradient shadow-tenant-glow">
            Get in touch
          </a>
        </div>
      </main>

      <app-store-footer />
    </div>
  `,
})
export class StorefrontAboutComponent {
  readonly tenant = inject(TenantService).currentTenant;
}
