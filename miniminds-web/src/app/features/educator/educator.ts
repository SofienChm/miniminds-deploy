import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { EducatorModel } from './educator.interface';
import { EducatorService } from './educator.service';
import { TitlePage, TitleAction, Breadcrumb, DropdownItem } from '../../shared/layouts/title-page/title-page';
import { ExportUtil } from '../../shared/utils/export.util';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-educator',
  standalone: true,
  imports: [CommonModule, FormsModule, TitlePage],
  templateUrl: './educator.html',
  styleUrl: './educator.scss'
})
export class Educator implements OnInit {
  educators: EducatorModel[] = [];
  filteredEducators: EducatorModel[] = [];
  displayedEducators: EducatorModel[] = [];
  loading = false;
  viewMode: 'grid' | 'list' = 'grid';
  sortBy: string = 'recent-hired';
  showSortMenu = false;
  showExportDropdown = false;
  educatorsPerPage = 9;
  currentPage = 1;
  searchTerm: string = '';

  breadcrumbs: Breadcrumb[] = [
    { label: 'Dashboard' },
    { label: 'Educators' }
  ];

  titleActions: TitleAction[] = [
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
    },
    {
      label: 'Add Educator',
      class: 'btn btn-primary',
      action: () => this.router.navigate(['/educators/add'])
    }
  ];

  constructor(
    private educatorService: EducatorService,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadEducators();
    this.educatorService.educators$.subscribe(educators => {
      this.educators = educators;
      this.filteredEducators = educators;
    });
  }

  loadEducators() {
    this.loading = true;
    this.educatorService.loadEducators(this.searchTerm).subscribe({
      next: (educators) => {
        this.educators = educators;
        this.applySort();
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading educators:', error);
        this.loading = false;
        const errorMessage = error?.error?.message || 'Failed to load educators. Please check if the backend server is running.';
        Swal.fire('Error', errorMessage, 'error');
      }
    });
  }

  private searchTimeout: any;

  onSearch() {
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }
    this.searchTimeout = setTimeout(() => {
      this.loadEducators();
    }, 300);
  }

  editEducator(educator: EducatorModel) {
    this.router.navigate(['/educators/edit', educator.id]);
  }

  deleteEducator(id: number) {
    Swal.fire({
      title: 'Are you sure?',
      text: 'Do you want to delete this educator?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete it!'
    }).then((result) => {
      if (result.isConfirmed) {
        this.educatorService.deleteEducator(id).subscribe({
          next: () => {
            Swal.fire('Deleted!', 'Educator has been deleted.', 'success');
            this.loadEducators();
          },
          error: (error) => {
            const errorMessage = error?.error?.message || 'Failed to delete educator';
            Swal.fire('Error', errorMessage, 'error');
          }
        });
      }
    });
  }

  viewDetails(educator: EducatorModel) {
    this.router.navigate(['/educators/detail', educator.id]);
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
    let sorted = [...this.educators];
    
    switch (this.sortBy) {
      case 'name-asc':
        sorted.sort((a, b) => `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`));
        break;
      case 'name-desc':
        sorted.sort((a, b) => `${b.firstName} ${b.lastName}`.localeCompare(`${a.firstName} ${a.lastName}`));
        break;
      case 'recent-hired':
        sorted.sort((a, b) => new Date(b.hireDate).getTime() - new Date(a.hireDate).getTime());
        break;
    }
    
    this.filteredEducators = sorted;
    this.currentPage = 1;
    this.updateDisplayedEducators();
  }

  updateDisplayedEducators() {
    const endIndex = this.currentPage * this.educatorsPerPage;
    this.displayedEducators = this.filteredEducators.slice(0, endIndex);
  }

  loadMoreEducators() {
    this.currentPage++;
    this.updateDisplayedEducators();
  }

  hasMoreEducators(): boolean {
    return this.displayedEducators.length < this.filteredEducators.length;
  }

  getSortLabel(): string {
    switch (this.sortBy) {
      case 'name-asc': return 'Sort by A-Z';
      case 'name-desc': return 'Sort by Z-A';
      case 'recent-hired': return 'Recently Hired';
      default: return 'Sort by A-Z';
    }
  }

  toggleExportDropdown() {
    this.showExportDropdown = !this.showExportDropdown;
  }

  exportToPDF(): void {
    const data = this.filteredEducators.map(educator => ({
      'Name': `${educator.firstName} ${educator.lastName}`,
      'Email': educator.email,
      'Phone': educator.phone || 'N/A',
      'Specialization': educator.specialization || 'N/A',
      'Hire Date': new Date(educator.hireDate).toLocaleDateString(),
      'Status': educator.isActive ? 'Active' : 'Inactive'
    }));

    if (data.length === 0) {
      Swal.fire('Warning', 'No data to export', 'warning');
      return;
    }

    ExportUtil.exportToPDF(data, 'Educators Report');
  }

  exportToExcel(): void {
    const data = this.filteredEducators.map(educator => ({
      'Name': `${educator.firstName} ${educator.lastName}`,
      'Email': educator.email,
      'Phone': educator.phone || 'N/A',
      'Specialization': educator.specialization || 'N/A',
      'Hire Date': new Date(educator.hireDate).toLocaleDateString(),
      'Status': educator.isActive ? 'Active' : 'Inactive'
    }));

    if (data.length === 0) {
      Swal.fire('Warning', 'No data to export', 'warning');
      return;
    }

    ExportUtil.exportToExcel(data, 'Educators Report');
  }
}
