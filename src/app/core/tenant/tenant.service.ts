import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, map } from 'rxjs';
import { environment } from '@env/environment';
import { ITenant, IPublicStoreSettingsRaw, IApiResponse, STORE_TYPE_FROM_STRING, StoreType } from '../models';

@Injectable({ providedIn: 'root' })
export class TenantService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/v1`;

  // ─── State ────────────────────────────────────────────────────────────────

  readonly currentTenant = signal<ITenant | null>(null);
  readonly isLoaded      = computed(() => this.currentTenant() !== null);

  // ─── Subdomain Resolution ─────────────────────────────────────────────────

  /**
   * Reads window.location.pathname and extracts the tenant subdomain from
   * the /store/:subdomain/... path prefix.
   * Returns null for the platform root (/, /login, /signup, /super, etc — no /store/ prefix).
   * Returns the tenant subdomain for /store/{subdomain}/...
   *
   * This is path-based rather than hostname-based because the project is
   * hosted on Vercel's free domain, which doesn't support the wildcard
   * subdomains (storename.example.com) that hostname-based tenant
   * resolution needs. A real custom domain with wildcard DNS would let this
   * go back to hostname parsing instead, if that's ever set up.
   */
  getSubdomain(): string | null {
    const match = window.location.pathname.match(/^\/store\/([a-z0-9-]+)/);
    return match ? match[1] : null;
  }

  isSuperAdminSubdomain(): boolean {
    return this.getSubdomain() === 'admin';
  }

  isPlatformRoot(): boolean {
    return this.getSubdomain() === null;
  }

  /**
   * Builds a same-origin URL to a tenant's store path.
   * Safe to pass to either `window.location.href` (full navigation, needed
   * right after login/signup so APP_BASE_HREF and the tenant route table
   * get re-initialized for the new /store/:subdomain prefix — see
   * app.config.ts) or, once already inside that tenant's app instance, plain
   * `router.navigate()`.
   *
   * dev/prod alike: buildTenantUrl('trend-store', '/admin') → https://yourapp.vercel.app/store/trend-store/admin
   */
  buildTenantUrl(subdomain: string, path: string): string {
    return `${window.location.origin}/store/${subdomain}${path}`;
  }

  // ─── Load Tenant ──────────────────────────────────────────────────────────

  /**
   * Fetches public store settings and maps the storeType string → StoreType enum.
   * This is the ONLY place in the app where the string→int conversion happens.
   * The X-Tenant-Subdomain header is added by TenantInterceptor automatically.
   */
  loadTenant(): Observable<ITenant> {
    return this.http
      .get<IApiResponse<IPublicStoreSettingsRaw>>(`${this.base}/store/settings`)
      .pipe(
        map(res => {
          if (!res.success || !res.data) {
            throw new Error(res.message ?? 'Failed to load store settings');
          }
          return this.#mapRawToTenant(res.data);
        }),
        tap(tenant => this.currentTenant.set(tenant))
      );
  }

  // ─── Private ──────────────────────────────────────────────────────────────

  /**
   * Maps IPublicStoreSettingsRaw (storeType as string) → ITenant (storeType as enum).
   * The string "Ecommerce" becomes StoreType.Ecommerce (= 0), etc.
   */
  #mapRawToTenant(raw: IPublicStoreSettingsRaw): ITenant {
    const resolved = STORE_TYPE_FROM_STRING[raw.storeType];
    if (resolved === undefined) {
      console.error(
        `[Launchly] TenantService: unknown storeType "${raw.storeType}" received from /store/settings. ` +
        `Falling back to Ecommerce (0). This is a data/backend issue — investigate immediately.`
      );
    }
    const storeType = resolved ?? StoreType.Ecommerce;
    return {
      storeName:         raw.storeName,
      logoUrl:           raw.logoUrl,
      primaryColor:      raw.primaryColor,
      secondaryColor:    raw.secondaryColor,
      heroText:          raw.heroText,
      aboutText:         raw.aboutText,
      googleAnalyticsId: raw.googleAnalyticsId,
      storeType,
      templateId:        raw.templateId,
      contactPhone:      raw.contactPhone,
      whatsappNumber:    raw.whatsappNumber,
      contactEmail:      raw.contactEmail,
      contactAddress:    raw.contactAddress,
      facebookUrl:       raw.facebookUrl,
      instagramUrl:      raw.instagramUrl,
    };
  }
}
