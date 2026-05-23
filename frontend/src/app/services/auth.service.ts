import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { EventService } from './event.service';
import { ConfigService } from './config.service';
import { NetworkService } from './network.service';
import { DbService } from './db.service';

export interface SignupRequest {
  username: string;
  password: string;
  fullName: string;
}

export interface SignupResponse {
  token: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
}

export interface UserInfo {
  id: string;
  username: string;
  fullName: string;
  createdAt: string;
}

export interface ErrorResponse {
  error: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiEndpoint = 'auth'; 

  constructor(
    private http: HttpClient,
    private eventService: EventService,
    private configService: ConfigService,
    private networkService: NetworkService,
    private db: DbService
  ) { }

  signup(credentials: SignupRequest): Observable<SignupResponse> {
    return this.http.post<SignupResponse>(this.configService.getFullApiUrl(`${this.apiEndpoint}/signup`), credentials)
      .pipe(
        catchError(this.handleError)
      );
  }

  login(credentials: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(this.configService.getFullApiUrl(`${this.apiEndpoint}/signin`), credentials)
      .pipe(
        catchError(this.handleError)
      );
  }

  getCurrentUser(): Observable<UserInfo> {
    return this.http.get<UserInfo>(this.configService.getFullApiUrl(`${this.apiEndpoint}/me`)).pipe(
      tap(user => this.cacheUser(user)),
      catchError(this.handleError)
    );
  }

  getCurrentUserOfflineFallback(): Observable<UserInfo> {
    if (this.networkService.isOnline) {
      return this.getCurrentUser();
    }
    const cached = this.getCachedUser();
    return cached ? of(cached) : throwError(() => new Error('Offline and no cached user'));
  }

  cacheUser(user: UserInfo): void {
    localStorage.setItem('cachedUser', JSON.stringify(user));
  }

  getCachedUser(): UserInfo | null {
    const raw = localStorage.getItem('cachedUser');
    return raw ? JSON.parse(raw) : null;
  }

  private handleError(error: HttpErrorResponse) {
    if (error.status === 0) {
      console.error('An error occurred:', error.error);
      return throwError(() => ({
        error: { error: 'Unable to connect to server. Please try again later.' }
      }));
    } else {
      console.error(`Backend returned code ${error.status}, body was: `, error.error);
      return throwError(() => error);
    }
  }

  saveToken(token: string): void {
    localStorage.setItem('authToken', token);
    this.eventService.notifyAuthStateChanged();
  }

  getToken(): string | null {
    return localStorage.getItem('authToken');
  }

  removeToken(): void {
    localStorage.removeItem('authToken');
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  logout(): void {
    this.removeToken();
    localStorage.removeItem('cachedUser');
    this.db.clearAllData().catch(() => {});
    this.eventService.notifyAuthStateChanged();
  }
}
