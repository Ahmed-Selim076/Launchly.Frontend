import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@env/environment';
import { IApiResponse, ICustomerList } from '../models';

@Injectable({ providedIn: 'root' })
export class CustomerService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/v1/admin/customers`;

  getAll(page = 1, pageSize = 20): Observable<IApiResponse<ICustomerList>> {
    const params = new HttpParams()
      .set('page',     String(page))
      .set('pageSize', String(pageSize));
    return this.http.get<IApiResponse<ICustomerList>>(this.base, { params });
  }
}
