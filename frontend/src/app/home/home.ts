import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotebookComponent } from '../components/notebook/notebook';
import { BudgetService } from '../services/budget.service';
import { CategoryService } from '../services/category.service';
import { Budget, Category } from '../types/budget.types';

@Component({
  selector: 'app-home',
  imports: [NotebookComponent, CommonModule],
  templateUrl: './home.html',
  styleUrl: './home.scss'
})
export class Home implements OnInit {
  budgets: Budget[] = [];
  selectedBudget: Budget | null = null;
  loading = false;
  error: string | null = null;

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
        this.budgets = budgets;
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
    return Math.min((category.spentAmount / category.plannedAmount) * 100, 100);
  }

  // Action methods
  createSampleCategory(budgetId: string) {
    const sampleCategory = {
      name: 'Food & Dining',
      budgetId: budgetId,
      plannedAmount: 500
    };

    this.categoryService.createCategory(sampleCategory).subscribe({
      next: (category) => {
        // Find the budget and add the category
        const budget = this.budgets.find(b => b.id === budgetId);
        if (budget) {
          if (!budget.categories) budget.categories = [];
          budget.categories.push(category);
        }
        console.log('Category created:', category);
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
}
