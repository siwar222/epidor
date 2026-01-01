import { Injectable } from '@angular/core';
import { CanActivate, CanActivateChild, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService } from './auth.service';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate, CanActivateChild {
  constructor(private authService: AuthService, private router: Router) { }

  canActivate(next: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> {
      const userId = next.paramMap.get('userId') || localStorage.getItem('redirected_userId');

    if (!userId) {
      this.authService.redirectToLogin();
      return of(false);
    }

    return this.authService.fetchAndStoreTokenOnce(userId).pipe(
      map(success => {
        if (success) {
          return true;
        } else {
          this.authService.redirectToLogin();
          return false;
        }
      }),
      catchError(() => {
        this.authService.redirectToLogin();
        return of(false);
      })
    );
  }

  canActivateChild(childRoute: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> {
    return this.canActivate(childRoute, state);
  }
}
