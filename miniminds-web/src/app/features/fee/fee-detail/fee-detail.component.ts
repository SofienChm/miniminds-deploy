import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { TitlePage, Breadcrumb } from '../../../shared/layouts/title-page/title-page';
import { FeeService } from '../fee.service';
import { FeeModel } from '../fee.interface';
import { PaymentService } from '../../../core/services/payment.service';
import { AuthService } from '../../../core/services/auth';
import { ParentChildHeaderSimpleComponent } from '../../../shared/components/parent-child-header-simple/parent-child-header-simple.component';
import { Location } from '@angular/common';

@Component({
  selector: 'app-fee-detail',
  imports: [CommonModule, TitlePage, ParentChildHeaderSimpleComponent],
  templateUrl: './fee-detail.component.html',
  styleUrls: ['./fee-detail.component.scss']
})
export class FeeDetailComponent implements OnInit {
  fee: FeeModel | null = null;
  loading = false;
  feeId: number = 0;

  breadcrumbs: Breadcrumb[] = [
    { label: 'Dashboard' },
    { label: 'Fees', url: '/fees' },
    { label: 'Fee Detail' }
  ];


  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private feeService: FeeService,
    private paymentService: PaymentService,
    private authService: AuthService,
    private location: Location
  ) {}

  ngOnInit() {
    this.feeId = Number(this.route.snapshot.paramMap.get('id'));
    this.loadFee();
  }

  back() {
    this.location.back();
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

  goBack() {
    this.router.navigate(['/fees']);
  }

  editFee() {
    this.router.navigate(['/fees/edit', this.feeId]);
  }

  print() {
    window.print();
  }

  payOnline() {
    if (!this.fee || !this.fee.id) return;
    
    this.loading = true;
    this.paymentService.createCheckoutSession(this.fee.id).subscribe({
      next: (response) => {
        window.location.href = response.url;
      },
      error: (error) => {
        console.error('Error creating checkout session:', error);
        alert('Failed to initiate payment. Please try again.');
        this.loading = false;
      }
    });
  }

  isParent(): boolean {
    return this.authService.getUserRole() === 'Parent';
  }
}
