import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { catchError, finalize, map, shareReplay } from 'rxjs/operators';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private baseUrl = environment.authBackendBaseUrl;
  private tokenKey = 'auth_token';
  private userInfoKey = 'auth_user';

  private currentUserSubject = new BehaviorSubject<any>(this.getStoredUser());
  private tokenRefreshed?: Observable<boolean>;

  constructor(private http: HttpClient) { }

  public clearSession(): void {
    const userId = this.getUserId();

    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.userInfoKey);

    this.currentUserSubject.next(null);

    if (userId) {
      this.centralLogout(userId);
    }

    this.redirectToLogin();
  }

  centralLogout(userId: string): void {
    const body = { userId: userId };

    this.http.post(`${this.baseUrl}/auth/logout`, body).subscribe({
      next: () => {
        console.log('Déconnexion réussie');
      },
      error: (err) => {
        console.error('Erreur lors de la déconnexion', err);
      }
    });
  }

  decodeToken(token: string): any {
    try {
      const payload = token.split('.')[1];
      return JSON.parse(atob(payload));
    } catch {
      return null;
    }
  }

  checkTokenValidity(): void {
    if (this.isTokenExpired()) {
      console.log('Token expired. Logging out.');
      this.clearSession();
    }
  }

  isTokenExpired(): boolean {
    const token = this.getToken();
    const decoded: any = this.decodeToken(token || '');
    if (!decoded || !decoded.exp) return true;

    return Date.now() > decoded.exp * 1000;
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  getStoredUser(): any {
    const user = localStorage.getItem(this.userInfoKey);
    return user ? JSON.parse(user) : null;
  }

  getUserId(): string | null {
    const decoded = this.decodeToken(this.getToken() || '');
    return decoded?.['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'] || null;
  }

  getUserDirectionId(): string | null {
    const decoded = this.decodeToken(this.getToken() || '');
    return decoded?.directionId || null;
  }

  getUserName(): string | null {
    const decoded = this.decodeToken(this.getToken() || '');
    return decoded?.['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'] || null;
  }

  getUserRole(): string | null {
    const decoded = this.decodeToken(this.getToken() || '');
    return decoded?.['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] || null;
  }

  isLoggedIn(): boolean {
    return !!this.getToken() && !this.isTokenExpired();
  }

    fetchAndStoreToken(userId: string): Observable<boolean> {
        
    const url = `${this.baseUrl}/users/${userId}/token`;

    return this.http.get<any>(url).pipe(
      map(response => {
          const token = response?.token;
        if (token) {
          localStorage.setItem(this.tokenKey, token);
          const decoded = this.decodeToken(token);

          if (decoded) {
            if (this.isTokenExpired()) {
              this.clearSession();  
              return false;
            }

            localStorage.setItem(this.userInfoKey, JSON.stringify(decoded));
            this.currentUserSubject.next(decoded);
            return true;
          }
        }

        return false;
      }),
      catchError(error => {
        return of(false);
      })
    );
    }

    fetchAndStoreTokenOnce(userId: string): Observable<boolean> {
        if (!this.tokenRefreshed) {
            this.tokenRefreshed = this.fetchAndStoreToken(userId).pipe(
                shareReplay(1),
                finalize(() => this.tokenRefreshed = undefined)
            );
        }
        return this.tokenRefreshed;
    }

  public redirectToLogin(): void {
    window.location.href = environment.authFrontBaseUrl + "/logout";
  }

}
