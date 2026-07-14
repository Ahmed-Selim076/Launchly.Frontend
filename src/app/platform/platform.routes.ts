import { Routes } from '@angular/router';

export const platformRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/home/home.component').then(m => m.HomeComponent),
  },
  {
    path: 'pricing',
    loadComponent: () =>
      import('./pages/pricing/pricing.component').then(m => m.PricingComponent),
  },
  {
    path: 'showcase',
    loadComponent: () =>
      import('./pages/showcase/showcase.component').then(m => m.ShowcaseComponent),
  },
];
