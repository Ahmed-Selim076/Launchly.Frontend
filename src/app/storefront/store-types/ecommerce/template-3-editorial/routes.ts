import { Routes } from '@angular/router';
import { EditorialHomeComponent }          from './home/home.component';
import { EditorialProductGridComponent }   from './product-grid/product-grid.component';
import { EditorialProductDetailComponent } from './product-detail/product-detail.component';
import { EditorialCartComponent }          from './cart/cart.component';
import { EditorialCheckoutComponent }      from './checkout/checkout.component';

/**
 * Template 3 — Editorial routes.
 *
 * ✅ Home:           EditorialHomeComponent
 * ✅ Product Grid:   EditorialProductGridComponent
 * ✅ Product Detail: EditorialProductDetailComponent
 * ✅ Cart:           EditorialCartComponent
 * ✅ Checkout:       EditorialCheckoutComponent
 */
export const editorialRoutes: Routes = [
  { path: '',               component: EditorialHomeComponent },
  { path: 'products',       component: EditorialProductGridComponent },
  { path: 'products/:slug', component: EditorialProductDetailComponent },
  { path: 'cart',           component: EditorialCartComponent },
  { path: 'checkout',       component: EditorialCheckoutComponent },
];
