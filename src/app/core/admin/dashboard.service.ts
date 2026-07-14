import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@env/environment';
import { IApiResponse, IDashboard } from '../models';

/**
 * Wraps GET /api/v1/admin/dashboard.
 *
 * One endpoint serves all 3 StoreTypes — DashboardService on the backend
 * branches per StoreType and returns the same IDashboard shape with
 * generically-named fields (totalOrders/totalCatalogItems/etc). This
 * service does NOT relabel anything — that's the consuming component's job
 * (it knows the tenant's storeType via TenantService).
 */
@Injectable({ providedIn: 'root' })
export class DashboardService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/v1/admin/dashboard`;

  getDashboard(): Observable<IApiResponse<IDashboard>> {
    return this.http.get<IApiResponse<IDashboard>>(this.base);
  }
}
