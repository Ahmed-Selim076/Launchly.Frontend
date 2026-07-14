import { Routes } from '@angular/router';

/**
 * Template 1 — Minimal ecommerce routes.
 * All components are lazy-loaded so only this template's code is
 * downloaded for tenants that chose templateId = 1.
 */
export const minimalRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./home/home.component').then(m => m.MinimalHomeComponent),
  },
  {
    path: 'products',
    loadComponent: () =>
      import('./product-grid/product-grid.component').then(m => m.MinimalProductGridComponent),
  },
  {
    path: 'products/:slug',
    loadComponent: () =>
      import('./product-detail/product-detail.component').then(m => m.MinimalProductDetailComponent),
  },
  {
    path: 'cart',
    loadComponent: () =>
      import('./cart/cart.component').then(m => m.MinimalCartComponent),
  },
  {
    path: 'checkout',
    loadComponent: () =>
      import('./checkout/checkout.component').then(m => m.MinimalCheckoutComponent),
  },
];
