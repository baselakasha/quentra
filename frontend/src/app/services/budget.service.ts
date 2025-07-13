import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { 
  Budget, 
  CreateBudgetRequest, 
  UpdateBudgetRequest, 
  ErrorResponse,
  BudgetSummary 
} from '../types/budget.types';

@Injectable({
  providedIn: 'root'
})
export class BudgetService {
  private apiUrl = 'http://localhost:8080/api/budget';

  constructor(private http: HttpClient) { }

  createBudget(budgetData: CreateBudgetRequest): Observable<Budget> {
    return this.http.post<Budget>(this.apiUrl, budgetData)
      .pipe(
        catchError(this.handleError)
      );
  }

  getBudgets(): Observable<Budget[]> {
    return this.http.get<Budget[]>(this.apiUrl)
      .pipe(
        catchError(this.handleError)
      );
  }

  getBudgetById(id: string): Observable<Budget> {
    return this.http.get<Budget>(`${this.apiUrl}/${id}`)
      .pipe(
        catchError(this.handleError)
      );
  }

  updateBudget(id: string, budgetData: UpdateBudgetRequest): Observable<Budget> {
    return this.http.put<Budget>(`${this.apiUrl}/${id}`, budgetData)
      .pipe(
        catchError(this.handleError)
      );
  }

  deleteBudget(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`)
      .pipe(
        catchError(this.handleError)
      );
  }
  
  pinBudget(id: string): Observable<Budget> {
    return this.http.put<Budget>(`${this.apiUrl}/${id}/pin`, {})
      .pipe(
        catchError(this.handleError)
      );
  }
  
  unpinBudget(id: string): Observable<Budget> {
    return this.http.put<Budget>(`${this.apiUrl}/${id}/unpin`, {})
      .pipe(
        catchError(this.handleError)
      );
  }

  // Utility method to calculate budget summary
  calculateBudgetSummary(budget: Budget): BudgetSummary {
    if (!budget.categories || budget.categories.length === 0) {
      return {
        totalPlanned: 0,
        totalSpent: 0,
        remainingBudget: budget.monthlyIncome,
        percentageSpent: 0
      };
    }

    const totalPlanned = budget.categories.reduce((sum, cat) => sum + cat.plannedAmount, 0);
    const totalSpent = budget.categories.reduce((sum, cat) => sum + cat.spentAmount, 0);
    const remainingBudget = budget.monthlyIncome - totalSpent;
    const percentageSpent = budget.monthlyIncome > 0 ? (totalSpent / budget.monthlyIncome) * 100 : 0;

    return {
      totalPlanned,
      totalSpent,
      remainingBudget,
      percentageSpent
    };
  }

  // Helper method to get budgets with calculated summaries
  getBudgetsWithSummaries(): Observable<(Budget & { summary: BudgetSummary })[]> {
    return this.getBudgets().pipe(
      map(budgets => budgets.map(budget => ({
        ...budget,
        summary: this.calculateBudgetSummary(budget)
      })))
    );
  }

  private handleError(error: HttpErrorResponse) {
    if (error.status === 0) {
      // A client-side or network error occurred
      console.error('An error occurred:', error.error);
      return throwError(() => ({
        error: { error: 'Unable to connect to server. Please try again later.' }
      }));
    } else {
      // The backend returned an unsuccessful response code
      console.error(`Backend returned code ${error.status}, body was: `, error.error);
      return throwError(() => error);
    }
  }
}
