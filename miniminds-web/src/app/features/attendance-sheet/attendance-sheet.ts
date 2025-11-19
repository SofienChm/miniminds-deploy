import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AttendanceService } from './attendance.service';
import { Attendance, AttendanceStats } from './attendance.interface';
import { TitlePage } from '../../shared/layouts/title-page/title-page';
import { ChildrenService } from '../children/children.service';
import { ChildModel } from '../children/children.interface';
import { interval, Subscription } from 'rxjs';
import { AuthService } from '../../core/services/auth';

@Component({
  selector: 'app-attendance-sheet',
  imports: [CommonModule, FormsModule, TitlePage],
  standalone: true,
  templateUrl: './attendance-sheet.html',
  styleUrl: './attendance-sheet.scss'
})
export class AttendanceSheet implements OnInit, OnDestroy {
  attendances: Attendance[] = [];
  stats: AttendanceStats = { totalPresent: 0, totalAbsent: 0, checkInsToday: 0, checkOutsToday: 0 };
  selectedDate = new Date().toISOString().split('T')[0];
  searchTerm = '';
  loading = false;
  currentTime = new Date();
  children: ChildModel[] = [];
  selectedChildId: number | null = null;
  checkInNotes = '';
  showCheckInForm = false;
  private refreshSubscription?: Subscription;
  private clockSubscription?: Subscription;
  get isParent(): boolean {
      return this.authService.isParent();
  }
  constructor(
    private authService: AuthService,
    private attendanceService: AttendanceService,
    private childrenService: ChildrenService
  ) {}

  ngOnInit(): void {
    this.loadTodayData();
    this.loadChildren();
    this.startAutoRefresh();
    this.startClock();
  }

  loadChildren(): void {
    this.childrenService.loadChildren().subscribe({
      next: (children) => this.children = children
    });
  }

  ngOnDestroy(): void {
    this.refreshSubscription?.unsubscribe();
    this.clockSubscription?.unsubscribe();
  }

  startAutoRefresh(): void {
    // Refresh data every 30 seconds
    this.refreshSubscription = interval(30000).subscribe(() => {
      if (this.selectedDate === new Date().toISOString().split('T')[0]) {
        this.loadTodayData();
      }
    });
  }

  startClock(): void {
    // Update current time every second
    this.clockSubscription = interval(1000).subscribe(() => {
      this.currentTime = new Date();
    });
  }

  loadTodayData(): void {
    this.loading = true;
    this.attendanceService.getTodayAttendance().subscribe({
      next: (data) => {
        this.attendances = data;
        this.loading = false;
      },
      error: () => this.loading = false
    });

    this.attendanceService.getTodayStats().subscribe({
      next: (stats) => this.stats = stats
    });
  }

  onDateChange(): void {
    this.loading = true;
    this.attendanceService.getAttendanceByDate(this.selectedDate).subscribe({
      next: (data) => {
        this.attendances = data;
        this.loading = false;
      },
      error: () => this.loading = false
    });
  }

  checkOut(attendance: Attendance, notes?: string): void {
    this.attendanceService.checkOut(attendance.id, notes).subscribe({
      next: () => {
        // Update locally for immediate feedback
        attendance.checkOutTime = new Date().toISOString();
        attendance.checkOutNotes = notes;
        // Refresh data to get server state
        setTimeout(() => this.loadTodayData(), 500);
      }
    });
  }

  get filteredAttendances(): Attendance[] {
    if (!this.searchTerm) return this.attendances;
    
    return this.attendances.filter(a => 
      a.child?.firstName.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
      a.child?.lastName.toLowerCase().includes(this.searchTerm.toLowerCase())
    );
  }

  getStatusClass(attendance: Attendance): string {
    if (attendance.checkOutTime) return 'status-checked-out';
    return 'status-present';
  }

  getStatusText(attendance: Attendance): string {
    if (attendance.checkOutTime) return 'Checked Out';
    return 'Present';
  }

  formatTime(dateString: string): string {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  calculateDuration(checkIn: string, checkOut?: string): number {
    const checkInTime = new Date(checkIn).getTime();
    const endTime = checkOut ? new Date(checkOut).getTime() : this.currentTime.getTime();
    return (endTime - checkInTime) / (1000 * 60 * 60);
  }

  getCurrentTime(): string {
    return this.currentTime.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  }

  getActiveDuration(checkIn: string): string {
    const duration = this.calculateDuration(checkIn);
    const hours = Math.floor(duration);
    const minutes = Math.floor((duration - hours) * 60);
    return `${hours}h ${minutes}m`;
  }

  get availableChildren(): ChildModel[] {
    const checkedInIds = this.attendances
      .filter(a => !a.checkOutTime)
      .map(a => a.childId);
    return this.children.filter(c => !checkedInIds.includes(c.id!));
  }

  toggleCheckInForm(): void {
    this.showCheckInForm = !this.showCheckInForm;
    if (!this.showCheckInForm) {
      this.resetCheckInForm();
    }
  }

  resetCheckInForm(): void {
    this.selectedChildId = null;
    this.checkInNotes = '';
  }

  checkInChild(): void {
    if (!this.selectedChildId) return;
    
    this.attendanceService.checkIn(this.selectedChildId, this.checkInNotes).subscribe({
      next: () => {
        this.loadTodayData();
        this.resetCheckInForm();
        this.showCheckInForm = false;
      }
    });
  }
}
