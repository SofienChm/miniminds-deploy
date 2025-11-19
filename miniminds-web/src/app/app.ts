import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { AuthService } from './core/services/auth';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App implements OnInit {
  protected readonly title = signal('miniminds-web');
  private translate = inject(TranslateService);
  private authService = inject(AuthService);

  constructor(private translates: TranslateService) {
  const savedLang = localStorage.getItem('lang') || 'en';
  translates.setDefaultLang('en');
  translates.use(savedLang);
}
/*

  constructor() {

    
    this.translate.addLangs(['en', 'fr', 'it']);
    this.translate.setDefaultLang('en');
    
    const savedLang = localStorage.getItem('selectedLanguage');
    if (savedLang) {
      this.translate.use(savedLang);
    } else {
      const browserLang = this.translate.getBrowserLang();
      const langToUse = browserLang?.match(/en|fr|it/) ? browserLang : 'en';
      this.translate.use(langToUse);
      localStorage.setItem('selectedLanguage', langToUse);
    }
  }*/

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(user => {
      if (user?.preferredLanguage) {
        this.translate.use(user.preferredLanguage);
        localStorage.setItem('lang', user.preferredLanguage);
      }
    });
  }
}
