import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@env/environment';
import {
  IApiResponse, IPublicProduct, IPagedResult,
  ICategory, IPlaceOrderRequest, IPlacedOrder, ICustomerOrder,
  IWishlistItem, IReviewSummary, ICreateReviewRequest, IContactMessageRequest,
} from '../models';

export interface IProductQuery {
  search?:     string;
  categoryId?: string;
  minPrice?:   number;
  maxPrice?:   number;
  page?:       number;
  pageSize?:   number;
}

@Injectable({ providedIn: 'root' })
export class ProductStoreService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/v1/store`;

  getProducts(q: IProductQuery = {}): Observable<IApiResponse<IPagedResult<IPublicProduct>>> {
    let params = new HttpParams();
    if (q.search)     params = params.set('search',     q.search);
    if (q.categoryId) params = params.set('categoryId', q.categoryId);
    if (q.minPrice != null) params = params.set('minPrice', q.minPrice);
    if (q.maxPrice != null) params = params.set('maxPrice', q.maxPrice);
    params = params.set('page',     String(q.page     ?? 1));
    params = params.set('pageSize', String(q.pageSize ?? 20));
    return this.http.get<IApiResponse<IPagedResult<IPublicProduct>>>(`${this.base}/products`, { params });
  }

  getProduct(slug: string): Observable<IApiResponse<IPublicProduct>> {
    return this.http.get<IApiResponse<IPublicProduct>>(`${this.base}/products/${slug}`);
  }

  getCategories(): Observable<IApiResponse<ICategory[]>> {
    return this.http.get<IApiResponse<ICategory[]>>(`${this.base}/categories`);
  }

  placeOrder(body: IPlaceOrderRequest): Observable<IApiResponse<IPlacedOrder>> {
    return this.http.post<IApiResponse<IPlacedOrder>>(`${this.base}/orders`, body);
  }

  getOrders(): Observable<IApiResponse<ICustomerOrder[]>> {
    return this.http.get<IApiResponse<ICustomerOrder[]>>(`${this.base}/orders`);
  }

  getOrder(orderId: string): Observable<IApiResponse<ICustomerOrder>> {
    return this.http.get<IApiResponse<ICustomerOrder>>(`${this.base}/orders/${orderId}`);
  }

  logVisit(): void {
    this.http.post(`${this.base}/visit`, {}).subscribe({ error: () => {} });
  }

  // ─── Wishlist (requires Customer auth) ───────────────────────────────────

  getWishlist(): Observable<IApiResponse<IWishlistItem[]>> {
    return this.http.get<IApiResponse<IWishlistItem[]>>(`${this.base}/wishlist`);
  }

  addToWishlist(productId: string): Observable<IApiResponse<boolean>> {
    return this.http.post<IApiResponse<boolean>>(`${this.base}/wishlist/${productId}`, {});
  }

  removeFromWishlist(productId: string): Observable<IApiResponse<boolean>> {
    return this.http.delete<IApiResponse<boolean>>(`${this.base}/wishlist/${productId}`);
  }

  // ─── Reviews ──────────────────────────────────────────────────────────────

  getReviews(slug: string): Observable<IApiResponse<IReviewSummary>> {
    return this.http.get<IApiResponse<IReviewSummary>>(`${this.base}/products/${slug}/reviews`);
  }

  addReview(slug: string, body: ICreateReviewRequest): Observable<IApiResponse<unknown>> {
    return this.http.post<IApiResponse<unknown>>(`${this.base}/products/${slug}/reviews`, body);
  }

  // ─── Contact ──────────────────────────────────────────────────────────────

  sendContactMessage(body: IContactMessageRequest): Observable<IApiResponse<boolean>> {
    return this.http.post<IApiResponse<boolean>>(`${this.base}/contact`, body);
  }
}
