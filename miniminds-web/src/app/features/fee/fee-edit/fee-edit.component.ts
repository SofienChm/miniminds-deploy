import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { TitlePage, Breadcrumb } from '../../../shared/layouts/title-page/title-page';
import { FeeService } from '../fee.service';
import { ChildrenService } from '../../children/children.service';
import { FeeModel } from '../fee.interface';
import { ChildModel } from '../../children/children.interface';

@Component({
  selector: 'app-fee-edit',
  imports: [CommonModule, FormsModule, TitlePage],
  templateUrl: './fee-edit.component.html',
  styleUrls: ['./fee-edit.component.scss']
})
export class FeeEditComponent implements OnInit {
  fee: FeeModel = {
    id: 0,
    childId: 0,
    amount: 0,
    description: '',
    dueDate: '',
    feeType: 'monthly',
    status: 'pending'
  };

  children: ChildModel[] = [];
  loading = false;
  submitting = false;
  feeId: number = 0;

  breadcrumbs: Breadcrumb[] = [
    { label: 'Dashboard' },
    { label: 'Fees', url: '/fees' },
    { label: 'Edit Fee' }
  ];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private feeService: FeeService,
    private childrenService: ChildrenService
  ) {}

  ngOnInit() {
    this.feeId = Number(this.route.snapshot.paramMap.get('id'));
    this.loadChildren();
    this.loadFee();
  }

  loadChildren() {
    this.childrenService.loadChildren().subscribe({
      next: (children: ChildModel[]) => {
        this.children = children;
      },
      error: (error: any) => {
        console.error('Error loading children:', error);
      }
    });
  }

  loadFee() {
    this.loading = true;
    this.feeService.getFeeById(this.feeId).subscribe({
      next: (fee) => {
        this.fee = fee;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading fee:', error);
        this.loading = false;
      }
    });
  }

  onSubmit() {
    if (this.isFormValid()) {
      this.submitting = true;
      this.feeService.updateFee(this.feeId, this.fee).subscribe({
        next: () => {
          this.router.navigate(['/fees']);
        },
        error: (error) => {
          console.error('Error updating fee:', error);
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
