import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ParentService } from '../parent.service';
import { ParentModel } from '../parent.interface';
import { FeeService } from '../../fee/fee.service';
import { CreateFeeModel } from '../../fee/fee.interface';
import { TitlePage, TitleAction } from '../../../shared/layouts/title-page/title-page';
import { ChildrenService } from '../../children/children.service';
import { ChildModel } from '../../children/children.interface';
import Swal from 'sweetalert2';
import { AuthService } from '../../../core/services/auth';
import { Location } from '@angular/common';
import { ParentChildHeaderComponent } from '../../../shared/components/parent-child-header/parent-child-header.component';

@Component({
  selector: 'app-parent-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, TitlePage, ParentChildHeaderComponent],
  templateUrl: './parent-detail.html',
  styleUrls: ['./parent-detail.scss']
})
export class ParentDetail implements OnInit {
  parent: ParentModel | null = null;
  loading = true;
  error: string | null = null;
  currentUserProfilePicture: string = '';
  showAddFee = false;
  showAddChildModal = false;
  showSelectChildModal = false;
  availableChildren: ChildModel[] = [];
  filteredChildren: ChildModel[] = [];
  searchTerm = '';
  selectedChildId: number | null = null;
  savingFee = false;
  linkingChild = false;
  isAdmin = true; // TODO: Get from auth service
   get isParent(): boolean {
      return this.authService.isParent();
  }
  newFee: CreateFeeModel = {
    childId: 0,
    amount: 0,
    description: '',
    dueDate: '',
    feeType: 'monthly'
  };

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private parentService: ParentService,
    private feeService: FeeService,
    private childrenService: ChildrenService,
    private authService: AuthService,
    private location: Location

  ) {}

  ngOnInit(): void {
    const user = this.authService.getCurrentUser();
    this.currentUserProfilePicture = user?.profilePicture || '';
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadParentDetails(+id);
    }
  }

  loadParentDetails(id: number): void {
    this.loading = true;
    this.parentService.getParentWithChildren(id).subscribe({
      next: (parent) => {
        this.parent = parent;
        if (this.isParent && this.currentUserProfilePicture) {
          this.parent.profilePicture = this.currentUserProfilePicture;
        }
        
        // Calculate age for each child
        if (this.parent?.children) {
          this.parent.children = this.parent.children.map(child => ({
            ...child,
            age: this.calculateAge(child.dateOfBirth)
          }));
        }
        
        this.loading = false;
      },
      error: (error) => {
        this.error = 'Failed to load parent details';
        this.loading = false;
        console.error('Error loading parent:', error);
      }
    });
  }

  calculateAge(dateOfBirth: string): number {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  }

  formatDate(dateString?: string): string {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  }

  goBack(): void {
    this.router.navigate(['/parents']);
  }

  editParent(): void {
    if (this.parent?.id) {
      if (this.isParent) {
        this.router.navigate(['/profile/edit']);
      } else {
        this.router.navigate(['/parents/edit', this.parent.id]);
      }
    }
  }

  viewChildDetails(childId: number): void {
    this.router.navigate(['/children/detail', childId]);
  }
  addChild(): void {
    Swal.fire({
      title: 'Add Child',
      text: 'Choose an option',
      icon: 'question',
      showCancelButton: true,
      showDenyButton: true,
      confirmButtonText: '<i class="bi bi-plus-square"></i> Create New Child',
      denyButtonText: '<i class="bi bi-list-ul"></i> Select Existing Child',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#3085d6',
      denyButtonColor: '#6c757d',
      cancelButtonColor: '#d33',
      customClass: {
        confirmButton: 'btn btn-primary me-2',
        denyButton: 'btn btn-secondary me-2',
        cancelButton: 'btn btn-outline-secondary'
      },
      buttonsStyling: false
    }).then((result) => {
      if (result.isConfirmed) {
        this.createNewChild();
      } else if (result.isDenied) {
        this.selectExistingChild();
      }
    });
  }

  selectExistingChild(): void {
    this.loadAvailableChildren();
    this.showSelectChildModal = true;
  }

  loadAvailableChildren(): void {
    this.childrenService.loadChildren().subscribe({
      next: (children) => {
        const currentChildIds = this.parent?.children?.map(c => c.id).filter(id => id !== undefined) || [];
        this.availableChildren = children.filter(c => c.id && !currentChildIds.includes(c.id));
        this.filteredChildren = [...this.availableChildren];
      },
      error: () => {
        Swal.fire('Error', 'Failed to load children', 'error');
      }
    });
  }

  filterChildren(): void {
    const term = this.searchTerm.toLowerCase();
    this.filteredChildren = this.availableChildren.filter(child =>
      `${child.firstName} ${child.lastName}`.toLowerCase().includes(term)
    );
  }

  linkChildToParent(childId: number): void {
    if (!this.parent?.id) return;
    this.linkingChild = true;
    
    this.childrenService.getChild(childId).subscribe({
      next: (child) => {
        const updatedChild = { ...child, parentId: this.parent!.id! };
        this.childrenService.updateChild(updatedChild).subscribe({
          next: () => {
            this.linkingChild = false;
            this.showSelectChildModal = false;
            this.loadParentDetails(this.parent!.id!);
            Swal.fire('Success', 'Child linked successfully!', 'success');
          },
          error: () => {
            this.linkingChild = false;
            Swal.fire('Error', 'Failed to link child', 'error');
          }
        });
      },
      error: () => {
        this.linkingChild = false;
        Swal.fire('Error', 'Failed to load child details', 'error');
      }
    });
  }

  closeSelectChildModal(): void {
    this.showSelectChildModal = false;
    this.searchTerm = '';
  }

  createNewChild(): void {
    this.showAddChildModal = false;
    this.router.navigate(['/children/add'], { queryParams: { parentId: this.parent?.id } });
  }

  addFeeForChild(childId: number, childName: string): void {
    this.selectedChildId = childId;
    this.newFee = {
      childId: childId,
      amount: 0,
      description: `Monthly fee for ${childName}`,
      dueDate: this.getNextMonthDate(),
      feeType: 'monthly'
    };
    this.showAddFee = true;
  }

  saveFee(): void {
    this.savingFee = true;
    this.feeService.createFee(this.newFee).subscribe({
      next: () => {
        this.savingFee = false;
        this.showAddFee = false;
        Swal.fire('Success', 'Fee added successfully!', 'success');
      },
      error: () => {
        this.savingFee = false;
        Swal.fire('Error', 'Failed to add fee. Please try again.', 'error');
      }
    });
  }

  cancelAddFee(): void {
    this.showAddFee = false;
    this.selectedChildId = null;
  }
  back() {
    this.location.back();
  }

  logout(): void {
    this.authService.logout();
  }
  removeChildFromParent(childId: number, childName: string): void {
    if (!this.parent?.id) return;
    
    Swal.fire({
      title: 'Are you sure?',
      text: `Do you want to remove ${childName} from this parent?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Yes, remove!',
      cancelButtonText: 'Cancel'
    }).then((result) => {
      if (result.isConfirmed) {
        this.childrenService.deleteChild(childId).subscribe({
          next: () => {
            this.loadParentDetails(this.parent!.id!);
            Swal.fire('Removed!', 'Child has been removed.', 'success');
          },
          error: () => {
            Swal.fire('Error', 'Failed to remove child', 'error');
          }
        });
      }
    });
  }

  toggleParentStatus(): void {
    if (!this.parent) return;
    
    const action = this.parent.isActive ? 'deactivate' : 'activate';
    
    Swal.fire({
      title: 'Are you sure?',
      text: `Do you want to ${action} this parent?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: `Yes, ${action}!`
    }).then((result) => {
      if (result.isConfirmed) {
        const request = this.parent!.isActive 
          ? this.parentService.deactivateParent(this.parent!.id!) 
          : this.parentService.activateParent(this.parent!.id!);
        
        request.subscribe({
          next: () => {
            if (this.parent) {
              this.parent.isActive = !this.parent.isActive;
              this.updateChildrenStatus(this.parent.isActive);
            }
            Swal.fire('Success', `Parent ${action}d successfully!`, 'success');
          },
          error: () => {
            Swal.fire('Error', `Failed to ${action} parent`, 'error');
          }
        });
      }
    });
  }

  private getNextMonthDate(): string {
    const date = new Date();
    date.setMonth(date.getMonth() + 1);
    return date.toISOString().split('T')[0];
  }

  private updateChildrenStatus(isActive: boolean): void {
    if (!this.parent?.children) return;
    
    this.parent.children.forEach(child => {
      if (child.id) {
        const updatedChild = { ...child, isActive, parentId: this.parent!.id! };
        this.childrenService.updateChild(updatedChild).subscribe({
          next: () => {
            child.isActive = isActive;
          },
          error: (error) => {
            console.error(`Failed to update child ${child.firstName} status:`, error);
          }
        });
      }
    });
  }

  getActions(): TitleAction[] {
    const actions: TitleAction[] = [
      {
        label: 'Back',
        icon: 'bi bi-arrow-left',
        class: 'btn-outline-secondary',
        action: () => this.goBack()
      }
    ];

    if (this.parent) {
      actions.push({
        label: 'Edit',
        icon: 'bi bi-pencil-square me-2',
        class: 'btn-primary',
        action: () => this.editParent()
      });

      if (this.isAdmin) {
        actions.push({
          label: this.parent.isActive ? 'Deactivate' : 'Activate',
          icon: this.parent.isActive ? 'bi bi-pause-circle' : 'bi bi-play',
          class: this.parent.isActive ? 'btn-warning' : 'btn-success',
          action: () => this.toggleParentStatus()
        });
      }
    }

    return actions;
  }
}