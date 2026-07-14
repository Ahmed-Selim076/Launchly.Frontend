import { Routes } from '@angular/router';
import { RestaurantMinimalHomeComponent }      from './home/home.component';
import { RestaurantMinimalMenuViewComponent }  from './menu-view/menu-view.component';
import { RestaurantMinimalFoodCartComponent }  from './food-cart/food-cart.component';
import { RestaurantMinimalOrderTypeComponent } from './order-type/order-type.component';

export const restaurantMinimalRoutes: Routes = [
  { path: '',          component: RestaurantMinimalHomeComponent },
  { path: 'menu',      component: RestaurantMinimalMenuViewComponent },
  { path: 'cart',      component: RestaurantMinimalFoodCartComponent },
  { path: 'order-type', component: RestaurantMinimalOrderTypeComponent },
];
