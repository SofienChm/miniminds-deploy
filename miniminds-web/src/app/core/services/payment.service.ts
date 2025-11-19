import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class PaymentService {
  private apiUrl = `${environment.apiUrl}/api/Payment`;

  constructor(private http: HttpClient) {}

  createCheckoutSession(feeId: number): Observable<{ sessionId: string; url: string }> {
    return this.http.post<{ sessionId: string; url: string }>(
      `${this.apiUrl}/create-checkout-session/${feeId}`,
      {}
    );
  }
}
