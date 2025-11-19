import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TitlePage, Breadcrumb } from '../../../shared/layouts/title-page/title-page';
import { FeeService } from '../fee.service';
import { ChildrenService } from '../../children/children.service';
import { CreateFeeModel } from '../fee.interface';
import { ChildModel } from '../../children/children.interface';

@Component({
  selector: 'app-add-fee',
  imports: [CommonModule, FormsModule, TitlePage],
  templateUrl: './add-fee.component.html',
  styleUrls: ['./add-fee.component.scss']
})
export class AddFeeComponent implements OnInit {
  fee: CreateFeeModel = {
    childId: 0,
    amount: 0,
    description: '',
    dueDate: '',
    feeType: 'monthly',
    notes: ''
  };

  children: ChildModel[] = [];
  loading = false;
  submitting = false;

  breadcrumbs: Breadcrumb[] = [
    { label: 'Dashboard' },
    { label: 'Fees', url: '/fees' },
    { label: 'Add Fee' }
  ];

  actions = [
    {
      label: 'Back to Fees',
      icon: 'bi bi-arrow-left',
      class: 'btn-cancel-global',
      action: () => this.cancel()
    }
  ];

  constructor(
    private router: Router,
    private feeService: FeeService,
    private childrenService: ChildrenService
  ) {}

  ngOnInit() {
    this.loadChildren();
    this.setDefaultDueDate();
  }

  loadChildren() {
    this.loading = true;
    this.childrenService.loadChildren().subscribe({
      next: (children: ChildModel[]) => {
        this.children = children;
        this.loading = false;
      },
      error: (error: any) => {
        console.error('Error loading children:', error);
        this.loading = false;
      }
    });
  }

  setDefaultDueDate() {
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    nextMonth.setDate(1);
    this.fee.dueDate = nextMonth.toISOString().split('T')[0];
  }

  onSubmit() {
    if (this.isFormValid()) {
      this.submitting = true;
      this.feeService.createFee(this.fee).subscribe({
        next: () => {
          this.router.navigate(['/fees']);
        },
        error: (error) => {
          console.error('Error creating fee:', error);
          this.submitting = false;
        }
      });
    }
  }

  isFormValid(): boolean {
    return this.fee.childId > 0 && 
           this.fee.amount > 0 && 
           this.fee.description.trim() !== '' && 
           this.fee.dueDate !== '';
  }

  cancel() {
    this.router.navigate(['/fees']);
  }
}