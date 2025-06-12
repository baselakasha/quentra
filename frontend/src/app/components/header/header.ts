import { Component, OnInit, OnDestroy } from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService, UserInfo } from '../../services/auth.service';
import { EventService } from '../../services/event.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-header',
  imports: [RouterLink, CommonModule],
  templateUrl: './header.html',
  styleUrl: './header.scss',
})
export class Header implements OnInit, OnDestroy {
  currentUser: UserInfo | null = null;
  private authSubscription!: Subscription;

  constructor(
    public authService: AuthService,
    private router: Router,
    private eventService: EventService,
  ) {}

  ngOnInit(): void {
    this.loadUserInfo();

    // Subscribe to auth state changes
    this.authSubscription = this.eventService.authStateChanged$.subscribe(
      () => {
        // Small delay to ensure token is properly saved
        setTimeout(() => this.loadUserInfo(), 300);
      },
    );
  }

  ngOnDestroy(): void {
    if (this.authSubscription) {
      this.authSubscription.unsubscribe();
    }
  }

  loadUserInfo(): void {
    if (this.authService.isAuthenticated()) {
      this.authService.getCurrentUser().subscribe({
        next: (user) => {
          this.currentUser = user;
        },
        error: (error) => {
          console.error('Error fetching user info:', error);
        },
      });
    }
  }

  get isAuthPage(): boolean {
    const url = this.router.url;
    return url === '/login' || url === '/signup';
  }

  logout(): void {
    this.authService.logout();
    this.currentUser = null;
    this.router.navigate(['/']);
  }
}
