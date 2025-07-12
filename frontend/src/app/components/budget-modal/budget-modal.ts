import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CreateBudgetRequest } from '../../types/budget.types';

@Component({
  selector: 'app-budget-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './budget-modal.html',
  styleUrl: './budget-modal.scss'
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
