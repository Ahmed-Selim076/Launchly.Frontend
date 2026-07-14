import { Routes } from '@angular/router';
import { BoldHomeComponent }          from './home/home.component';
import { BoldProductGridComponent }   from './product-grid/product-grid.component';
import { BoldProductDetailComponent } from './product-detail/product-detail.component';
import { BoldCartComponent }          from './cart/cart.component';
import { BoldCheckoutComponent }      from './checkout/checkout.component';

export const boldRoutes: Routes = [
  { path: '',               component: BoldHomeComponent },
  { path: 'products',       component: BoldProductGridComponent },
  { path: 'products/:slug', component: BoldProductDetailComponent },
  { path: 'cart',           component: BoldCartComponent },
  { path: 'checkout',       component: BoldCheckoutComponent },
];
