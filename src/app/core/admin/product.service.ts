import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@env/environment';
import {
  IApiResponse, IProduct, IPagedResult,
} from '../models';

export interface IProductsQuery {
  page?: number;
  pageSize?: number;
  search?: string;
  categoryId?: string | null;
  isActive?: boolean | null;
}

export interface ICreateProductRequest {
  name: string;
  description: string | null;
  price: number;
  stock: number;
  categoryId: string | null;
  imageUrl: string | null;
  isActive: boolean;
}

export type IUpdateProductRequest = ICreateProductRequest;

@Injectable({ providedIn: 'root' })
export class ProductService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/v1/admin/products`;

  getAll(query: IProductsQuery = {}): Observable<IApiResponse<IPagedResult<IProduct>>> {
    let params = new HttpParams()
      .set('page',     String(query.page     ?? 1))
      .set('pageSize', String(query.pageSize ?? 20));

    if (query.search)                  params = params.set('search',     query.search);
    if (query.categoryId != null)      params = params.set('categoryId', query.categoryId);
    if (query.isActive   != null)      params = params.set('isActive',   String(query.isActive));

    return this.http.get<IApiResponse<IPagedResult<IProduct>>>(this.base, { params });
  }

  getById(id: string): Observable<IApiResponse<IProduct>> {
    return this.http.get<IApiResponse<IProduct>>(`${this.base}/${id}`);
  }

  create(req: ICreateProductRequest): Observable<IApiResponse<IProduct>> {
    return this.http.post<IApiResponse<IProduct>>(this.base, req);
  }

  update(id: string, req: IUpdateProductRequest): Observable<IApiResponse<IProduct>> {
    return this.http.put<IApiResponse<IProduct>>(`${this.base}/${id}`, req);
  }

  delete(id: string): Observable<IApiResponse<boolean>> {
    return this.http.delete<IApiResponse<boolean>>(`${this.base}/${id}`);
  }
}
