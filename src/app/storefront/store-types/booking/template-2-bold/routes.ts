import { Routes } from '@angular/router';
import { BookingBoldHomeComponent }        from './home/home.component';
import { BookingBoldServiceListComponent } from './service-list/service-list.component';
import { BookingBoldCalendarComponent }    from './booking-calendar/booking-calendar.component';
import { BookingBoldConfirmComponent }     from './booking-confirm/booking-confirm.component';

export const bookingBoldRoutes: Routes = [
  { path: '',                        component: BookingBoldHomeComponent },
  { path: 'services',                component: BookingBoldServiceListComponent },
  { path: 'book/:serviceId',         component: BookingBoldCalendarComponent },
  { path: 'book/:serviceId/confirm', component: BookingBoldConfirmComponent },
];
