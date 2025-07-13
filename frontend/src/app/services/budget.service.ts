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
import { ConfigService } from './config.service';

@Injectable({
  providedIn: 'root'
})
export class BudgetService {
  private apiEndpoint = 'budget';

  constructor(
    private http: HttpClient,
    private configService: ConfigService
  ) { }

  createBudget(budgetData: CreateBudgetRequest): Observable<Budget> {
    return this.http.post<Budget>(this.configService.getFullApiUrl(this.apiEndpoint), budgetData)
      .pipe(
        catchError(this.handleError)
      );
  }

  getBudgets(): Observable<Budget[]> {
    return this.http.get<Budget[]>(this.configService.getFullApiUrl(this.apiEndpoint))
      .pipe(
        catchError(this.handleError)
      );
  }

  getBudgetById(id: string): Observable<Budget> {
    return this.http.get<Budget>(this.configService.getFullApiUrl(`${this.apiEndpoint}/${id}`))
      .pipe(
        catchError(this.handleError)
      );
  }

  updateBudget(id: string, budgetData: UpdateBudgetRequest): Observable<Budget> {
    return this.http.put<Budget>(this.configService.getFullApiUrl(`${this.apiEndpoint}/${id}`), budgetData)
      .pipe(
        catchError(this.handleError)
      );
  }

  deleteBudget(id: string): Observable<void> {
    return this.http.delete<void>(this.configService.getFullApiUrl(`${this.apiEndpoint}/${id}`))
      .pipe(
        catchError(this.handleError)
      );
  }
  
  pinBudget(id: string): Observable<Budget> {
    return this.http.put<Budget>(this.configService.getFullApiUrl(`${this.apiEndpoint}/${id}/pin`), {})
      .pipe(
        catchError(this.handleError)
      );
  }
  
  unpinBudget(id: string): Observable<Budget> {
    return this.http.put<Budget>(this.configService.getFullApiUrl(`${this.apiEndpoint}/${id}/unpin`), {})
      .pipe(
        catchError(this.handleError)
      );
  }
  
  duplicateBudget(id: string): Observable<Budget> {
    return this.http.post<Budget>(this.configService.getFullApiUrl(`${this.apiEndpoint}/${id}/duplicate`), {})
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
      console.error('An error occurred:', error.error);
      return throwError(() => ({
        error: { error: 'Unable to connect to server. Please try again later.' }
      }));
    } else {
      console.error(`Backend returned code ${error.status}, body was: `, error.error);
      return throwError(() => error);
    }
  }
}
