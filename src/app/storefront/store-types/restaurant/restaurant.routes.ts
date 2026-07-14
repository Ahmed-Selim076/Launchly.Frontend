import { Routes } from '@angular/router';

export const restaurantRoutes: Routes = [
  {
    path: '',
    loadChildren: () =>
      import('./template-1-minimal/routes').then(m => m.restaurantMinimalRoutes),
  },
];