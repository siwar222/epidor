import { Component, OnInit, HostListener, ElementRef } from '@angular/core';
import { Router, NavigationEnd, RouterModule } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { environment } from '../../../../environments/environment';
import { CommonModule } from '@angular/common';
import { filter } from 'rxjs/operators';


@Component({
  selector: 'app-content-top',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './content-top.component.html',
  styleUrl: './content-top.component.css'
})
export class ContentTopComponent implements OnInit {
  title = "Application Gestion Budget";
  logoLink = "";
  userName: string | null = null;
  isMenuOpen = false;

  menuItems = [
    { label: 'Accueil', path: '/', icon: 'bi-house' },
    { label: 'Gestion Sessions', path: '/agb/session', icon: 'bi-calendar2-check' },
  ];

  constructor(
    private authService: AuthService,
    private router: Router,
    private el: ElementRef) {
    this.userName = this.authService.getUserName();
  }

  authAppUrl = `${environment.authFrontBaseUrl}`;

  ngOnInit(): void {
    this.updateLogoLink(this.router.url);

    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: NavigationEnd) => {
      const currentUrl = event.urlAfterRedirects.split('?')[0];
      this.updateLogoLink(currentUrl);
    });
  }

  private updateLogoLink(currentUrl: string) {
    if (currentUrl.startsWith('/agb/')) {
      this.logoLink = '';
    } else {
      this.logoLink = this.authAppUrl;
    }
  }

  get menuRoutes(): string[] {
    return this.menuItems.map(item => item.path);
  }

  logout() {
    this.authService.clearSession();
  }

  toggleMenu() {
    this.isMenuOpen = !this.isMenuOpen;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event) {
    const clickedInside = this.el.nativeElement.contains(event.target);
    if (!clickedInside) {
      this.isMenuOpen = false;
    }
  }
}
