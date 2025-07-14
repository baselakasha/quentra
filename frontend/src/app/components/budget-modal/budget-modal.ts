import { Component, EventEmitter, Output, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CreateBudgetRequest, Budget, UpdateBudgetRequest } from '../../types/budget.types';
import { NotificationService } from '../../services/notification.service';

@Component({
  selector: 'app-budget-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './budget-modal.html',
  styleUrl: './budget-modal.scss'
})
export class BudgetModalComponent {
  @Output() budgetCreated = new EventEmitter<CreateBudgetRequest>();
  @Output() budgetUpdated = new EventEmitter<{id: string, data: UpdateBudgetRequest}>();
  @Output() modalClosed = new EventEmitter<void>();
  
  isActive = false;
  isLoading = false;
  formSubmitted = false;
  title = 'Create New Budget';
  errorMessage = '';
  editMode = false;
  editBudgetId = '';
  
  budgetData: CreateBudgetRequest = this.getDefaultBudgetData();
  
  constructor(private notification: NotificationService) {}
  
  open() {
    this.isActive = true;
    this.formSubmitted = false;
    this.errorMessage = '';
    this.editMode = false;
    // Reset to default data
    this.budgetData = this.getDefaultBudgetData();
    this.title = 'Create New Budget';
  }
  
  openForEdit(budget: Budget) {
    this.isActive = true;
    this.formSubmitted = false;
    this.errorMessage = '';
    this.editMode = true;
    this.editBudgetId = budget.id;
    this.title = 'Edit Budget';
    
    // Set the form data with the existing budget values
    this.budgetData = {
      name: budget.name,
      startDate: budget.startDate,
      endDate: budget.endDate,
      monthlyIncome: budget.monthlyIncome
    };
  }
  
  close() {
    this.isActive = false;
    this.resetForm();
    this.modalClosed.emit();
  }
  
  save() {
    this.formSubmitted = true;
    
    if (!this.isValid()) {
      this.notification.warning('Please fix the errors in the form before submitting.');
      return;
    }
    
    if (this.endDateBeforeStartDate()) {
      this.notification.warning('End date must be after start date.');
      return;
    }
    
    this.errorMessage = '';
    this.isLoading = true;
    
    if (this.editMode) {
      // Emit update event with budget ID and data
      this.budgetUpdated.emit({
        id: this.editBudgetId,
        data: {...this.budgetData}
      });
    } else {
      // Emit create event with budget data
      this.budgetCreated.emit({...this.budgetData});
    }
  }
  
  resetForm() {
    this.budgetData = this.getDefaultBudgetData();
    this.formSubmitted = false;
    this.isLoading = false;
    this.errorMessage = '';
    this.editMode = false;
    this.editBudgetId = '';
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
      this.notification.error('There was an error creating the budget. Please try again.');
    }
  }
  
  setErrorMessage(message: string) {
    this.notification.error(message);
    this.isLoading = false;
  }
}
