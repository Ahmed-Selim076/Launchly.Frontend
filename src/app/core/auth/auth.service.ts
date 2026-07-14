import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, catchError, throwError } from 'rxjs';
import { environment } from '@env/environment';
import { TokenStorageService } from './token-storage.service';
import {
  IUser, IAuthResponse, IApiResponse, IRegisterRequest,
  ILoginRequest, IGoogleAuthRequest, IForgotPasswordRequest,
  IResetPasswordRequest, IVerifyEmailRequest, UserRole,
  IRegisterCustomerRequest,
} from '../models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http    = inject(HttpClient);
  private readonly storage = inject(TokenStorageService);
  private readonly base    = `${environment.apiUrl}/v1/auth`;

  // ─── Google OAuth availability ─────────────────────────────────────────────
  // False when the Google Client ID placeholder has not been replaced yet.
  // Components read this to show/hide the "Continue with Google" button.
  readonly googleEnabled =
    !!environment.googleClientId &&
    !environment.googleClientId.startsWith('YOUR_GOOGLE');

  // ─── State ────────────────────────────────────────────────────────────────

  readonly currentUser     = signal<IUser | null>(this.#loadUserFromToken());
  readonly isAuthenticated = computed(() => this.currentUser() !== null);

  // Fields that can change without a fresh login (so they can't live in the
  // JWT, which is only re-issued at login/refresh) — currently just the
  // avatar. Populated by fetching /auth/me; null until that's called.
  readonly avatarUrl = signal<string | null>(null);

  // ─── Profile ──────────────────────────────────────────────────────────────

  getMe(): Observable<IApiResponse<{ avatarUrl: string | null }>> {
    return this.http.get<IApiResponse<{ avatarUrl: string | null }>>(`${this.base}/me`).pipe(
      tap(res => { if (res.success && res.data) this.avatarUrl.set(res.data.avatarUrl); })
    );
  }

  updateAvatar(avatarUrl: string | null): Observable<IApiResponse<{ avatarUrl: string | null }>> {
    return this.http.patch<IApiResponse<{ avatarUrl: string | null }>>(`${this.base}/avatar`, { avatarUrl }).pipe(
      tap(res => { if (res.success && res.data) this.avatarUrl.set(res.data.avatarUrl); })
    );
  }

  changePassword(currentPassword: string, newPassword: string): Observable<IApiResponse<boolean>> {
    return this.http.post<IApiResponse<boolean>>(`${this.base}/change-password`, { currentPassword, newPassword });
  }

  // ─── Auth Actions ─────────────────────────────────────────────────────────

  register(req: IRegisterRequest): Observable<IApiResponse<IAuthResponse>> {
    return this.http.post<IApiResponse<IAuthResponse>>(`${this.base}/register`, req).pipe(
      tap(res => { if (res.success && res.data) this.#storeSession(res.data); })
    );
  }

  login(req: ILoginRequest): Observable<IApiResponse<IAuthResponse>> {
    return this.http.post<IApiResponse<IAuthResponse>>(`${this.base}/login`, req).pipe(
      tap(res => { if (res.success && res.data) this.#storeSession(res.data); })
    );
  }

  registerCustomer(req: IRegisterCustomerRequest): Observable<IApiResponse<IAuthResponse>> {
    return this.http
      .post<IApiResponse<IAuthResponse>>(`${this.base.replace('/auth', '')}/store/register`, req)
      .pipe(tap(res => { if (res.success && res.data) this.#storeSession(res.data); }));
  }

  loginCustomer(req: ILoginRequest): Observable<IApiResponse<IAuthResponse>> {
    return this.http
      .post<IApiResponse<IAuthResponse>>(`${this.base}/login-customer`, req)
      .pipe(tap(res => { if (res.success && res.data) this.#storeSession(res.data); }));
  }

  loginWithGoogle(idToken: string): Observable<IApiResponse<IAuthResponse>> {
    const req: IGoogleAuthRequest = { idToken };
    return this.http
      .post<IApiResponse<IAuthResponse>>(`${this.base}/google`, req)
      .pipe(tap(res => { if (res.success && res.data) this.#storeSession(res.data); }));
  }

  logout(): Observable<IApiResponse<boolean>> {
    const refreshToken = this.storage.getRefreshToken() ?? '';
    return this.http
      .post<IApiResponse<boolean>>(`${this.base}/logout`, { refreshToken })
      .pipe(
        tap(() => this.#clearSession()),
        catchError(err => { this.#clearSession(); return throwError(() => err); })
      );
  }

  refreshToken(): Observable<IApiResponse<IAuthResponse>> {
    const refreshToken = this.storage.getRefreshToken() ?? '';
    return this.http
      .post<IApiResponse<IAuthResponse>>(`${this.base}/refresh`, { refreshToken })
      .pipe(tap(res => { if (res.success && res.data) this.#storeSession(res.data); }));
  }

  verifyEmail(token: string): Observable<IApiResponse<boolean>> {
    const req: IVerifyEmailRequest = { token };
    return this.http.post<IApiResponse<boolean>>(`${this.base}/verify-email`, req);
  }

  forgotPassword(email: string): Observable<IApiResponse<boolean>> {
    const req: IForgotPasswordRequest = { email };
    return this.http.post<IApiResponse<boolean>>(`${this.base}/forgot-password`, req);
  }

  resetPassword(token: string, newPassword: string): Observable<IApiResponse<boolean>> {
    const req: IResetPasswordRequest = { token, newPassword };
    return this.http.post<IApiResponse<boolean>>(`${this.base}/reset-password`, req);
  }

  checkSubdomain(subdomain: string): Observable<IApiResponse<boolean>> {
    return this.http.get<IApiResponse<boolean>>(`${this.base}/check-subdomain/${subdomain}`);
  }

  // ─── Role Checks ──────────────────────────────────────────────────────────

  hasRole(role: UserRole): boolean { return this.currentUser()?.role === role; }
  isTenantAdmin(): boolean { return this.hasRole(UserRole.TenantAdmin); }
  isSuperAdmin():  boolean { return this.hasRole(UserRole.SuperAdmin); }
  isCustomer():    boolean { return this.hasRole(UserRole.Customer); }

  // ─── Public session helpers ──────────────────────────────────────────────

  clearLocalSession(): void { this.#clearSession(); }

  // ─── Private Helpers ──────────────────────────────────────────────────────

  #storeSession(auth: IAuthResponse): void {
    this.storage.setToken(auth.accessToken);
    this.storage.setRefreshToken(auth.refreshToken);
    this.currentUser.set(auth.user);
  }

  #clearSession(): void {
    this.storage.clearAll();
    this.currentUser.set(null);
  }

  #loadUserFromToken(): IUser | null {
    const token = this.storage.getToken();
    if (!token) return null;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const exp: number = payload['exp'] ?? 0;
      if (Date.now() / 1000 > exp) {
        this.storage.clearAll();
        return null;
      }
      return {
        id:        payload['sub']         ?? '',
        email:     payload['email']       ?? '',
        // Backend sends JwtRegisteredClaimNames.GivenName / FamilyName
        firstName: payload['given_name']  ?? '',
        lastName:  payload['family_name'] ?? '',
        role:      (payload['role'] as UserRole) ?? UserRole.Customer,
        // Backend sends both 'tenant_id' (snake) and 'tenantId' (camel)
        tenantId:  payload['tenant_id']   ?? payload['tenantId'] ?? null,
        // Not carried in the JWT — only ever comes from the login/register
        // response body, and only matters for that one redirect decision.
        tenantSubdomain: null,
      };
    } catch {
      this.storage.clearAll();
      return null;
    }
  }
}
