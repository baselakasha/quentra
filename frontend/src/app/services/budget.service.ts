import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, from, throwError } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import {
  Budget,
  CreateBudgetRequest,
  UpdateBudgetRequest,
  ErrorResponse,
  BudgetSummary
} from '../types/budget.types';
import { ConfigService } from './config.service';
import { DbService, LocalBudget, LocalCategory } from './db.service';
import { NetworkService } from './network.service';
import { SyncService } from './sync.service';

@Injectable({ providedIn: 'root' })
export class BudgetService {
  private apiEndpoint = 'budget';

  constructor(
    private http: HttpClient,
    private configService: ConfigService,
    private db: DbService,
    private network: NetworkService,
    private sync: SyncService
  ) {}

  createBudget(budgetData: CreateBudgetRequest): Observable<Budget> {
    const tempId = 'tmp_' + crypto.randomUUID();
    const localBudget: LocalBudget = {
      id: tempId,
      name: budgetData.name,
      startDate: budgetData.startDate,
      endDate: budgetData.endDate,
      monthlyIncome: budgetData.monthlyIncome ?? null,
      isPinned: false,
      _dirty: true,
      _isNew: true,
      _deleted: false,
      _syncedAt: ''
    };

    return from(
      this.db.saveBudget(localBudget).then(() =>
        this.db.enqueue({
          operation: 'budget:create',
          entityId: tempId,
          payload: budgetData, // no id — server generates it
          status: 'pending',
          retries: 0,
          createdAt: new Date().toISOString()
        })
      )
    ).pipe(
      map(() => this.toApiBudget(localBudget, [])),
      tap(() => { if (this.network.isOnline) this.sync.triggerSync(); })
    );
  }

  getBudgets(sortField?: string, sortDirection?: 'asc' | 'desc'): Observable<Budget[]> {
    return from(this.loadBudgetsWithCategories()).pipe(
      map(budgets => {
        const active = budgets.filter(b => !b._deleted);
        return this.sortBudgets(active, sortField, sortDirection);
      })
    );
  }

  getBudgetById(id: string): Observable<Budget> {
    return from(this.loadBudgetWithCategories(id)).pipe(
      map(result => {
        if (!result) throw new Error('Budget not found');
        return result;
      })
    );
  }

  updateBudget(id: string, budgetData: UpdateBudgetRequest): Observable<Budget> {
    return from(
      this.db.getBudgetById(id).then(async existing => {
        if (!existing) throw new Error('Budget not found');
        const updated: LocalBudget = {
          ...existing,
          ...budgetData,
          startDate: budgetData.startDate ?? existing.startDate,
          endDate: budgetData.endDate ?? existing.endDate,
          monthlyIncome: budgetData.monthlyIncome !== undefined
            ? (budgetData.monthlyIncome ?? null)
            : existing.monthlyIncome,
          _dirty: true
        };
        await this.db.saveBudget(updated);
        await this.db.enqueue({
          operation: 'budget:update',
          entityId: id,
          payload: budgetData,
          status: 'pending',
          retries: 0,
          createdAt: new Date().toISOString()
        });
        return updated;
      })
    ).pipe(
      map(updated => this.toApiBudget(updated, [])),
      tap(() => { if (this.network.isOnline) this.sync.triggerSync(); })
    );
  }

