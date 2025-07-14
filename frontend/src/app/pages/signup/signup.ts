import { Component } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { NotebookComponent } from '../../components/notebook/notebook';
import { NotificationService } from '../../services/notification.service';

@Component({
  selector: 'app-signup',
  imports: [ReactiveFormsModule, CommonModule, RouterModule, NotebookComponent],
  templateUrl: './signup.html',
  styleUrl: './signup.scss'
})
export class Signup {
  signUpForm: FormGroup = new FormGroup({
    fullName: new FormControl("", [
      Validators.required,
      Validators.minLength(2),
    ]),
    
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
    if (this.signUpForm.valid) {
      this.isLoading = true;

      const { username, password, fullName } = this.signUpForm.value;

      this.authService.signup({ username, password, fullName }).subscribe({
        next: (response) => {
          this.isLoading = false;
          this.notification.success('Account created successfully!');
          this.authService.saveToken(response.token);
          
          // Redirect to home or dashboard after successful signup
          setTimeout(() => {
            this.router.navigate(['/']);
          }, 1500);
        },
        error: (error) => {
          this.isLoading = false;
          const errorMessage = error.error?.error || 'An error occurred during signup';
          this.notification.error(errorMessage);
        }
      });
    } else {
      this.markFormGroupTouched();
      this.notification.warning('Please fill in all required fields correctly.');
    }
  }

  private markFormGroupTouched(): void {
    Object.keys(this.signUpForm.controls).forEach(key => {
      const control = this.signUpForm.get(key);
      control?.markAsTouched();
    });
  }

  getFieldError(fieldName: string): string {
    const field = this.signUpForm.get(fieldName);
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
