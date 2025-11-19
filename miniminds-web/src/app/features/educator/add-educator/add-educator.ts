import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { EducatorModel } from '../educator.interface';
import { EducatorService } from '../educator.service';
import { TitlePage, Breadcrumb } from '../../../shared/layouts/title-page/title-page';

@Component({
  selector: 'app-add-educator',
  imports: [CommonModule, FormsModule, TitlePage],
  standalone: true,
  templateUrl: './add-educator.html',
  styleUrl: './add-educator.scss'
})
export class AddEducator {
  saving = false;
  imagePreview: string | null = null;

  breadcrumbs: Breadcrumb[] = [
    { label: 'Dashboard' },
    { label: 'Educators', url: '/educators' },
    { label: 'Add Educator' }
  ];

  newEducator: EducatorModel = {
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    dateOfBirth: '',
    hireDate: '',
    specialization: '',
    salary: 0,
    profilePicture: '',
    password: ''
  };

  constructor(
    private educatorService: EducatorService,
    private router: Router
  ) {}

  saveEducator() {
    console.log('Sending educator data:', JSON.stringify(this.newEducator, null, 2));
    
    // Validate required fields
    if (!this.newEducator.firstName || !this.newEducator.lastName || !this.newEducator.email || !this.newEducator.password) {
      console.error('Missing required fields');
      alert('Please fill in all required fields');
      return;
    }
    
    this.saving = true;
    this.educatorService.addEducator({ ...this.newEducator }).subscribe({
      next: (response) => {
        console.log('Success response:', response);
        this.router.navigate(['/educators']);
        this.saving = false;
      },
      error: (error) => {
        console.error('Full error object:', error);
        console.error('Error status:', error.status);
        console.error('Error message:', error.message);
        if (error.error) {
          console.error('Error details:', error.error);
        }
        alert('Failed to create educator. Check console for details.');
        this.saving = false;
      }
    });
  }

  cancel() {
    this.router.navigate(['/educators']);
  }

  onImageSelect(event: any) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.imagePreview = e.target.result;
        this.newEducator.profilePicture = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }
}
