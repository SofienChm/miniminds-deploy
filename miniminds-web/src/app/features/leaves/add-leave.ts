import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TitlePage, Breadcrumb } from '../../shared/layouts/title-page/title-page';
import { AuthService } from '../../core/services/auth';
import { LeavesService, CreateLeaveRequestDto } from './leaves.service';
import { EducatorService } from '../educator/educator.service';
import { EducatorModel } from '../educator/educator.interface';

@Component({
  selector: 'app-add-leave',
  standalone: true,
  imports: [CommonModule, FormsModule, TitlePage],
  templateUrl: './add-leave.html',
  styleUrls: ['./add-leave.scss']
})
export class AddLeave implements OnInit {
  isAdmin = false;
  isTeacher = false;
  breadcrumbs: Breadcrumb[] = [
    { label: 'Dashboard', url: '/dashboard' },
    { label: 'Leaves', url: '/leaves' },
    { label: 'Add' }
  ];
  actions = [
    {
      label: 'Back to leaves',
      icon: 'bi bi-arrow-left',
      class: 'btn-cancel-global',
      action: () => this.cancel()
    }
  ];

  // Teacher form
  newLeave: CreateLeaveRequestDto = { startDate: '', endDate: '', reason: '', leaveType: 'Annual' };
  submitting = false;
  errorMessage = '';

  // Admin form
  teachers: EducatorModel[] = [];
  adminSelectedTeacherId: number | null = null;
  adminNewLeave: CreateLeaveRequestDto = { startDate: '', endDate: '', reason: '', leaveType: 'Annual' };
  adminApprove: boolean = true;
  adminSubmitting = false;
  adminError = '';

  constructor(
    private authService: AuthService,
    private leavesService: LeavesService,
    private educatorService: EducatorService,
    private router: Router
  ) {}

  cancel(): void {
    this.router.navigate(['/leaves']);
  }

  ngOnInit(): void {
    this.isAdmin = this.authService.isAdmin();
    this.isTeacher = this.authService.isTeacher();
    if (this.isAdmin) {
      this.loadTeachers();
    }
  }

  loadTeachers(): void {
    this.educatorService.loadEducators().subscribe({
      next: (list) => this.teachers = list || [],
      error: () => this.teachers = []
    });
  }

  submitTeacherLeave(): void {
    this.errorMessage = '';
    this.submitting = true;
    const { startDate, endDate, reason } = this.newLeave;
    if (!startDate || !endDate) {
      this.errorMessage = 'Start and end dates are required';
      this.submitting = false;
      return;
    }
    this.leavesService.requestLeave({ startDate, endDate, reason: (reason || '').trim(), leaveType: this.newLeave.leaveType }).subscribe({
      next: () => {
        this.submitting = false;
        this.router.navigate(['/leaves']);
      },
      error: (err) => {
        this.errorMessage = err.error?.message || 'Failed to submit leave request';
        this.submitting = false;
      }
    });
  }

  submitAdminLeave(): void {
    this.adminError = '';
    this.adminSubmitting = true;
    const tid = this.adminSelectedTeacherId;
    const { startDate, endDate, reason } = this.adminNewLeave;
    if (!tid) {
      this.adminError = 'Please select a teacher';
      this.adminSubmitting = false;
      return;
    }
    if (!startDate || !endDate) {
      this.adminError = 'Start and end dates are required';
      this.adminSubmitting = false;
      return;
    }
    this.leavesService.adminCreateLeave(tid, { startDate, endDate, reason: (reason || '').trim(), leaveType: this.adminNewLeave.leaveType, approve: this.adminApprove }).subscribe({
      next: () => {
        this.adminSubmitting = false;
        this.router.navigate(['/leaves']);
      },
      error: (err) => {
        this.adminError = err.error?.message || 'Failed to create leave';
        this.adminSubmitting = false;
      }
    });
  }
}