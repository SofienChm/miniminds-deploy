import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth';
import { ChildrenService } from '../children/children.service';
import { ParentService } from '../parent/parent.service';
import { EventService } from '../event/event.service';
import { AttendanceService } from '../../core/services/attendance.service';
import { DailyActivityService } from '../daily-activities/daily-activity.service';
import { DailyActivity } from '../daily-activities/daily-activity.interface';
import { BaseChartDirective } from 'ng2-charts';
import { TranslateModule } from '@ngx-translate/core';
import { CalendarComponent } from '../../shared/components/calendar/calendar.component';
import type { ChartConfiguration } from 'chart.js';

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule, RouterModule, BaseChartDirective, TranslateModule, CalendarComponent],
  standalone: true,
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss'
})
export class Dashboard implements OnInit {
  userRole: string | null = null;
  userName: string = '';
  userProfilePicture: string = '';
  loading = true;

  stats = {
    children: 0,
    parents: 0,
    teachers: 0,
    events: 0,
    activeChildren: 0,
    todayAttendance: 0
  };

  monthlyStats = {
    childrenChange: 0,
    eventsChange: 0,
    incomeChange: 0,
    income: 0
  };

  recentChildren: any[] = [];
  upcomingEvents: any[] = [];
  myChildren: any[] = [];
  selectedChildIndex: number = 0;
  todayActivities: DailyActivity[] = [];
  todayStats = {
    meals: { completed: 0, total: 0 },
    napTime: '',
    activities: 0
  };

  // Gender Chart Data
  genderChartData: ChartConfiguration<'doughnut'>['data'] = {
    labels: ['Boys', 'Girls'],
    datasets: [{
      data: [0, 0],
      backgroundColor: ['#202c4b', '#dc3545'],
      hoverBackgroundColor: ['#1b253dff', '#bb2d3b']
    }]
  };

