import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TitlePage, TitleAction, Breadcrumb } from '../../shared/layouts/title-page/title-page';
import { FeeService } from './fee.service';
import { ChildrenService } from '../children/children.service';
import { FeeModel, FeesSummary, CreateFeeModel } from './fee.interface';
import { ChildModel } from '../children/children.interface';
import Swal from 'sweetalert2';
import { Location } from '@angular/common';
import { AuthService } from '../../core/services/auth';
import { ParentChildHeaderSimpleComponent } from '../../shared/components/parent-child-header-simple/parent-child-header-simple.component';

@Component({
  selector: 'app-fee',
  imports: [CommonModule, TitlePage, FormsModule, ParentChildHeaderSimpleComponent],
  templateUrl: './fee.component.html',
  styleUrls: ['./fee.component.scss']
})
export class FeeComponent implements OnInit {
  fees: FeeModel[] = [];
  displayedFees: FeeModel[] = [];
  children: ChildModel[] = [];
  summary: FeesSummary | null = null;
  loading = false;
  showExportDropdown = false;
  showAddFeeModal = false;
  showBulkFeeModal = false;
  showPaymentModal = false;
  selectedFee: FeeModel | null = null;
  feesPerPage = 9;
  currentPage = 1;

  // Filter options
  filterStatus = 'all';
  filterChild = 'all';
  searchTerm = '';

  // New fee form
  newFee: CreateFeeModel = {
    childId: 0,
    amount: 0,
    description: '',
    dueDate: '',
    feeType: 'monthly'
  };

  // Bulk fee form
  bulkFee = {
    amount: 0,
    description: 'Monthly Fee',
    dueDate: ''
  };

  // Payment form
  paymentData = {
    paidDate: new Date().toISOString().split('T')[0],
    paymentNotes: ''
  };

  breadcrumbs: Breadcrumb[] = [
    { label: 'Dashboard' },
    { label: 'Fees' }
  ];

  titleActions: TitleAction[] = [
    {
      label: 'Update Overdue',
      class: 'btn btn-warning me-2 btn-update-overdue',
      action: () => this.updateOverdueFees()
    },
    {
      label: 'Bulk Monthly Fee',
      class: 'btn btn-info me-2 btn-bulk-monthly-fee',
      action: () => this.openBulkFeeModal()
    },
    {
      label: 'Add Fee',
      class: 'btn btn-primary btn-add-fee',
      action: () => this.navigateToAddFee()
    }
  ];


  constructor(
    private router: Router,
    private feeService: FeeService,
    private childrenService: ChildrenService,
    private location: Location,
    private authService: AuthService
  ) {}

  ngOnInit() {    
    this.loadData();
  }
  back() {
    this.location.back();
  }

  loadData() {
    this.loading = true;
    Promise.all([
      this.loadFees(),
      this.loadChildren(),
      this.loadSummary()
    ]).finally(() => {
      this.loading = false;
    });
  }

  loadFees() {
    return this.feeService.getFees().toPromise().then((fees: FeeModel[] | undefined) => {
      this.fees = fees || [];
    }).catch((error: any) => {
      console.error('Error loading fees:', error);
      this.fees = [];
    });
  }

  loadChildren() {
    return this.childrenService.loadChildren().toPromise().then((children: ChildModel[] | undefined) => {
      this.children = children || [];
    }).catch((error: any) => {
      console.error('Error loading children:', error);
      this.children = [];
    });
  }

  loadSummary() {
    return this.feeService.getFeesSummary().toPromise().then((summary: FeesSummary | undefined) => {
      this.summary = summary || null;
    }).catch((error: any) => {
      console.error('Error loading summary:', error);
    });
  }

  get filteredFees() {
    const filtered = this.fees.filter(fee => {
      const matchesStatus = this.filterStatus === 'all' || fee.status === this.filterStatus;
      const matchesChild = this.filterChild === 'all' || fee.childId.toString() === this.filterChild;
      const matchesSearch = !this.searchTerm || 
        fee.childName?.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        fee.parentName?.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        fee.description.toLowerCase().includes(this.searchTerm.toLowerCase());
      
      return matchesStatus && matchesChild && matchesSearch;
    });
    
    this.updateDisplayedFees(filtered);
    return this.displayedFees;
  }

  updateDisplayedFees(filtered: FeeModel[]) {
    const endIndex = this.currentPage * this.feesPerPage;
    this.displayedFees = filtered.slice(0, endIndex);
  }

  loadMoreFees() {
    this.currentPage++;
    // Trigger getter to update displayed fees
    const _ = this.filteredFees;
  }

