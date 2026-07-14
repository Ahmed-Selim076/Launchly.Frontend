import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@env/environment';
import { IApiResponse, IOrder, IPagedResult } from '../models';

export interface IOrdersQuery {
  page?: number;
  pageSize?: number;
  status?: number | null;    // 0=Pending,1=Confirmed,2=Shipped,3=Delivered,4=Cancelled
  customerId?: string | null;
}

export interface IUpdateOrderStatusRequest {
  status: number;
}

@Injectable({ providedIn: 'root' })
export class OrderService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/v1/admin/orders`;

  getAll(query: IOrdersQuery = {}): Observable<IApiResponse<IPagedResult<IOrder>>> {
    let params = new HttpParams()
      .set('page',     String(query.page     ?? 1))
      .set('pageSize', String(query.pageSize ?? 20));

    if (query.status     != null) params = params.set('status',     String(query.status));
    if (query.customerId != null) params = params.set('customerId', query.customerId);

    return this.http.get<IApiResponse<IPagedResult<IOrder>>>(this.base, { params });
  }

  getById(id: string): Observable<IApiResponse<IOrder>> {
    return this.http.get<IApiResponse<IOrder>>(`${this.base}/${id}`);
  }

  updateStatus(id: string, req: IUpdateOrderStatusRequest): Observable<IApiResponse<IOrder>> {
    return this.http.patch<IApiResponse<IOrder>>(`${this.base}/${id}/status`, req);
  }
}
