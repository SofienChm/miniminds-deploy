import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth';
import { AuthResponse } from '../../core/interfaces/dto/auth-response-dto';

@Component({
  selector: 'app-profile-menu',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './profile-menu.component.html',
  styleUrl: './profile-menu.component.scss'
})
export class ProfileMenuComponent implements OnInit {
  currentUser: AuthResponse | null = null;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    if (!this.authService.isParent()) {
      this.router.navigate(['/dashboard']);
      return;
    }
    this.currentUser = this.authService.getCurrentUser();
  }

  navigateTo(route: string): void {
    this.router.navigate([route]);
  }

  goBack(): void {
    window.history.back();
  }

  logout(): void {
    this.authService.logout();
  }
}