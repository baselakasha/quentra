import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, from, throwError } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import {
  Category,
  CreateCategoryRequest,
  UpdateCategoryRequest,
  ErrorResponse,
  CategoryWithCalculations
} from '../types/budget.types';
import { ConfigService } from './config.service';
import { DbService, LocalCategory } from './db.service';
import { NetworkService } from './network.service';
import { SyncService } from './sync.service';

@Injectable({ providedIn: 'root' })
export class CategoryService {
  private apiEndpoint = 'category';

  constructor(
    private http: HttpClient,
    private configService: ConfigService,
    private db: DbService,
    private network: NetworkService,
    private sync: SyncService
  ) {}

  createCategory(categoryData: CreateCategoryRequest): Observable<Category> {
    const tempId = 'tmp_' + crypto.randomUUID();
    return from(
      this.db.getCategoriesByBudget(categoryData.budgetId).then(async existing => {
        const nextOrder = existing.filter(c => !c._deleted).length;
        const localCat: LocalCategory = {
          id: tempId,
          budgetId: categoryData.budgetId,
          name: categoryData.name,
          plannedAmount: categoryData.plannedAmount ?? 0,
          spentAmount: categoryData.spentAmount ?? 0,
          order: nextOrder,
          type: categoryData.type ?? 'need',
          _dirty: true,
          _isNew: true,
          _deleted: false,
          _syncedAt: ''
        };
        await this.db.saveCategory(localCat);
        await this.db.enqueue({
          operation: 'category:create',
          entityId: tempId,
          payload: {
            name: categoryData.name,
            budgetId: categoryData.budgetId, // no id — server generates it
            plannedAmount: localCat.plannedAmount,
            spentAmount: localCat.spentAmount,
            type: localCat.type
          },
          status: 'pending',
          retries: 0,
          createdAt: new Date().toISOString()
        });
        return localCat;
      })
    ).pipe(
      map(local => this.toApiCategory(local)),
      tap(() => { if (this.network.isOnline) this.sync.triggerSync(); })
    );
  }

  getCategoryById(id: string): Observable<Category> {
    return from(this.db.getCategoryById(id)).pipe(
      map(local => {
        if (!local) throw new Error('Category not found');
        return this.toApiCategory(local);
      })
    );
  }

  updateCategory(id: string, categoryData: UpdateCategoryRequest): Observable<Category> {
    return from(
      this.db.getCategoryById(id).then(async existing => {
        if (!existing) throw new Error('Category not found');
        const updated: LocalCategory = {
          ...existing,
          name: categoryData.name ?? existing.name,
          plannedAmount: categoryData.plannedAmount ?? existing.plannedAmount,
          spentAmount: categoryData.spentAmount ?? existing.spentAmount,
          type: (categoryData.type as 'need' | 'want') ?? existing.type,
          _dirty: true
        };
        await this.db.saveCategory(updated);
        await this.db.enqueue({
          operation: 'category:update',
          entityId: id,
          payload: categoryData,
          status: 'pending',
          retries: 0,
          createdAt: new Date().toISOString()
        });
        return updated;
      })
    ).pipe(
      map(updated => this.toApiCategory(updated)),
      tap(() => { if (this.network.isOnline) this.sync.triggerSync(); })
    );
  }

  deleteCategory(id: string): Observable<void> {
    return from(
      this.db.markCategoryDeleted(id).then(() =>
        this.db.enqueue({
          operation: 'category:delete',
          entityId: id,
          payload: null,
          status: 'pending',
          retries: 0,
          createdAt: new Date().toISOString()
        })
      )
    ).pipe(
      map(() => undefined as void),
      tap(() => { if (this.network.isOnline) this.sync.triggerSync(); })
    );
  }

  updateSpentAmount(id: string, spentAmount: number): Observable<Category> {
    return this.updateCategory(id, { spentAmount });
  }

  updatePlannedAmount(id: string, plannedAmount: number): Observable<Category> {
    return this.updateCategory(id, { plannedAmount });
  }

  updateCategoriesOrder(categories: Pick<Category, 'id' | 'order'>[]): Observable<void> {
    return from(
      (async () => {
        for (const { id, order } of categories) {
          const cat = await this.db.getCategoryById(id);
          if (cat) {
            await this.db.saveCategory({ ...cat, order: order ?? cat.order });
          }
        }
        if (categories.length > 0) {
          await this.db.enqueue({
            operation: 'category:order',
            entityId: categories[0].id,
            payload: { categories },
            status: 'pending',
            retries: 0,
            createdAt: new Date().toISOString()
          });
        }
      })()
    ).pipe(
      map(() => undefined as void),
      tap(() => { if (this.network.isOnline) this.sync.triggerSync(); })
    );
  }

  calculateCategoryWithCalculations(category: Category): CategoryWithCalculations {
    const remainingAmount = category.plannedAmount - category.spentAmount;
    const percentageSpent = category.plannedAmount > 0
      ? (category.spentAmount / category.plannedAmount) * 100
      : 0;
    const isOverBudget = category.spentAmount > category.plannedAmount;
    return { ...category, remainingAmount, percentageSpent, isOverBudget };
  }

  getCategoryWithCalculations(id: string): Observable<CategoryWithCalculations> {
    return this.getCategoryById(id).pipe(
      map(category => this.calculateCategoryWithCalculations(category))
    );
  }

  private toApiCategory(local: LocalCategory): Category {
    return {
      id: local.id,
      name: local.name,
      plannedAmount: local.plannedAmount,
      spentAmount: local.spentAmount,
      order: local.order,
      type: local.type
    };
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
