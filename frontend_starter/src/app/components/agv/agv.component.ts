import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { RouterModule } from '@angular/router';
import { Role } from '../../services/role.enum';

@Component({
  selector: 'app-agv',
  standalone: true,
  templateUrl: './agv.component.html',
  styleUrl: './agv.component.css',
  imports: [RouterModule, CommonModule]
})
export class AgvComponent {

  userId: string | null = null;
  userRole: string | null = null;

  constructor(private authService: AuthService, private router: Router) { }

  ngOnInit(): void {
    this.userId = this.authService.getUserId();
    this.userRole = this.authService.getUserRole();
  }

  isAdmin(): boolean {
    return this.userRole === Role.administrator;
  }

  isSuperAdmin(): boolean {
    return this.userRole === Role.super_administrator;
  }
}
