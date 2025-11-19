import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ClassesService } from '../classes.service';
import { ClassModel } from '../classes.interface';
import { TitlePage } from '../../../shared/layouts/title-page/title-page';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-add-class',
  standalone: true,
  imports: [CommonModule, FormsModule, TitlePage],
  templateUrl: './add-class.component.html',
  styleUrls: ['./add-class.component.scss']
})
export class AddClassComponent {
  classData: ClassModel = {
    name: '',
    description: '',
    capacity: 20,
    ageGroupMin: 2,
    ageGroupMax: 5,
    schedule: '',
    isActive: true
  };

  saving = false;

  constructor(
    private classesService: ClassesService,
    private router: Router
  ) {}

  onSubmit() {
    this.saving = true;
    this.classesService.createClass(this.classData).subscribe({
      next: () => {
        Swal.fire({
          icon: 'success',
          title: 'Success!',
          text: 'Class created successfully',
          timer: 2000,
          showConfirmButton: false
        });
        this.router.navigate(['/classes']);
      },
      error: (error) => {
        console.error('Error creating class:', error);
        this.saving = false;
        Swal.fire({
          icon: 'error',
          title: 'Error!',
          text: 'Failed to create class'
        });
      }
    });
  }

  cancel() {
    this.router.navigate(['/classes']);
  }
}
