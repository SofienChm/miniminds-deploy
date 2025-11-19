import { Component } from '@angular/core';
import { LoginRequest } from '../../../core/interfaces/dto/login-request-dto';
import { AuthService } from '../../../core/services/auth';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-login',
  imports: [CommonModule, FormsModule, RouterModule],
  standalone: true,
  templateUrl: './login.html',
  styleUrl: './login.scss'
})
export class Login {
  credentials: LoginRequest = {
    email: '',
    password: ''
  };
  errorMessage = '';
  isLoading = false;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  onSubmit(): void {
    this.errorMessage = '';
    this.isLoading = true;

    this.authService.login(this.credentials).subscribe({
      next: () => {
        this.router.navigate(['/dashboard']);
      },
      error: (error) => {
        this.errorMessage = error.error?.message || 'Login failed. Please check your credentials.';
        this.isLoading = false;
      },
      complete: () => {
        this.isLoading = false;
      }
    });
  }
}