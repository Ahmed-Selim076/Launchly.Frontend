import { ApplicationConfig, provideZoneChangeDetection, APP_INITIALIZER, inject } from '@angular/core';
import { provideRouter, withComponentInputBinding, Router } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';

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
      // These two exist on the platform root's static route config
      // (app.routes.ts) too, but resetConfig() here REPLACES the whole
      // route table for tenant subdomains — without re-adding them, the
      // "Forgot password?" link on the login page (which every tenant
      // actually uses, at {subdomain}.launchly.com/login) 404'd, even
      // though the component, the backend endpoint, and the link itself
      // all existed and worked fine on the platform root domain.
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
          // Tenant not found / suspended — still register routes so the
          // storefront's own tenantResolver runs and can route to /not-found
          // with a proper error state instead of leaving routes unconfigured.
          registerTenantRoutes().finally(resolve);
        },
      });
    });
}

export const appConfig: ApplicationConfig = {
  providers: [
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