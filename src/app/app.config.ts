import { ApplicationConfig, provideZoneChangeDetection, APP_INITIALIZER, inject } from '@angular/core';
import { provideRouter, withComponentInputBinding, Router } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import { APP_BASE_HREF } from '@angular/common';

import { routes } from './app.routes';
import { authInterceptor }   from './core/interceptors/auth.interceptor';
import { tenantInterceptor } from './core/interceptors/tenant.interceptor';
import { TenantService } from './core/tenant/tenant.service';
import { TenantThemeService } from './core/tenant/tenant-theme.service';
import { TokenStorageService } from './core/auth/token-storage.service';

/**
 * Picks up the access/refresh tokens handed off via the URL fragment after
 * cross-origin signup/login redirects (see signup.component.ts for why this
 * exists: localStorage set on launchly.com is invisible on
 * my-store.launchly.com — different origins — so tokens have to travel in
 * the URL itself for that one redirect). Writes them into THIS origin's
 * localStorage via TokenStorageService directly (not AuthService) so this
 * runs before AuthService's constructor ever reads storage — order matters
 * here, since AuthService seeds its `currentUser` signal from storage only
 * once, at construction. Then strips the fragment so the token never lingers
 * in the address bar or browser history.
 */
function consumeAuthHandoff(): void {
  const hash = window.location.hash;
  if (!hash.startsWith('#auth=')) return;

  try {
    const payload = JSON.parse(decodeURIComponent(hash.slice('#auth='.length)));
    if (payload.at && payload.rt) {
      const tokenStorage = inject(TokenStorageService);
      tokenStorage.setToken(payload.at);
      tokenStorage.setRefreshToken(payload.rt);
    }
  } catch {
    // Malformed fragment — ignore, user falls through to the login page.
  } finally {
    history.replaceState(null, '', window.location.pathname + window.location.search);
  }
}

/**
 * Runs before the app's initial navigation fires (APP_INITIALIZER blocks
 * bootstrap until it resolves). For tenant subdomains, this is the ONLY
 * place tenant-scoped routes get registered — AppComponent used to do this
 * a second time in ngOnInit, which raced with the initial navigation and
 * caused canMatch guards (isBooking/isRestaurant/isTpl2/isTpl3) to evaluate
 * against a still-null currentTenant(), falling through to the wrong
 * template or the catch-all NotFoundComponent. Loading the tenant HERE,
 * before resetConfig, guarantees currentTenant() is populated by the time
 * the first navigation attempts to match any canMatch-guarded route.
 */
function initializeRoutes() {
  consumeAuthHandoff();

  const tenantService = inject(TenantService);
  const themeService   = inject(TenantThemeService);
  const router = inject(Router);
  const subdomain = tenantService.getSubdomain();

  if (!subdomain || subdomain === 'admin') {
    return () => Promise.resolve();
  }

  const registerTenantRoutes = () => Promise.all([
    import('./storefront/storefront.routes'),
    import('./admin/admin.routes'),
    import('./platform/pages/login/login.component'),
    import('./platform/pages/auth/auth-pages.component'),
    import('./platform/pages/not-found/not-found.component'),
  ]).then(([{ storefrontRoutes }, { adminRoutes }, loginMod, authPagesMod, notFoundMod]) => {
    router.resetConfig([
      {
        path: 'admin',
        children: adminRoutes,
      },
      {
        path: 'login',
        component: loginMod.LoginComponent,
      },
      {
        path: 'forgot-password',
        component: authPagesMod.ForgotPasswordComponent,
      },
      {
        path: 'reset-password',
        component: authPagesMod.ResetPasswordComponent,
      },
      ...storefrontRoutes,
      {
        path: '**',
        component: notFoundMod.NotFoundComponent,
      },
    ]);
  });

  return () =>
    new Promise<void>(resolve => {
      tenantService.loadTenant().subscribe({
        next: tenant => {
          themeService.applyTheme(tenant);
          registerTenantRoutes().finally(resolve);
        },
        error: () => {
          registerTenantRoutes().finally(resolve);
        },
      });
    });
}

/**
 * Computes the app's effective base href from the current URL path, BEFORE
 * the Router/PathLocationStrategy are constructed. For /store/pizzaa/admin,
 * this returns '/store/pizzaa/' — Angular's PathLocationStrategy then
 * transparently strips this prefix when matching routes and re-adds it when
 * generating hrefs, so every route defined elsewhere (e.g. { path: 'admin' })
 * needs no changes at all: 'admin' still resolves correctly whether the
 * effective base is '/' (platform root) or '/store/pizzaa/' (tenant).
 *
 * This exists because the project is hosted on Vercel's free domain, which
 * has no wildcard-subdomain support — /store/:subdomain/... stands in for
 * what would otherwise be a real subdomain.
 */
function getBaseHref(): string {
  const match = window.location.pathname.match(/^\/store\/([a-z0-9-]+)/);
  return match ? `/store/${match[1]}/` : '/';
}

export const appConfig: ApplicationConfig = {
  providers: [
    { provide: APP_BASE_HREF, useFactory: getBaseHref },
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(
      routes,
      withComponentInputBinding(),
    ),
    provideHttpClient(
      withInterceptors([tenantInterceptor, authInterceptor])
    ),
    provideAnimations(),
    {
      provide: APP_INITIALIZER,
      useFactory: initializeRoutes,
      multi: true,
    },
  ],
};
