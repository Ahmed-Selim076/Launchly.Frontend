import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, switchMap } from 'rxjs';
import { environment } from '@env/environment';
import { IApiResponse, ISignedUploadParams } from '../models';

export type UploadType = 'product' | 'logo' | 'avatar' | 'service';

/**
 * Implements the 3-step Cloudinary signed upload flow documented in
 * UploadController.cs:
 *
 *   1. POST /api/v1/admin/upload/sign?type={type}
 *      → API signs the upload with its secret, returns params (never exposing the secret).
 *
 *   2. POST https://api.cloudinary.com/v1_1/{cloudName}/image/upload
 *      → Browser sends the file DIRECTLY to Cloudinary (no binary through our API).
 *      The signed params prove the upload is authorised.
 *
 *   3. Cloudinary responds with { secure_url, ... }.
 *      The caller then saves the URL via PUT /products/{id} or PATCH /settings/logo.
 *
 * Critical: the params that are signed (folder + timestamp) must be sent
 * verbatim to Cloudinary — any extra param added on the frontend that wasn't
 * included in the signature will cause a 400 "Invalid Signature" error.
 */
@Injectable({ providedIn: 'root' })
export class UploadService {
  private readonly http = inject(HttpClient);
  private readonly signBase = `${environment.apiUrl}/v1/admin/upload/sign`;

  /**
   * Signs, uploads, and returns the secure_url.
   * Caller provides the raw File object from an <input type="file">.
   */
  upload(file: File, type: UploadType): Observable<string> {
    return this.#sign(type).pipe(
      switchMap(params => this.#uploadToCloudinary(file, params)),
    );
  }

  #sign(type: UploadType): Observable<ISignedUploadParams> {
    return new Observable(observer => {
      this.http
        .post<IApiResponse<ISignedUploadParams>>(`${this.signBase}?type=${type}`, {})
        .subscribe({
          next: res => {
            if (res.success && res.data) {
              observer.next(res.data);
              observer.complete();
            } else {
              observer.error(new Error(res.message ?? 'Failed to sign upload.'));
            }
          },
          error: err => observer.error(err),
        });
    });
  }

  #uploadToCloudinary(file: File, params: ISignedUploadParams): Observable<string> {
    return new Observable(observer => {
      const url = `https://api.cloudinary.com/v1_1/${params.cloudName}/image/upload`;

      // Only send the params that were included in the signature (folder + timestamp).
      // Adding any extra field (e.g. public_id) that wasn't signed will cause a
      // 400 "Invalid Signature" from Cloudinary.
      const fd = new FormData();
      fd.append('file',      file);
      fd.append('api_key',   params.apiKey);
      fd.append('timestamp', String(params.timestamp));
      fd.append('signature', params.signature);
      fd.append('folder',    params.folder);

      const xhr = new XMLHttpRequest();
      xhr.open('POST', url);

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const data = JSON.parse(xhr.responseText) as { secure_url: string };
            observer.next(data.secure_url);
            observer.complete();
          } catch {
            observer.error(new Error('Unexpected Cloudinary response.'));
          }
        } else {
          observer.error(new Error(`Cloudinary upload failed (${xhr.status}).`));
        }
      };

      xhr.onerror = () => observer.error(new Error('Network error during upload.'));

      xhr.send(fd);

      // Allow caller to cancel
      return () => xhr.abort();
    });
  }
}
