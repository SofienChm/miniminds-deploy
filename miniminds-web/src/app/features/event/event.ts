import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { EventModel } from './event.interface';
import { EventService } from './event.service';
import { AuthService } from '../../core/services/auth';
import { TitlePage, TitleAction, Breadcrumb, DropdownItem } from '../../shared/layouts/title-page/title-page';
import { ParentChildHeaderSimpleComponent } from '../../shared/components/parent-child-header-simple/parent-child-header-simple.component';

@Component({
  selector: 'app-event',
  standalone: true,
  imports: [CommonModule, TitlePage, ParentChildHeaderSimpleComponent],
  templateUrl: './event.html',
  styleUrl: './event.scss'
})
export class Event implements OnInit {
  events: EventModel[] = [];
  filteredEvents: EventModel[] = [];
  displayedEvents: EventModel[] = [];
  loading = false;
  userRole: string | null = null;
  viewMode: 'grid' | 'list' = 'grid';
  sortBy: string = 'created-desc';
  showSortMenu = false;
  showExportDropdown = false;
  eventsPerPage = 9;
  currentPage = 1;

  breadcrumbs: Breadcrumb[] = [
    { label: 'Dashboard' },
    { label: 'Events' }
  ];

  titleActions: TitleAction[] = [];

  get isParent(): boolean {
    return this.authService.isParent();
  }

  constructor(
    private eventService: EventService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    this.userRole = this.authService.getUserRole();
    this.setupTitleActions();
    this.loadEvents();
    this.eventService.events$.subscribe(events => {
      this.events = events;
    });
  }

  setupTitleActions() {
    this.titleActions = [
      {
        label: 'Export',
        class: 'btn btn-light me-2',
        action: () => {},
        dropdown: {
          items: [
            {
              label: 'Export as PDF',
              icon: 'bi bi-file-earmark-pdf',
              action: () => this.exportToPDF()
            },
            {
              label: 'Export as Excel',
              icon: 'bi bi-file-earmark-excel',
              action: () => this.exportToExcel()
            }
          ]
        }
      }
    ];

    if (this.authService.isAdmin() || this.authService.isTeacher()) {
      this.titleActions.push({
        label: 'Add Event',
        class: 'btn btn-primary',
        action: () => this.router.navigate(['/events/add'])
      });
    }
  }

  loadEvents() {
    this.loading = true;
    this.eventService.loadEvents().subscribe({
      next: (events) => {
        this.events = events;
        this.applySort();
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading events:', error);
        this.loading = false;
      }
    });
  }

  editEvent(event: EventModel) {
    this.router.navigate(['/events/edit', event.id]);
  }

  deleteEvent(id: number) {
    if (confirm('Are you sure you want to delete this event?')) {
      this.eventService.deleteEvent(id).subscribe({
        next: () => {
          this.loadEvents();
        },
        error: (error) => {
          console.error('Error deleting event:', error);
        }
      });
    }
  }

  canEdit(): boolean {
    return this.authService.isAdmin() || this.authService.isTeacher();
  }

  canDelete(): boolean {
    return this.authService.isAdmin();
  }

  setViewMode(mode: 'grid' | 'list') {
    this.viewMode = mode;
  }

  setSortBy(sortBy: string) {
    this.sortBy = sortBy;
    this.showSortMenu = false;
    this.applySort();
  }

  toggleSortMenu() {
    this.showSortMenu = !this.showSortMenu;
  }

  applySort() {
    let sorted = [...this.events];
    
    switch (this.sortBy) {
      case 'name-asc':
        sorted.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'name-desc':
        sorted.sort((a, b) => b.name.localeCompare(a.name));
        break;
      case 'price-asc':
        sorted.sort((a, b) => a.price - b.price);
        break;
      case 'price-desc':
        sorted.sort((a, b) => b.price - a.price);
        break;
      case 'created-desc':
        sorted.sort((a, b) => new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime());
        break;
      case 'created-asc':
        sorted.sort((a, b) => new Date(a.createdAt || '').getTime() - new Date(b.createdAt || '').getTime());
        break;
    }
    
    this.filteredEvents = sorted;
    this.currentPage = 1;
    this.updateDisplayedEvents();
  }

