import { Routes } from '@angular/router';
import { inject } from '@angular/core';
import { tenantResolver }           from './tenant.resolver';
import { StorefrontShellComponent } from './layout/storefront-shell/storefront-shell.component';
import { TenantService }            from '../core/tenant/tenant.service';
import { StoreType }                from '../core/models';

// By the time canMatch runs, currentTenant() is already populated
// because app.component.ts loads the tenant BEFORE registering routes.
const isBooking    = () => inject(TenantService).currentTenant()?.storeType === StoreType.Booking;
const isRestaurant = () => inject(TenantService).currentTenant()?.storeType === StoreType.Restaurant;
const isTpl2       = () => (inject(TenantService).currentTenant()?.templateId ?? 1) === 2;
const isTpl3       = () => (inject(TenantService).currentTenant()?.templateId ?? 1) === 3;

export const storefrontRoutes: Routes = [
  {
    path: '',
    component: StorefrontShellComponent,
    resolve: { tenant: tenantResolver },
    children: [

      // ── Shared account pages (identical across every store type/template) ──
      { path: 'account', loadComponent: () => import('./pages/account/account.component').then(m => m.StorefrontAccountComponent) },
      { path: 'orders',  loadComponent: () => import('./pages/account/orders.component').then(m => m.StorefrontOrdersComponent) },
      { path: 'contact', loadComponent: () => import('./pages/contact/contact.component').then(m => m.StorefrontContactComponent) },
      { path: 'about',   loadComponent: () => import('./pages/about/about.component').then(m => m.StorefrontAboutComponent) },
      { path: 'wishlist', loadComponent: () => import('./pages/wishlist/wishlist.component').then(m => m.StorefrontWishlistComponent) },

      // ── Booking ────────────────────────────────────────────────────────────
      { path: '', canMatch: [isBooking, isTpl2],    loadChildren: () => import('./store-types/booking/template-2-bold/routes').then(m => m.bookingBoldRoutes) },
      { path: '', canMatch: [isBooking, isTpl3],    loadChildren: () => import('./store-types/booking/template-3-editorial/routes').then(m => m.bookingEditorialRoutes) },
      { path: '', canMatch: [isBooking],             loadChildren: () => import('./store-types/booking/template-1-minimal/routes').then(m => m.bookingMinimalRoutes) },

      // ── Restaurant ─────────────────────────────────────────────────────────
      { path: '', canMatch: [isRestaurant, isTpl2], loadChildren: () => import('./store-types/restaurant/template-2-bold/routes').then(m => m.restaurantBoldRoutes) },
      { path: '', canMatch: [isRestaurant, isTpl3], loadChildren: () => import('./store-types/restaurant/template-3-editorial/routes').then(m => m.restaurantEditorialRoutes) },
      { path: '', canMatch: [isRestaurant],          loadChildren: () => import('./store-types/restaurant/template-1-minimal/routes').then(m => m.restaurantMinimalRoutes) },

      // ── Ecommerce (default) ────────────────────────────────────────────────
      { path: '', canMatch: [isTpl2],               loadChildren: () => import('./store-types/ecommerce/template-2-bold/routes').then(m => m.boldRoutes) },
      { path: '', canMatch: [isTpl3],               loadChildren: () => import('./store-types/ecommerce/template-3-editorial/routes').then(m => m.editorialRoutes) },
      { path: '',                                    loadChildren: () => import('./store-types/ecommerce/template-1-minimal/routes').then(m => m.minimalRoutes) },

    ],
  },
];