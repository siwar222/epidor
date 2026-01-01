import {
  HttpRequest,
  HttpHandlerFn,
  HttpEvent,
  HttpInterceptorFn
} from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { inject } from '@angular/core';
import { AuthService } from './auth.service';

export const authInterceptor: HttpInterceptorFn = (
  req: HttpRequest<any>,
  next: HttpHandlerFn
): Observable<HttpEvent<any>> => {
    const authService = inject(AuthService);
    const token = localStorage.getItem('auth_token');
    const apiKey = environment.apiKey;

    const userId = localStorage.getItem('redirected_userId');
    authService.fetchAndStoreTokenOnce(userId!).subscribe();

    const cloned = req.clone({
      setHeaders: {
        Authorization: token ? `Bearer ${token}` : '',
        'x-api-key': apiKey
      }
    });

    return next(cloned);
};
