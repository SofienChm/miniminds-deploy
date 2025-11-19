import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ParentModel } from './parent.interface';
import { ParentService } from './parent.service';
import { TitlePage, TitleAction, Breadcrumb, DropdownItem } from '../../shared/layouts/title-page/title-page';

@Component({
  selector: 'app-parent',
  standalone: true,
  imports: [CommonModule, FormsModule, TitlePage],
  templateUrl: './parent.html',
  styleUrl: './parent.scss'
})
export class Parent implements OnInit {
  parents: ParentModel[] = [];
  filteredParents: ParentModel[] = [];
  displayedParents: ParentModel[] = [];
  loading = false;
  itemsPerPage = 9;
  currentPage = 1;
  showExportDropdown = false;
  viewMode: 'grid' | 'list' = 'grid';
  sortBy: string = 'recent-added';
  showSortMenu = false;
  isAdmin = true; // TODO: Get from auth service
  searchTerm: string = '';
  breadcrumbs: Breadcrumb[] = [
    { label: 'Dashboard' },
    { label: 'Parents' }
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
      label: 'Add Parent',
      class: 'btn btn-primary',
      action: () => this.router.navigate(['/parents/add'])
    }
  ];



  constructor(
    private parentService: ParentService,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadParents();
    this.parentService.parents$.subscribe(parents => {
      this.parents = parents;
      this.applySort();
    });
  }

  loadParents() {
    this.loading = true;
    this.parentService.loadParents(this.searchTerm).subscribe({
      next: (parents) => {
        this.parents = parents;
        this.applySort();
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading parents');
        this.loading = false;
      }
    });
  }

  private searchTimeout: any;

  onSearch() {
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }
    this.searchTimeout = setTimeout(() => {
      this.loadParents();
    }, 300);
  }



  editParent(parent: ParentModel) {
    this.router.navigate(['/parents/edit', parent.id]);
  }



  deleteParent(id: number) {
    if (window.confirm('Are you sure you want to delete this parent?')) {
      this.parentService.deleteParent(id).subscribe({
        next: () => {
          this.loadParents();
        },
        error: () => {
          console.error('Error deleting parent');
        }
      });
    }
  }

  async toggleParentStatus(parent: ParentModel) {
    if (!parent.isActive) {
      // Activating parent - simple confirmation
      const { default: Swal } = await import('sweetalert2');
      const result = await Swal.fire({
        title: 'Activate Parent',
        text: `Are you sure you want to activate ${parent.firstName} ${parent.lastName}?`,
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#28a745',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Yes, activate'
      });
      
      if (result.isConfirmed) {
        this.parentService.toggleParentStatus(parent.id!, false).subscribe({
          next: () => this.loadParents(),
          error: () => console.error('Error activating parent')
        });
      }
    } else {
      // Deactivating parent - ask about children
      const { default: Swal } = await import('sweetalert2');
      const hasChildren = parent.children && parent.children.length > 0;
      
      if (hasChildren) {
        const result = await Swal.fire({
          title: 'Deactivate Parent',
          text: `${parent.firstName} ${parent.lastName} has ${parent.children!.length} child(ren). What would you like to do?`,
          icon: 'warning',
          showCancelButton: true,
          showDenyButton: true,
          confirmButtonColor: '#dc3545',
          denyButtonColor: '#ffc107',
          cancelButtonColor: '#6c757d',
          confirmButtonText: 'Deactivate parent and children',
          denyButtonText: 'Deactivate parent only',
          cancelButtonText: 'Cancel'
        });
        
        if (result.isConfirmed) {
          // Deactivate parent and children
          this.parentService.toggleParentStatus(parent.id!, true).subscribe({
            next: () => this.loadParents(),
            error: () => console.error('Error deactivating parent and children')
          });
        } else if (result.isDenied) {
          // Deactivate parent only
          this.parentService.toggleParentStatus(parent.id!, false).subscribe({
            next: () => this.loadParents(),
            error: () => console.error('Error deactivating parent')
          });
        }
      } else {
        // No children - simple deactivation
        const result = await Swal.fire({
          title: 'Deactivate Parent',
          text: `Are you sure you want to deactivate ${parent.firstName} ${parent.lastName}?`,
          icon: 'warning',
          showCancelButton: true,
          confirmButtonColor: '#dc3545',
          cancelButtonColor: '#6c757d',
          confirmButtonText: 'Yes, deactivate'
        });
        
        if (result.isConfirmed) {
          this.parentService.toggleParentStatus(parent.id!, false).subscribe({
            next: () => this.loadParents(),
            error: () => console.error('Error deactivating parent')
          });
        }
      }
    }
  }

  viewDetails(parent: ParentModel) {
    this.router.navigate(['/parents/detail', parent.id]);
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
    let sorted = [...this.parents];
    
    switch (this.sortBy) {
      case 'name-asc':
        sorted.sort((a, b) => `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`));
        break;
      case 'name-desc':
        sorted.sort((a, b) => `${b.firstName} ${b.lastName}`.localeCompare(`${a.firstName} ${a.lastName}`));
        break;
      case 'recent-added':
        sorted.sort((a, b) => new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime());
        break;
      case 'email-asc':
        sorted.sort((a, b) => a.email.localeCompare(b.email));
        break;
    }
    
    this.filteredParents = sorted;
    this.currentPage = 1;
    this.updateDisplayedParents();
  }

  updateDisplayedParents() {
    const endIndex = this.currentPage * this.itemsPerPage;
    this.displayedParents = this.filteredParents.slice(0, endIndex);
  }

  loadMore() {
    this.currentPage++;
    this.updateDisplayedParents();
  }

  get hasMoreItems(): boolean {
    return this.displayedParents.length < this.filteredParents.length;
  }

  getSortLabel(): string {
    switch (this.sortBy) {
      case 'name-asc': return 'Sort by A-Z';
      case 'name-desc': return 'Sort by Z-A';
      case 'recent-added': return 'Recently Added';
      case 'email-asc': return 'Sort by Email';
      default: return 'Sort by A-Z';
    }
  }

  toggleExportDropdown() {
    this.showExportDropdown = !this.showExportDropdown;
  }

  exportToPDF(): void {
    const data = this.filteredParents.map(parent => ({
      'Name': `${parent.firstName} ${parent.lastName}`,
      'Email': parent.email,
      'Phone': parent.phoneNumber,
      'Address': parent.address || 'N/A',
      'Emergency Contact': parent.emergencyContact || 'N/A'
    }));

    this.generatePDF(data, 'Parents Report');
  }


  exportToExcel(): void {
    const data = this.filteredParents.map(parent => ({
      'Name': `${parent.firstName} ${parent.lastName}`,
      'Email': parent.email,
      'Phone': parent.phoneNumber,
      'Address': parent.address || 'N/A',
      'Emergency Contact': parent.emergencyContact || 'N/A'
    }));

    this.generateExcel(data, 'Parents Report');
  }

    private generatePDF(data: any[], title: string): void {
    if (data.length === 0) {
      alert('No data to export');
      return;
    }

    const headers = Object.keys(data[0]);
    
    // Create HTML table for PDF
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

    // Create and download PDF as data URL
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