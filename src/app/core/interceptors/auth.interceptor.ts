import {
  HttpInterceptorFn,
  HttpRequest,
  HttpHandlerFn,
  HttpErrorResponse,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError, BehaviorSubject, filter, take } from 'rxjs';
import { TokenStorageService } from '../auth/token-storage.service';
import { AuthService }         from '../auth/auth.service';

// Shared refresh state — prevents multiple parallel 401s from triggering
// multiple simultaneous refresh calls. Only one refresh is in-flight at a time;
// subsequent 401 callers wait for the new token via the BehaviorSubject.
let isRefreshing                              = false;
const refreshDone$ = new BehaviorSubject<string | null>(null);

export const authInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
) => {
  const storage     = inject(TokenStorageService);
  const authService = inject(AuthService);
  const token       = storage.getToken();

  const authReq = token
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;

  return next(authReq).pipe(
    catchError((err: unknown) => {
      if (!(err instanceof HttpErrorResponse) || err.status !== 401) {
        return throwError(() => err);
      }

      // Don't retry the refresh endpoint itself to avoid infinite loop
      if (req.url.includes('/auth/refresh') || req.url.includes('/auth/login')) {
        authService.clearLocalSession();
        return throwError(() => err);
      }

      if (isRefreshing) {
        // Wait for the refresh to complete, then retry with the new token
        return refreshDone$.pipe(
          filter(t => t !== null),
          take(1),
          switchMap(newToken => {
            const retried = req.clone({ setHeaders: { Authorization: `Bearer ${newToken}` } });
            return next(retried);
          })
        );
      }

      isRefreshing = true;
      refreshDone$.next(null);

      return authService.refreshToken().pipe(
        switchMap(res => {
          isRefreshing = false;
          if (res.success && res.data) {
            const newToken = res.data.accessToken;
            refreshDone$.next(newToken);
            const retried = req.clone({ setHeaders: { Authorization: `Bearer ${newToken}` } });
            return next(retried);
          }
          authService.clearLocalSession();
          return throwError(() => err);
        }),
        catchError(refreshErr => {
          isRefreshing = false;
          refreshDone$.next(null);
          authService.clearLocalSession();
          return throwError(() => refreshErr);
        })
      );
    })
  );
};
