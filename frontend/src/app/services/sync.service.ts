import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { filter, distinctUntilChanged } from 'rxjs/operators';
import { firstValueFrom } from 'rxjs';
import { DbService, SyncOperation } from './db.service';
import { NetworkService } from './network.service';
import { ConfigService } from './config.service';
import { EventService } from './event.service';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class SyncService {
  private syncing = false;
  private syncQueued = false;

  constructor(
    private db: DbService,
    private http: HttpClient,
    private network: NetworkService,
    private config: ConfigService,
    private events: EventService,
    private auth: AuthService
  ) {}

  init(): void {
    this.network.online$.pipe(
      filter(online => online),
      distinctUntilChanged()
    ).subscribe(() => this.sync());

    // Trigger sync when the user logs in so server data is pulled immediately
    this.events.authStateChanged$.pipe(
      filter(() => this.auth.isAuthenticated())
    ).subscribe(() => this.sync());

    if (this.network.isOnline && this.auth.isAuthenticated()) {
      this.sync();
    }
  }

  triggerSync(): void {
    if (this.syncing) {
      this.syncQueued = true;
      return;
    }
    this.sync();
  }

  private async sync(): Promise<void> {
    if (!this.auth.isAuthenticated()) return;
    if (this.syncing) {
      this.syncQueued = true;
      return;
    }
    this.syncing = true;
    this.syncQueued = false;
    try {
      await this.pushQueue();
      await this.pullChanges();
      this.events.notifyDataSynced();
    } catch {
      // sync errors are expected (e.g. 401 before login) — ignore silently
    } finally {
      this.syncing = false;
      if (this.syncQueued) {
        this.syncQueued = false;
        this.sync();
      }
    }
  }

  // Push local changes to server.
  // After each create op, the server returns a real ID which replaces the temp ID
  // in local DB before continuing with remaining ops (which may reference that temp ID).
  private async pushQueue(): Promise<void> {
    const MAX_PASSES = 200;

    for (let pass = 0; pass < MAX_PASSES; pass++) {
      const ops = await this.db.getPendingOps();
      if (ops.length === 0) break;

      const deduplicated = this.deduplicateOps(ops);
      let needsRepass = false;

      for (const op of deduplicated) {
        try {
          const result = await this.executeOp(op);
          await this.db.markOpDone(op.id!);

          if (op.operation === 'budget:create' || op.operation === 'category:create') {
            const type = op.operation === 'budget:create' ? 'budget' : 'category';
            await this.db.replaceTempId(op.entityId, result.id, type);
            needsRepass = true;
            break; // re-fetch ops now that IDs have changed
          }
        } catch (err: any) {
          if (op.operation.endsWith(':delete') && err?.status === 404) {
            await this.db.markOpDone(op.id!);
          } else if (err?.status === 409 || err?.status === 400) {
            await this.db.markOpFailed(op.id!);
          } else {
            return; // network error — stop, retry on next sync
          }
        }
      }

      if (!needsRepass) break;
    }
  }

  private async executeOp(op: SyncOperation): Promise<any> {
    const base = this.config.apiUrl;
    switch (op.operation) {
      case 'budget:create':
        return firstValueFrom(this.http.post(`${base}/budget`, op.payload));
      case 'budget:update':
        return firstValueFrom(this.http.put(`${base}/budget/${op.entityId}`, op.payload));
      case 'budget:delete':
        return firstValueFrom(this.http.delete(`${base}/budget/${op.entityId}`));
      case 'budget:pin':
        return firstValueFrom(this.http.put(`${base}/budget/${op.entityId}/pin`, {}));
      case 'budget:unpin':
        return firstValueFrom(this.http.put(`${base}/budget/${op.entityId}/unpin`, {}));
      case 'budget:duplicate':
        return firstValueFrom(this.http.post(`${base}/budget/${op.entityId}/duplicate`, {}));
      case 'category:create':
        return firstValueFrom(this.http.post(`${base}/category`, op.payload));
      case 'category:update':
        return firstValueFrom(this.http.put(`${base}/category/${op.entityId}`, op.payload));
      case 'category:delete':
        return firstValueFrom(this.http.delete(`${base}/category/${op.entityId}`));
      case 'category:order':
        return firstValueFrom(this.http.put(`${base}/category/order`, op.payload));
    }
  }

  private async pullChanges(): Promise<void> {
    const lastSync = await this.db.getLastSync();
    const since = lastSync ? lastSync.toISOString() : '';
    const base = this.config.apiUrl;
    const url = since ? `${base}/budget?since=${since}` : `${base}/budget`;

    const budgets = await firstValueFrom(this.http.get<any[]>(url));

    for (const budget of budgets) {
      const existing = await this.db.getBudgetById(budget.id);
      if (existing?._dirty) continue;

      await this.db.saveBudget({
        id: budget.id,
        name: budget.name,
        startDate: budget.startDate,
        endDate: budget.endDate,
        monthlyIncome: budget.monthlyIncome != null ? Number(budget.monthlyIncome) : null,
        isPinned: budget.isPinned ?? false,
        _dirty: false,
        _deleted: false,
        _isNew: false,
        _syncedAt: new Date().toISOString()
      });

      for (const cat of (budget.categories ?? [])) {
        const existingCat = await this.db.getCategoryById(cat.id);
        if (existingCat?._dirty) continue;

        await this.db.saveCategory({
          id: cat.id,
          budgetId: budget.id,
          name: cat.name,
          plannedAmount: Number(cat.plannedAmount),
          spentAmount: Number(cat.spentAmount),
          order: cat.order ?? 0,
          type: cat.type ?? 'need',
          _dirty: false,
          _deleted: false,
          _isNew: false,
          _syncedAt: new Date().toISOString()
        });
      }
    }

    await this.db.setLastSync(new Date());
  }

  // For update ops on the same entity, keep only the latest.
  // Create ops are never deduplicated — there should only ever be one per temp ID.
  private deduplicateOps(ops: SyncOperation[]): SyncOperation[] {
    const seen = new Map<string, SyncOperation>();
    for (const op of ops) {
      const key = `${op.operation}:${op.entityId}`;
      seen.set(key, op);
    }
    return [...seen.values()];
  }
}
