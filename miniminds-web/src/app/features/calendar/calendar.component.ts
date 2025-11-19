import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CalendarComponent } from '../../shared/components/calendar/calendar.component';
import { TitlePage } from '../../shared/layouts/title-page/title-page';
import { EventService } from '../event/event.service';
import { EventModel } from '../event/event.interface';
import { HolidayService } from '../holiday/holiday.service';
import { Holiday } from '../holiday/holiday.interface';
import { AuthService } from '../../core/services/auth';
import { FullCalendarModule } from '@fullcalendar/angular';
import { CalendarOptions } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { Location } from '@angular/common';
import { ParentChildHeaderSimpleComponent } from '../../shared/components/parent-child-header-simple/parent-child-header-simple.component';

@Component({
  selector: 'app-calendar-page',
  imports: [CommonModule, CalendarComponent, TitlePage, FullCalendarModule, ParentChildHeaderSimpleComponent],
  templateUrl: './calendar.component.html',
  styleUrls: ['./calendar.component.scss']
})
export class CalendarPageComponent implements OnInit {
  selectedDate: Date = new Date();
  events: EventModel[] = [];
  holidays: Holiday[] = [];
  fullCalendarMonth: Date = new Date();
  fullCalendarWeeks: Date[][] = [];
  selectedEvent: EventModel | null = null;
  selectedDateEvents: EventModel[] = [];
  selectedDateHolidays: Holiday[] = [];
  showDateEventsModal = false;
  loading = false;
  displayedChildren: any[] = [];
  filteredChildren: any[] = [];
  viewMode = 'grid';
  userRole = '';
  calendarOptions: CalendarOptions = {
    plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],
    initialView: 'dayGridMonth',
    height: 'auto',
    headerToolbar: {
      left: 'prev',
      center: 'title',
      right: 'next'
    },
    events: [],
    dayCellClassNames: (arg) => {
      const cellDate = new Date(arg.date);
      cellDate.setHours(0, 0, 0, 0);
      const hasHoliday = this.holidays.some(h => {
        const holidayDate = new Date(h.date);
        holidayDate.setHours(0, 0, 0, 0);
        return cellDate.getTime() === holidayDate.getTime();
      });
      return hasHoliday ? ['holiday'] : [];
    },
    dateClick: (info) => {
      const clickedDate = new Date(info.dateStr);
      this.onDateSelected(clickedDate);
      this.selectedDateEvents = this.getEventsForDate(clickedDate);
      this.selectedDateHolidays = this.getHolidaysForDay(clickedDate);
      if (this.selectedDateEvents.length > 0 || this.selectedDateHolidays.length > 0) {
        this.showDateEventsModal = true;
      }
    },
    eventClick: (info) => {
      this.selectedEvent = this.events.find(e => e.id === parseInt(info.event.id)) || null;
    }
  };
  get isParent(): boolean {
      return this.authService.isParent();
  }
  back() {
    this.location.back();
  }
  closeEventModal() {
    this.selectedEvent = null;
  }

  closeDateEventsModal() {
    this.showDateEventsModal = false;
    this.selectedDateEvents = [];
    this.selectedDateHolidays = [];
  }
  constructor(
    private authService: AuthService,
    private eventService: EventService,
    private holidayService: HolidayService,
    private location: Location
  ) {}

  ngOnInit() {
    this.loadEvents();
    this.loadHolidays();
    this.generateFullCalendar();
  }

  loadEvents() {
    this.eventService.loadEvents().subscribe(events => {
      this.events = events;
      this.updateCalendarEvents();
    });
  }

  loadHolidays() {
    this.holidayService.getHolidays().subscribe(holidays => {
      this.holidays = holidays;
      this.updateCalendarEvents();
    });
  }

  updateCalendarEvents() {
    const eventItems = this.events.map(e => ({
      id: 'event-' + e.id?.toString(),
      title: e.name,
      start: e.time,
      backgroundColor: e.type === 'Holiday' ? '#dc3545' : '#0d6efd'
    }));

    const holidayItems = this.holidays.map(h => ({
      id: 'holiday-' + h.id?.toString(),
      title: h.name,
      start: h.date,
      backgroundColor: '#dc3545'
    }));

    this.calendarOptions.events = [...eventItems, ...holidayItems];
  }

  onDateSelected(date: Date) {
    this.selectedDate = date;
  }

  getEventsForDate(date: Date): EventModel[] {
    return this.events.filter(event => {
      const eventDate = new Date(event.time);
      return eventDate.toDateString() === date.toDateString();
    });
  }

  getUpcomingEvents(): EventModel[] {
    const now = new Date();
    return this.events
      .filter(event => new Date(event.time) > now)
      .sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime())
      .slice(0, 3);
  }

  generateFullCalendar() {
    const year = this.fullCalendarMonth.getFullYear();
    const month = this.fullCalendarMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());

    this.fullCalendarWeeks = [];
    let currentWeek: Date[] = [];

    for (let i = 0; i < 42; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      currentWeek.push(date);
      
      if (currentWeek.length === 7) {
        this.fullCalendarWeeks.push(currentWeek);
        currentWeek = [];
      }
    }
  }

  previousMonthFull() {
    this.fullCalendarMonth.setMonth(this.fullCalendarMonth.getMonth() - 1);
    this.generateFullCalendar();
  }

  nextMonthFull() {
    this.fullCalendarMonth.setMonth(this.fullCalendarMonth.getMonth() + 1);
    this.generateFullCalendar();
  }

  getFullCalendarMonthYear(): string {
    return this.fullCalendarMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }

  formatDateAttr(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  isToday(date: Date): boolean {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  }

  isPast(date: Date): boolean {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  }

  isFuture(date: Date): boolean {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date > today;
  }

  isCurrentMonth(date: Date): boolean {
    return date.getMonth() === this.fullCalendarMonth.getMonth();
  }

  getHolidaysForDay(date: Date): Holiday[] {
    return this.holidays.filter(holiday => {
      const holidayDate = new Date(holiday.date);
      return holidayDate.toDateString() === date.toDateString();
    });
  }

  getEventsForDay(date: Date): EventModel[] {
    return this.events.filter(event => {
      const eventDate = new Date(event.time);
      return eventDate.toDateString() === date.toDateString();
    });
  }

  showHolidayDetails(holiday: Holiday, event: Event) {
    event.stopPropagation();
    alert(`Holiday: ${holiday.name}\nDate: ${new Date(holiday.date).toLocaleDateString()}`);
  }

  showEventDetails(event: EventModel, clickEvent: Event) {
    clickEvent.stopPropagation();
    this.selectedEvent = event;
  }

  selectDate(date: Date) {
    this.selectedDate = date;
  }

}