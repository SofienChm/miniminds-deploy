import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../../core/services/auth';
import { TitlePage, Breadcrumb } from '../../../shared/layouts/title-page/title-page';
import { CustomValidators } from '../../../shared/validators/custom.validators';
import { environment } from '../../../../environments/environment.development';
import { ParentChildHeaderComponent } from '../../../shared/components/parent-child-header/parent-child-header.component';
import { Location } from '@angular/common';

@Component({
  selector: 'app-edit-profile',
  imports: [CommonModule, ReactiveFormsModule, TitlePage, ParentChildHeaderComponent],
  standalone: true,
  templateUrl: './edit-profile.html',
  styleUrl: './edit-profile.scss'
})
export class EditProfile implements OnInit {
  profileForm!: FormGroup;
  securityForm!: FormGroup;
  preferencesForm!: FormGroup;
  saving = false;
  imagePreview: string | null = null;
  errorMessage = '';
  activeTab = 'personal';
  userRole = '';

  breadcrumbs: Breadcrumb[] = [
    { label: 'Dashboard' },
    { label: 'Profile' }
  ];
   isParent(): boolean {
    return this.authService.isParent();
  }
  constructor(
    private authService: AuthService,
    private http: HttpClient,
    private router: Router,
    private fb: FormBuilder,
    private location: Location
  ) {}

  ngOnInit() {
    this.initForms();
    const user = this.authService.getCurrentUser();
    if (user) {
      this.userRole = user.role;
      if (this.isParent()) {
        this.loadParentData();
      } else {
        this.profileForm.patchValue({
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email
        });
        this.imagePreview = user.profilePicture || null;
      }
    }
  }

  loadParentData() {
    const parentId = this.authService.getParentId();
    if (parentId) {
      this.http.get<any>(`${environment.apiUrl}/parents/${parentId}`).subscribe({
        next: (parent) => {
          this.profileForm.patchValue({
            firstName: parent.firstName,
            lastName: parent.lastName,
            email: parent.email,
            phoneNumber: parent.phoneNumber,
            address: parent.address,
            emergencyContact: parent.emergencyContact
          });
          this.imagePreview = parent.profilePicture || null;
        }
      });
    }
  }

  initForms() {
    this.profileForm = this.fb.group({
      firstName: ['', [Validators.required, CustomValidators.noWhitespace, CustomValidators.alphaOnly]],
      lastName: ['', [Validators.required, CustomValidators.noWhitespace, CustomValidators.alphaOnly]],
      email: ['', [Validators.required, CustomValidators.email]],
      phoneNumber: ['', [Validators.required, CustomValidators.phone]],
      address: [''],
      emergencyContact: [''],
      profilePicture: ['']
    });

    this.securityForm = this.fb.group({
      currentPassword: ['', [Validators.required, Validators.minLength(6)]],
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required, CustomValidators.matchPassword('newPassword')]]
    });

    this.preferencesForm = this.fb.group({
      language: ['en'],
      timezone: ['UTC']
    });
  }

  setActiveTab(tab: string) {
    this.activeTab = tab;
  }

  getInitials(): string {
    const firstName = this.profileForm.get('firstName')?.value || '';
    const lastName = this.profileForm.get('lastName')?.value || '';
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  }

  get firstName() { return this.profileForm.get('firstName')!; }
  get lastName() { return this.profileForm.get('lastName')!; }
  get email() { return this.profileForm.get('email')!; }
  get phoneNumber() { return this.profileForm.get('phoneNumber')!; }
  get address() { return this.profileForm.get('address')!; }
  get emergencyContact() { return this.profileForm.get('emergencyContact')!; }

  updateProfile() {
    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      return;
    }

    this.saving = true;
    this.errorMessage = '';
    
    const parentId = this.authService.getParentId();
    if (parentId) {
      this.http.get<any>(`${environment.apiUrl}/parents/${parentId}`).subscribe({
        next: (parent) => {
          const updatedData = {
            ...parent,
            firstName: this.profileForm.value.firstName,
            lastName: this.profileForm.value.lastName,
            email: this.profileForm.value.email,
            phoneNumber: this.profileForm.value.phoneNumber,
            address: this.profileForm.value.address,
            emergencyContact: this.profileForm.value.emergencyContact,
            profilePicture: this.imagePreview || parent.profilePicture
          };
          
          this.http.put(`${environment.apiUrl}/parents/${parentId}`, updatedData).subscribe({
            next: () => {
              const currentUser = this.authService.getCurrentUser();
              if (currentUser) {
                this.authService.updateCurrentUser({
                  ...currentUser,
                  firstName: updatedData.firstName,
                  lastName: updatedData.lastName,
                  email: updatedData.email,
                  profilePicture: updatedData.profilePicture
                });
              }
              this.router.navigate(['/dashboard']);
              this.saving = false;
            },
            error: (error) => {
              this.errorMessage = error.error?.message || 'Failed to update profile';
              this.saving = false;
            }
          });
        },
        error: (error) => {
          this.errorMessage = 'Failed to load profile data';
          this.saving = false;
        }
      });
    }
  }

  updatePassword() {
    if (this.securityForm.invalid) {
      this.securityForm.markAllAsTouched();
      return;
    }
    // Implement password update logic
    console.log('Update password:', this.securityForm.value);
  }

  updatePreferences() {
    if (this.preferencesForm.invalid) {
      this.preferencesForm.markAllAsTouched();
      return;
    }
    // Implement preferences update logic
    console.log('Update preferences:', this.preferencesForm.value);
  }

  cancel() {
    this.router.navigate(['/dashboard']);
  }

  back() {
    this.location.back();
  }

  getErrorMessage(formGroup: FormGroup, fieldName: string): string {
    const control = formGroup.get(fieldName);
    if (!control || !control.errors || !control.touched) return '';

    if (control.errors['required']) return `${fieldName} is required`;
    if (control.errors['invalidEmail']) return 'Invalid email format';
    if (control.errors['invalidPhone']) return 'Invalid phone number';
    if (control.errors['minlength']) return `Minimum ${control.errors['minlength'].requiredLength} characters required`;
    if (control.errors['notAlpha']) return 'Only letters allowed';
    if (control.errors['whitespace']) return 'Cannot be empty or whitespace';
    if (control.errors['passwordMismatch']) return 'Passwords do not match';
    return 'Invalid input';
  }

  onImageSelect(event: any) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.imagePreview = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }
}
