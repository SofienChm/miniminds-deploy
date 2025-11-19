import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReclamationsService, Reclamation, ReclamationUser } from './reclamations.service';
import { AuthService } from '../../core/services/auth';
import { TitlePage } from "../../shared/layouts/title-page/title-page";

@Component({
  selector: 'app-reclamations',
  standalone: true,
  imports: [CommonModule, FormsModule, TitlePage],
  templateUrl: './reclamations.component.html',
  styleUrls: ['./reclamations.component.scss']
})
export class ReclamationsComponent implements OnInit, OnDestroy {
  users: ReclamationUser[] = [];
  sentReclamations: Reclamation[] = [];
  receivedReclamations: Reclamation[] = [];
  selectedReclamation: Reclamation | null = null;
  showModal = false;
  showNewReclamationModal = false;
  searchTerm = '';
  newReclamation = {
    recipientId: '',
    subject: '',
    content: ''
  };
  responseText = '';
  currentUserId = '';
  showUserList = false;
  activeTab: 'sent' | 'received' = 'received';

  constructor(
    private reclamationsService: ReclamationsService,
    public authService: AuthService
  ) {}

  ngOnInit(): void {
    this.currentUserId = this.getCurrentUserId();
    this.loadUsers();
    this.loadReclamations();
    this.autoSelectAdminForParents();
  }

  private autoSelectAdminForParents(): void {
    if (this.authService.isParent()) {
      this.reclamationsService.getUsers().subscribe({
        next: (users) => {
          const admin = users.find(u => u.email === 'admin@daycare.com');
          if (admin) {
            this.newReclamation.recipientId = admin.id;
            console.log('Set recipientId to admin:', admin.id);
          } else {
            console.error('Admin user not found. Please ensure admin@daycare.com exists.');
          }
        },
        error: (err) => console.error('Error loading users:', err)
      });
    }
  }

  ngOnDestroy(): void {
  }

  private getCurrentUserId(): string {
    const token = localStorage.getItem('token');
    if (!token) return '';
    
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const claims = payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'];
      return Array.isArray(claims) ? claims[claims.length - 1] : claims || '';
    } catch {
      return '';
    }
  }

  loadUsers(): void {
    this.reclamationsService.getUsers().subscribe({
      next: (users) => this.users = users,
      error: (err) => console.error('Error loading users:', err)
    });
  }

  loadReclamations(): void {
    this.reclamationsService.getSentReclamations().subscribe({
      next: (reclamations) => this.sentReclamations = reclamations,
      error: (err) => console.error('Error loading sent reclamations:', err)
    });
    
    this.reclamationsService.getReceivedReclamations().subscribe({
      next: (reclamations) => this.receivedReclamations = reclamations,
      error: (err) => console.error('Error loading received reclamations:', err)
    });
  }

  selectReclamation(reclamation: Reclamation): void {
    this.selectedReclamation = reclamation;
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.selectedReclamation = null;
  }

  openNewReclamationModal(): void {
    this.showNewReclamationModal = true;
  }

  closeNewReclamationModal(): void {
    this.showNewReclamationModal = false;
  }

  filteredUsers(): ReclamationUser[] {
    if (!this.searchTerm.trim()) return this.users;
    const term = this.searchTerm.toLowerCase();
    return this.users.filter(u => 
      u.name?.toLowerCase().includes(term) || u.email?.toLowerCase().includes(term)
    );
  }

  send(): void {
    console.log('Send clicked', this.newReclamation);
    
    if (!this.newReclamation.recipientId || 
        !this.newReclamation.subject.trim() || 
        !this.newReclamation.content.trim()) {
      console.log('Validation failed', {
        recipientId: this.newReclamation.recipientId,
        subject: this.newReclamation.subject,
        content: this.newReclamation.content
      });
      return;
    }
    
    const { recipientId, subject, content } = this.newReclamation;
    
    this.reclamationsService.sendReclamation(recipientId, subject, content).subscribe({
      next: () => {
        console.log('Reclamation sent successfully');
        this.newReclamation.subject = '';
        this.newReclamation.content = '';
        this.loadReclamations();
        this.autoSelectAdminForParents();
        this.closeNewReclamationModal();
      },
      error: (err) => console.error('Error sending reclamation:', err)
    });
  }

  resolve(): void {
    if (!this.selectedReclamation || !this.responseText.trim()) return;
    
    this.reclamationsService.resolveReclamation(this.selectedReclamation.id!, this.responseText).subscribe({
      next: () => {
        this.responseText = '';
        this.loadReclamations();
        // Reload the selected reclamation to get updated status
        if (this.selectedReclamation) {
          this.reclamationsService.getReclamation(this.selectedReclamation.id!).subscribe({
            next: (reclamation) => this.selectedReclamation = reclamation,
            error: (err) => console.error('Error reloading reclamation:', err)
          });
        }
      },
      error: (err) => console.error('Error resolving reclamation:', err)
    });
  }

  formatDate(date: string | Date | undefined): string {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  getUserById(userId: string): ReclamationUser | undefined {
    return this.users.find(u => u.id === userId);
  }

  getUserName(userId: string): string {
    const user = this.getUserById(userId);
    return user ? user.name : 'Unknown User';
  }

  switchTab(tab: 'sent' | 'received'): void {
    this.activeTab = tab;
  }
  get isParent(): boolean {
      return this.authService.isParent();
  }

  get activeReclamations(): Reclamation[] {
    return this.activeTab === 'sent' ? this.sentReclamations : this.receivedReclamations;
  }
}