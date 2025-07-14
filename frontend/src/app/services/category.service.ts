import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { 
  Category, 
  CreateCategoryRequest, 
  UpdateCategoryRequest, 
  ErrorResponse,
  CategoryWithCalculations 
} from '../types/budget.types';
import { ConfigService } from './config.service';

@Injectable({
  providedIn: 'root'
})
export class CategoryService {
  private apiEndpoint = 'category';

  constructor(
    private http: HttpClient,
    private configService: ConfigService
  ) { }

  createCategory(categoryData: CreateCategoryRequest): Observable<Category> {
    return this.http.post<Category>(this.configService.getFullApiUrl(this.apiEndpoint), categoryData)
      .pipe(
        catchError(this.handleError)
      );
  }

  getCategoryById(id: string): Observable<Category> {
    return this.http.get<Category>(this.configService.getFullApiUrl(`${this.apiEndpoint}/${id}`))
      .pipe(
        catchError(this.handleError)
      );
  }

  updateCategory(id: string, categoryData: UpdateCategoryRequest): Observable<Category> {
    return this.http.put<Category>(this.configService.getFullApiUrl(`${this.apiEndpoint}/${id}`), categoryData)
      .pipe(
        catchError(this.handleError)
      );
  }

  deleteCategory(id: string): Observable<void> {
    return this.http.delete<void>(this.configService.getFullApiUrl(`${this.apiEndpoint}/${id}`))
      .pipe(
        catchError(this.handleError)
      );
  }

  // Helper method to update spent amount
  updateSpentAmount(id: string, spentAmount: number): Observable<Category> {
    return this.updateCategory(id, { spentAmount });
  }

  // Helper method to update planned amount
  updatePlannedAmount(id: string, plannedAmount: number): Observable<Category> {
    return this.updateCategory(id, { plannedAmount });
  }

  // Update the order of categories
  updateCategoriesOrder(categories: Pick<Category, 'id' | 'order'>[]): Observable<void> {
    return this.http.put<void>(
      this.configService.getFullApiUrl(`${this.apiEndpoint}/order`), 
      { categories }
    ).pipe(
      catchError(this.handleError)
    );
  }

  // Utility method to calculate category with additional fields
  calculateCategoryWithCalculations(category: Category): CategoryWithCalculations {
    const remainingAmount = category.plannedAmount - category.spentAmount;
    const percentageSpent = category.plannedAmount > 0 ? 
      (category.spentAmount / category.plannedAmount) * 100 : 0;
    const isOverBudget = category.spentAmount > category.plannedAmount;

    return {
      ...category,
      remainingAmount,
      percentageSpent,
      isOverBudget
    };
  }

  // Helper method to get category with calculations
  getCategoryWithCalculations(id: string): Observable<CategoryWithCalculations> {
    return this.getCategoryById(id).pipe(
      map(category => this.calculateCategoryWithCalculations(category))
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
