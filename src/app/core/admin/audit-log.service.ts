import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@env/environment';
import { IApiResponse, IAuditLogList } from '../models';

@Injectable({ providedIn: 'root' })
export class AuditLogService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/v1/admin/audit-log`;

  getAll(page = 1, pageSize = 30): Observable<IApiResponse<IAuditLogList>> {
    const params = new HttpParams()
      .set('page',     String(page))
      .set('pageSize', String(pageSize));
    return this.http.get<IApiResponse<IAuditLogList>>(this.base, { params });
  }
}
