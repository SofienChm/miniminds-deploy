import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ParentService } from '../parent.service';
import { ChildrenService } from '../../children/children.service';
import { ParentModel, ChildInfo } from '../parent.interface';
import { ChildModel } from '../../children/children.interface';
import { TitlePage, Breadcrumb } from '../../../shared/layouts/title-page/title-page';

@Component({
  selector: 'app-edit-parent',
  imports: [CommonModule, FormsModule, RouterModule, TitlePage],
  standalone: true,
  templateUrl: './edit-parent.html',
  styleUrl: './edit-parent.scss'
})
export class EditParent implements OnInit {
  parent: ParentModel = {
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    address: '',
    emergencyContact: ''
  };
  
  newChild: ChildModel = {
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    gender: '',
    allergies: '',
    medicalNotes: '',
    parentId: 0
  };
  
  loading = true;
  saving = false;
  showAddChild = false;
  imagePreview: string | null = null;
  childImagePreview: string | null = null;
  
  genders = [
    { value: 'Male', label: 'Male' },
    { value: 'Female', label: 'Female' }
  ];
  
  breadcrumbs: Breadcrumb[] = [
    { label: 'Dashboard' },
    { label: 'Parents', url: '/parents' },
    { label: 'Edit Parent' }
  ];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private parentService: ParentService,
    private childrenService: ChildrenService
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadParent(+id);
    }
  }

  loadParent(id: number): void {
    this.parentService.getParentWithChildren(id).subscribe({
      next: (parent) => {
        this.parent = parent;
        // Calculate age for each child
        if (this.parent?.children) {
          this.parent.children = this.parent.children.map(child => ({
            ...child,
            age: this.calculateAge(child.dateOfBirth)
          }));
        }
        this.newChild.parentId = parent.id!;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.router.navigate(['/parents']);
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

  saveParent(): void {
    this.saving = true;
    this.parentService.updateParent(this.parent).subscribe({
      next: () => {
        this.saving = false;
        this.router.navigate(['/parents/detail', this.parent.id]);
      },
      error: () => {
        this.saving = false;
      }
    });
  }

  addChild(): void {
    this.saving = true;
    this.childrenService.addChild(this.newChild).subscribe({
      next: () => {
        this.saving = false;
        this.showAddChild = false;
        this.resetChildForm();
        this.loadParent(this.parent.id!);
      },
      error: () => {
        this.saving = false;
      }
    });
  }

  resetChildForm(): void {
    this.newChild = {
      firstName: '',
      lastName: '',
      dateOfBirth: '',
      gender: '',
      allergies: '',
      medicalNotes: '',
      parentId: this.parent.id!
    };
    this.childImagePreview = null;
  }

  onParentImageSelect(event: any): void {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.imagePreview = e.target.result;
        this.parent.profilePicture = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }

  onChildImageSelect(event: any): void {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.childImagePreview = e.target.result;
        this.newChild.profilePicture = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }

  cancel(): void {
    this.router.navigate(['/parents/detail', this.parent.id]);
  }

  toggleAddChild(): void {
    this.showAddChild = !this.showAddChild;
    if (this.showAddChild) {
      this.resetChildForm();
    }
  }
}
