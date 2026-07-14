import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment }  from '../../../environments/environment';
import { IApiResponse } from '../models';

// ─── Booking-specific public interfaces ──────────────────────────────────────
// Declared here (not in core/models) so no existing file needs editing.
// Shape matches ServiceDto from Launchly.API exactly.

export interface IPublicService {
  id:           string;
  name:         string;
  description:  string | null;
  durationMins: number;
  price:        number;
  isActive:     boolean;
  createdAt:    string;
  imageUrl:     string | null;
}

export interface IAvailableSlot {
  startTime: string;   // ISO datetime
  endTime:   string;   // ISO datetime
}

export interface IBookAppointmentRequest {
  serviceId: string;
  startTime: string;   // ISO datetime
  notes?:    string | null;
}

export interface IAppointment {
  id:          string;
  serviceId:   string;
  serviceName: string;
  startTime:   string;  // ISO datetime
  endTime:     string;  // ISO datetime
  status:      string;
  notes:       string | null;
}

/**
 * BookingStoreService
 *
 * Public storefront service for the Booking store type.
 * Mirrors ProductStoreService exactly — HttpClient injection,
 * same environment.apiUrl base, same IApiResponse<T> wrapper.
 *
 * Endpoints consumed:
 *   GET  /api/v1/store/booking/services            (public)
 *   GET  /api/v1/store/booking/services/:id         (public)
 *   GET  /api/v1/store/booking/services/:id/availability?date=  (public)
 *   POST /api/v1/store/booking/appointments          (requires Customer auth)
 *   GET  /api/v1/store/booking/appointments/my       (requires Customer auth)
 */
@Injectable({ providedIn: 'root' })
export class BookingStoreService {

  private readonly http    = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/v1/store/booking`;

  /** Returns all active services for the current tenant's store. */
  getServices(): Observable<IApiResponse<IPublicService[]>> {
    return this.http.get<IApiResponse<IPublicService[]>>(
      `${this.baseUrl}/services`
    );
  }

  /** Returns a single service by ID. */
  getServiceById(id: string): Observable<IApiResponse<IPublicService>> {
    return this.http.get<IApiResponse<IPublicService>>(
      `${this.baseUrl}/services/${id}`
    );
  }

  /**
   * Returns available booking slots for a service on a given date.
   * @param date ISO date string e.g. '2026-07-15'
   */
  getAvailableSlots(
    serviceId: string,
    date: string
  ): Observable<IApiResponse<IAvailableSlot[]>> {
    return this.http.get<IApiResponse<IAvailableSlot[]>>(
      `${this.baseUrl}/services/${serviceId}/availability`,
      { params: { date } }
    );
  }

  /**
   * Books an appointment. Requires the customer to be authenticated
   * (authInterceptor attaches the bearer token automatically) — the
   * calling component is responsible for ensuring isAuthenticated()
   * is true before calling this, same pattern as Ecommerce checkout.
   */
  bookAppointment(
    req: IBookAppointmentRequest
  ): Observable<IApiResponse<IAppointment>> {
    return this.http.post<IApiResponse<IAppointment>>(
      `${this.baseUrl}/appointments`,
      req
    );
  }

  /** Returns all appointments for the currently authenticated customer. */
  getMyAppointments(): Observable<IApiResponse<IAppointment[]>> {
    return this.http.get<IApiResponse<IAppointment[]>>(
      `${this.baseUrl}/appointments/my`
    );
  }
}