  deleteBudget(id: string): Observable<void> {
    return from(
      this.db.markBudgetDeleted(id).then(() =>
        this.db.enqueue({
          operation: 'budget:delete',
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

  pinBudget(id: string): Observable<Budget> {
    return from(
      (async () => {
        const allBudgets = await this.db.getBudgets();
        for (const b of allBudgets) {
          if (b.isPinned) {
            await this.db.saveBudget({ ...b, isPinned: false });
          }
        }
        const target = await this.db.getBudgetById(id);
        if (!target) throw new Error('Budget not found');
        const pinned = { ...target, isPinned: true, _dirty: true };
        await this.db.saveBudget(pinned);
        await this.db.enqueue({
          operation: 'budget:pin',
          entityId: id,
          payload: null,
          status: 'pending',
          retries: 0,
          createdAt: new Date().toISOString()
        });
        return pinned;
      })()
    ).pipe(
      map(updated => this.toApiBudget(updated, [])),
      tap(() => { if (this.network.isOnline) this.sync.triggerSync(); })
    );
  }

  unpinBudget(id: string): Observable<Budget> {
    return from(
      this.db.getBudgetById(id).then(async existing => {
        if (!existing) throw new Error('Budget not found');
        const updated = { ...existing, isPinned: false, _dirty: true };
        await this.db.saveBudget(updated);
        await this.db.enqueue({
          operation: 'budget:unpin',
          entityId: id,
          payload: null,
          status: 'pending',
          retries: 0,
          createdAt: new Date().toISOString()
        });
        return updated;
      })
    ).pipe(
      map(updated => this.toApiBudget(updated, [])),
      tap(() => { if (this.network.isOnline) this.sync.triggerSync(); })
    );
  }

  duplicateBudget(id: string): Observable<Budget> {
    if (this.network.isOnline) {
      return this.http.post<Budget>(
        this.configService.getFullApiUrl(`${this.apiEndpoint}/${id}/duplicate`), {}
      ).pipe(
        tap(async newBudget => {
          await this.db.saveBudget({
            id: newBudget.id,
            name: newBudget.name,
            startDate: newBudget.startDate,
            endDate: newBudget.endDate,
            monthlyIncome: newBudget.monthlyIncome ?? null,
            isPinned: newBudget.isPinned ?? false,
            _dirty: false,
            _isNew: false,
            _deleted: false,
            _syncedAt: new Date().toISOString()
          });
          for (const cat of (newBudget.categories ?? [])) {
            await this.db.saveCategory({
              id: cat.id,
              budgetId: newBudget.id,
              name: cat.name,
              plannedAmount: Number(cat.plannedAmount),
              spentAmount: Number(cat.spentAmount),
              order: cat.order ?? 0,
              type: (cat.type as 'need' | 'want') ?? 'need',
              _dirty: false,
              _isNew: false,
              _deleted: false,
              _syncedAt: new Date().toISOString()
            });
          }
        }),
        catchError(this.handleError)
      );
    }

    return from(
      (async () => {
        const source = await this.db.getBudgetById(id);
        if (!source) throw new Error('Budget not found');
        const sourceCats = await this.db.getCategoriesByBudget(id);

        const newBudgetTempId = 'tmp_' + crypto.randomUUID();
        const newBudget: LocalBudget = {
          ...source,
          id: newBudgetTempId,
          name: `${source.name} (Copy)`,
          isPinned: false,
          _dirty: true,
          _isNew: true,
          _deleted: false,
          _syncedAt: ''
        };
        await this.db.saveBudget(newBudget);
        await this.db.enqueue({
          operation: 'budget:create',
          entityId: newBudgetTempId,
          payload: {
            name: newBudget.name,
            startDate: newBudget.startDate,
            endDate: newBudget.endDate,
            monthlyIncome: newBudget.monthlyIncome
          },
          status: 'pending',
          retries: 0,
          createdAt: new Date().toISOString()
        });

        const newCategories: LocalCategory[] = [];
        for (const cat of sourceCats.filter(c => !c._deleted)) {
          const newCatTempId = 'tmp_' + crypto.randomUUID();
          const newCat: LocalCategory = {
            ...cat,
            id: newCatTempId,
            budgetId: newBudgetTempId,
            spentAmount: 0,
            _dirty: true,
            _isNew: true,
            _deleted: false,
            _syncedAt: ''
          };
          await this.db.saveCategory(newCat);
          await this.db.enqueue({
            operation: 'category:create',
            entityId: newCatTempId,
            payload: {
              name: newCat.name,
              budgetId: newBudgetTempId, // will be replaced by replaceTempId after budget syncs
              plannedAmount: newCat.plannedAmount,
              spentAmount: 0,
              order: newCat.order,
              type: newCat.type
            },
            status: 'pending',
            retries: 0,
            createdAt: new Date().toISOString()
          });
          newCategories.push(newCat);
        }

        return { budget: newBudget, categories: newCategories };
      })()
    ).pipe(
      map(({ budget, categories }) => this.toApiBudget(budget, categories)),
      tap(() => { if (this.network.isOnline) this.sync.triggerSync(); })
    );
  }

  calculateBudgetSummary(budget: Budget): BudgetSummary {
    const monthlyIncome = budget.monthlyIncome ?? 0;

    if (!budget.categories || budget.categories.length === 0) {
      return {
        totalPlanned: 0,
        totalSpent: 0,
        remainingBudget: monthlyIncome,
        percentageSpent: 0
      };
    }

    const totalPlanned = budget.categories.reduce((sum, cat) => sum + cat.plannedAmount, 0);
    const totalSpent = budget.categories.reduce((sum, cat) => sum + cat.spentAmount, 0);
    const remainingBudget = monthlyIncome - totalSpent;
    const percentageSpent = monthlyIncome > 0 ? (totalSpent / monthlyIncome) * 100 : 0;

    return { totalPlanned, totalSpent, remainingBudget, percentageSpent };
  }

  getBudgetsWithSummaries(): Observable<(Budget & { summary: BudgetSummary })[]> {
    return this.getBudgets().pipe(
      map(budgets => budgets.map(budget => ({
        ...budget,
        summary: this.calculateBudgetSummary(budget)
      })))
    );
  }

  private async loadBudgetsWithCategories(): Promise<(LocalBudget & { _categories: LocalCategory[] })[]> {
    const budgets = await this.db.getBudgets();
    return Promise.all(
      budgets.map(async b => ({
        ...b,
        _categories: await this.db.getCategoriesByBudget(b.id)
      }))
    );
  }

  private async loadBudgetWithCategories(id: string): Promise<Budget | null> {
    const budget = await this.db.getBudgetById(id);
    if (!budget) return null;
    const categories = await this.db.getCategoriesByBudget(id);
    return this.toApiBudget(budget, categories);
  }

  private toApiBudget(local: LocalBudget, categories: LocalCategory[]): Budget {
    return {
      id: local.id,
      name: local.name,
      startDate: local.startDate,
      endDate: local.endDate,
      monthlyIncome: local.monthlyIncome,
      isPinned: local.isPinned,
      categories: categories
        .filter(c => !c._deleted)
        .sort((a, b) => a.order - b.order)
        .map(c => ({
          id: c.id,
          name: c.name,
          plannedAmount: c.plannedAmount,
          spentAmount: c.spentAmount,
          order: c.order,
          type: c.type
        }))
    };
  }

  private sortBudgets(
    budgets: (LocalBudget & { _categories: LocalCategory[] })[],
    sortField?: string,
    sortDirection?: 'asc' | 'desc'
  ): Budget[] {
    const sorted = [...budgets].sort((a, b) => {
      if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;

      if (sortField) {
        const aVal = (a as any)[sortField];
        const bVal = (b as any)[sortField];
        const dir = sortDirection === 'asc' ? 1 : -1;
        if (aVal < bVal) return -dir;
        if (aVal > bVal) return dir;
      } else {
        if (a.startDate < b.startDate) return 1;
        if (a.startDate > b.startDate) return -1;
      }
      return 0;
    });

    return sorted.map(b => this.toApiBudget(b, b._categories));
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
