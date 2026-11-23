import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';
import { I18nService } from './i18n/i18n.service';

// Runs before every HTTP request:
// 1. Adds "Authorization: Bearer <token>" when calling our API
// 2. Adds "Accept-Language" with the language chosen in the app
// 3. If the API answers 401 (token expired or invalid), closes the session
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const i18n = inject(I18nService);

  // The token is only sent to our API, never to third-party services
  if (!req.url.startsWith(environment.apiUrl)) {
    return next(req);
  }

  const headers: Record<string, string> = { 'Accept-Language': i18n.locale() };
  const token = auth.token();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return next(req.clone({ setHeaders: headers })).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401 && token) {
        auth.logout();
      }
      return throwError(() => error);
    }),
  );
};