  genderChartOptions: ChartConfiguration<'doughnut'>['options'] = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const label = context.label || '';
            const value = context.parsed || 0;
            const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
            const percentage = ((value / total) * 100).toFixed(1);
            return `${label}: ${value} (${percentage}%)`;
          }
        }
      }
    }
  };

  boysCount = 0;
  girlsCount = 0;
  boysPercentage = 0;
  girlsPercentage = 0;

  paymentStats = {
    paid: 0,
    pending: 0,
    overdue: 0
  };

  paymentChartData: ChartConfiguration<'doughnut'>['data'] = {
    labels: ['Paid', 'Pending', 'Overdue'],
    datasets: [{
      data: [0, 0, 0],
      backgroundColor: ['#202c4b', '#cdeaf0', '#feccfd'],
      hoverBackgroundColor: ['#202c4v', '#cdeaf9', '#feccf5']
    }]
  };

  paymentChartOptions: ChartConfiguration<'doughnut'>['options'] = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: {
        display: false
      }
    }
  };

  attendanceChartData: ChartConfiguration<'bar'>['data'] = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [{
      label: 'Attendance',
      data: [10, 12, 11, 13, 12, 8, 7],
      backgroundColor: '#202c4b',
      borderColor: '#202c4b',
      borderWidth: 1,
      borderRadius: 4
    }]
  };

  attendanceChartOptions: ChartConfiguration<'bar'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        enabled: true
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 5
        }
      },
      x: {
        grid: {
          display: false
        }
      }
    }
  };

  constructor(
    private authService: AuthService,
    private childrenService: ChildrenService,
    private parentService: ParentService,
    private eventService: EventService,
    private attendanceService: AttendanceService,
    private dailyActivityService: DailyActivityService,
    private router: Router
  ) {}

  ngOnInit() {
    this.userRole = this.authService.getUserRole();
    const user = this.authService.getCurrentUser();
    this.userName = user?.firstName || this.userRole!;
    this.userProfilePicture = user?.profilePicture || '';
    this.loadChartJS();
    this.initializeCharts();
    this.loadDashboardData();
  }

  loadChartJS() {
    import('chart.js').then(({ Chart, ArcElement, Tooltip, Legend, DoughnutController, BarElement, BarController, LinearScale, CategoryScale }) => {
      Chart.register(ArcElement, Tooltip, Legend, DoughnutController, BarElement, BarController, LinearScale, CategoryScale);
    });
  }

  initializeCharts() {
    this.paymentChartData.datasets[0].data = [1, 1, 1];
    this.attendanceChartData.datasets[0].data = [10, 12, 11, 13, 12, 8, 7];
  }

  loadDashboardData() {
    this.loading = true;

    if (this.userRole === 'Parent') {
      this.loadParentDashboard();
    } else {
      this.loadAdminTeacherDashboard();
    }
  }

  loadParentDashboard() {
    const parentId = this.authService.getParentId();
    if (parentId) {
      this.parentService.getParentWithChildren(parentId).subscribe({
        next: (parent) => {
          if (parent.profilePicture) {
            this.authService.updateProfilePicture(parent.profilePicture);
            this.userProfilePicture = parent.profilePicture;
          }
        }
      });
    }

    this.childrenService.loadChildren().subscribe({
      next: (children) => {
        this.myChildren = children;
        this.stats.children = children.length;
        this.loadTodayAttendance();
        if (children.length > 0 && children[0].id) {
          this.loadTodayActivities(children[0].id);
        }
      },
      error: (error) => {
        console.error('Error loading children:', error);
        this.myChildren = [];
        this.loading = false;
      }
    });

    this.eventService.loadEvents().subscribe({
      next: (events) => {
        const now = new Date();
        this.upcomingEvents = events
          .filter(e => new Date(e.time) > now)
          .sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime())
          .slice(0, 3);
      }
    });
  }

  loadTodayActivities(childId: number) {
    const today = new Date().toISOString().split('T')[0];
    this.dailyActivityService.getActivitiesByChild(childId, today).subscribe({
      next: (activities) => {
        this.todayActivities = activities.sort((a, b) => 
          new Date(a.activityTime).getTime() - new Date(b.activityTime).getTime()
        );
        this.calculateTodayStats(activities);
      },
      error: (error) => {
        console.error('Error loading activities:', error);
        this.todayActivities = [];
      }
    });
  }

  calculateTodayStats(activities: DailyActivity[]) {
    const meals = activities.filter(a => a.activityType.toLowerCase().includes('meal') || a.activityType.toLowerCase().includes('snack'));
    this.todayStats.meals.completed = meals.length;
    this.todayStats.meals.total = 3;
    
    const napActivity = activities.find(a => a.activityType.toLowerCase().includes('nap'));
    this.todayStats.napTime = napActivity?.duration || '0 hour';
    
    this.todayStats.activities = activities.filter(a => 
      !a.activityType.toLowerCase().includes('meal') && 
      !a.activityType.toLowerCase().includes('snack') &&
      !a.activityType.toLowerCase().includes('nap')
    ).length;
  }

  loadTodayAttendance() {
    this.attendanceService.getTodayAttendance().subscribe({
      next: (attendances) => {
        this.myChildren.forEach(child => {
          const todayAttendance = attendances.find((att: any) => att.childId === child.id);
          if (todayAttendance) {
            if (todayAttendance.checkInTime) {
              child.checkInTime = todayAttendance.checkInTime;
            }
            if (todayAttendance.checkOutTime) {
              child.checkOutTime = todayAttendance.checkOutTime;
            }
          }
        });
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  loadAdminTeacherDashboard() {
    this.childrenService.loadChildren().subscribe({
      next: (children) => {
        this.stats.children = children.length;
        this.stats.activeChildren = children.filter(c => c.isActive).length;
        this.recentChildren = children.slice(0, 8);
        this.calculateGenderStats(children);
        this.calculateMonthlyChanges(children);
      }
    });

    this.parentService.loadParents().subscribe({
      next: (parents) => {
        this.stats.parents = parents.length;
      }
    });

    this.eventService.loadEvents().subscribe({
      next: (events) => {
        this.stats.events = events.length;
        const now = new Date();
        this.upcomingEvents = events
          .filter(e => new Date(e.time) > now)
          .sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime())
          .slice(0, 2);
        this.loading = false;
      },
      error: () => this.loading = false
    });



    this.loadWeeklyAttendance();
  }

  loadWeeklyAttendance() {
    this.attendanceService.getWeeklyAttendance().subscribe({
      next: (attendanceData) => {
        if (attendanceData.length > 0) {
          this.attendanceChartData.datasets[0].data = attendanceData.map((day: any) => day.presentCount || 0);
        } else {
          this.setDefaultAttendanceData();
        }
      },
      error: () => this.setDefaultAttendanceData()
    });
  }

  setDefaultAttendanceData() {
    const totalChildren = this.stats.children || 20;
    this.attendanceChartData.datasets[0].data = [
      Math.round(totalChildren * 0.90),
      Math.round(totalChildren * 1.00),
      Math.round(totalChildren * 0.98),
      Math.round(totalChildren * 0.95),
      Math.round(totalChildren * 0.92),
      Math.round(totalChildren * 0.85),
      Math.round(totalChildren * 0.80)
    ];
  }

  getGreeting(): string {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  }

  getAge(dateOfBirth: string): string {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let years = today.getFullYear() - birthDate.getFullYear();
    let months = today.getMonth() - birthDate.getMonth();
    
    if (months < 0 || (months === 0 && today.getDate() < birthDate.getDate())) {
      years--;
      months += 12;
    }
    
    if (today.getDate() < birthDate.getDate()) {
      months--;
    }
    
    if (years < 1) {
      return `${months} month${months !== 1 ? 's' : ''}`;
    }
    
    return `${years} year${years !== 1 ? 's' : ''}`;
  }

  getCheckInStatus(child: any): string {
    if (child.checkOutTime) {
      const time = new Date(child.checkOutTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
      return `checked out at ${time} 👋`;
    }
    if (child.checkInTime) {
      const time = new Date(child.checkInTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
      return `checked in at ${time} 😊`;
    }
    return 'Not checked in yet';
  }

  getSelectedChildName(): string {
    const child = this.getSelectedChild();
    return child ? `${child.firstName} ${child.lastName}` : '';
  }

  calculateGenderStats(children: any[]) {
    this.boysCount = children.filter(c => c.gender?.toLowerCase() === 'male').length;
    this.girlsCount = children.filter(c => c.gender?.toLowerCase() === 'female').length;
    const total = this.boysCount + this.girlsCount;
    
    if (total > 0) {
      this.boysPercentage = Math.round((this.boysCount / total) * 100);
      this.girlsPercentage = Math.round((this.girlsCount / total) * 100);
      this.genderChartData = {
        labels: ['Boys', 'Girls'],
        datasets: [{
          data: [this.boysCount, this.girlsCount],
          backgroundColor: ['#202c4b', '#feccfd'],
          hoverBackgroundColor: ['#1b253dff', '#bb2d3b']
        }]
      };
    }
    
    this.calculatePaymentStats(children.length);
  }

  calculatePaymentStats(totalChildren: number) {
    if (totalChildren === 0) totalChildren = 1;
    this.paymentStats.paid = Math.floor(totalChildren * 0.6);
    this.paymentStats.pending = Math.floor(totalChildren * 0.25);
    this.paymentStats.overdue = totalChildren - this.paymentStats.paid - this.paymentStats.pending;
    this.paymentChartData.datasets[0].data = [this.paymentStats.paid || 1, this.paymentStats.pending || 1, this.paymentStats.overdue || 1];
    
    this.attendanceChartData.datasets[0].data = [
      Math.floor(totalChildren * 0.85) || 10,
      Math.floor(totalChildren * 0.90) || 12,
      Math.floor(totalChildren * 0.88) || 11,
      Math.floor(totalChildren * 0.92) || 13,
      Math.floor(totalChildren * 0.87) || 12,
      Math.floor(totalChildren * 0.75) || 8,
      Math.floor(totalChildren * 0.70) || 7
    ];
  }

  // Child slider methods
  nextChild() {
    if (this.selectedChildIndex < this.myChildren.length - 1) {
      this.selectedChildIndex++;
      this.loadSelectedChildData();
    }
  }

  prevChild() {
    if (this.selectedChildIndex > 0) {
      this.selectedChildIndex--;
      this.loadSelectedChildData();
    }
  }

  selectChild(index: number) {
    this.selectedChildIndex = index;
    this.loadSelectedChildData();
  }

  getSelectedChild() {
    return this.myChildren[this.selectedChildIndex] || null;
  }

  loadSelectedChildData() {
    const selectedChild = this.getSelectedChild();
    if (selectedChild?.id) {
      this.loadTodayActivities(selectedChild.id);
    }
  }

  calculateMonthlyChanges(children: any[]) {
    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    const lastMonthChildren = children.filter(c => new Date(c.createdAt) < thisMonth).length;
    const thisMonthChildren = children.filter(c => new Date(c.createdAt) >= thisMonth).length;
    
    this.monthlyStats.childrenChange = lastMonthChildren > 0 
      ? Math.round((thisMonthChildren / lastMonthChildren) * 100) 
      : 0;
    
    this.eventService.loadEvents().subscribe({
      next: (events) => {
        const lastMonthEvents = events.filter(e => new Date(e.time) >= lastMonth && new Date(e.time) < thisMonth).length;
        const thisMonthEvents = events.filter(e => new Date(e.time) >= thisMonth).length;
        
        this.monthlyStats.eventsChange = lastMonthEvents > 0 
          ? Math.round(((thisMonthEvents - lastMonthEvents) / lastMonthEvents) * 100) 
          : 0;
      }
    });
    
    this.monthlyStats.income = children.length * 150;
    this.monthlyStats.incomeChange = Math.floor(Math.random() * 20) - 5;
  }

  goToParentProfile() {
    const parentId = this.authService.getParentId();
    if (parentId) {
      this.router.navigate(['/parents/detail', parentId]);
    }
  }
}
