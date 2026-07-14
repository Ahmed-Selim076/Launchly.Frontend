import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@env/environment';
import { IApiResponse, IOnboardingStatus } from '../models';

/**
 * Wraps GET /api/v1/admin/onboarding.
 *
 * The backend (OnboardingService.cs) returns 4 steps always — the
 * step keys and labels vary per StoreType but are resolved server-side.
 * This service is deliberately thin: it fetches and passes through.
 * Health score computation lives in the consuming component (HealthScoreComponent)
 * using the same IOnboardingStatus data, following the agreed formula:
 *   25% Store Identity (logo_uploaded) +
 *   35% Catalog readiness (product_created / service_created / menu_item_created) +
 *   40% First real activity (first_order / first_appointment)
 * Email verification is tracked as a checklist step but excluded from the
 * health score weights (it's a prerequisite, not a quality signal).
 */
@Injectable({ providedIn: 'root' })
export class OnboardingService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/v1/admin/onboarding`;

  getStatus(): Observable<IApiResponse<IOnboardingStatus>> {
    return this.http.get<IApiResponse<IOnboardingStatus>>(this.base);
  }
}
