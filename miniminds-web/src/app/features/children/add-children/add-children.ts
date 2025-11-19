import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ChildModel } from '../children.interface';
import { ChildrenService } from '../children.service';
import { ParentService } from '../../parent/parent.service';
import { ParentModel } from '../../parent/parent.interface';
import { AuthService } from '../../../core/services/auth';
import { TitlePage, Breadcrumb } from '../../../shared/layouts/title-page/title-page';

@Component({
  selector: 'app-add-children',
  imports: [CommonModule, FormsModule, TitlePage],
  standalone: true,
  templateUrl: './add-children.html',
  styleUrl: './add-children.scss'
})
export class AddChildren implements OnInit {
  saving = false;
  imagePreview: string | null = null;
  parents: ParentModel[] = [];
  currentParentId: number | null = null;

  breadcrumbs: Breadcrumb[] = [
    { label: 'Dashboard' },
    { label: 'Children', url: '/children' },
    { label: 'Add Child' }
  ];

  newChild: ChildModel = {
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
    private router: Router
  ) {}

  ngOnInit() {
    this.loadParents();
    // If current user is a parent, auto-select their ID
    this.currentParentId = this.authService.getParentId();
    if (this.currentParentId) {
      this.newChild.parentId = this.currentParentId;
    }
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

  saveChild() {
    this.saving = true;
    this.childrenService.addChild({ ...this.newChild }).subscribe({
      next: () => {
        this.router.navigate(['/children']);
        this.saving = false;
      },
      error: (error) => {
        console.error('Error saving child:', error);
        this.saving = false;
      }
    });
  }

  cancel() {
    this.router.navigate(['/children']);
  }

  onImageSelect(event: any) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.imagePreview = e.target.result;
        this.newChild.profilePicture = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }

  isParent(): boolean {
    return this.authService.isParent();
  }
}
