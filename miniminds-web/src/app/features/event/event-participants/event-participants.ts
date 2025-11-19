import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { EventParticipant } from '../event-participants.interface';
import { EventParticipantsService } from '../event-participants.service';
import { ChildrenService } from '../../children/children.service';
import { EventService } from '../event.service';
import { AuthService } from '../../../core/services/auth';
import { ChildModel } from '../../children/children.interface';
import { EventModel } from '../event.interface';
import { TitlePage, Breadcrumb, TitleAction } from '../../../shared/layouts/title-page/title-page';

@Component({
  selector: 'app-event-participants',
  standalone: true,
  imports: [CommonModule, FormsModule, TitlePage],
  templateUrl: './event-participants.html',
  styleUrl: './event-participants.scss'
})
export class EventParticipants implements OnInit {
  eventId: number = 0;
  event: EventModel | null = null;
  participants: EventParticipant[] = [];
  availableChildren: ChildModel[] = [];
  selectedChildId: number = 0;
  loading = false;
  saving = false;

  breadcrumbs: Breadcrumb[] = [
    { label: 'Dashboard' },
    { label: 'Events', url: '/events' },
    { label: 'Participants' }
  ];

  titleActions: TitleAction[] = [];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private participantsService: EventParticipantsService,
    private childrenService: ChildrenService,
    private eventService: EventService,
    public authService: AuthService
  ) {}

  ngOnInit() {
    this.eventId = Number(this.route.snapshot.paramMap.get('id'));
    this.loadEvent();
    this.loadParticipants(); // This will also load available children
  }

  loadEvent() {
    this.eventService.getEvent(this.eventId).subscribe({
      next: (event) => {
        this.event = event;
        this.setupTitleActions();
      },
      error: (error) => {
        console.error('Error loading event:', error);
      }
    });
  }

  setupTitleActions(): void {
    this.titleActions = [
      {
        label: 'Back to Event',
        icon: 'bi bi-arrow-left',
        class: 'btn-outline-primary',
        action: () => this.router.navigate(['/events', this.eventId])
      }
    ];
  }

  loadParticipants() {
    this.loading = true;
    this.participantsService.getEventParticipants(this.eventId).subscribe({
      next: (participants) => {
        this.participants = participants;
        this.loadAvailableChildren(); // Load children after participants are loaded
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading participants:', error);
        this.loading = false;
      }
    });
  }

  loadAvailableChildren() {
    this.childrenService.loadChildren().subscribe({
      next: (children) => {
        // Filter out already registered children
        const registeredChildIds = this.participants.map(p => p.childId);
        this.availableChildren = children.filter(c => !registeredChildIds.includes(c.id!));
      },
      error: (error) => {
        console.error('Error loading children:', error);
      }
    });
  }

  addParticipant() {
    if (!this.selectedChildId) return;

    this.saving = true;
    const participant: EventParticipant = {
      eventId: this.eventId,
      childId: Number(this.selectedChildId)
    };

    console.log('Sending participant data:', participant);

    this.participantsService.registerParticipant(participant).subscribe({
      next: () => {
        this.selectedChildId = 0;
        this.loadParticipants(); // This will also reload available children
        this.saving = false;
      },
      error: (error) => {
        console.error('Error adding participant:', error);
        console.error('Error details:', error.error);
        if (error.error?.errors) {
          console.error('Validation errors:', error.error.errors);
        }
        this.saving = false;
      }
    });
  }

  removeParticipant(participantId: number) {
    if (confirm('Are you sure you want to remove this participant?')) {
      this.participantsService.removeParticipant(participantId).subscribe({
        next: () => {
          this.loadParticipants(); // This will also reload available children
        },
        error: (error) => {
          console.error('Error removing participant:', error);
        }
      });
    }
  }

  canAddParticipants(): boolean {
    return this.authService.isAdmin() || this.authService.isTeacher() || this.authService.isParent();
  }

  canRemoveParticipant(participant: EventParticipant): boolean {
    if (this.authService.isAdmin() || this.authService.isTeacher()) {
      return true;
    }
    
    if (this.authService.isParent()) {
      const parentId = this.authService.getParentId();
      return !!(participant.child?.parent?.id && parentId === participant.child.parent.id);
    }
    
    return false;
  }

  approveParticipant(participantId: number) {
    this.participantsService.approveParticipant(participantId).subscribe({
      next: () => {
        this.loadParticipants();
      },
      error: (error) => {
        console.error('Error approving participant:', error);
      }
    });
  }

  rejectParticipant(participantId: number) {
    this.participantsService.rejectParticipant(participantId).subscribe({
      next: () => {
        this.loadParticipants();
      },
      error: (error) => {
        console.error('Error rejecting participant:', error);
      }
    });
  }

  goBack() {
    this.router.navigate(['/events']);
  }
}