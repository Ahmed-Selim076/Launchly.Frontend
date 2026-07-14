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
   * Reads window.location.hostname and extracts the subdomain.
   * Returns null for platform root (launchly.com or localhost:4200).
   * Returns 'admin' for admin.launchly.com.
   * Returns the tenant subdomain for {tenant}.launchly.com.
   */
  getSubdomain(): string | null {
    const hostname = window.location.hostname;
    const platformDomain = environment.platformDomain.replace(/:\d+$/, ''); // strip port

    // localhost:4200 without subdomain
    if (hostname === 'localhost' || hostname === platformDomain) return null;

    // Extract subdomain: e.g. "ahmed-store.launchly.com" → "ahmed-store"
    const parts = hostname.split('.');
    if (parts.length < 2) return null;

    // Matches "{subdomain}.launchly.com" or "{subdomain}.localhost"
    return parts[0];
  }

  isSuperAdminSubdomain(): boolean {
    return this.getSubdomain() === 'admin';
  }

  isPlatformRoot(): boolean {
    return this.getSubdomain() === null;
  }

  /**
   * Builds a full cross-origin URL to a tenant's subdomain.
   * ONLY ever pass this to `window.location.href` — NEVER `router.navigate()`.
   * This is a different origin/host than the current page (platform domain
   * vs. {subdomain}.{platformDomain}), and the Angular Router can't and
   * shouldn't handle navigation across origins; only a real browser
   * navigation re-runs AppComponent.ngOnInit() on the new host, which is
   * what actually resolves the tenant and registers the admin/storefront
   * routes (see AppComponent's subdomain-gated resetConfig).
   *
   * dev:  buildTenantUrl('trend-store', '/admin') → http://trend-store.localhost:4200/admin
   * prod: buildTenantUrl('trend-store', '/admin') → https://trend-store.launchly.com/admin
   */
  buildTenantUrl(subdomain: string, path: string): string {
    const protocol = environment.production ? 'https' : 'http';
    return `${protocol}://${subdomain}.${environment.platformDomain}${path}`;
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
