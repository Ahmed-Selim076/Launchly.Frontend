import {
  Component, OnInit, inject, signal,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, ActivatedRoute } from '@angular/router';
import { TenantService } from '../../../core/tenant/tenant.service';
import { SpinnerComponent } from '../../../shared/components/spinner/spinner.component';
import { ITenant, StoreType } from '../../../core/models';

/**
 * StorefrontShellComponent
 *
 * Acts as the outermost wrapper for any tenant storefront.
 * Reads the resolved tenant (from TenantResolver) and makes it
 * available to all child routes via TenantService.currentTenant().
 *
 * Does NOT render different layouts here — layout selection happens
 * inside each StoreType's own routing (Phase 5/6/7).
 * This shell only handles:
 *   1. Confirming tenant is loaded before rendering children
 *   2. Providing a loading/error state at the top level
 *   3. Injecting the page-level <meta> tags (store name, og:image)
 */
@Component({
  selector: 'app-storefront-shell',
  standalone: true,
  imports: [CommonModule, RouterOutlet, SpinnerComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (tenant()) {
      <div
        class="min-h-screen bg-sf-bg"
        [attr.data-store-type]="storeTypeName()"
        [attr.data-template-id]="tenant()!.templateId"
      >
        <router-outlet></router-outlet>
      </div>
    } @else if (error()) {
      <div class="min-h-screen bg-sf-bg flex items-center justify-center px-6 text-center">
        <div>
          <p class="text-sf-text-3 text-sm mb-2">Store not found</p>
          <h1 class="font-display text-3xl font-bold text-sf-text-1 mb-4">
            This store doesn't exist
          </h1>
          <p class="text-sf-text-3">
            The store you're looking for may have been moved or deleted.
          </p>
        </div>
      </div>
    } @else {
      <!-- Loading state — shown briefly while TenantResolver fetches -->
      <div class="min-h-screen bg-sf-bg flex items-center justify-center">
        <app-spinner size="lg"></app-spinner>
      </div>
    }
  `,
})
export class StorefrontShellComponent implements OnInit {
  private readonly route         = inject(ActivatedRoute);
  private readonly tenantService = inject(TenantService);

  readonly tenant = signal<ITenant | null>(null);
  readonly error  = signal(false);

  ngOnInit(): void {
    // TenantResolver puts the resolved tenant in route.data['tenant']
    const resolved: ITenant | null = this.route.snapshot.data['tenant'];
    if (resolved) {
      this.tenant.set(resolved);
      this.#applyMetaTags(resolved);
    } else {
      this.error.set(true);
    }
  }

  storeTypeName(): string {
    const map: Record<StoreType, string> = {
      [StoreType.Ecommerce]:  'ecommerce',
      [StoreType.Booking]:    'booking',
      [StoreType.Restaurant]: 'restaurant',
    };
    return this.tenant() ? map[this.tenant()!.storeType] : '';
  }

  #applyMetaTags(tenant: ITenant): void {
    document.title = tenant.storeName;

    // og:title
    let ogTitle = document.querySelector<HTMLMetaElement>('meta[property="og:title"]');
    if (!ogTitle) {
      ogTitle = document.createElement('meta');
      ogTitle.setAttribute('property', 'og:title');
      document.head.appendChild(ogTitle);
    }
    ogTitle.content = tenant.storeName;

    // og:image
    if (tenant.logoUrl) {
      let ogImage = document.querySelector<HTMLMetaElement>('meta[property="og:image"]');
      if (!ogImage) {
        ogImage = document.createElement('meta');
        ogImage.setAttribute('property', 'og:image');
        document.head.appendChild(ogImage);
      }
      ogImage.content = tenant.logoUrl;
    }
  }
}
