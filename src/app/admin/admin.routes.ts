import { Routes } from '@angular/router';
import { tenantAdminGuard, ecommerceGuard, bookingGuard, restaurantGuard } from '../core/auth/guards';
import { AdminShellComponent } from './layout/admin-shell/admin-shell.component';

/**
 * Admin routes — Phase 4.
 *
 * Two levels of protection per the agreed pattern:
 *   1. UI level: Sidebar hides nav items for the wrong StoreType.
 *   2. URL level: Route guards reject direct URL manipulation.
 *
 * All routes require `tenantAdminGuard`.
 * StoreType-specific routes also require their respective guard.
 *
 * Lazy-loaded per page — code-split by route, not by shell.
 */
export const adminRoutes: Routes = [
  {
    path: '',
    component: AdminShellComponent,
    canActivate: [tenantAdminGuard],
    children: [

      // Default redirect
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full',
      },

      // ── Shared (all store types) ──────────────────────────────────────────

      {
        path: 'dashboard',
        loadComponent: () =>
          import('./pages/dashboard/dashboard.component').then(m => m.DashboardComponent),
      },
      {
        path: 'analytics',
        loadComponent: () =>
          import('./pages/analytics/analytics.component').then(m => m.AnalyticsComponent),
      },
      {
        path: 'customers',
        loadComponent: () =>
          import('./pages/customers/customers.component').then(m => m.CustomersComponent),
      },
      {
        path: 'audit-log',
        loadComponent: () =>
          import('./pages/audit-log/audit-log.component').then(m => m.AuditLogComponent),
      },
      {
        path: 'settings',
        loadComponent: () =>
          import('./pages/settings/settings.component').then(m => m.SettingsComponent),
      },

      // ── Ecommerce only ───────────────────────────────────────────────────

      {
        path: 'products',
        canActivate: [ecommerceGuard],
        loadComponent: () =>
          import('./pages/products/products.component').then(m => m.ProductsComponent),
      },
      {
        path: 'products/new',
        canActivate: [ecommerceGuard],
        loadComponent: () =>
          import('./pages/products/products.component').then(m => m.ProductFormPageComponent),
      },
      {
        path: 'products/:id',
        canActivate: [ecommerceGuard],
        loadComponent: () =>
          import('./pages/products/products.component').then(m => m.ProductFormPageComponent),
      },
      {
        path: 'orders',
        canActivate: [ecommerceGuard],
        loadComponent: () =>
          import('./pages/orders/orders.component').then(m => m.OrdersComponent),
      },

      // ── Booking only ──────────────────────────────────────────────────────

      {
        path: 'services',
        canActivate: [bookingGuard],
        loadComponent: () =>
          import('./pages/services/services.component').then(m => m.ServicesComponent),
      },
      {
        path: 'appointments',
        canActivate: [bookingGuard],
        loadComponent: () =>
          import('./pages/appointments/appointments.component').then(m => m.AppointmentsComponent),
      },

      // ── Restaurant only ───────────────────────────────────────────────────

      {
        path: 'menu',
        canActivate: [restaurantGuard],
        loadComponent: () =>
          import('./pages/menu/menu.component').then(m => m.MenuComponent),
      },
      {
        path: 'food-orders',
        canActivate: [restaurantGuard],
        loadComponent: () =>
          import('./pages/food-orders/food-orders.component').then(m => m.FoodOrdersComponent),
      },
    ],
  },
];
