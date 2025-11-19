import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { EducatorModel } from '../educator.interface';
import { EducatorService } from '../educator.service';
import { ChildrenService } from '../../children/children.service';
import { ChildModel } from '../../children/children.interface';
import { AuthService } from '../../../core/services/auth';
import { TitlePage, TitleAction, Breadcrumb } from '../../../shared/layouts/title-page/title-page';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-educator-detail',
  imports: [CommonModule, TitlePage, FormsModule],
  standalone: true,
  templateUrl: './educator-detail.html',
  styleUrl: './educator-detail.scss'
})
export class EducatorDetail implements OnInit {
  educator: EducatorModel | null = null;
  loading = false;
  educatorId: number = 0;
  showAddChildModal = false;
  availableChildren: ChildModel[] = [];
  assignedChildren: ChildModel[] = [];
  selectedChildId: number | null = null;

  breadcrumbs: Breadcrumb[] = [
    { label: 'Dashboard' },
    { label: 'Educators', url: '/educators' },
    { label: 'Educator Details' }
  ];

  titleActions: TitleAction[] = [];

  constructor(
    private educatorService: EducatorService,
    private childrenService: ChildrenService,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private http: HttpClient
  ) {}

  ngOnInit() {
    this.educatorId = Number(this.route.snapshot.paramMap.get('id'));
    this.setupTitleActions();
    this.loadEducator();
    this.loadAssignedChildren();
  }

  setupTitleActions() {
    this.titleActions = [
      {
        label: 'Back to Educators',
        class: 'btn-outline-secondary',
        icon: 'bi bi-arrow-left',
        action: () => this.goBack()
      }
    ];

    if (this.authService.isAdmin()) {
      this.titleActions.push({
        label: 'Edit Educator',
        class: 'btn-primary',
        icon: 'bi bi-pencil-square',
        action: () => this.router.navigate(['/educators/edit', this.educatorId])
      });
    }
  }

  loadEducator() {
    this.loading = true;
    this.educatorService.getEducator(this.educatorId).subscribe({
      next: (educator) => {
        this.educator = educator;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading educator:', error);
        this.loading = false;
        this.router.navigate(['/educators']);
      }
    });
  }

  loadAssignedChildren() {
    this.http.get<ChildModel[]>(`http://localhost:5001/api/teachers/${this.educatorId}/children`).subscribe({
      next: (children) => this.assignedChildren = children,
      error: (error) => console.error('Error loading assigned children:', error)
    });
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

  goBack() {
    this.router.navigate(['/educators']);
  }

  openAddChildModal() {
    this.showAddChildModal = true;
    this.loadAvailableChildren();
  }

  closeAddChildModal() {
    this.showAddChildModal = false;
    this.selectedChildId = null;
  }

  loadAvailableChildren() {
    this.childrenService.loadChildren().subscribe({
      next: (children) => {
        const assignedIds = this.assignedChildren.map(c => c.id);
        this.availableChildren = children.filter(c => !assignedIds.includes(c.id));
      },
      error: (error) => console.error('Error loading children:', error)
    });
  }

  assignChildToEducator() {
    if (!this.selectedChildId) return;

    this.http.post(`http://localhost:5001/api/teachers/${this.educatorId}/assign-child`, {
      childId: this.selectedChildId
    }).subscribe({
      next: () => {
        this.closeAddChildModal();
        this.loadAssignedChildren();
      },
      error: (error) => console.error('Error assigning child:', error)
    });
  }

  removeChild(childId: number) {
    if (!confirm('Remove this child from the educator?')) return;

    this.http.delete(`http://localhost:5001/api/teachers/${this.educatorId}/remove-child/${childId}`).subscribe({
      next: () => this.loadAssignedChildren(),
      error: (error) => console.error('Error removing child:', error)
    });
  }

  viewChildDetails(childId: number) {
    this.router.navigate(['/children/detail', childId]);
  }
}
