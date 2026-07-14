import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@env/environment';
import { IApiResponse, IService, IAppointment, IPagedResult } from '../models';

// ─── Service CRUD ──────────────────────────────────────────────────────────────

export interface ICreateServiceRequest {
  name: string;
  description: string | null;
  durationMins: number;
  price: number;
  imageUrl: string | null;
}

export type IUpdateServiceRequest = ICreateServiceRequest & { isActive: boolean };

// ─── Appointments ──────────────────────────────────────────────────────────────

export interface IAppointmentsQuery {
  page?: number;
  pageSize?: number;
  status?: string | null;
  serviceId?: string | null;
}

export interface IUpdateAppointmentStatusRequest {
  status: string;  // "Pending" | "Confirmed" | "Cancelled" | "Completed"
}

@Injectable({ providedIn: 'root' })
export class BookingService {
  private readonly http = inject(HttpClient);
  private readonly baseServices     = `${environment.apiUrl}/v1/admin/booking/services`;
  private readonly baseAppointments = `${environment.apiUrl}/v1/admin/booking/appointments`;

  // ── Services ────────────────────────────────────────────────────────────────

  getServices(): Observable<IApiResponse<IService[]>> {
    return this.http.get<IApiResponse<IService[]>>(this.baseServices);
  }

  getServiceById(id: string): Observable<IApiResponse<IService>> {
    return this.http.get<IApiResponse<IService>>(`${this.baseServices}/${id}`);
  }

  createService(req: ICreateServiceRequest): Observable<IApiResponse<IService>> {
    return this.http.post<IApiResponse<IService>>(this.baseServices, req);
  }

  updateService(id: string, req: IUpdateServiceRequest): Observable<IApiResponse<IService>> {
    return this.http.put<IApiResponse<IService>>(`${this.baseServices}/${id}`, req);
  }

  deleteService(id: string): Observable<IApiResponse<boolean>> {
    return this.http.delete<IApiResponse<boolean>>(`${this.baseServices}/${id}`);
  }

  // ── Appointments ────────────────────────────────────────────────────────────

  getAppointments(query: IAppointmentsQuery = {}): Observable<IApiResponse<IPagedResult<IAppointment>>> {
    let params = new HttpParams()
      .set('page',     String(query.page     ?? 1))
      .set('pageSize', String(query.pageSize ?? 20));

    if (query.status    != null) params = params.set('status',    query.status);
    if (query.serviceId != null) params = params.set('serviceId', query.serviceId);

    return this.http.get<IApiResponse<IPagedResult<IAppointment>>>(this.baseAppointments, { params });
  }

  updateAppointmentStatus(id: string, req: IUpdateAppointmentStatusRequest): Observable<IApiResponse<IAppointment>> {
    return this.http.patch<IApiResponse<IAppointment>>(`${this.baseAppointments}/${id}/status`, req);
  }
}
