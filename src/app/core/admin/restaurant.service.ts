import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@env/environment';
import { IApiResponse, IMenuCategory, IMenuItem, IFoodOrder, IPagedResult } from '../models';

// ─── Menu Category ─────────────────────────────────────────────────────────────

export interface ICreateMenuCategoryRequest {
  name: string;
  sortOrder: number;
}

export type IUpdateMenuCategoryRequest = ICreateMenuCategoryRequest;

// ─── Menu Item ─────────────────────────────────────────────────────────────────

export interface ICreateMenuItemRequest {
  name: string;
  description: string | null;
  price: number;
  categoryId: string | null;
  imageUrl: string | null;
  isActive: boolean;
}

export type IUpdateMenuItemRequest = ICreateMenuItemRequest;

// ─── Food Orders ───────────────────────────────────────────────────────────────

export interface IFoodOrdersQuery {
  page?: number;
  pageSize?: number;
  // Backend uses OrderStatus int: 0=Pending,1=Confirmed,2=Shipped,3=Delivered,4=Cancelled
  // (FoodOrderStatus enum in frontend models doesn't match what the backend actually returns)
  status?: number | null;
}

export interface IUpdateFoodOrderStatusRequest {
  status: number;
}

@Injectable({ providedIn: 'root' })
export class RestaurantService {
  private readonly http = inject(HttpClient);
  private readonly baseCategories = `${environment.apiUrl}/v1/admin/menu-categories`;
  private readonly baseItems      = `${environment.apiUrl}/v1/admin/menu-items`;
  private readonly baseOrders     = `${environment.apiUrl}/v1/admin/food-orders`;

  // ── Categories ──────────────────────────────────────────────────────────────

  getCategories(): Observable<IApiResponse<IMenuCategory[]>> {
    return this.http.get<IApiResponse<IMenuCategory[]>>(this.baseCategories);
  }

  createCategory(req: ICreateMenuCategoryRequest): Observable<IApiResponse<IMenuCategory>> {
    return this.http.post<IApiResponse<IMenuCategory>>(this.baseCategories, req);
  }

  updateCategory(id: string, req: IUpdateMenuCategoryRequest): Observable<IApiResponse<IMenuCategory>> {
    return this.http.put<IApiResponse<IMenuCategory>>(`${this.baseCategories}/${id}`, req);
  }

  deleteCategory(id: string): Observable<IApiResponse<boolean>> {
    return this.http.delete<IApiResponse<boolean>>(`${this.baseCategories}/${id}`);
  }

  // ── Menu Items ──────────────────────────────────────────────────────────────

  getItems(activeOnly = false): Observable<IApiResponse<IMenuItem[]>> {
    const params = activeOnly ? new HttpParams().set('activeOnly', 'true') : undefined;
    return this.http.get<IApiResponse<IMenuItem[]>>(this.baseItems, { params });
  }

  createItem(req: ICreateMenuItemRequest): Observable<IApiResponse<IMenuItem>> {
    return this.http.post<IApiResponse<IMenuItem>>(this.baseItems, req);
  }

  updateItem(id: string, req: IUpdateMenuItemRequest): Observable<IApiResponse<IMenuItem>> {
    return this.http.put<IApiResponse<IMenuItem>>(`${this.baseItems}/${id}`, req);
  }

  deleteItem(id: string): Observable<IApiResponse<boolean>> {
    return this.http.delete<IApiResponse<boolean>>(`${this.baseItems}/${id}`);
  }

  // ── Food Orders ─────────────────────────────────────────────────────────────

  getOrders(query: IFoodOrdersQuery = {}): Observable<IApiResponse<IPagedResult<IFoodOrder>>> {
    let params = new HttpParams()
      .set('page',     String(query.page     ?? 1))
      .set('pageSize', String(query.pageSize ?? 20));

    if (query.status != null) params = params.set('status', String(query.status));

    return this.http.get<IApiResponse<IPagedResult<IFoodOrder>>>(this.baseOrders, { params });
  }

  updateOrderStatus(id: string, req: IUpdateFoodOrderStatusRequest): Observable<IApiResponse<IFoodOrder>> {
    return this.http.patch<IApiResponse<IFoodOrder>>(`${this.baseOrders}/${id}/status`, req);
  }
}
