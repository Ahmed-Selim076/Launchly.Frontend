import { Routes } from '@angular/router';
import { superAdminGuard } from '../core/auth/guards';
import { SuperAdminShellComponent } from './layout/super-admin-shell/super-admin-shell.component';

/**
 * Super Admin routes — Phase 8.
 *
 * All routes protected by superAdminGuard (requires UserRole.SuperAdmin).
 * Shell wraps all pages with the dark sidebar layout.
 * Lazy-loaded per page.
 */
export const superAdminRoutes: Routes = [
  {
    path: '',
    component: SuperAdminShellComponent,
    canActivate: [superAdminGuard],
    children: [
      {
        path: '',
        redirectTo: 'tenants',
        pathMatch: 'full',
      },
      {
        path: 'tenants',
        loadComponent: () =>
          import('./pages/tenants/tenants.component').then(m => m.SuperTenantsComponent),
      },
      {
        path: 'tenants/:id',
        loadComponent: () =>
          import('./pages/tenant-detail/tenant-detail.component').then(m => m.SuperTenantDetailComponent),
      },
      {
        path: 'analytics',
        loadComponent: () =>
          import('./pages/analytics/analytics.component').then(m => m.SuperAnalyticsComponent),
      },
      {
        path: 'audit-log',
        loadComponent: () =>
          import('./pages/audit-log/audit-log.component').then(m => m.SuperAuditLogComponent),
      },
    ],
  },
];
