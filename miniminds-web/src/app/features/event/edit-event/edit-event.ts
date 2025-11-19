import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { EventModel } from '../event.interface';
import { EventService } from '../event.service';
import { TitlePage, Breadcrumb } from '../../../shared/layouts/title-page/title-page';
import { ConfirmationModal } from '../../../shared/components/confirmation-modal/confirmation-modal';

@Component({
  selector: 'app-edit-event',
  imports: [CommonModule, FormsModule, TitlePage, ConfirmationModal],
  standalone: true,
  templateUrl: './edit-event.html',
  styleUrl: './edit-event.scss'
})
export class EditEvent implements OnInit {
  saving = false;
  loading = false;
  eventId: number = 0;
  showCancelModal = false;

  breadcrumbs: Breadcrumb[] = [
    { label: 'Dashboard' },
    { label: 'Events', url: '/events' },
    { label: 'Edit Event' }
  ];

  event: EventModel = {
    name: '',
    type: '',
    description: '',
    price: 0,
    ageFrom: 0,
    ageTo: 0,
    capacity: 0,
    time: ''
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
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    this.eventId = Number(this.route.snapshot.paramMap.get('id'));
    this.loadEvent();
  }

  loadEvent() {
    this.loading = true;
    this.eventService.getEvent(this.eventId).subscribe({
      next: (event) => {
        this.event = { ...event };
        
        // Split existing datetime into date and time parts
        if (event.time) {
          const eventDateTime = new Date(event.time);
          if (!isNaN(eventDateTime.getTime())) {
            this.eventDate = eventDateTime.toISOString().split('T')[0];
            this.eventTime = eventDateTime.toTimeString().split(' ')[0].substring(0, 5);
          }
        }
        
        // Set image preview if event has image
        if (event.image) {
          this.imagePreview = event.image;
        }
        
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading event:', error);
        this.loading = false;
        this.router.navigate(['/events']);
      }
    });
  }

  updateEvent() {
    this.saving = true;
    
    // Combine date and time into ISO string
    const combinedDateTime = `${this.eventDate}T${this.eventTime}:00`;
    let eventToUpdate = { ...this.event, time: combinedDateTime };
    
    // Add image if selected or keep existing
    if (this.selectedImage) {
      const reader = new FileReader();
      reader.onload = () => {
        eventToUpdate.image = reader.result as string;
        this.submitUpdate(eventToUpdate);
      };
      reader.readAsDataURL(this.selectedImage);
    } else {
      // Keep existing image or remove if cleared
      eventToUpdate.image = this.imagePreview || undefined;
      this.submitUpdate(eventToUpdate);
    }
  }

  private submitUpdate(eventToUpdate: any) {
    // Clean the event object to remove properties that shouldn't be sent
    const cleanEvent = {
      id: eventToUpdate.id,
      name: eventToUpdate.name,
      type: eventToUpdate.type,
      description: eventToUpdate.description,
      price: eventToUpdate.price,
      ageFrom: eventToUpdate.ageFrom,
      ageTo: eventToUpdate.ageTo,
      capacity: eventToUpdate.capacity,
      time: eventToUpdate.time,
      place: eventToUpdate.place,
      image: eventToUpdate.image
    };
    
    this.eventService.updateEvent(cleanEvent).subscribe({
      next: () => {
        this.router.navigate(['/events']);
        this.saving = false;
      },
      error: (error) => {
        console.error('Error updating event:', error);
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

  removeImage() {
    this.imagePreview = null;
    this.selectedImage = null;
    // Clear the file input
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  }

  cancel() {
    this.showCancelModal = true;
  }

  confirmCancel() {
    this.showCancelModal = false;
    this.router.navigate(['/events']);
  }

  closeCancelModal() {
    this.showCancelModal = false;
  }
}
