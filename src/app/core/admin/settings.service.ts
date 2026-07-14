import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@env/environment';
import { IApiResponse, ISettings, IUpdateSettingsRequest } from '../models';

/**
 * Wraps the three Settings endpoints:
 *
 *   GET    /api/v1/admin/settings          → ISettings
 *   PUT    /api/v1/admin/settings          → ISettings  (text fields + colors)
 *   PATCH  /api/v1/admin/settings/logo     → ISettings  (logoUrl only)
 *
 * Logo upload itself is handled by UploadService (type='logo') — this service
 * only saves the returned Cloudinary URL via patchLogo().
 */
@Injectable({ providedIn: 'root' })
export class SettingsService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/v1/admin/settings`;

  getSettings(): Observable<IApiResponse<ISettings>> {
    return this.http.get<IApiResponse<ISettings>>(this.base);
  }

  updateSettings(body: IUpdateSettingsRequest): Observable<IApiResponse<ISettings>> {
    return this.http.put<IApiResponse<ISettings>>(this.base, body);
  }

  /** Called after ImageUploader emits the Cloudinary secure_url */
  patchLogo(logoUrl: string): Observable<IApiResponse<ISettings>> {
    return this.http.patch<IApiResponse<ISettings>>(`${this.base}/logo`, { logoUrl });
  }
}
