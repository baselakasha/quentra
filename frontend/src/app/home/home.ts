import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BudgetComponent } from '../components/budget/budget';
import { BudgetService } from '../services/budget.service';
import { Budget } from '../types/budget.types';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, FormsModule, BudgetComponent],
  templateUrl: './home.html',
  styleUrl: './home.scss'
})
export class Home implements OnInit {
  budgets: Budget[] = [];
  loading = false;
  error: string | null = null;

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
  
  createNewBudget() {
    const newBudget = {
      name: 'New Budget',
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString().split('T')[0],
      monthlyIncome: 0
    };
    
    this.budgetService.createBudget(newBudget).subscribe({
      next: (budget) => {
        this.budgets.push(budget);
        console.log('New budget created:', budget);
      },
      error: (error) => {
        this.error = 'Failed to create new budget';
        console.error('Error creating new budget:', error);
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
}
