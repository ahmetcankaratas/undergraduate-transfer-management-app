import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap, catchError, of } from 'rxjs';
import { StorageService } from './storage.service';
import { User, UserRole, AuthResponse } from '../models';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly API_URL = 'http://localhost:5001/api/auth';

  private currentUser = signal<User | null>(null);
  private isAuthenticated = signal<boolean>(false);

  readonly user = this.currentUser.asReadonly();
  readonly authenticated = this.isAuthenticated.asReadonly();
  readonly userRole = computed(() => this.currentUser()?.role);

  constructor(
    private http: HttpClient,
    private router: Router,
    private storage: StorageService
  ) {
    this.loadUserFromStorage();
  }

  private loadUserFromStorage(): void {
    const user = this.storage.getUser();
    const token = this.storage.getToken();
    if (user && token) {
      this.currentUser.set(user);
      this.isAuthenticated.set(true);
    }
  }

  login(email: string, password: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.API_URL}/login`, { email, password }).pipe(
      tap((response) => {
        this.storage.setToken(response.accessToken);
        this.storage.setUser(response.user);
        this.currentUser.set(response.user);
        this.isAuthenticated.set(true);
      })
    );
  }

  register(data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role?: UserRole;
  }): Observable<User> {
    return this.http.post<User>(`${this.API_URL}/register`, data);
  }

  logout(): void {
    this.storage.clear();
    this.currentUser.set(null);
    this.isAuthenticated.set(false);
    this.router.navigate(['/auth/login']);
  }

  getProfile(): Observable<User> {
    return this.http.get<User>(`${this.API_URL}/profile`).pipe(
      tap((user) => {
        this.currentUser.set(user);
        this.storage.setUser(user);
      }),
      catchError(() => {
        this.logout();
        return of(null as any);
      })
    );
  }

  hasRole(...roles: UserRole[]): boolean {
    const userRole = this.currentUser()?.role;
    return userRole ? roles.includes(userRole) : false;
  }

  getDashboardRoute(): string {
    const role = this.currentUser()?.role;
    switch (role) {
      case UserRole.STUDENT:
        return '/student';
      case UserRole.OIDB_STAFF:
        return '/oidb';
      case UserRole.FACULTY_STAFF:
        return '/faculty';
      case UserRole.YGK_MEMBER:
        return '/ygk';
      case UserRole.ADMIN:
        return '/admin';
      default:
        return '/';
    }
  }
}
