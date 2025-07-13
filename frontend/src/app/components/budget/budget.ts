import { Component, Input, Output, EventEmitter, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NotebookComponent } from '../notebook/notebook';
import { BudgetModalComponent } from '../budget-modal/budget-modal';
import { BudgetService } from '../../services/budget.service';
import { CategoryService } from '../../services/category.service';
import { Budget, Category, UpdateBudgetRequest } from '../../types/budget.types';

@Component({
  selector: 'app-budget',
  standalone: true,
  imports: [CommonModule, FormsModule, NotebookComponent, BudgetModalComponent],
  templateUrl: './budget.html',
  styleUrl: './budget.scss'
})
export class BudgetComponent {
  @Input() budget!: Budget;
  @Output() budgetDeleted = new EventEmitter<string>();
  @Output() budgetUpdated = new EventEmitter<Budget>();
  @Output() error = new EventEmitter<string>();
  @ViewChild(BudgetModalComponent) budgetModal!: BudgetModalComponent;
  
  // Properties for category form
  newCategoryName: string = '';
  newCategoryPlannedAmount: number = 0;
  newCategorySpentAmount: number = 0;

  constructor(
    private categoryService: CategoryService,
    private budgetService: BudgetService
  ) {}

  // Helper methods for budget calculations
  getTotalPlanned(): number {
    if (!this.budget.categories || this.budget.categories.length === 0) return 0;
    return this.budget.categories.reduce((sum, cat) => sum + cat.plannedAmount, 0);
  }

  getTotalSpent(): number {
    if (!this.budget.categories || this.budget.categories.length === 0) return 0;
    return this.budget.categories.reduce((sum, cat) => sum + cat.spentAmount, 0);
  }

  getRemainingBudget(): number {
    return this.budget.monthlyIncome - this.getTotalSpent();
  }
  
  // Calculate days left until budget end date
  getDaysLeft(): number {
    if (!this.budget.endDate) return 0;
    
    const today = new Date();
    const endDate = new Date(this.budget.endDate);
    
    // Reset hours to compare just the dates
    today.setHours(0, 0, 0, 0);
    endDate.setHours(0, 0, 0, 0);
    
    const diffTime = endDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
  }
  
  // Check if the budget period has started
  hasBudgetStarted(): boolean {
    if (!this.budget.startDate) return true; // Default to true if no start date
    
    const today = new Date();
    const startDate = new Date(this.budget.startDate);
    
    // Reset hours to compare just the dates
    today.setHours(0, 0, 0, 0);
    startDate.setHours(0, 0, 0, 0);
    
    return today >= startDate;
  }
  
  // Calculate days until budget starts
  getDaysUntilStart(): number {
    if (!this.budget.startDate) return 0;
    
    const today = new Date();
    const startDate = new Date(this.budget.startDate);
    
    // Reset hours to compare just the dates
    today.setHours(0, 0, 0, 0);
    startDate.setHours(0, 0, 0, 0);
    
    const diffTime = startDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays > 0 ? diffDays : 0;
  }

  getProgressPercentage(category: Category): number {
    if (category.plannedAmount === 0) return 0;
    // Allow percentages above 100%
    return (category.spentAmount / category.plannedAmount) * 100;
  }

  // Get total budget percentage spent
  getTotalPercentage(): number {
    const totalPlanned = this.getTotalPlanned();
    if (totalPlanned === 0) return 0;
    
    const totalSpent = this.getTotalSpent();
    // Allow percentages above 100%
    return (totalSpent / totalPlanned) * 100;
  }
  
  // Get budget health based on spending percentage
  getBudgetHealthClass(): string {
    const percentage = this.getTotalPercentage();
    if (percentage > 100) return 'danger';
    if (percentage > 75) return 'warning';
    return 'good';
  }
  
  // Action methods
  addCategory() {
    if (!this.newCategoryName || this.newCategoryName.trim() === '') {
      this.error.emit('Category name is required');
      return;
    }
    
    const plannedAmount = Number(this.newCategoryPlannedAmount) || 0;
    const spentAmount = Number(this.newCategorySpentAmount) || 0;
    
    const newCategory = {
      name: this.newCategoryName,
      budgetId: this.budget.id,
      plannedAmount: plannedAmount,
      spentAmount: spentAmount
    };
    
    this.categoryService.createCategory(newCategory).subscribe({
      next: (category) => {
        // Add the category to the budget
        if (!this.budget.categories) this.budget.categories = [];
        
        // Use the returned category from the server with fallbacks
        const completeCategory = {
          ...category,
          plannedAmount: Number(category.plannedAmount) || plannedAmount,
          spentAmount: Number(category.spentAmount) || spentAmount
        };
        
        this.budget.categories.push(completeCategory);
        
        // Reset form fields
        this.newCategoryName = '';
        this.newCategoryPlannedAmount = 0;
        this.newCategorySpentAmount = 0;
        
        console.log('Category created:', completeCategory);
      },
      error: (error) => {
        this.error.emit('Failed to create category');
        console.error('Error creating category:', error);
      }
    });
  }

  updateCategory(category: Category) {
    // Ensure values are valid numbers
    const plannedAmount = Number(category.plannedAmount) || 0;
    const spentAmount = Number(category.spentAmount) || 0;
    
    // Update the local object immediately to provide responsive UI
    category.plannedAmount = plannedAmount;
    category.spentAmount = spentAmount;
    
    this.categoryService.updateCategory(category.id, {
      name: category.name,
      plannedAmount: plannedAmount,
      spentAmount: spentAmount
    }).subscribe({
      next: (updatedCategory) => {
        // Update the local category with returned values ensuring they're numbers
        Object.assign(category, {
          ...updatedCategory,
          plannedAmount: Number(updatedCategory.plannedAmount) || plannedAmount,
          spentAmount: Number(updatedCategory.spentAmount) || spentAmount
        });
        console.log('Category updated:', updatedCategory);
      },
      error: (error) => {
        this.error.emit('Failed to update category');
        console.error('Error updating category:', error);
      }
    });
  }

  // Edit budget handler
  editBudget() {
    this.budgetModal.openForEdit(this.budget);
  }

  // Handle budget update from modal
  onBudgetUpdated(event: {id: string, data: UpdateBudgetRequest}) {
    this.budgetService.updateBudget(event.id, event.data).subscribe({
      next: (updatedBudget) => {
        // Update local budget with returned values
        Object.assign(this.budget, updatedBudget);
        this.budgetModal.finishLoading(true);
        this.budgetUpdated.emit(updatedBudget);
        console.log('Budget updated:', updatedBudget);
      },
      error: (error) => {
        this.budgetModal.setErrorMessage('Failed to update budget');
        this.error.emit('Failed to update budget');
        console.error('Error updating budget:', error);
      }
    });
  }

  deleteBudget() {
    if (confirm('Are you sure you want to delete this budget?')) {
      this.budgetService.deleteBudget(this.budget.id).subscribe({
        next: () => {
          this.budgetDeleted.emit(this.budget.id);
          console.log('Budget deleted');
        },
        error: (error) => {
          this.error.emit('Failed to delete budget');
          console.error('Error deleting budget:', error);
        }
      });
    }
  }
}
