import { Component, Input, Output, EventEmitter, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NotebookComponent } from '../notebook/notebook';
import { BudgetModalComponent } from '../budget-modal/budget-modal';
import { BudgetService } from '../../services/budget.service';
import { CategoryService } from '../../services/category.service';
import { Budget, Category, UpdateBudgetRequest } from '../../types/budget.types';
import { DropdownComponent } from '../dropdown';
import { DropdownItemComponent } from '../dropdown-item';
import { SpendingChartComponent } from '../spending-chart/spending-chart';
import { CollapsibleContainerComponent } from '../collapsible-container/collapsible-container';
import { NotificationService } from '../../services/notification.service';
import { CdkDragDrop, moveItemInArray, DragDropModule } from '@angular/cdk/drag-drop';

@Component({
  selector: 'app-budget',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    NotebookComponent, 
    BudgetModalComponent,
    DropdownComponent,
    DropdownItemComponent,
    SpendingChartComponent,
    CollapsibleContainerComponent,
    DragDropModule
  ],
  templateUrl: './budget.html',
  styleUrl: './budget.scss'
})
export class BudgetComponent implements AfterViewInit {
  @Input() set budget(value: Budget) {
    this._budget = value;
    // Set initial expanded state based on whether the budget is pinned
    if (value && this.isExpanded === undefined) {
      this.isExpanded = !!value.isPinned;
    }
  }
  get budget(): Budget {
    return this._budget;
  }
  
  private _budget!: Budget;
  @Output() budgetDeleted = new EventEmitter<string>();
  @Output() budgetUpdated = new EventEmitter<Budget>();
  @Output() budgetPinned = new EventEmitter<Budget>();
  @Output() budgetDuplicated = new EventEmitter<Budget>();
  @Output() error = new EventEmitter<string>();
  @ViewChild(BudgetModalComponent) budgetModal!: BudgetModalComponent;
  
  isExpanded: boolean = false; // Track expanded/collapsed state
  newCategoryName: string = '';
  newCategoryPlannedAmount: number = 0;
  newCategorySpentAmount: number = 0;

  constructor(
    private categoryService: CategoryService,
    private budgetService: BudgetService,
    private notification: NotificationService
  ) {}
  
  ngAfterViewInit() {
    // Component initialization
    // Set initial expanded state based on whether the budget is pinned
    if (this._budget) {
      this.isExpanded = !!this._budget.isPinned;
    }
  }
  
  getTotalPlanned(): number {
    if (!this.budget.categories || this.budget.categories.length === 0) return 0;
    return this.budget.categories.reduce((sum, cat) => sum + cat.plannedAmount, 0);
  }

  getTotalSpent(): number {
    if (!this.budget.categories || this.budget.categories.length === 0) return 0;
    return this.budget.categories.reduce((sum, cat) => sum + cat.spentAmount, 0);
  }

  getRemainingBudget(): number {
    // If no monthly income is defined, don't calculate remaining budget
    if (!this.budget.monthlyIncome) return 0;
    return this.budget.monthlyIncome - this.getTotalSpent();
  }
  
  // Check if budget has monthly income defined
  hasMonthlyIncome(): boolean {
    return this.budget.monthlyIncome !== null && 
           this.budget.monthlyIncome !== undefined && 
           this.budget.monthlyIncome > 0;
  }
  
  // Get monthly income percentage safely
  getMonthlyIncomePercentage(): number {
    if (!this.hasMonthlyIncome() || this.budget.monthlyIncome === 0) {
      return 0;
    }
    // Non-null assertion is safe here because hasMonthlyIncome() ensures it's not null
    return (this.getTotalSpent() / (this.budget.monthlyIncome as number)) * 100;
  }
  
  // Calculate the savings amount (income - spent)
  getSavings(): number {
    if (!this.hasMonthlyIncome()) return 0;
    return (this.budget.monthlyIncome as number) - this.getTotalSpent();
  }
  
  // Calculate savings as a percentage of income
  getSavingsPercentage(): number {
    if (!this.hasMonthlyIncome() || this.budget.monthlyIncome === 0) {
      return 0;
    }
    // Non-null assertion is safe here because hasMonthlyIncome() ensures it's not null
    return (this.getSavings() / (this.budget.monthlyIncome as number)) * 100;
  }
  
  // Get class for savings percentage display
  getSavingsHealthClass(): string {
    const percentage = this.getSavingsPercentage();
    if (percentage < 10) return 'danger';
    if (percentage < 20) return 'warning';
    return 'good';
  }
  
  getDaysLeft(): number {
    if (!this.budget.endDate) return 0;
    
    const today = new Date();
    const endDate = new Date(this.budget.endDate);
    
    today.setHours(0, 0, 0, 0);
    endDate.setHours(0, 0, 0, 0);
    
    const diffTime = endDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
  }
  
  hasBudgetStarted(): boolean {
    if (!this.budget.startDate) return true;
    
    const today = new Date();
    const startDate = new Date(this.budget.startDate);
    
    today.setHours(0, 0, 0, 0);
    startDate.setHours(0, 0, 0, 0);
    
    return today >= startDate;
  }
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
      this.notification.warning('Category name is required');
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
        
        // Refresh categories reference to trigger change detection
        this.refreshCategoriesReference();
        
