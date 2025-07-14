import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { RouterLink, Router, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService, UserInfo } from '../../services/auth.service';
import { EventService } from '../../services/event.service';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-header',
  imports: [RouterLink, CommonModule],
  templateUrl: './header.html',
  styleUrl: './header.scss',
})
export class Header implements OnInit, OnDestroy {
  currentUser: UserInfo | null = null;
  private authSubscription!: Subscription;
  private routerSubscription!: Subscription;

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
    
    // Subscribe to router events to close menu on navigation
    this.routerSubscription = this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => {
        this.closeMenu();
      });
  }

  ngOnDestroy(): void {
    if (this.authSubscription) {
      this.authSubscription.unsubscribe();
    }
    
    if (this.routerSubscription) {
      this.routerSubscription.unsubscribe();
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

  isMenuActive = false;

  get isAuthPage(): boolean {
    const url = this.router.url;
    return url === '/login' || url === '/signup';
  }

  toggleMenu(): void {
    this.isMenuActive = !this.isMenuActive;
  }

  closeMenu(): void {
    this.isMenuActive = false;
  }
  
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    // Get the navbar menu and burger button
    const navbarMenu = document.getElementById('navbarBasicExample');
    const navbarBurger = document.querySelector('.navbar-burger');
    
    // Check if the menu is active and the click is outside the menu and burger button
    if (this.isMenuActive && navbarMenu && navbarBurger) {
      const clickedInside = navbarMenu.contains(event.target as Node) || 
                           navbarBurger.contains(event.target as Node);
      
      if (!clickedInside) {
        this.closeMenu();
      }
    }
  }

  logout(): void {
    this.authService.logout();
    this.currentUser = null;
    this.router.navigate(['/']);
    this.closeMenu();
  }
}
