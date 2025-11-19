import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ParentModel } from '../parent.interface';
import { ParentService } from '../parent.service';
import { TitlePage, Breadcrumb } from '../../../shared/layouts/title-page/title-page';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-add-parent',
  imports: [CommonModule, FormsModule, TitlePage],
  standalone: true,
  templateUrl: './add-parent.html',
  styleUrl: './add-parent.scss'
})
export class AddParent {
  saving = false;
  imagePreview: string | null = null;

  breadcrumbs: Breadcrumb[] = [
    { label: 'Dashboard' },
    { label: 'Parents', url: '/parents' },
    { label: 'Add Parent' }
  ];

  newParent: ParentModel = {
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    address: '',
    emergencyContact: '',
    profilePicture: '',
    gender: '',
    work: '',
    zipCode: '',
    parentType: '',
    password: '',
    isActive: true
  };

  constructor(
    private parentService: ParentService,
    private router: Router
  ) {}

  saveParent() {
    this.saving = true;
    console.log('Sending parent data:', this.newParent);
    this.parentService.addParent({ ...this.newParent }).subscribe({
      next: () => {
        this.saving = false;
        Swal.fire('Success', 'Parent created successfully!', 'success').then(() => {
          this.router.navigate(['/parents']);
        });
      },
      error: (error) => {
        this.saving = false;
        const errorMessage = error?.error?.message || 'Failed to create parent';
        Swal.fire('Error', errorMessage, 'error');
      }
    });
  }

  cancel() {
    this.router.navigate(['/parents']);
  }

  onImageSelect(event: any) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.imagePreview = e.target.result;
        this.newParent.profilePicture = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }
}
