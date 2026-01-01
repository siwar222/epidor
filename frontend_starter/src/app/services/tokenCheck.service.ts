import { Injectable, OnDestroy } from '@angular/core';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class TokenCheckService implements OnDestroy {
  private intervalId: any;

  constructor(private authService: AuthService) {
    this.intervalId = setInterval(() => {
      this.authService.checkTokenValidity();
    }, 60000);
  }

  ngOnDestroy(): void {
    clearInterval(this.intervalId);
  }
}
