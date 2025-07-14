import { Component } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { NotebookComponent } from '../../components/notebook/notebook';
import { NotificationService } from '../../services/notification.service';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, CommonModule, RouterModule, NotebookComponent],
  templateUrl: './login.html',
  styleUrl: './login.scss'
})
export class Login {
  loginForm: FormGroup = new FormGroup({
    username: new FormControl("", [
      Validators.required,
      Validators.minLength(5),
    ]),

    password: new FormControl("", [
      Validators.required,
      Validators.minLength(6),
    ])
  });

  isLoading = false;

  constructor(
    private authService: AuthService,
    private router: Router,
    private notification: NotificationService
  ) {}

  onSubmit(): void {
    if (this.loginForm.valid) {
      this.isLoading = true;

      const { username, password } = this.loginForm.value;

      this.authService.login({ username, password }).subscribe({
        next: (response) => {
          this.isLoading = false;
          this.notification.toast('Logged in successfully!', 'success');
          this.authService.saveToken(response.token);
          // Use setTimeout to ensure the event is processed after token is saved
          setTimeout(() => {
            this.router.navigate(['/']);
          }, 100);
        },
        error: (error) => {
          this.isLoading = false;
          const errorMessage = error.error?.error || 'Invalid credentials';
          this.notification.error(errorMessage, 'Login Failed');
        }
      });
    } else {
      this.markFormGroupTouched();
      this.notification.warning('Please fill in all required fields correctly.');
    }
  }

  private markFormGroupTouched(): void {
    Object.keys(this.loginForm.controls).forEach(key => {
      const control = this.loginForm.get(key);
      control?.markAsTouched();
    });
  }

  getFieldError(fieldName: string): string {
    const field = this.loginForm.get(fieldName);
    if (field?.errors && field.touched) {
      if (field.errors['required']) {
        return `${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} is required`;
      }
      if (field.errors['minlength']) {
        const requiredLength = field.errors['minlength'].requiredLength;
        return `${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} must be at least ${requiredLength} characters`;
      }
    }
    return '';
  }
}
