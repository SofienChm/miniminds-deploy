import { Component, OnInit, OnDestroy } from '@angular/core';
import { AuthService } from '../../../core/services/auth';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { PrefixPipe } from '../../../core/services/prefix/prefix.pipe';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-sidebar',
  imports: [CommonModule, RouterModule, PrefixPipe],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.scss'
})
export class Sidebar implements OnInit, OnDestroy {
  menuItemsMain: any[] = [];
  menuItemsPrincipal: any[] = [];
  menuItemsChild: any[] = [];
  menuItemsPeople: any[] = [];
  menuItemsIa: any[] = [];
  menuItemsSetting: any[] = [];
  userRole: string | null = null;
  private userSubscription?: Subscription;

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    this.userRole = this.authService.getUserRole();
    this.setupMenuItems();
  }

  ngOnDestroy(): void {
    if (this.userSubscription) {
      this.userSubscription.unsubscribe();
    }
  }

  private setupMenuItems(): void {
    
    // Main items - available to all roles
    this.menuItemsMain = [
      { path: '/dashboard', icon: 'bi-speedometer2', label: 'Dashboard' },
      { path: '/messages', icon: 'bi-envelope', label: 'Messages' },
      { path: '/reclamations', icon: 'bi-exclamation-circle', label: 'Reclamations' },
      { path: '/calendar', icon: 'bi-calendar', label: 'Calendar' }
    ];

    // Principal items - available to all roles
    this.menuItemsPrincipal = [
      { path: '/holidays', icon: 'bi-calendar-heart', label: 'Holidays' },
      { path: '/leaves', icon: 'bi-person-raised-hand', label: 'Leaves' },
      { path: '/fees', icon: 'bi-currency-dollar', label: 'Fees' },
      { path: '/events', icon: 'bi-calendar-event', label: 'Events' }
    ];

    // Child items - available to all roles
    this.menuItemsChild = [
      { path: '/attendance', icon: 'bi-calendar-check', label: 'Attendance' },
      { path: '/activities', icon: 'bi-activity', label: 'Daily Report' },
      { path: '/classes', icon: 'bi-book', label: 'Classes' },
      { path: '/learning-games', icon: 'bi-controller', label: 'Learning Games' }
    ];

    // People items - role-based
    this.menuItemsPeople = [
      { path: '/children', icon: 'bi-person-hearts', label: 'children', usePrefix: true }
    ];

    // Add role-specific menu items
    if (this.authService.isAdmin()) {
      this.menuItemsPeople.unshift(
        { path: '/parents', icon: 'bi-people', label: 'Parents' },
        { path: '/educators', icon: 'bi-person-workspace', label: 'Educators' }
      );
    } else if (this.authService.isTeacher()) {
      this.menuItemsPeople.unshift(
        { path: '/parents', icon: 'bi-people', label: 'Parents' }
      );
    }

    // IA items - available to admin users
    if (this.authService.isAdmin()) {
      this.menuItemsIa = [
        { path: '/basic-ai', icon: 'bi-search', label: 'Basic AI' },
        { path: '/ai-assistant', icon: 'bi-robot', label: 'OpenAI Assistant' }
      ];
    }

    // Setting items - available to all roles
    this.menuItemsSetting = [
      { path: '/settings', icon: 'bi-gear', label: 'Settings' }
    ];
  }

  isAdmin(): boolean {
    return this.authService.isAdmin();
  }

  isParent(): boolean {
    return this.authService.isParent();
  }

  isTeacher(): boolean {
    return this.authService.isTeacher();
  }
}