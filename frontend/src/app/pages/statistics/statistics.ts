import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Budget, BudgetSummary } from '../../types/budget.types';
import { BudgetService } from '../../services/budget.service';
import { NotificationService } from '../../services/notification.service';
import { NotebookComponent } from '../../components/notebook/notebook';

@Component({
  selector: 'app-statistics',
  standalone: true,
  imports: [CommonModule, NotebookComponent],
  templateUrl: './statistics.html',
  styleUrl: './statistics.scss'
})
export class Statistics implements OnInit {
  budgets: Budget[] = [];
  loading: boolean = true;
  
  // Sorting properties
  sortField: 'startDate' | 'endDate' | 'name' = 'startDate';
  sortDirection: 'asc' | 'desc' = 'asc';
  
  constructor(
    private budgetService: BudgetService,
    private notification: NotificationService
  ) {}
  
  ngOnInit(): void {
    this.loadBudgets();
  }
  
  loadBudgets(): void {
    this.loading = true;
    this.budgetService.getBudgets().subscribe({
      next: (budgets) => {
        this.budgets = budgets;
        this.applySort(); // Apply sorting to the budgets
        this.loading = false;
      },
      error: (error) => {
        this.notification.error('Failed to load budgets');
        console.error('Error loading budgets:', error);
        this.loading = false;
      }
    });
  }
  
  // Calculate total planned spending for a budget
  getTotalPlanned(budget: Budget): number {
    if (!budget.categories || budget.categories.length === 0) return 0;
    return budget.categories.reduce((sum, cat) => sum + cat.plannedAmount, 0);
  }

  // Calculate total actual spending for a budget
  getTotalSpent(budget: Budget): number {
    if (!budget.categories || budget.categories.length === 0) return 0;
    return budget.categories.reduce((sum, cat) => sum + cat.spentAmount, 0);
  }
  
  // Calculate actual savings (income - spent)
  getSavings(budget: Budget): number {
    if (!this.hasMonthlyIncome(budget)) return 0;
    return (budget.monthlyIncome as number) - this.getTotalSpent(budget);
  }
  
  // Calculate planned savings (income - planned)
  getPlannedSavings(budget: Budget): number {
    if (!this.hasMonthlyIncome(budget)) return 0;
    return (budget.monthlyIncome as number) - this.getTotalPlanned(budget);
  }
  
  // Calculate savings as percentage of income
  getSavingsPercentage(budget: Budget): number {
    if (!this.hasMonthlyIncome(budget) || budget.monthlyIncome === 0) {
      return 0;
    }
    return (this.getSavings(budget) / (budget.monthlyIncome as number)) * 100;
  }
  
  // Check if budget has monthly income defined
  hasMonthlyIncome(budget: Budget): boolean {
    return budget.monthlyIncome !== null && 
           budget.monthlyIncome !== undefined && 
           budget.monthlyIncome > 0;
  }
  
  // Get class for savings health
  getSavingsHealthClass(budget: Budget): string {
    if (!this.hasMonthlyIncome(budget)) return '';
    
    const percentage = this.getSavingsPercentage(budget);
    
    if (percentage < 10) return 'is-danger';
    if (percentage < 20) return 'is-warning';
    return 'is-success';
  }
  
  // Get class based on spending percentage of income
  getSpendingPercentageClass(budget: Budget): string {
    if (!this.hasMonthlyIncome(budget)) return '';
    
    const spendingPercentage = (this.getTotalSpent(budget) / (budget.monthlyIncome as number)) * 100;
    
    if (spendingPercentage > 90) return 'is-danger';
    if (spendingPercentage > 75) return 'is-warning';
    return 'is-success';
  }
  
  // Sort the budgets based on the current sort field and direction
  sortBudgets(field: 'startDate' | 'endDate' | 'name'): void {
    if (this.sortField === field) {
      // If already sorting by this field, toggle direction
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      // If sorting by a new field, set the field and default to ascending
      this.sortField = field;
      this.sortDirection = 'asc';
    }
    
    this.applySort();
  }
  
  // Apply the current sort to the budgets array
  private applySort(): void {
    this.budgets = [...this.budgets].sort((a, b) => {
      let comparison = 0;
      
      if (this.sortField === 'name') {
        comparison = a.name.localeCompare(b.name);
      } else if (this.sortField === 'startDate') {
        const dateA = a.startDate ? new Date(a.startDate).getTime() : 0;
        const dateB = b.startDate ? new Date(b.startDate).getTime() : 0;
        comparison = dateA - dateB;
      } else if (this.sortField === 'endDate') {
        const dateA = a.endDate ? new Date(a.endDate).getTime() : 0;
        const dateB = b.endDate ? new Date(b.endDate).getTime() : 0;
        comparison = dateA - dateB;
      }
      
      // Reverse the comparison if descending
      return this.sortDirection === 'asc' ? comparison : -comparison;
    });
  }
  
  // Get sort icon class based on current sort settings
  getSortIconClass(field: 'startDate' | 'endDate' | 'name'): string {
    if (this.sortField !== field) {
      return 'fas fa-sort';
    }
    return this.sortDirection === 'asc' ? 'fas fa-sort-up' : 'fas fa-sort-down';
  }
  
  // Format date range for display
  getDateRange(budget: Budget): string {
    if (!budget.startDate || !budget.endDate) return 'No dates set';
    
    const startDate = new Date(budget.startDate);
    const endDate = new Date(budget.endDate);
    
    return `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`;
  }
}
