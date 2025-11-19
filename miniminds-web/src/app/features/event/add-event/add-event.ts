import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { EventModel } from '../event.interface';
import { EventService } from '../event.service';
import { TitlePage, Breadcrumb } from '../../../shared/layouts/title-page/title-page';

@Component({
  selector: 'app-add-event',
  imports: [CommonModule, FormsModule, TitlePage],
  standalone: true,
  templateUrl: './add-event.html',
  styleUrl: './add-event.scss'
})
export class AddEvent {
  saving = false;

  breadcrumbs: Breadcrumb[] = [
    { label: 'Dashboard' },
    { label: 'Events', url: '/events' },
    { label: 'Add Event' }
  ];

  newEvent: EventModel = {
    name: '',
    type: '',
    description: '',
    price: 0,
    ageFrom: 0,
    ageTo: 0,
    capacity: 0,
    time: '',
    image: ''
  };

  eventDate: string = '';
  eventTime: string = '';
  imagePreview: string | null = null;
  selectedImage: File | null = null;

  eventTypes = [
    'Workshop',
    'Party',
    'Educational',
    'Sports',
    'Arts & Crafts',
    'Music',
    'Outdoor',
    'Special Event'
  ];

  constructor(
    private eventService: EventService,
    private router: Router
  ) {}

  saveEvent() {
    this.saving = true;
    
    // Combine date and time into ISO string
    const combinedDateTime = `${this.eventDate}T${this.eventTime}:00`;
    let eventToSave = { ...this.newEvent, time: combinedDateTime };
    
    // Convert image to base64 if selected
    if (this.selectedImage) {
      const reader = new FileReader();
      reader.onload = () => {
        eventToSave.image = reader.result as string;
        this.submitEvent(eventToSave);
      };
      reader.readAsDataURL(this.selectedImage);
    } else {
      this.submitEvent(eventToSave);
    }
  }

  private submitEvent(eventToSave: any) {
    this.eventService.addEvent(eventToSave).subscribe({
      next: () => {
        this.router.navigate(['/events']);
        this.saving = false;
      },
      error: (error) => {
        console.error('Error saving event:', error);
        this.saving = false;
      }
    });
  }

  onImageSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.selectedImage = file;
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.imagePreview = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }

  cancel() {
    this.router.navigate(['/events']);
  }
}
