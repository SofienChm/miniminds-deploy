import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { EducatorModel } from '../educator.interface';
import { EducatorService } from '../educator.service';
import { TitlePage, Breadcrumb } from '../../../shared/layouts/title-page/title-page';

@Component({
  selector: 'app-edit-educator',
  imports: [CommonModule, FormsModule, TitlePage],
  standalone: true,
  templateUrl: './edit-educator.html',
  styleUrl: './edit-educator.scss'
})
export class EditEducator implements OnInit {
  saving = false;
  loading = false;
  imagePreview: string | null = null;
  educatorId: number = 0;

  breadcrumbs: Breadcrumb[] = [
    { label: 'Dashboard' },
    { label: 'Educators', url: '/educators' },
    { label: 'Edit Educator' }
  ];

  educator: EducatorModel = {
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    dateOfBirth: '',
    hireDate: '',
    specialization: '',
    salary: 0,
    profilePicture: ''
  };

  constructor(
    private educatorService: EducatorService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    this.educatorId = Number(this.route.snapshot.paramMap.get('id'));
    this.loadEducator();
  }

  loadEducator() {
    this.loading = true;
    this.educatorService.getEducator(this.educatorId).subscribe({
      next: (educator) => {
        this.educator = { ...educator };
        this.imagePreview = educator.profilePicture || null;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading educator:', error);
        this.loading = false;
        this.router.navigate(['/educators']);
      }
    });
  }

  updateEducator() {
    this.saving = true;
    this.educatorService.updateEducator(this.educator).subscribe({
      next: () => {
        this.router.navigate(['/educators']);
        this.saving = false;
      },
      error: (error) => {
        console.error('Error updating educator:', error);
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
        this.educator.profilePicture = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }
}
