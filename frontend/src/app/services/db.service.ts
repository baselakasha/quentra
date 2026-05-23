import { Injectable } from '@angular/core';
import { openDB, DBSchema, IDBPDatabase } from 'idb';

export interface LocalBudget {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  monthlyIncome: number | null;
  isPinned: boolean;
  _dirty: boolean;
  _deleted: boolean;
  _isNew: boolean;
  _syncedAt: string;
}

export interface LocalCategory {
  id: string;
  budgetId: string;
  name: string;
  plannedAmount: number;
  spentAmount: number;
  order: number;
  type: 'need' | 'want';
  _dirty: boolean;
  _deleted: boolean;
  _isNew: boolean;
  _syncedAt: string;
}

export interface SyncOperation {
  id?: number;
  status: 'pending' | 'failed';
  retries: number;
  createdAt: string;
  operation:
    | 'budget:create' | 'budget:update' | 'budget:delete'
    | 'budget:pin'    | 'budget:unpin'  | 'budget:duplicate'
    | 'category:create' | 'category:update' | 'category:delete'
    | 'category:order';
  entityId: string;
  payload: unknown;
}

interface QuentraDB extends DBSchema {
  budgets: {
    key: string;
    value: LocalBudget;
    indexes: { 'by-pinned': number };
  };
  categories: {
    key: string;
    value: LocalCategory;
    indexes: { 'by-budget': string };
  };
  meta: {
    key: string;
    value: unknown;
  };
  syncQueue: {
    key: number;
    value: SyncOperation;
    indexes: { 'by-status': string };
  };
}

@Injectable({ providedIn: 'root' })
export class DbService {
  private dbPromise: Promise<IDBPDatabase<QuentraDB>>;

  constructor() {
    this.dbPromise = openDB<QuentraDB>('quentra-db', 1, {
      upgrade(db: IDBPDatabase<QuentraDB>) {
        const budgetStore = db.createObjectStore('budgets', { keyPath: 'id' });
        budgetStore.createIndex('by-pinned', 'isPinned');

        const categoryStore = db.createObjectStore('categories', { keyPath: 'id' });
        categoryStore.createIndex('by-budget', 'budgetId');

        db.createObjectStore('meta', { keyPath: undefined });

        const syncStore = db.createObjectStore('syncQueue', { keyPath: 'id', autoIncrement: true });
        syncStore.createIndex('by-status', 'status');
      }
    });
  }

  // --- Budgets ---

  async getBudgets(): Promise<LocalBudget[]> {
    const db = await this.dbPromise;
    return db.getAll('budgets');
  }

  async getBudgetById(id: string): Promise<LocalBudget | undefined> {
    const db = await this.dbPromise;
    return db.get('budgets', id);
  }

  async saveBudget(budget: LocalBudget): Promise<void> {
    const db = await this.dbPromise;
    await db.put('budgets', budget);
  }

  async markBudgetDeleted(id: string): Promise<void> {
    const db = await this.dbPromise;
    const budget = await db.get('budgets', id);
    if (budget) {
      budget._deleted = true;
      budget._dirty = true;
      await db.put('budgets', budget);
    }
  }

  // --- Categories ---

  async getCategoriesByBudget(budgetId: string): Promise<LocalCategory[]> {
    const db = await this.dbPromise;
    return db.getAllFromIndex('categories', 'by-budget', budgetId);
  }

  async getCategoryById(id: string): Promise<LocalCategory | undefined> {
    const db = await this.dbPromise;
    return db.get('categories', id);
  }

  async saveCategory(category: LocalCategory): Promise<void> {
    const db = await this.dbPromise;
    await db.put('categories', category);
  }

  async markCategoryDeleted(id: string): Promise<void> {
    const db = await this.dbPromise;
    const category = await db.get('categories', id);
    if (category) {
      category._deleted = true;
      category._dirty = true;
      await db.put('categories', category);
    }
  }

  // --- Sync queue ---

  async enqueue(op: Omit<SyncOperation, 'id'>): Promise<void> {
    const db = await this.dbPromise;
    await db.add('syncQueue', op as SyncOperation);
  }

  async getPendingOps(): Promise<SyncOperation[]> {
    const db = await this.dbPromise;
    return db.getAllFromIndex('syncQueue', 'by-status', 'pending');
  }

  async markOpDone(id: number): Promise<void> {
    const db = await this.dbPromise;
    await db.delete('syncQueue', id);
  }

  async markOpFailed(id: number): Promise<void> {
    const db = await this.dbPromise;
    const op = await db.get('syncQueue', id);
    if (op) {
      op.status = 'failed';
      op.retries = (op.retries ?? 0) + 1;
      await db.put('syncQueue', op);
    }
  }

  // --- Meta ---

  async getLastSync(): Promise<Date | null> {
    const db = await this.dbPromise;
    const value = await db.get('meta', 'lastSync');
    return value ? new Date(value as string) : null;
  }

  async setLastSync(date: Date): Promise<void> {
    const db = await this.dbPromise;
    await db.put('meta', date.toISOString(), 'lastSync');
  }

  async replaceTempId(tempId: string, realId: string, type: 'budget' | 'category'): Promise<void> {
    const db = await this.dbPromise;
    const tx = db.transaction(['budgets', 'categories', 'syncQueue'], 'readwrite');

    if (type === 'budget') {
      const budgetStore = tx.objectStore('budgets');
      const budget = await budgetStore.get(tempId);
      if (budget) {
        await budgetStore.delete(tempId);
        await budgetStore.put({ ...budget, id: realId, _isNew: false, _dirty: false, _syncedAt: new Date().toISOString() });

        const catStore = tx.objectStore('categories');
        const cats = await catStore.index('by-budget').getAll(tempId);
        for (const cat of cats) {
          await catStore.delete(cat.id);
          await catStore.put({ ...cat, budgetId: realId });
        }
      }
    } else {
      const catStore = tx.objectStore('categories');
      const cat = await catStore.get(tempId);
      if (cat) {
        await catStore.delete(tempId);
        await catStore.put({ ...cat, id: realId, _isNew: false, _dirty: false, _syncedAt: new Date().toISOString() });
      }
    }

    // Update any pending ops that reference the tempId
    const syncStore = tx.objectStore('syncQueue');
    const allOps = await syncStore.getAll();
    for (const op of allOps) {
      const entityChanged = op.entityId === tempId;
      const payloadBudgetIdChanged =
        type === 'budget' &&
        op.payload !== null &&
        typeof op.payload === 'object' &&
        (op.payload as any).budgetId === tempId;

      if (entityChanged || payloadBudgetIdChanged) {
        await syncStore.delete(op.id!);
        const updated: SyncOperation = {
          ...op,
          entityId: entityChanged ? realId : op.entityId,
          payload: payloadBudgetIdChanged
            ? { ...(op.payload as object), budgetId: realId }
            : op.payload
        };
        delete (updated as any).id;
        await syncStore.add(updated);
      }
    }

    await tx.done;
  }

  async clearAllData(): Promise<void> {
    const db = await this.dbPromise;
    await db.clear('budgets');
    await db.clear('categories');
    await db.clear('syncQueue');
    await db.delete('meta', 'lastSync');
  }
}
