import { Component, OnInit, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { ClassesService } from '../classes.service';
import { ClassModel } from '../classes.interface';
import { TitlePage, TitleAction, Breadcrumb } from '../../../shared/layouts/title-page/title-page';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-class-detail',
  standalone: true,
  imports: [CommonModule, TitlePage, FormsModule],
  templateUrl: './class-detail.component.html',
  styleUrls: ['./class-detail.component.scss']
})
export class ClassDetailComponent implements OnInit, AfterViewInit, OnDestroy {
  classData: ClassModel | null = null;
  loading = false;
  classId: number = 0;
  showAddChildModal = false;
  availableChildren: any[] = [];
  enrolledChildren: any[] = [];
  selectedChildId: number | null = null;
  showAssignTeacherModal = false;
  availableTeachers: any[] = [];
  selectedTeacherIds: number[] = [];
  assignedTeachers: any[] = [];
  private niceSelect: any;

  breadcrumbs: Breadcrumb[] = [
    { label: 'Dashboard' },
    { label: 'Classes', url: '/classes' },
    { label: 'Class Details' }
  ];

  titleActions: TitleAction[] = [];

  constructor(
    private classesService: ClassesService,
    private router: Router,
    private route: ActivatedRoute,
    private http: HttpClient
  ) {}

  ngOnInit() {
    this.classId = Number(this.route.snapshot.paramMap.get('id'));
    this.setupTitleActions();
    this.loadClass();
  }

  setupTitleActions() {
    this.titleActions = [
      {
        label: 'Back to Classes',
        class: 'btn-outline-secondary btn-back',
        icon: 'bi bi-arrow-left',
        action: () => this.goBack()
      },
      {
        label: 'Edit Class',
        class: 'btn-primary',
        icon: 'bi bi-pencil-square',
        action: () => this.router.navigate(['/classes/edit', this.classId])
      }
    ];
  }

  loadClass() {
    this.loading = true;
    this.classesService.getClass(this.classId).subscribe({
      next: (classData) => {
        this.classData = classData;
        this.loading = false;
        this.loadEnrolledChildren();
        this.loadAssignedTeachers();
      },
      error: (error) => {
        console.error('Error loading class:', error);
        this.loading = false;
        this.router.navigate(['/classes']);
      }
    });
  }

  loadAssignedTeachers() {
    this.http.get<any[]>(`http://localhost:5001/api/classes/${this.classId}/teachers`).subscribe({
      next: (teachers) => this.assignedTeachers = teachers,
      error: (error) => console.error('Error loading assigned teachers:', error)
    });
  }

  loadEnrolledChildren() {
    this.http.get<any[]>(`http://localhost:5001/api/classes/${this.classId}/children`).subscribe({
      next: (children) => this.enrolledChildren = children,
      error: (error) => console.error('Error loading enrolled children:', error)
    });
  }

  openAddChildModal() {
    this.showAddChildModal = true;
    this.loadAvailableChildren();
  }

  closeAddChildModal() {
    this.showAddChildModal = false;
    this.selectedChildId = null;
  }

  loadAvailableChildren() {
    this.http.get<any[]>('http://localhost:5001/api/children').subscribe({
      next: (children) => {
        const enrolledIds = this.enrolledChildren.map(c => c.id);
        this.availableChildren = children.filter(c => !enrolledIds.includes(c.id));
      },
      error: (error) => console.error('Error loading children:', error)
    });
  }

