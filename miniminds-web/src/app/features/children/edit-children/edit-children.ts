import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { ChildModel } from '../children.interface';
import { ChildrenService } from '../children.service';
import { ParentService } from '../../parent/parent.service';
import { ParentModel } from '../../parent/parent.interface';
import { AuthService } from '../../../core/services/auth';
import { TitlePage, Breadcrumb } from '../../../shared/layouts/title-page/title-page';
import { Location } from '@angular/common';

@Component({
  selector: 'app-edit-children',
  imports: [CommonModule, FormsModule, TitlePage],
  standalone: true,
  templateUrl: './edit-children.html',
  styleUrl: './edit-children.scss'
})
export class EditChildren implements OnInit {
  saving = false;
  loading = false;
  imagePreview: string | null = null;
  childId: number = 0;
  parents: ParentModel[] = [];

  breadcrumbs: Breadcrumb[] = [
    { label: 'Dashboard' },
    { label: 'Children', url: '/children' },
    { label: 'Edit Child' }
  ];

  child: ChildModel = {
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    gender: '',
    allergies: '',
    medicalNotes: '',
    profilePicture: '',
    parentId: 0,
    isActive: true
  };

  genders = [
    { value: 'Male', label: 'Male' },
    { value: 'Female', label: 'Female' }
  ];

  constructor(
    private childrenService: ChildrenService,
    private parentService: ParentService,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private location: Location
  ) {}

  ngOnInit() {
    this.childId = Number(this.route.snapshot.paramMap.get('id'));
    this.loadParents();
    this.loadChild();
  }

  loadParents() {
    // Only load parents if user is admin or teacher
    if (this.authService.isAdmin() || this.authService.isTeacher()) {
      this.parentService.loadParents().subscribe({
        next: (parents) => {
          this.parents = parents;
        },
        error: (error) => {
          console.error('Error loading parents:', error);
        }
      });
    }
  }

  loadChild() {
    this.loading = true;
    this.childrenService.getChild(this.childId).subscribe({
      next: (child) => {
        this.child = { ...child };
        if (child.dateOfBirth) {
          this.child.dateOfBirth = new Date(child.dateOfBirth).toISOString().split('T')[0];
        }
        this.imagePreview = child.profilePicture || null;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading child:', error);
        this.loading = false;
        this.router.navigate(['/children']);
      }
    });
  }

  updateChild() {
    this.saving = true;
    this.childrenService.updateChild(this.child).subscribe({
      next: () => {
        this.router.navigate(['/children']);
        this.saving = false;
      },
      error: (error) => {
        console.error('Error updating child:', error);
        this.saving = false;
      }
    });
  }

  cancel() {
    this.router.navigate(['/children']);
  }
  back() {
    this.location.back();
  }

  onImageSelect(event: any) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.imagePreview = e.target.result;
        this.child.profilePicture = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }

  isParent(): boolean {
    return this.authService.isParent();
  }

  get isActive(): boolean {
    return this.child?.isActive ?? true;
  }

  getAge(dateOfBirth: string): number {
    if (!dateOfBirth) return 0;
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  }
}
