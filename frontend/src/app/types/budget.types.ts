// Shared interfaces for budget and category data
export interface User {
  id: string;
  username: string;
  fullName: string;
  createdAt: string;
}

export interface Budget {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  monthlyIncome: number;
  isPinned?: boolean;
  categories?: Category[];
  user?: User;
}

export interface Category {
  id: string;
  name: string;
  plannedAmount: number;
  spentAmount: number;
  budget?: {
    id: string;
    name: string;
  };
}

// Request interfaces for API calls
export interface CreateBudgetRequest {
  name: string;
  startDate: string;
  endDate: string;
  monthlyIncome: number;
}

export interface UpdateBudgetRequest {
  name?: string;
  startDate?: string;
  endDate?: string;
  monthlyIncome?: number;
}

export interface CreateCategoryRequest {
  name: string;
  budgetId: string;
  plannedAmount?: number;
  spentAmount?: number;
}

export interface UpdateCategoryRequest {
  name?: string;
  plannedAmount?: number;
  spentAmount?: number;
}

// Common error response
export interface ErrorResponse {
  error: string;
}

// Budget summary calculations
export interface BudgetSummary {
  totalPlanned: number;
  totalSpent: number;
  remainingBudget: number;
  percentageSpent: number;
}

// Category with calculated fields
export interface CategoryWithCalculations extends Category {
  remainingAmount: number;
  percentageSpent: number;
  isOverBudget: boolean;
}
