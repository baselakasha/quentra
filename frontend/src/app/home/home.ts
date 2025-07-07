import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NotebookComponent } from '../components/notebook/notebook';
import { BudgetService } from '../services/budget.service';
import { CategoryService } from '../services/category.service';
import { Budget, Category } from '../types/budget.types';

@Component({
  selector: 'app-home',
  imports: [NotebookComponent, CommonModule, FormsModule],
  templateUrl: './home.html',
  styleUrl: './home.scss'
})
export class Home implements OnInit {
  budgets: Budget[] = [];
  selectedBudget: Budget | null = null;
  loading = false;
  error: string | null = null;

  // New properties for category form
  newCategoryName: string = '';
  newCategoryPlannedAmount: number = 0;
  newCategorySpentAmount: number = 0;

  constructor(
    private budgetService: BudgetService,
    private categoryService: CategoryService
  ) {}

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

  selectBudget(budget: Budget) {
    this.selectedBudget = budget;
  }

  createSampleBudget() {
    const sampleBudget = {
      name: 'Monthly Budget',
      startDate: '2025-01-01',
      endDate: '2025-01-31',
      monthlyIncome: 5000
    };

    this.budgetService.createBudget(sampleBudget).subscribe({
      next: (budget) => {
        this.budgets.push(budget);
        console.log('Budget created:', budget);
      },
      error: (error) => {
        this.error = 'Failed to create budget';
        console.error('Error creating budget:', error);
      }
    });
  }

  // Helper methods for budget calculations
  getTotalPlanned(budget: Budget): number {
    if (!budget.categories || budget.categories.length === 0) return 0;
    return budget.categories.reduce((sum, cat) => sum + cat.plannedAmount, 0);
  }

  getTotalSpent(budget: Budget): number {
    if (!budget.categories || budget.categories.length === 0) return 0;
    return budget.categories.reduce((sum, cat) => sum + cat.spentAmount, 0);
  }

  getRemainingBudget(budget: Budget): number {
    return budget.monthlyIncome - this.getTotalSpent(budget);
  }

  getProgressPercentage(category: Category): number {
    if (category.plannedAmount === 0) return 0;
    // Remove the Math.min to allow percentages above 100%
    return (category.spentAmount / category.plannedAmount) * 100;
  }

  // Get total budget percentage spent
  getTotalPercentage(budget: Budget): number {
    const totalPlanned = this.getTotalPlanned(budget);
    if (totalPlanned === 0) return 0;
    
    const totalSpent = this.getTotalSpent(budget);
    // Remove the Math.min to allow percentages above 100%
    return (totalSpent / totalPlanned) * 100;
  }
  
  // Get budget health based on spending percentage
  getBudgetHealthClass(budget: Budget): string {
    const percentage = this.getTotalPercentage(budget);
    if (percentage > 100) return 'danger';
    if (percentage > 75) return 'warning';
    return 'good';
  }
  
  // Action methods
  createSampleCategory(budgetId: string) {
    const sampleCategory = {
      name: 'Food & Dining',
      budgetId: budgetId,
      plannedAmount: 500,
      spentAmount: 0
    };

    this.categoryService.createCategory(sampleCategory).subscribe({
      next: (category) => {
        // Find the budget and add the category
        const budget = this.budgets.find(b => b.id === budgetId);
        if (budget) {
          if (!budget.categories) budget.categories = [];
          budget.categories.push({
            ...category,
            plannedAmount: Number(category.plannedAmount) || 500,
            spentAmount: Number(category.spentAmount) || 0
          });
        }
        console.log('Category created:', category);
      },
      error: (error) => {
        this.error = 'Failed to create category';
        console.error('Error creating category:', error);
      }
    });
  }

  addCategory(budget: Budget) {
    if (!this.newCategoryName || this.newCategoryName.trim() === '') {
      this.error = 'Category name is required';
      return;
    }
    
    const plannedAmount = Number(this.newCategoryPlannedAmount) || 0;
    const spentAmount = Number(this.newCategorySpentAmount) || 0;
    
    const newCategory = {
      name: this.newCategoryName,
      budgetId: budget.id,
      plannedAmount: plannedAmount,
      spentAmount: spentAmount
    };
    
    this.categoryService.createCategory(newCategory).subscribe({
      next: (category) => {
        // Find the budget and add the category
        const budgetToUpdate = this.budgets.find(b => b.id === budget.id);
        if (budgetToUpdate) {
          if (!budgetToUpdate.categories) budgetToUpdate.categories = [];
          
          // Use the returned category from the server with fallbacks
          const completeCategory = {
            ...category,
            plannedAmount: Number(category.plannedAmount) || plannedAmount,
            spentAmount: Number(category.spentAmount) || spentAmount
          };
          
          budgetToUpdate.categories.push(completeCategory);
          
          // Reset form fields
          this.newCategoryName = '';
          this.newCategoryPlannedAmount = 0;
          this.newCategorySpentAmount = 0;
          
          console.log('Category created:', completeCategory);
        }
      },
      error: (error) => {
        this.error = 'Failed to create category';
        console.error('Error creating category:', error);
      }
    });
  }

  viewBudgetDetails(budget: Budget) {
    this.selectedBudget = budget;
    // Could navigate to a detailed view or open a modal
    console.log('Viewing budget details:', budget);
  }

  editBudget(budget: Budget) {
    // Could open an edit modal or navigate to edit page
    console.log('Editing budget:', budget);
  }

  deleteBudget(budgetId: string) {
    if (confirm('Are you sure you want to delete this budget?')) {
      this.budgetService.deleteBudget(budgetId).subscribe({
        next: () => {
          this.budgets = this.budgets.filter(b => b.id !== budgetId);
          console.log('Budget deleted');
        },
        error: (error) => {
          this.error = 'Failed to delete budget';
          console.error('Error deleting budget:', error);
        }
      });
    }
  }

  // Update category with changes
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
        this.error = 'Failed to update category';
        console.error('Error updating category:', error);
      }
    });
  }
}
