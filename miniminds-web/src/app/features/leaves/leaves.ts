import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth';
import { LeavesService, LeaveRequestModel, CreateLeaveRequestDto, LeaveBalanceDto } from './leaves.service';
import { EducatorService } from '../educator/educator.service';
import { EducatorModel } from '../educator/educator.interface';
import { TitlePage, Breadcrumb, TitleAction } from '../../shared/layouts/title-page/title-page';
import { Router } from '@angular/router';

@Component({
  selector: 'app-leaves',
  standalone: true,
  imports: [CommonModule, FormsModule, TitlePage],
  templateUrl: './leaves.html',
  styleUrls: ['./leaves.scss']
})
export class Leaves implements OnInit {
  isAdmin = false;
  isTeacher = false;
  breadcrumbs: Breadcrumb[] = [
    { label: 'Dashboard', url: '/dashboard' },
    { label: 'Leaves' }
  ];
  titleActions: TitleAction[] = [];

  // Teacher view state
  balance: LeaveBalanceDto | null = null;
  myLeaves: LeaveRequestModel[] = [];
  submitting = false;
  errorMessage = '';

  newLeave: CreateLeaveRequestDto = {
    startDate: '',
    endDate: '',
    reason: '',
    leaveType: 'Annual'
  };

  // Admin view state
  pendingLeaves: LeaveRequestModel[] = [];
  displayedLeaves: LeaveRequestModel[] = [];
  allStatus: Array<'All' | 'Pending' | 'Approved' | 'Rejected'> = ['All', 'Pending', 'Approved', 'Rejected'];
  selectedStatus: 'All' | 'Pending' | 'Approved' | 'Rejected' = 'All';
  loadingAdmin = false;
  leavesPerPage = 9;
  currentPage = 1;
  teachers: EducatorModel[] = [];
  adminSelectedTeacherId: number | null = null;
  adminNewLeave: CreateLeaveRequestDto = { startDate: '', endDate: '', reason: '', leaveType: 'Annual' };
  adminApprove: boolean = true;
  adminSubmitting = false;
  adminError = '';

  constructor(
    public authService: AuthService,
    private leavesService: LeavesService,
    private educatorService: EducatorService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.isAdmin = this.authService.isAdmin();
    this.isTeacher = this.authService.isTeacher();

    if (this.isTeacher) {
      this.loadBalance();
      this.loadMyLeaves();
    }

    if (this.isAdmin) {
      this.loadAdminLeaves();
      this.loadTeachers();
    }

    this.titleActions = [
      {
        label: 'Add Leave',
        class: 'btn btn-primary',
        action: () => this.router.navigate(['/leaves/add'])
      }
    ];
  }

  // Teacher functions
  loadBalance(): void {
    this.leavesService.getMyBalance().subscribe({
      next: (bal) => this.balance = bal,
      error: () => this.balance = null
    });
  }

  loadMyLeaves(): void {
    this.leavesService.getMyLeaves().subscribe({
      next: (list) => this.myLeaves = list,
      error: () => this.myLeaves = []
    });
  }

  submitLeave(): void {
    this.errorMessage = '';
    this.submitting = true;

    const { startDate, endDate, reason } = this.newLeave;
    if (!startDate || !endDate) {
      this.errorMessage = 'Start and end dates are required';
      this.submitting = false;
      return;
    }

    this.leavesService.requestLeave({ startDate, endDate, reason: (reason || '').trim(), leaveType: this.newLeave.leaveType }).subscribe({
      next: (_) => {
        this.newLeave = { startDate: '', endDate: '', reason: '', leaveType: 'Annual' };
        this.submitting = false;
        this.loadMyLeaves();
        this.loadBalance();
      },
      error: (err) => {
        this.errorMessage = err.error?.message || 'Failed to submit leave request';
        this.submitting = false;
      }
    });
  }

  // Admin functions
  loadAdminLeaves(): void {
    this.loadingAdmin = true;
    this.leavesService.getAllLeaves(this.selectedStatus).subscribe({
      next: (list) => {
        this.pendingLeaves = list;
        this.currentPage = 1;
        this.updateDisplayedLeaves();
        this.loadingAdmin = false;
      },
      error: () => {
        this.pendingLeaves = [];
        this.displayedLeaves = [];
        this.loadingAdmin = false;
      }
    });
  }

  updateDisplayedLeaves() {
    const endIndex = this.currentPage * this.leavesPerPage;
    this.displayedLeaves = this.pendingLeaves.slice(0, endIndex);
  }

  loadMoreLeaves() {
    this.currentPage++;
    this.updateDisplayedLeaves();
  }

  hasMoreLeaves(): boolean {
    return this.displayedLeaves.length < this.pendingLeaves.length;
  }

  loadTeachers(): void {
    this.educatorService.loadEducators().subscribe({
      next: (list) => this.teachers = list || [],
      error: () => this.teachers = []
    });
  }

  approve(leave: LeaveRequestModel): void {
    this.leavesService.approveLeave(leave.id).subscribe({
      next: () => this.loadAdminLeaves(),
      error: () => {}
    });
  }

  reject(leave: LeaveRequestModel): void {
    this.leavesService.rejectLeave(leave.id).subscribe({
      next: () => this.loadAdminLeaves(),
      error: () => {}
    });
  }

  adminSubmitLeave(): void {
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
        this.adminNewLeave = { startDate: '', endDate: '', reason: '', leaveType: 'Annual' };
        this.adminSelectedTeacherId = null;
        this.adminApprove = true;
        this.adminSubmitting = false;
        this.loadAdminLeaves();
      },
      error: (err) => {
        this.adminError = err.error?.message || 'Failed to create leave';
        this.adminSubmitting = false;
      }
    });
  }
}