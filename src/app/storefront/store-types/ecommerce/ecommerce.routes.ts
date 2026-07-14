import { Routes } from '@angular/router';

export const ecommerceRoutes: Routes = [
  {
    path: '',
    loadChildren: () =>
      import('./template-1-minimal/routes').then(m => m.minimalRoutes),
  },
];