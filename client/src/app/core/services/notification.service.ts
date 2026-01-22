import { Injectable, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { Notification } from '../models';

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  private readonly API_URL = 'http://localhost:5001/api/notifications';

  private unreadCount = signal<number>(0);
  readonly count = this.unreadCount.asReadonly();

  constructor(private http: HttpClient) {}

  getAll(unreadOnly = false): Observable<Notification[]> {
    const params = new HttpParams().set('unreadOnly', unreadOnly.toString());
    return this.http.get<Notification[]>(this.API_URL, { params });
  }

  getUnreadCount(): Observable<{ count: number }> {
    return this.http.get<{ count: number }>(`${this.API_URL}/count`).pipe(
      tap((response) => this.unreadCount.set(response.count))
    );
  }

  markAsRead(id: string): Observable<Notification> {
    return this.http.post<Notification>(`${this.API_URL}/${id}/read`, {}).pipe(
      tap(() => {
        const currentCount = this.unreadCount();
        if (currentCount > 0) {
          this.unreadCount.set(currentCount - 1);
        }
      })
    );
  }

  markAllAsRead(): Observable<void> {
    return this.http.post<void>(`${this.API_URL}/read-all`, {}).pipe(
      tap(() => this.unreadCount.set(0))
    );
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/${id}`);
  }
}
