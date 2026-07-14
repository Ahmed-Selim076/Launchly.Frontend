import { inject } from '@angular/core';
import { ResolveFn, Router } from '@angular/router';
import { TenantService } from '../core/tenant/tenant.service';
import { TenantThemeService } from '../core/tenant/tenant-theme.service';
import { ITenant } from '../core/models';
import { catchError, tap, of } from 'rxjs';

/**
 * TenantResolver — runs before any tenant route activates.
 *
 * If the tenant is already loaded (e.g. AppComponent loaded it on bootstrap),
 * returns the cached value immediately.
 * Otherwise fetches /store/settings, maps storeType string→enum, applies theme.
 *
 * On failure (unknown subdomain, suspended store), redirects to /not-found.
 */
export const tenantResolver: ResolveFn<ITenant | null> = () => {
  const tenantService = inject(TenantService);
  const themeService  = inject(TenantThemeService);
  const router        = inject(Router);

  // Already loaded — return cached value
  const cached = tenantService.currentTenant();
  if (cached) return of(cached);

  return tenantService.loadTenant().pipe(
    tap(tenant => themeService.applyTheme(tenant)),
    catchError(() => {
      router.navigate(['/not-found']);
      return of(null);
    })
  );
};
