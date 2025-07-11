import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CreateBudgetRequest } from '../../types/budget.types';

@Component({
  selector: 'app-budget-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="modal" [class.is-active]="isActive">
      <div class="modal-background" (click)="close()"></div>
      <div class="modal-card">
        <header class="modal-card-head">
          <p class="modal-card-title">{{ title }}</p>
          <button class="delete" aria-label="close" (click)="close()"></button>
        </header>
        <section class="modal-card-body">
          <div *ngIf="errorMessage" class="notification is-danger">
            {{ errorMessage }}
          </div>

          <div class="field">
            <label class="label">Budget Name</label>
            <div class="control">
              <input 
                class="input" 
                type="text" 
                [(ngModel)]="budgetData.name" 
                placeholder="Enter budget name"
                required
                #budgetName="ngModel"
                [ngClass]="{'is-danger': budgetName.invalid && (budgetName.dirty || budgetName.touched || formSubmitted)}"
              >
            </div>
            <p *ngIf="budgetName.invalid && (budgetName.dirty || budgetName.touched || formSubmitted)" class="help is-danger">
              Budget name is required
            </p>
          </div>

          <div class="field">
            <label class="label">Start Date</label>
            <div class="control">
              <input 
                class="input" 
                type="date" 
                [(ngModel)]="budgetData.startDate"
                required
                #startDate="ngModel"
                [ngClass]="{'is-danger': startDate.invalid && (startDate.dirty || startDate.touched || formSubmitted)}"
              >
            </div>
            <p *ngIf="startDate.invalid && (startDate.dirty || startDate.touched || formSubmitted)" class="help is-danger">
              Start date is required
            </p>
          </div>

          <div class="field">
            <label class="label">End Date</label>
            <div class="control">
              <input 
                class="input" 
                type="date" 
                [(ngModel)]="budgetData.endDate"
                required
                #endDate="ngModel"
                [ngClass]="{'is-danger': endDate.invalid && (endDate.dirty || endDate.touched || formSubmitted) || endDateBeforeStartDate()}"
              >
            </div>
            <p *ngIf="endDate.invalid && (endDate.dirty || endDate.touched || formSubmitted)" class="help is-danger">
              End date is required
            </p>
            <p *ngIf="endDateBeforeStartDate()" class="help is-danger">
              End date must be after start date
            </p>
          </div>

          <div class="field">
            <label class="label">Monthly Income</label>
            <div class="control has-icons-left">
              <span class="icon is-small is-left">
                <i class="fas fa-pound-sign"></i>
              </span>
              <input 
                class="input" 
                type="number" 
                [(ngModel)]="budgetData.monthlyIncome" 
                placeholder="0.00"
                min="0"
                step="0.01"
                required
                #monthlyIncome="ngModel"
                [ngClass]="{'is-danger': monthlyIncome.invalid && (monthlyIncome.dirty || monthlyIncome.touched || formSubmitted)}"
              >
            </div>
            <p *ngIf="monthlyIncome.invalid && (monthlyIncome.dirty || monthlyIncome.touched || formSubmitted)" class="help is-danger">
              Monthly income must be a positive number
            </p>
          </div>
        </section>
        <footer class="modal-card-foot">
          <button class="button is-success" [class.is-loading]="isLoading" [disabled]="isLoading" (click)="save()">
            {{ isLoading ? 'Saving...' : 'Save' }}
          </button>
          <button class="button" (click)="close()">Cancel</button>
        </footer>
      </div>
    </div>
  `,
  styles: [`
    .modal-card {
      width: 90%;
      max-width: 500px;
    }
    
    .notification {
      margin-bottom: 1rem;
    }
    
    .modal-card-body {
      max-height: 70vh;
      overflow-y: auto;
    }
    
    .field {
      margin-bottom: 1.5rem;
    }
    
    /* Add animation */
    .modal.is-active .modal-card {
      animation: slideIn 0.3s ease-out;
    }
    
    @keyframes slideIn {
      from { transform: translateY(-20px); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }
  `]
})
export class BudgetModalComponent {
  @Output() budgetCreated = new EventEmitter<CreateBudgetRequest>();
  @Output() modalClosed = new EventEmitter<void>();
  
  isActive = false;
  isLoading = false;
  formSubmitted = false;
  title = 'Create New Budget';
  errorMessage = '';
  
  budgetData: CreateBudgetRequest = this.getDefaultBudgetData();
  
  open() {
    this.isActive = true;
    this.formSubmitted = false;
    this.errorMessage = '';
    // Reset to default data
    this.budgetData = this.getDefaultBudgetData();
  }
  
  close() {
    this.isActive = false;
    this.resetForm();
    this.modalClosed.emit();
  }
  
  save() {
    this.formSubmitted = true;
    
    if (!this.isValid()) {
      this.errorMessage = 'Please fix the errors in the form before submitting.';
      return;
    }
    
    if (this.endDateBeforeStartDate()) {
      this.errorMessage = 'End date must be after start date.';
      return;
    }
    
    this.errorMessage = '';
    this.isLoading = true;
    this.budgetCreated.emit({...this.budgetData}); // Send a copy of the data
  }
  
  resetForm() {
    this.budgetData = this.getDefaultBudgetData();
    this.formSubmitted = false;
    this.isLoading = false;
    this.errorMessage = '';
  }
  
  getDefaultBudgetData(): CreateBudgetRequest {
    // Set default dates: today and end of current month
    const today = new Date();
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    
    return {
      name: '',
      startDate: today.toISOString().split('T')[0],
      endDate: endOfMonth.toISOString().split('T')[0],
      monthlyIncome: 0
    };
  }
  
  endDateBeforeStartDate(): boolean {
    if (!this.budgetData.startDate || !this.budgetData.endDate) return false;
    return new Date(this.budgetData.endDate) < new Date(this.budgetData.startDate);
  }
  
  isValid(): boolean {
    return (
      !!this.budgetData.name &&
      !!this.budgetData.startDate &&
      !!this.budgetData.endDate &&
      this.budgetData.monthlyIncome >= 0 &&
      !this.endDateBeforeStartDate()
    );
  }
  
  finishLoading(success: boolean) {
    this.isLoading = false;
    
    if (success) {
      this.close();
    } else {
      this.errorMessage = 'There was an error creating the budget. Please try again.';
    }
  }
  
  setErrorMessage(message: string) {
    this.errorMessage = message;
    this.isLoading = false;
  }
}
