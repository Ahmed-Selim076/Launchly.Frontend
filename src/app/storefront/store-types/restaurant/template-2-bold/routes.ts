import { Routes } from '@angular/router';
import { RestaurantBoldHomeComponent }      from './home/home.component';
import { RestaurantBoldMenuViewComponent }  from './menu-view/menu-view.component';
import { RestaurantBoldFoodCartComponent }  from './food-cart/food-cart.component';
import { RestaurantBoldOrderTypeComponent } from './order-type/order-type.component';

export const restaurantBoldRoutes: Routes = [
  { path: '',           component: RestaurantBoldHomeComponent },
  { path: 'menu',       component: RestaurantBoldMenuViewComponent },
  { path: 'cart',       component: RestaurantBoldFoodCartComponent },
  { path: 'order-type', component: RestaurantBoldOrderTypeComponent },
];
