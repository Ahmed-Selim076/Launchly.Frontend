import { Routes } from '@angular/router';
import { BookingEditorialHomeComponent }        from './home/home.component';
import { BookingEditorialServiceListComponent } from './service-list/service-list.component';
import { BookingEditorialCalendarComponent }    from './booking-calendar/booking-calendar.component';
import { BookingEditorialConfirmComponent }     from './booking-confirm/booking-confirm.component';

export const bookingEditorialRoutes: Routes = [
  { path: '',                        component: BookingEditorialHomeComponent },
  { path: 'services',                component: BookingEditorialServiceListComponent },
  { path: 'book/:serviceId',         component: BookingEditorialCalendarComponent },
  { path: 'book/:serviceId/confirm', component: BookingEditorialConfirmComponent },
];
