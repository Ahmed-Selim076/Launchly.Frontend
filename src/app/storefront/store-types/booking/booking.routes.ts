import { Routes } from '@angular/router';

export const bookingRoutes: Routes = [
  {
    path: '',
    loadChildren: () =>
      import('./template-1-minimal/routes').then(m => m.bookingMinimalRoutes),
  },
];