  hasMoreFees(): boolean {
    const filtered = this.fees.filter(fee => {
      const matchesStatus = this.filterStatus === 'all' || fee.status === this.filterStatus;
      const matchesChild = this.filterChild === 'all' || fee.childId.toString() === this.filterChild;
      const matchesSearch = !this.searchTerm || 
        fee.childName?.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        fee.parentName?.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        fee.description.toLowerCase().includes(this.searchTerm.toLowerCase());
      
      return matchesStatus && matchesChild && matchesSearch;
    });
    return this.displayedFees.length < filtered.length;
  }

  navigateToAddFee() {
    this.router.navigate(['/fees/add']);
  }

  navigateToDetail(feeId: number) {
    this.router.navigate(['/fees/detail', feeId]);
  }

  navigateToEdit(feeId: number) {
    this.router.navigate(['/fees/edit', feeId]);
  }

  openBulkFeeModal() {
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    nextMonth.setDate(1);
    
    this.bulkFee = {
      amount: 0,
      description: `Monthly Fee - ${nextMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`,
      dueDate: nextMonth.toISOString().split('T')[0]
    };
    this.showBulkFeeModal = true;
  }

  openPaymentModal(fee: FeeModel) {
    this.selectedFee = fee;
    this.paymentData = {
      paidDate: new Date().toISOString().split('T')[0],
      paymentNotes: ''
    };
    this.showPaymentModal = true;
  }

  createFee() {
    if (this.newFee.childId && this.newFee.amount && this.newFee.description && this.newFee.dueDate) {
      this.feeService.createFee(this.newFee).subscribe({
        next: () => {
          this.showAddFeeModal = false;
          this.loadData();
        },
        error: (error) => {
          console.error('Error creating fee:', error);
        }
      });
    }
  }

  createBulkFees() {
    if (this.bulkFee.amount && this.bulkFee.description && this.bulkFee.dueDate) {
      this.feeService.createMonthlyFeesForAll(
        this.bulkFee.amount,
        this.bulkFee.description,
        this.bulkFee.dueDate
      ).subscribe({
        next: (result) => {
          this.showBulkFeeModal = false;
          this.loadData();
          alert(`Created ${result.count} monthly fees successfully!`);
        },
        error: (error) => {
          console.error('Error creating bulk fees:', error);
        }
      });
    }
  }

  payFee() {
    if (this.selectedFee) {
      this.feeService.payFee(this.selectedFee.id!, {
        feeId: this.selectedFee.id!,
        paidDate: this.paymentData.paidDate,
        paymentNotes: this.paymentData.paymentNotes
      }).subscribe({
        next: () => {
          this.showPaymentModal = false;
          this.loadData();
        },
        error: (error) => {
          console.error('Error paying fee:', error);
        }
      });
    }
  }

  updateOverdueFees() {
    Swal.fire({
      title: 'Update Overdue Fees?',
      text: 'This will mark all pending fees past their due date as overdue.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, update them!'
    }).then((result) => {
      if (result.isConfirmed) {
        this.feeService.updateOverdueFees().subscribe({
          next: (result) => {
            this.loadData();
            Swal.fire('Updated!', `${result.count} fees marked as overdue`, 'success');
          },
          error: (error) => {
            console.error('Error updating overdue fees:', error);
            Swal.fire('Error!', 'Failed to update overdue fees', 'error');
          }
        });
      }
    });
  }

  deleteFee(fee: FeeModel) {
    if (confirm(`Are you sure you want to delete this fee for ${fee.childName}?`)) {
      this.feeService.deleteFee(fee.id!).subscribe({
        next: () => {
          this.loadData();
        },
        error: (error) => {
          console.error('Error deleting fee:', error);
        }
      });
    }
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'paid': return 'badge bg-success';
      case 'overdue': return 'badge bg-danger';
      case 'pending': return 'badge bg-warning';
      default: return 'badge bg-secondary';
    }
  }

  getFeeTypeClass(feeType: string): string {
    switch (feeType) {
      case 'monthly': return 'badge bg-primary';
      case 'one-time': return 'badge bg-info';
      case 'late-fee': return 'badge bg-danger';
      default: return 'badge bg-secondary';
    }
  }

  toggleExportDropdown() {
    this.showExportDropdown = !this.showExportDropdown;
  }

  exportAsPDF() {
    console.log('Exporting fees as PDF...');
    this.showExportDropdown = false;
  }

  exportAsExcel() {
    console.log('Exporting fees as Excel...');
    this.showExportDropdown = false;
  }
  get isParent(): boolean {
    return this.authService.getUserRole() === 'Parent';
  }
}