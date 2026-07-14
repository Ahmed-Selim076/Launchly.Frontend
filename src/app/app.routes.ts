import { Routes } from '@angular/router';

/**
 * Top-level routing strategy:
 * The AppComponent reads the subdomain and activates the correct route group.
 *
 * Subdomain logic (mirrors Section 9 of FRONTEND_PLAN.md):
 *   No subdomain     → Platform Site (launchly.com)
 *   subdomain=admin  → Super Admin panel
 *   any other        → Tenant storefront + /admin section
 */
export const routes: Routes = [
  // Platform marketing site
  {
    path: '',
    loadChildren: () =>
      import('./platform/platform.routes').then(m => m.platformRoutes),
  },

  // Auth pages (shared — used by both platform login and tenant admin login)
  {
    path: 'login',
    loadComponent: () =>
      import('./platform/pages/login/login.component').then(m => m.LoginComponent),
  },
  {
    path: 'signup',
    loadComponent: () =>
      import('./platform/pages/signup/signup.component').then(m => m.SignupComponent),
  },
  {
    path: 'forgot-password',
    loadComponent: () =>
      import('./platform/pages/auth/auth-pages.component').then(m => m.ForgotPasswordComponent),
  },
  {
    path: 'reset-password',
    loadComponent: () =>
      import('./platform/pages/auth/auth-pages.component').then(m => m.ResetPasswordComponent),
  },
  {
    path: 'verify-email',
    loadComponent: () =>
      import('./platform/pages/auth/auth-pages.component').then(m => m.VerifyEmailComponent),
  },

  // Super Admin panel (subdomain=admin or path /super)
  {
    path: 'super',
    loadChildren: () =>
      import('./super-admin/super-admin.routes').then(m => m.superAdminRoutes),
  },

  // 404
  {
    path: '**',
    loadComponent: () =>
      import('./platform/pages/not-found/not-found.component').then(m => m.NotFoundComponent),
  },
];
