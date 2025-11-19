import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { TitlePage, Breadcrumb } from '../../shared/layouts/title-page/title-page';
import { PrefixService } from '../../core/services/prefix/prefix.service';
import { AuthService } from '../../core/services/auth';
import { LanguageService } from '../../core/services/langauge-service';
import Swal from 'sweetalert2';
import { environment } from '../../../environments/environment.development';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, TranslateModule, FormsModule, TitlePage],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.scss'
})
export class SettingsComponent implements OnInit {
  private translate = inject(TranslateService);
  private prefixService = inject(PrefixService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private http = inject(HttpClient);
  private readonly languageService = inject(LanguageService);

  isAdmin = false;
  
  languages = [
    { code: 'en', name: 'English', flag: '🇬🇧' },
    { code: 'fr', name: 'Français', flag: '🇫🇷' },
    { code: 'it', name: 'Italiano', flag: '🇮🇹' }
  ];

  currencies = [
    { code: 'USD', symbol: '$', name: 'US Dollar' },
    { code: 'EUR', symbol: '€', name: 'Euro' },
    { code: 'GBP', symbol: '£', name: 'British Pound' }
  ];

  countries = [
    { code: 'US', name: 'United States', flag: '🇺🇸' },
    { code: 'FR', name: 'France', flag: '🇫🇷' },
    { code: 'IT', name: 'Italy', flag: '🇮🇹' },
    { code: 'CA', name: 'Canada', flag: '🇨🇦' }
  ];

  selectedCurrency: string = localStorage.getItem('selectedCurrency') || 'USD';
  selectedCountry: string = localStorage.getItem('selectedCountry') || 'US';
  childPrefix: string = this.prefixService.getChildPrefix();
  parentPrefix: string = this.prefixService.getParentPrefix();
  educatorPrefix: string = this.prefixService.getEducatorPrefix();
  defaultAnnualLeaveDays: number = 30;
  defaultMedicalLeaveDays: number = 10;

  breadcrumbs: Breadcrumb[] = [
    { label: 'Dashboard' },
    { label: 'Settings' }
  ];

  ngOnInit(): void {
    this.isAdmin = this.authService.isAdmin();
    if (this.isAdmin) {
      this.loadLeaveSettings();
    }
  }

  loadLeaveSettings(): void {
    this.http.get<any>(`${environment.apiUrl}/api/settings/DefaultAnnualLeaveDays`).subscribe({
      next: (setting) => this.defaultAnnualLeaveDays = parseInt(setting.value),
      error: () => this.defaultAnnualLeaveDays = 30
    });
    this.http.get<any>(`${environment.apiUrl}/api/settings/DefaultMedicalLeaveDays`).subscribe({
      next: (setting) => this.defaultMedicalLeaveDays = parseInt(setting.value),
      error: () => this.defaultMedicalLeaveDays = 10
    });
  }

  saveLeaveSettings(): void {
    this.http.put(`${environment.apiUrl}/api/settings/DefaultAnnualLeaveDays`, { value: this.defaultAnnualLeaveDays.toString() }).subscribe();
    this.http.put(`${environment.apiUrl}/api/settings/DefaultMedicalLeaveDays`, { value: this.defaultMedicalLeaveDays.toString() }).subscribe({
      next: () => {
        Swal.fire({
          icon: 'success',
          title: 'Success!',
          text: 'Leave settings saved successfully!',
          timer: 2000,
          showConfirmButton: false
        });
      },
      error: () => {
        Swal.fire({
          icon: 'error',
          title: 'Error!',
          text: 'Failed to save leave settings',
          confirmButtonColor: '#d33'
        });
      }
    });
  }

  get currentLang(): string {
    return this.translate.currentLang;
  }

  switchLanguage(lang: string): void {
    this.translate.use(lang);
  }

  onCurrencyChange(): void {
    localStorage.setItem('selectedCurrency', this.selectedCurrency);
  }

  onCountryChange(): void {
    localStorage.setItem('selectedCountry', this.selectedCountry);
  }

  onPrefixChange(type: string): void {
    if (type === 'child') localStorage.setItem('childPrefix', this.childPrefix);
    if (type === 'parent') localStorage.setItem('parentPrefix', this.parentPrefix);
    if (type === 'educator') localStorage.setItem('educatorPrefix', this.educatorPrefix);
  }

/*  saveLanguage(): void {
    localStorage.setItem('lang', this.currentLang);
    
    this.authService.updateLanguage(this.currentLang)
      .subscribe({
        next: () => alert('Language saved successfully!'),
        error: (err) => {
          console.error('Failed to save language', err);
          alert('Language saved locally but failed to sync to server');
        }
      });
  }*/

    saveLanguage(): void {
    this.languageService.use(this.currentLang);

    this.authService.updateLanguage(this.currentLang)
      .subscribe({
        next: () => {
          Swal.fire({
            icon: 'success',
            title: 'Success!',
            text: 'Language saved successfully!',
            timer: 2000,
            showConfirmButton: false
          });
        },
        error: () => {
          Swal.fire({
            icon: 'warning',
            title: 'Partial Success',
            text: 'Saved locally but failed to sync to server',
            timer: 2000
          });
        }
      });
  }


  saveSettings(): void {
    localStorage.setItem('selectedCurrency', this.selectedCurrency);
    localStorage.setItem('selectedCountry', this.selectedCountry);
    this.prefixService.setChildPrefix(this.childPrefix);
    this.prefixService.setParentPrefix(this.parentPrefix);
    this.prefixService.setEducatorPrefix(this.educatorPrefix);
    Swal.fire({
      icon: 'success',
      title: 'Success!',
      text: 'Settings saved successfully!',
      timer: 2000,
      showConfirmButton: false
    });
  }
}
