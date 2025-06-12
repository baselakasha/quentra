import { Component } from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-header',
  imports: [RouterLink, CommonModule],
  templateUrl: './header.html',
  styleUrl: './header.scss'
})
export class Header {
  
  constructor(
    public authService: AuthService,
    private router: Router
  ) {}

  get isAuthPage(): boolean {
    const url = this.router.url;
    return url === '/login' || url === '/signup';
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/']);
  }
}
