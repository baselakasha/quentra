import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BudgetComponent } from '../components/budget/budget';
import { BudgetModalComponent } from '../components/budget-modal/budget-modal';
import { BudgetService } from '../services/budget.service';
import { Budget, CreateBudgetRequest } from '../types/budget.types';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, FormsModule, BudgetComponent, BudgetModalComponent],
  templateUrl: './home.html',
  styleUrl: './home.scss'
})
export class Home implements OnInit {
  budgets: Budget[] = [];
  loading = false;
  error: string | null = null;
  successMessage: string | null = null;
  
  @ViewChild(BudgetModalComponent) budgetModal!: BudgetModalComponent;

  constructor(private budgetService: BudgetService) {}

  ngOnInit() {
    this.loadBudgets();
  }

  loadBudgets() {
    this.loading = true;
    this.error = null;
    
    this.budgetService.getBudgets().subscribe({
      next: (budgets) => {
        // Ensure categories have proper default values with explicit number conversion
        this.budgets = budgets.map(budget => {
          // Ensure monthlyIncome is a number
          budget.monthlyIncome = Number(budget.monthlyIncome) || 0;
          
          if (budget.categories) {
            budget.categories = budget.categories.map(category => {
              return {
                ...category,
                plannedAmount: Number(category.plannedAmount) || 0,
                spentAmount: Number(category.spentAmount) || 0
              };
            });
          } else {
            budget.categories = [];
          }
          return budget;
        });
        
        // Log to verify data is loaded correctly
        console.log('Budgets loaded with categories:', this.budgets);
        this.loading = false;
      },
      error: (error) => {
        this.error = 'Failed to load budgets';
        this.loading = false;
        console.error('Error loading budgets:', error);
      }
    });
  }

  
  createNewBudget() {
    // Open the modal instead of directly creating a budget
    this.budgetModal.open();
  }
  
  onBudgetFormSubmit(budgetData: CreateBudgetRequest) {
    this.error = null;
    
    // Validate budget data
    if (!budgetData.name || budgetData.name.trim() === '') {
      this.budgetModal.setErrorMessage('Budget name is required');
      return;
    }
    
    if (!budgetData.startDate) {
      this.budgetModal.setErrorMessage('Start date is required');
      return;
    }
    
    if (!budgetData.endDate) {
      this.budgetModal.setErrorMessage('End date is required');
      return;
    }
    
    if (new Date(budgetData.endDate) < new Date(budgetData.startDate)) {
      this.budgetModal.setErrorMessage('End date must be after start date');
      return;
    }
    
    // Ensure monthly income is a number
    budgetData.monthlyIncome = Number(budgetData.monthlyIncome) || 0;
    
    this.budgetService.createBudget(budgetData).subscribe({
      next: (budget) => {
        // Format any numeric values
        budget.monthlyIncome = Number(budget.monthlyIncome) || 0;
        
        // Add the new budget to the list
        this.budgets.push(budget);
        
        // Show success message
        this.error = null;
        this.showSuccessMessage(`Budget "${budget.name}" created successfully!`);
        
        console.log('New budget created:', budget);
        this.budgetModal.finishLoading(true); // Close modal on success
      },
      error: (error) => {
        // Show specific error message if available
        const errorMessage = error.error?.message || 'Failed to create new budget';
        this.error = errorMessage;
        console.error('Error creating new budget:', error);
        this.budgetModal.finishLoading(false); // Keep modal open on error
        
        // Set error in modal
        this.budgetModal.setErrorMessage(errorMessage);
      }
    });
  }
  
  onBudgetDeleted(budgetId: string) {
    this.budgets = this.budgets.filter(b => b.id !== budgetId);
    console.log('Budget removed from list');
  }
  
  onError(errorMessage: string) {
    this.error = errorMessage;
  }
  
  showSuccessMessage(message: string) {
    this.successMessage = message;
    
    // Auto-hide success message after 5 seconds
    setTimeout(() => {
      this.successMessage = null;
    }, 5000);
  }
}
