import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ChildModel } from './children.interface';
import { ChildrenService } from './children.service';
import { AuthService } from '../../core/services/auth';
import { TitlePage, TitleAction, Breadcrumb, DropdownItem } from '../../shared/layouts/title-page/title-page';
import { ExportUtil } from '../../shared/utils/export.util';

@Component({
  selector: 'app-children',
  standalone: true,
  imports: [CommonModule, FormsModule, TitlePage],
  templateUrl: './children.html',
  styleUrl: './children.scss'
})
export class Children implements OnInit {
  children: ChildModel[] = [];
  filteredChildren: ChildModel[] = [];
  displayedChildren: ChildModel[] = [];
  loading = false;
  userRole: string | null = null;
  viewMode: 'grid' | 'list' = 'grid';
  sortBy: string = 'recent-added';
  showSortMenu = false;
  showExportDropdown = false;
  searchTerm: string = '';
  childrenPerPage = 9;
  currentPage = 1;
  isParent(): boolean {
      return this.authService.isParent();
  }
  breadcrumbs: Breadcrumb[] = [
    { label: 'Dashboard' },
    { label: 'Children' }
  ];

  titleActions: TitleAction[] = [];

  constructor(
    private childrenService: ChildrenService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    this.userRole = this.authService.getUserRole();
    this.setupTitleActions();
    this.loadChildren();
    this.childrenService.children$.subscribe(children => {
      this.children = children;
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

    // Only Admin and Teachers can add children
    if (this.authService.isAdmin() || this.authService.isTeacher()) {
      this.titleActions.push({
        label: 'Add Child',
        class: 'btn btn-primary',
        action: () => this.router.navigate(['/children/add'])
      });
    }
  }

  loadChildren() {
    this.loading = true;
    this.childrenService.loadChildren().subscribe({
      next: (children) => {
        this.children = children;
        this.applySort();
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading children:', error);
        this.loading = false;
      }
    });
  }

  editChild(child: ChildModel) {
    this.router.navigate(['/children/edit', child.id]);
  }

  deleteChild(id: number) {
    if (confirm('Are you sure you want to delete this child?')) {
      this.childrenService.deleteChild(id).subscribe({
        next: () => {
          this.loadChildren();
        },
        error: (error) => {
          console.error('Error deleting child:', error);
        }
      });
    }
  }

  viewDetails(child: ChildModel) {
    this.router.navigate(['/children/detail', child.id]);
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
    let sorted = [...this.children];
    
    // Apply search filter
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      sorted = sorted.filter(child => 
        `${child.firstName} ${child.lastName}`.toLowerCase().includes(term) ||
        child.gender?.toLowerCase().includes(term) ||
        (child.parent && `${child.parent.firstName} ${child.parent.lastName}`.toLowerCase().includes(term))
      );
    }
    
    // Apply sorting
    switch (this.sortBy) {
      case 'name-asc':
        sorted.sort((a, b) => `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`));
        break;
      case 'name-desc':
        sorted.sort((a, b) => `${b.firstName} ${b.lastName}`.localeCompare(`${a.firstName} ${a.lastName}`));
        break;
      case 'recent-added':
        sorted.sort((a, b) => new Date(b.enrollmentDate || '').getTime() - new Date(a.enrollmentDate || '').getTime());
        break;
      case 'age-asc':
        sorted.sort((a, b) => this.getAge(a.dateOfBirth) - this.getAge(b.dateOfBirth));
        break;
    }
    
    this.filteredChildren = sorted;
    this.currentPage = 1;
    this.updateDisplayedChildren();
  }

  updateDisplayedChildren() {
    const endIndex = this.currentPage * this.childrenPerPage;
    this.displayedChildren = this.filteredChildren.slice(0, endIndex);
  }

  loadMoreChildren() {
    this.currentPage++;
    this.updateDisplayedChildren();
  }

  hasMoreChildren(): boolean {
    return this.displayedChildren.length < this.filteredChildren.length;
  }

  onSearchChange() {
    this.applySort();
  }

  getSortLabel(): string {
    switch (this.sortBy) {
      case 'name-asc': return 'Sort by A-Z';
      case 'name-desc': return 'Sort by Z-A';
      case 'recent-added': return 'Recently Added';
      case 'age-asc': return 'Sort by Age';
      default: return 'Sort by A-Z';
    }
  }

  getAge(dateOfBirth: string): number {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  }

  toggleExportDropdown() {
    this.showExportDropdown = !this.showExportDropdown;
  }

  exportToPDF(): void {
    const data = this.filteredChildren.map(child => ({
      'Name': `${child.firstName} ${child.lastName}`,
      'Age': this.getAge(child.dateOfBirth),
      'Gender': child.gender,
      'Parent': child.parent ? `${child.parent.firstName} ${child.parent.lastName}` : 'N/A',
      'Enrollment Date': child.enrollmentDate ? new Date(child.enrollmentDate).toLocaleDateString() : 'N/A',
      'Allergies': child.allergies || 'None'
    }));

    ExportUtil.exportToPDF(data, 'Children Report');
  }

  exportToExcel(): void {
    const data = this.filteredChildren.map(child => ({
      'Name': `${child.firstName} ${child.lastName}`,
      'Age': this.getAge(child.dateOfBirth),
      'Gender': child.gender,
      'Parent': child.parent ? `${child.parent.firstName} ${child.parent.lastName}` : 'N/A',
      'Enrollment Date': child.enrollmentDate ? new Date(child.enrollmentDate).toLocaleDateString() : 'N/A',
      'Allergies': child.allergies || 'None'
    }));

    ExportUtil.exportToExcel(data, 'Children Report');
  }

  toggleChildStatus(id: number) {
    this.childrenService.toggleChildStatus(id).subscribe({
      next: () => {
        this.loadChildren();
      },
      error: (error) => {
        console.error('Error toggling child status:', error);
      }
    });
  }
}
