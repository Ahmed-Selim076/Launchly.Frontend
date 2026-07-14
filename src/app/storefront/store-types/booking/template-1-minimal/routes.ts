import { Routes } from '@angular/router';
import { BookingMinimalHomeComponent }        from './home/home.component';
import { BookingMinimalServiceListComponent } from './service-list/service-list.component';
import { BookingMinimalCalendarComponent }    from './booking-calendar/booking-calendar.component';
import { BookingMinimalConfirmComponent }     from './booking-confirm/booking-confirm.component';

/**
 * Phase 6 — Booking Storefront, Template 1 (Minimal) routes.
 *
 * ✅ Home:             BookingMinimalHomeComponent
 * ✅ Service List:     BookingMinimalServiceListComponent
 * ✅ Booking Calendar: BookingMinimalCalendarComponent   /book/:serviceId
 * ✅ Booking Confirm:  BookingMinimalConfirmComponent    /book/:serviceId/confirm?slot=<ISO>
 */
export const bookingMinimalRoutes: Routes = [
  { path: '',                                   component: BookingMinimalHomeComponent },
  { path: 'services',                           component: BookingMinimalServiceListComponent },
  { path: 'book/:serviceId',                    component: BookingMinimalCalendarComponent },
  { path: 'book/:serviceId/confirm',            component: BookingMinimalConfirmComponent },
];
