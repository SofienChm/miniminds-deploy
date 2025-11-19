import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MessagesService, MailMessage, Recipient } from '../../core/services/messages.service';
import { AuthService } from '../../core/services/auth';
import { Location } from '@angular/common';
import { TitlePage } from "../../shared/layouts/title-page/title-page";
@Component({
  selector: 'app-messages',
  standalone: true,
  imports: [CommonModule, FormsModule, TitlePage],
  templateUrl: './messages.component.html',
  styleUrl: './messages.component.scss'
})
export class MessagesComponent implements OnInit {
  view: 'inbox' | 'sent' | 'compose' | 'view' = 'inbox';
  inbox: MailMessage[] = [];
  sent: MailMessage[] = [];
  selectedMessage: any = null;
  isAdmin = false;
  currentUserId = '';
  
  composeForm = {
    recipientType: 'individual',
    recipientId: '',
    subject: '',
    content: ''
  };
  back() {
    this.location.back();
  }
  recipients: { parents: Recipient[], teachers: Recipient[] } = { parents: [], teachers: [] };

  constructor(
    private messagesService: MessagesService,
    private authService: AuthService,
    private location: Location
  ) {}

  ngOnInit(): void {
    this.currentUserId = this.getCurrentUserId();
    this.isAdmin = this.getUserRole() === 'Admin';
    this.loadInbox();
    if (this.isAdmin) {
      this.loadRecipients();
    }
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

  private getUserRole(): string {
    const token = localStorage.getItem('token');
    if (!token) return '';
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] || '';
    } catch {
      return '';
    }
  }

  loadInbox(): void {
    this.messagesService.getInbox().subscribe({
      next: (messages) => this.inbox = messages,
      error: (err) => console.error('Error loading inbox:', err)
    });
  }

  loadSent(): void {
    this.messagesService.getSent().subscribe({
      next: (messages) => this.sent = messages,
      error: (err) => console.error('Error loading sent:', err)
    });
  }

  loadRecipients(): void {
    this.messagesService.getRecipients().subscribe({
      next: (data) => this.recipients = data,
      error: (err) => console.error('Error loading recipients:', err)
    });
  }

  switchView(view: 'inbox' | 'sent' | 'compose'): void {
    this.view = view;
    if (view === 'inbox') this.loadInbox();
    if (view === 'sent') this.loadSent();
    if (view === 'compose') this.resetComposeForm();
  }

  viewMessage(message: MailMessage): void {
    this.messagesService.getMessage(message.id).subscribe({
      next: (data) => {
        this.selectedMessage = data;
        this.view = 'view';
      },
      error: (err) => console.error('Error loading message:', err)
    });
  }

  resetComposeForm(): void {
    this.composeForm = {
      recipientType: 'individual',
      recipientId: '',
      subject: '',
      content: ''
    };
  }

  sendMessage(): void {
    if (!this.composeForm.subject || !this.composeForm.content) return;
    
    this.messagesService.sendMessage(this.composeForm).subscribe({
      next: () => {
        this.switchView('sent');
      },
      error: (err) => console.error('Error sending message:', err)
    });
  }

  reply(): void {
    this.composeForm = {
      recipientType: 'individual',
      recipientId: this.selectedMessage.senderId,
      subject: 'Re: ' + this.selectedMessage.subject,
      content: ''
    };
    this.view = 'compose';
  }

  getRecipientsList(): Recipient[] {
    return [...this.recipients.parents, ...this.recipients.teachers];
  }
  get isParent(): boolean {
      return this.authService.isParent();
  }
}
