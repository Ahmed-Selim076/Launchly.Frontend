import { Routes } from '@angular/router';
import { RestaurantEditorialHomeComponent }      from './home/home.component';
import { RestaurantEditorialMenuViewComponent }  from './menu-view/menu-view.component';
import { RestaurantEditorialFoodCartComponent }  from './food-cart/food-cart.component';
import { RestaurantEditorialOrderTypeComponent } from './order-type/order-type.component';

export const restaurantEditorialRoutes: Routes = [
  { path: '',           component: RestaurantEditorialHomeComponent },
  { path: 'menu',       component: RestaurantEditorialMenuViewComponent },
  { path: 'cart',       component: RestaurantEditorialFoodCartComponent },
  { path: 'order-type', component: RestaurantEditorialOrderTypeComponent },
];