        this.notification.toast('Category added successfully');
      },
      error: (error) => {
        this.notification.error('Failed to create category');
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
        
        // Refresh categories reference to trigger change detection
        this.refreshCategoriesReference();
        
        // We don't show a toast here to avoid too many notifications when updating categories
      },
      error: (error) => {
        this.notification.error('Failed to update category');
        console.error('Error updating category:', error);
      }
    });
  }

  // Edit budget handler
  editBudget() {
    this.budgetModal.openForEdit(this.budget);
  }
  
  // Pin budget handler
  pinBudget() {
    this.budgetService.pinBudget(this.budget.id).subscribe({
      next: (updatedBudget) => {
        Object.assign(this.budget, updatedBudget);
        this.budgetPinned.emit(updatedBudget);
        // Expand the budget when pinned
        this.isExpanded = true;
        this.notification.toast('Budget pinned', 'success');
      },
      error: (error) => {
        this.notification.error('Failed to pin budget');
        console.error('Error pinning budget:', error);
      }
    });
  }
  
  // Unpin budget handler
  unpinBudget() {
    this.budgetService.unpinBudget(this.budget.id).subscribe({
      next: (updatedBudget) => {
        this.budget.isPinned = false;
        this.budgetPinned.emit(updatedBudget);
        // Optional: collapse the budget when unpinned
        // this.isExpanded = false;
        this.notification.toast('Budget unpinned', 'info');
      },
      error: (err) => {
        this.notification.error('Failed to unpin budget');
        console.error('Error unpinning budget:', err);
      }
    });
  }
  
  duplicateBudget() {
    this.budgetService.duplicateBudget(this.budget.id).subscribe({
      next: (newBudget) => {
        // Emit a special event for the parent component to handle
        this.budgetDuplicated.emit(newBudget);
        this.notification.success('Budget duplicated successfully');
      },
      error: (err) => {
        this.notification.error('Failed to duplicate budget');
        console.error('Error duplicating budget:', err);
      }
    });
  }

  // Handle budget update from modal
  onBudgetUpdated(event: {id: string, data: UpdateBudgetRequest}) {
    this.budgetService.updateBudget(event.id, event.data).subscribe({
      next: (updatedBudget) => {
        // Check if pinned status changed
        const wasPinned = this.budget.isPinned;
        
        // Update local budget with returned values
        Object.assign(this.budget, updatedBudget);
        this.budgetModal.finishLoading(true);
        this.budgetUpdated.emit(updatedBudget);
        
        // If budget was newly pinned, expand it
        if (!wasPinned && updatedBudget.isPinned) {
          this.isExpanded = true;
        }
        
        // Refresh categories reference to trigger change detection
        this.refreshCategoriesReference();
        
        this.notification.toast('Budget updated successfully', 'success');
      },
      error: (error) => {
        this.budgetModal.setErrorMessage('Failed to update budget');
        this.notification.error('Failed to update budget');
        console.error('Error updating budget:', error);
      }
    });
  }

  async deleteBudget() {
    const confirmed = await this.notification.confirm({
      title: 'Delete Budget',
      text: 'Are you sure you want to delete this budget? This action cannot be undone.',
      confirmButtonText: 'Yes, delete it',
      cancelButtonText: 'Cancel',
      icon: 'warning'
    });
    
    if (confirmed) {
      this.budgetService.deleteBudget(this.budget.id).subscribe({
        next: () => {
          this.budgetDeleted.emit(this.budget.id);
          this.notification.toast('Budget deleted successfully', 'success');
        },
        error: (error) => {
          this.notification.error('Failed to delete budget', 'Error');
          console.error('Error deleting budget:', error);
        }
      });
    }
  }

  // Toggle expanded/collapsed state
  toggleExpand() {
    this.isExpanded = !this.isExpanded;
    
    // If expanding the budget and it's not already expanded, refresh data 
    // to ensure we're showing the latest information
    if (this.isExpanded) {
      this.refreshCategoriesReference();
    }
  }
  
  // Handle drag and drop of categories
  dropCategory(event: CdkDragDrop<Category[]>) {
    if (event.previousIndex === event.currentIndex) {
      return; // No change in order
    }
    
    if (!this.budget.categories || this.budget.categories.length === 0) {
      return; // No categories to reorder
    }
    
    // Update the array order locally
    moveItemInArray(this.budget.categories, event.previousIndex, event.currentIndex);
    
    // Update order property for each category
    this.budget.categories.forEach((category, index) => {
      category.order = index;
    });
    
    // Save the new order to the backend
    const orderUpdates = this.budget.categories.map(cat => ({
      id: cat.id,
      order: cat.order
    }));
    
    this.categoryService.updateCategoriesOrder(orderUpdates).subscribe({
      next: () => {
        // No notification for successful reordering to avoid constant notifications
      },
      error: (err) => {
        this.notification.error('Failed to update category order');
        console.error('Error updating category order:', err);
        // If the API call fails, we might want to revert the local change
        // But that's complex and may cause UI flicker, so we don't do it here
      }
    });
  }
  
  // Helper method to trigger category updates for proper change detection
  private refreshCategoriesReference() {
    if (this._budget && this._budget.categories) {
      // Create a new array reference with the same items to trigger change detection
      this._budget.categories = [...this._budget.categories];
    }
  }
}
