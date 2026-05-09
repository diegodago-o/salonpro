import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const token = auth.getToken();

  if (token) {
    req = req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
  }

  return next(req).pipe(
    catchError((err: HttpErrorResponse) => {
      // Only attempt refresh on 401, and never on auth endpoints themselves
      if (err.status === 401 && !req.url.includes('/auth/')) {
        return auth.tryRefresh().pipe(
          switchMap(newToken => {
            const retried = req.clone({
              setHeaders: { Authorization: `Bearer ${newToken}` }
            });
            return next(retried);
          }),
          catchError(refreshErr => throwError(() => refreshErr))
        );
      }
      return throwError(() => err);
    })
  );
};