  updateDisplayedEvents() {
    const endIndex = this.currentPage * this.eventsPerPage;
    this.displayedEvents = this.filteredEvents.slice(0, endIndex);
  }

  loadMore() {
    this.currentPage++;
    this.updateDisplayedEvents();
  }

  hasMoreEvents(): boolean {
    return this.displayedEvents.length < this.filteredEvents.length;
  }

  getSortLabel(): string {
    switch (this.sortBy) {
      case 'name-asc': return 'Sort by A-Z';
      case 'name-desc': return 'Sort by Z-A';
      case 'price-asc': return 'Price: Low to High';
      case 'price-desc': return 'Price: High to Low';
      case 'created-desc': return 'Newest First';
      case 'created-asc': return 'Oldest First';
      default: return 'Newest First';
    }
  }

  viewParticipants(event: EventModel) {
    this.router.navigate(['/events', event.id, 'participants']);
  }

  viewEventDetail(event: EventModel) {
    this.router.navigate(['/events', event.id]);
  }

  isEventActive(event: EventModel): boolean {
    const eventDate = new Date(event.time);
    const now = new Date();
    return eventDate > now;
  }

  getEventStatus(event: EventModel): string {
    return this.isEventActive(event) ? 'Active' : 'Expired';
  }

  getEventStatusClass(event: EventModel): string {
    return this.isEventActive(event) ? 'bg-success' : 'bg-danger';
  }

  toggleExportDropdown() {
    this.showExportDropdown = !this.showExportDropdown;
  }

  exportToPDF(): void {
    const data = this.filteredEvents.map(event => ({
      'Name': event.name,
      'Type': event.type,
      'Price': `$${event.price}`,
      'Age Range': `${event.ageFrom}-${event.ageTo} years`,
      'Capacity': event.capacity,
      'Date & Time': new Date(event.time).toLocaleString(),
      'Status': this.getEventStatus(event),
      'Participants': event.participants?.length || 0
    }));

    this.generatePDF(data, 'Events Report');
  }

  exportToExcel(): void {
    const data = this.filteredEvents.map(event => ({
      'Name': event.name,
      'Type': event.type,
      'Price': `$${event.price}`,
      'Age Range': `${event.ageFrom}-${event.ageTo} years`,
      'Capacity': event.capacity,
      'Date & Time': new Date(event.time).toLocaleString(),
      'Status': this.getEventStatus(event),
      'Participants': event.participants?.length || 0
    }));

    this.generateExcel(data, 'Events Report');
  }

  private generatePDF(data: any[], title: string): void {
    if (data.length === 0) {
      alert('No data to export');
      return;
    }

    const headers = Object.keys(data[0]);
    
    let htmlContent = `
      <html>
        <head>
          <title>${title}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            h1 { color: #333; text-align: center; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; font-weight: bold; }
            tr:nth-child(even) { background-color: #f9f9f9; }
          </style>
        </head>
        <body>
          <h1>${title}</h1>
          <p>Generated on: ${new Date().toLocaleDateString()}</p>
          <table>
            <thead>
              <tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr>
            </thead>
            <tbody>
    `;
    
    data.forEach(row => {
      htmlContent += '<tr>';
      headers.forEach(header => {
        htmlContent += `<td>${row[header]}</td>`;
      });
      htmlContent += '</tr>';
    });
    
    htmlContent += `
            </tbody>
          </table>
        </body>
      </html>
    `;

    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${title.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.html`;
    link.click();
    window.URL.revokeObjectURL(url);
  }

  private generateExcel(data: any[], title: string): void {
    const headers = Object.keys(data[0] || {});
    let csvContent = headers.join(',') + '\n';
    
    data.forEach(row => {
      const values = headers.map(header => {
        const value = row[header];
        return typeof value === 'string' && value.includes(',') ? `"${value}"` : value;
      });
      csvContent += values.join(',') + '\n';
    });

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${title.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
  }
}
