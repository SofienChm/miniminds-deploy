import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { ChildModel } from '../children.interface';
import { ChildrenService } from '../children.service';
import { ParentService } from '../../parent/parent.service';
import { ParentModel } from '../../parent/parent.interface';
import { AuthService } from '../../../core/services/auth';
import { TitlePage, TitleAction, Breadcrumb } from '../../../shared/layouts/title-page/title-page';
import { HttpClient } from '@angular/common/http';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-child-detail',
  imports: [CommonModule, TitlePage, FormsModule],
  standalone: true,
  templateUrl: './child-detail.html',
  styleUrl: './child-detail.scss'
})
export class ChildDetail implements OnInit {
  child: ChildModel | null = null;
  loading = false;
  childId: number = 0;
  showAddParentModal = false;
  availableParents: ParentModel[] = [];
  selectedParentId: number | null = null;
  relationshipType: string = 'Parent';
  isPrimaryContact: boolean = false;

  breadcrumbs: Breadcrumb[] = [
    { label: 'Dashboard' },
    { label: 'Children', url: '/children' },
    { label: 'Child Details' }
  ];
  get isParent(): boolean {
      return this.authService.isParent();
  }

  get isActive(): boolean {
    return this.child?.isActive ?? true;
  }

  titleActions: TitleAction[] = [];

  constructor(
    private childrenService: ChildrenService,
    private parentService: ParentService,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private http: HttpClient
  ) {}

  ngOnInit() {
    this.childId = Number(this.route.snapshot.paramMap.get('id'));
    this.setupTitleActions();
    this.loadChild();
  }

  setupTitleActions() {
    this.titleActions = [
      {
        label: 'Back to Children',
        class: 'btn-outline-secondary btn-cancel-global',
        icon: 'bi bi-arrow-left',
        action: () => this.goBack()
      }
    ];

    if (this.authService.isAdmin() || this.authService.isTeacher()) {
      this.titleActions.push({
        label: 'Edit Child',
        class: 'btn-primary',
        icon: 'bi bi-pencil-square',
        action: () => this.router.navigate(['/children/edit', this.childId])
      });
    }
  }

  loadChild() {
    this.loading = true;
    this.childrenService.getChild(this.childId).subscribe({
      next: (child) => {
        this.child = child;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading child:', error);
        this.loading = false;
        this.router.navigate(['/children']);
      }
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
    this.router.navigate(['/children']);
  }

  openAddParentModal() {
    this.showAddParentModal = true;
    this.loadAvailableParents();
  }

  closeAddParentModal() {
    this.showAddParentModal = false;
    this.selectedParentId = null;
    this.relationshipType = 'Parent';
    this.isPrimaryContact = false;
  }

  loadAvailableParents() {
    this.parentService.loadParents().subscribe({
      next: (parents) => {
        const existingParentIds = this.child?.childParents?.map(cp => cp.parentId) || [];
        this.availableParents = parents.filter(p => !existingParentIds.includes(p.id!));
      },
      error: (error) => console.error('Error loading parents:', error)
    });
  }

  addParentToChild() {
    if (!this.selectedParentId || !this.child?.id) return;

    const payload = {
      childId: this.child.id,
      parentId: this.selectedParentId,
      relationshipType: this.relationshipType,
      isPrimaryContact: this.isPrimaryContact
    };

    this.http.post('http://localhost:5001/api/children/add-parent', payload).subscribe({
      next: () => {
        this.closeAddParentModal();
        this.loadChild();
        Swal.fire({
          icon: 'success',
          title: 'Success!',
          text: 'Parent added successfully',
          timer: 2000,
          showConfirmButton: false
        });
      },
      error: (error) => {
        console.error('Error adding parent:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error!',
          text: 'Failed to add parent'
        });
      }
    });
  }

  removeParent(childParentId: number) {
    Swal.fire({
      title: 'Are you sure?',
      text: 'Remove this parent from the child?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, remove it!',
      cancelButtonText: 'Cancel'
    }).then((result) => {
      if (result.isConfirmed) {
        this.http.delete(`http://localhost:5001/api/children/remove-parent/${childParentId}`).subscribe({
          next: () => {
            this.loadChild();
            Swal.fire({
              icon: 'success',
              title: 'Removed!',
              text: 'Parent has been removed successfully',
              timer: 2000,
              showConfirmButton: false
            });
          },
          error: (error) => {
            console.error('Error removing parent:', error);
            Swal.fire({
              icon: 'error',
              title: 'Error!',
              text: 'Failed to remove parent'
            });
          }
        });
      }
    });
  }

  viewParentDetails(parentId: number) {
    this.router.navigate(['/parents/detail', parentId]);
  }

  openAddFeeModal() {
    this.router.navigate(['/fees/create'], { queryParams: { childId: this.childId } });
  }

  navigateToParentDetail() {
    if (this.child?.parent?.id) {
      this.router.navigate(['/parents/detail', this.child.parent.id]);
    }
  }

  editChild() {
    this.router.navigate(['/children/edit', this.childId]);
  }
}