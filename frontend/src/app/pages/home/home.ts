import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BudgetComponent } from '../../components/budget/budget';
import { BudgetModalComponent } from '../../components/budget-modal/budget-modal';
import { BudgetService } from '../../services/budget.service';
import { Budget, CreateBudgetRequest } from '../../types/budget.types';
import { Subscription } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { EventService } from '../../services/event.service';
import { NotificationService } from '../../services/notification.service';

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
  budgetSubscription: Subscription | null = null;
  authStateSubscription: Subscription | null = null;
  isLoggedIn = false;

  @ViewChild(BudgetModalComponent) budgetModal!: BudgetModalComponent;

  constructor(
    private budgetService: BudgetService,
    private authService: AuthService,
    private eventService: EventService,
    private notification: NotificationService,
    public router: Router
  ) {}

  ngOnInit() {
    this.checkAuthenticationStatus();
    
    // Subscribe to auth state changes
    this.authStateSubscription = this.eventService.authStateChanged$.subscribe(() => {
      this.checkAuthenticationStatus();
    });
  }
  
  checkAuthenticationStatus() {
    this.isLoggedIn = this.authService.isAuthenticated();
    
    if (this.isLoggedIn) {
      this.loadBudgets();
    } else {
      // Clear budgets when logged out
      this.budgets = [];
    }
  }

  ngOnDestroy() {
    this.budgetSubscription?.unsubscribe();
    this.authStateSubscription?.unsubscribe();
  }

  loadBudgets() {
    if (!this.isLoggedIn) return;
    
    this.loading = true;
    this.error = null;
    
    this.budgetSubscription = this.budgetService.getBudgets().subscribe({
      next: (budgets) => {
        // Ensure categories have proper default values with explicit number conversion
        this.budgets = budgets.map(budget => {
          // Handle monthly income
          if (budget.monthlyIncome !== null && budget.monthlyIncome !== undefined) {
            budget.monthlyIncome = Number(budget.monthlyIncome);
          } else {
            budget.monthlyIncome = null;
          }
          
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
        
        this.loading = false;
      },
      error: (error) => {
        this.error = 'Failed to load budgets';
        this.loading = false;
        console.error('Error loading budgets:', error);
      }
    });
  }

  navigateToLogin() {
    this.router.navigate(['/login']);
  }
  
  navigateToSignup() {
    this.router.navigate(['/signup']);
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
    
    // Monthly income is handled by the checkbox now - no need to modify it here
    
    this.budgetService.createBudget(budgetData).subscribe({
      next: (budget) => {
        // Format numeric values correctly
        if (budget.monthlyIncome !== null && budget.monthlyIncome !== undefined) {
          budget.monthlyIncome = Number(budget.monthlyIncome);
        } else {
          budget.monthlyIncome = null;
        }
        
        // Add the new budget to the list
        this.budgets.push(budget);
        
        // Show success message
        this.error = null;
        this.showSuccessMessage(`Budget "${budget.name}" created successfully!`);
        
        this.budgetModal.finishLoading(true);
      },
      error: (error) => {
        // Show specific error message if available
        const errorMessage = error.error?.message || 'Failed to create new budget';
        console.error('Error creating new budget:', error);
        this.budgetModal.finishLoading(false); // Keep modal open on error
        
        // Use notification service instead of setting error in state
        this.notification.error(errorMessage, 'Budget Creation Failed');
      }
    });
  }
  
  onBudgetDeleted(budgetId: string) {
    this.budgets = this.budgets.filter(b => b.id !== budgetId);

  }
  
  onBudgetUpdated(updatedBudget: Budget) {
    // Find and update the budget in the local array
    const index = this.budgets.findIndex(b => b.id === updatedBudget.id);
    if (index !== -1) {
      this.budgets[index] = { ...this.budgets[index], ...updatedBudget };
      this.showSuccessMessage(`Budget "${updatedBudget.name}" updated successfully!`);
    }
  }
  
  onBudgetPinned(pinnedBudget: Budget) {
    // When a budget is pinned/unpinned, reload all budgets to ensure correct order
    this.loadBudgets();
    
    const action = pinnedBudget.isPinned ? 'pinned' : 'unpinned';
    this.showSuccessMessage(`Budget "${pinnedBudget.name}" ${action} successfully!`);
  }
  
  onBudgetDuplicated(newBudget: Budget) {
    // Add the duplicated budget to the list
    this.budgets.push(newBudget);
    
    // Reload all budgets to ensure correct order
    this.loadBudgets();
    
    this.showSuccessMessage(`Budget "${newBudget.name}" created successfully!`);
  }
  
  onError(errorMessage: string) {
    if (errorMessage) {
      this.notification.error(errorMessage);
    }
  }
  
  showSuccessMessage(message: string) {
    // Replace inline success message with SweetAlert2 toast
    this.notification.toast(message, 'success');
  }
}