  addChildToClass() {
    if (!this.selectedChildId) return;

    const payload = { classId: this.classId, childId: this.selectedChildId };
    this.http.post('http://localhost:5001/api/classes/enroll', payload).subscribe({
      next: () => {
        this.closeAddChildModal();
        this.loadClass();
        Swal.fire({
          icon: 'success',
          title: 'Success!',
          text: 'Child enrolled successfully',
          timer: 2000,
          showConfirmButton: false
        });
      },
      error: (error) => {
        console.error('Error enrolling child:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error!',
          text: 'Failed to enroll child'
        });
      }
    });
  }

  ngAfterViewInit() {}

  ngOnDestroy() {
    if (this.niceSelect) {
      this.niceSelect.destroy();
    }
  }

  openAssignTeacherModal() {
    this.showAssignTeacherModal = true;
    this.loadAvailableTeachers();
    setTimeout(() => this.initNiceSelect(), 100);
  }

  initNiceSelect() {
    const selectElement = document.getElementById('teacherSelect') as HTMLSelectElement;
    if (selectElement && typeof (window as any).NiceSelect !== 'undefined') {
      this.niceSelect = (window as any).NiceSelect.bind(selectElement, { searchable: true, placeholder: 'Select teachers...' });
    }
  }

  closeAssignTeacherModal() {
    if (this.niceSelect) {
      this.niceSelect.destroy();
      this.niceSelect = null;
    }
    this.showAssignTeacherModal = false;
    this.selectedTeacherIds = [];
  }

  loadAvailableTeachers() {
    this.http.get<any[]>('http://localhost:5001/api/teachers').subscribe({
      next: (teachers) => {
        const assignedIds = this.assignedTeachers.map(t => t.id);
        this.availableTeachers = teachers.filter(t => !assignedIds.includes(t.id));
      },
      error: (error) => console.error('Error loading teachers:', error)
    });
  }

  assignTeacher() {
    const selectElement = document.getElementById('teacherSelect') as HTMLSelectElement;
    if (!selectElement) return;

    const selectedOptions = Array.from(selectElement.selectedOptions);
    this.selectedTeacherIds = selectedOptions.map(option => parseInt(option.value));

    if (this.selectedTeacherIds.length === 0) return;

    const payload = { classId: this.classId, teacherIds: this.selectedTeacherIds };
    this.http.post('http://localhost:5001/api/classes/assign-teachers', payload).subscribe({
      next: () => {
        this.closeAssignTeacherModal();
        this.loadClass();
        Swal.fire({
          icon: 'success',
          title: 'Success!',
          text: 'Teacher assigned successfully',
          timer: 2000,
          showConfirmButton: false
        });
      },
      error: (error) => {
        console.error('Error assigning teacher:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error!',
          text: 'Failed to assign teacher'
        });
      }
    });
  }

  removeTeacher(teacherId: number) {
    Swal.fire({
      title: 'Are you sure?',
      text: 'Remove this teacher from the class?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, remove!'
    }).then((result) => {
      if (result.isConfirmed) {
        this.http.delete(`http://localhost:5001/api/classes/${this.classId}/teachers/${teacherId}`).subscribe({
          next: () => {
            this.loadClass();
            Swal.fire({
              icon: 'success',
              title: 'Removed!',
              text: 'Teacher has been removed',
              timer: 2000,
              showConfirmButton: false
            });
          },
          error: (error) => {
            console.error('Error removing teacher:', error);
            Swal.fire({
              icon: 'error',
              title: 'Error!',
              text: 'Failed to remove teacher'
            });
          }
        });
      }
    });
  }

  removeChild(childId: number) {
    Swal.fire({
      title: 'Are you sure?',
      text: 'Remove this child from the class?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, remove!'
    }).then((result) => {
      if (result.isConfirmed) {
        this.http.delete(`http://localhost:5001/api/classes/${this.classId}/children/${childId}`).subscribe({
          next: () => {
            this.loadClass();
            Swal.fire({
              icon: 'success',
              title: 'Removed!',
              text: 'Child has been removed',
              timer: 2000,
              showConfirmButton: false
            });
          },
          error: (error) => {
            console.error('Error removing child:', error);
            Swal.fire({
              icon: 'error',
              title: 'Error!',
              text: 'Failed to remove child'
            });
          }
        });
      }
    });
  }

  goBack() {
    this.router.navigate(['/classes']);
  }
}
