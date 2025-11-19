import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HolidayService } from './holiday.service';
import { Holiday } from './holiday.interface';
import { TitlePage } from '../../shared/layouts/title-page/title-page';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-holiday',
  standalone: true,
  imports: [CommonModule, RouterModule, TitlePage, ReactiveFormsModule],
  templateUrl: './holiday.component.html',
  styleUrls: ['./holiday.component.scss']
})
export class HolidayComponent implements OnInit {
  holidays: Holiday[] = [];
  displayedHolidays: Holiday[] = [];
  selectedHoliday: Holiday | null = null;
  showDetailModal = false;
  showEditModal = false;
  holidayForm: FormGroup;
  holidaysPerPage = 9;
  currentPage = 1;

  constructor(
    private holidayService: HolidayService,
    private router: Router,
    private fb: FormBuilder
  ) {
    this.holidayForm = this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(100)]],
      description: ['', Validators.maxLength(500)],
      date: ['', Validators.required],
      isRecurring: [false],
      recurrenceType: [''],
      color: ['#FF6B6B', Validators.required]
    });
  }

  ngOnInit() {
    this.loadHolidays();
  }

  loadHolidays() {
    this.holidayService.getHolidays().subscribe(holidays => {
      this.holidays = holidays;
      this.currentPage = 1;
      this.updateDisplayedHolidays();
    });
  }

  updateDisplayedHolidays() {
    const endIndex = this.currentPage * this.holidaysPerPage;
    this.displayedHolidays = this.holidays.slice(0, endIndex);
  }

  loadMoreHolidays() {
    this.currentPage++;
    this.updateDisplayedHolidays();
  }

  hasMoreHolidays(): boolean {
    return this.displayedHolidays.length < this.holidays.length;
  }

  showDetail(holiday: Holiday) {
    this.selectedHoliday = holiday;
    this.showDetailModal = true;
  }

  closeModal() {
    this.showDetailModal = false;
    this.selectedHoliday = null;
  }

  editHoliday(holiday: Holiday) {
    this.selectedHoliday = holiday;
    this.holidayForm.patchValue({
      name: holiday.name,
      description: holiday.description,
      date: holiday.date.split('T')[0],
      isRecurring: holiday.isRecurring,
      recurrenceType: holiday.recurrenceType,
      color: holiday.color
    });
    this.showEditModal = true;
  }

  closeEditModal() {
    this.showEditModal = false;
    this.selectedHoliday = null;
    this.holidayForm.reset();
  }

  onSubmit() {
    if (this.holidayForm.valid && this.selectedHoliday?.id) {
      const updatedHoliday = { ...this.holidayForm.value, id: this.selectedHoliday.id };
      this.holidayService.updateHoliday(this.selectedHoliday.id, updatedHoliday).subscribe({
        next: () => {
          this.closeEditModal();
          this.loadHolidays();
          Swal.fire({
            icon: 'success',
            title: 'Success!',
            text: 'Holiday updated successfully',
            timer: 2000,
            showConfirmButton: false
          });
        },
        error: (error) => {
          console.error('Error updating holiday:', error);
          Swal.fire({
            icon: 'error',
            title: 'Error!',
            text: 'Failed to update holiday'
          });
        }
      });
    }
  }

  deleteHoliday(id: number) {
    if (confirm('Are you sure you want to delete this holiday?')) {
      this.holidayService.deleteHoliday(id).subscribe(() => {
        this.loadHolidays();
      });
    }
  }

  addHoliday = () => {
    this.router.navigate(['/holidays/add']);
  }
}