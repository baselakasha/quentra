# Quentra iOS Migration Report

**Date**: 2026-05-23  
**Approach**: Angular + Capacitor (same codebase, native iOS wrapper)  
**Goal**: Offline-capable iOS app that syncs with the existing server

---

## 1. Existing Feature Inventory

| Feature | Web Status | iOS Readiness | Notes |
|---------|-----------|---------------|-------|
| Signup / Login | ✅ Complete | ✅ Works as-is | JWT stored in localStorage |
| Budget CRUD | ✅ Complete | ✅ Works as-is | Full create/read/update/delete |
| Category management | ✅ Complete | ✅ Works as-is | Drag-drop reorder, need/want types |
| Pin / unpin budget | ✅ Complete | ✅ Works as-is | One-at-a-time constraint |
| Duplicate budget | ✅ Complete | ✅ Works as-is | Resets spent amounts |
| Statistics dashboard | ✅ Complete | ✅ Works as-is | Charts, sortable table/cards |
| Responsive layout | ✅ Complete | ⚠️ Needs iOS safe-area fixes | Mobile layout exists |
| Offline support | ❌ Missing | ❌ Needs full implementation | See Section 4 |
| Local data cache | ❌ Missing | ❌ Needs implementation | No persistence beyond auth token |
| Sync queue | ❌ Missing | ❌ Needs implementation | No retry/queue logic |
| Biometric auth | ❌ Missing | ❌ Optional, easy to add | Capacitor plugin available |
| Push notifications | ❌ Missing | ❌ Optional | Could notify on budget milestones |

---

## 2. Architecture Overview (Current)

### Frontend — Angular 20 SPA
```
/frontend/src/app/
├── pages/          home, login, signup, statistics
├── components/     header, budget, budget-modal, budget-chart, spending-chart, ...
├── services/       auth, budget, category, config, event, notification
└── types/          budget.types.ts
```

**Key patterns:**
- Standalone components (Angular 20)
- `HttpClient` + `AuthInterceptor` auto-attaches JWT Bearer token
- `ConfigService` builds API URLs from `environment.ts`
- `EventService` (BehaviorSubject) broadcasts auth state changes
- Error display via SweetAlert2 (`NotificationService`)
- Auth token in `localStorage` only — no other data persisted

### Backend — TypeScript/Express REST API
```
POST/GET /api/auth/signup|signin|me
GET|POST|PUT|DELETE /api/budget/:id
PUT /api/budget/:id/pin|unpin
POST /api/budget/:id/duplicate
GET|POST|PUT|DELETE /api/category/:id
PUT /api/category/order
```

- JWT, 1-day expiry, bcrypt passwords
- TypeORM + PostgreSQL (UUID primary keys everywhere)
- No migrations — `synchronize: true`
- All UUIDs on entities, good for offline ID generation

---

## 3. What Works Without Changes

Because Capacitor wraps the Angular WebView, the following require **zero code changes**:

- All Angular components and routing
- All RxJS service logic
- HTTP requests (when online)
- SweetAlert2 notifications
- Chart.js visualizations
- Drag-and-drop reordering (`@angular/cdk`)
- Bulma CSS layouts
- Reactive Forms and validation
- AuthInterceptor JWT injection

The iOS app will be functionally identical to the web app when online.

---

## 4. What Needs to Be Built

### 4.1 Capacitor Setup (1–2 hours)

```bash
cd frontend
npm install @capacitor/core @capacitor/cli @capacitor/ios
npx cap init Quentra com.quentra.app --web-dir dist/quentra/browser
npx cap add ios
```

Update `capacitor.config.ts`:
```typescript
{
  appId: 'com.quentra.app',
  appName: 'Quentra',
  webDir: 'dist/quentra/browser',
  server: { androidScheme: 'https' }
}
```

Build and open Xcode:
```bash
npm run build
npx cap sync
npx cap open ios
```

---

### 4.2 iOS-Specific UI Fixes (2–4 hours)

#### Safe area (notch / Dynamic Island / home indicator)
Add to `src/styles/base.scss`:
```scss
body {
  padding-top: env(safe-area-inset-top);
  padding-bottom: env(safe-area-inset-bottom);
}
```
Or in `capacitor.config.ts`:
```typescript
ios: { contentInset: 'always' }
```

#### Status bar
```bash
npm install @capacitor/status-bar
```
```typescript
// In app.ts constructor (platform check)
import { StatusBar, Style } from '@capacitor/status-bar';
await StatusBar.setStyle({ style: Style.Dark });
```

#### Keyboard push-up (forms)
The login/signup/modal forms need scroll when keyboard appears. Add to `capacitor.config.ts`:
```typescript
ios: { scrollEnabled: true }
```

#### Pull-to-refresh (home page)
```bash
npm install @capacitor/haptics
```
Wrap the budget list in `<ion-refresher>` or implement a custom pull gesture in the `HomeComponent`.

---

### 4.3 Secure Storage (1 hour)

Replace `localStorage` for token with Capacitor's Keychain-backed secure storage:

```bash
npm install @capacitor/preferences
```

Update `auth.service.ts`:
```typescript
import { Preferences } from '@capacitor/preferences';

async saveToken(token: string) {
  await Preferences.set({ key: 'auth_token', value: token });
}
async getToken(): Promise<string | null> {
  const { value } = await Preferences.get({ key: 'auth_token' });
  return value;
}
async removeToken() {
  await Preferences.remove({ key: 'auth_token' });
}
```

`AuthInterceptor` will need to become async to await the token read.

---

### 4.4 Network Detection (2 hours)

```bash
npm install @capacitor/network
```

Create `NetworkService`:
```typescript
@Injectable({ providedIn: 'root' })
export class NetworkService {
  private online$ = new BehaviorSubject<boolean>(true);
  isOnline$ = this.online$.asObservable();

  async init() {
    const status = await Network.getStatus();
    this.online$.next(status.connected);
    Network.addListener('networkStatusChange', s => this.online$.next(s.connected));
  }

  get isOnline(): boolean { return this.online$.getValue(); }
}
```

Initialize in `app.ts` `ngOnInit`. Use throughout services to gate network requests.

---

### 4.5 Local SQLite Database (4–6 hours)

This is the core of offline support. All data reads/writes go to local SQLite first; server is synced separately.

```bash
npm install @capacitor-community/sqlite
```

**Local schema** (mirrors server entities):
```sql
CREATE TABLE budgets (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  start_date TEXT,
  end_date TEXT,
  monthly_income REAL,
  is_pinned INTEGER DEFAULT 0,
  dirty INTEGER DEFAULT 0,   -- 1 = needs sync to server
  deleted INTEGER DEFAULT 0, -- soft delete for sync
  synced_at TEXT
);

CREATE TABLE categories (
  id TEXT PRIMARY KEY,
  budget_id TEXT NOT NULL,
  name TEXT NOT NULL,
  planned_amount REAL DEFAULT 0,
  spent_amount REAL DEFAULT 0,
  order_index INTEGER DEFAULT 0,
  type TEXT DEFAULT 'need',
  dirty INTEGER DEFAULT 0,
  deleted INTEGER DEFAULT 0,
  synced_at TEXT,
  FOREIGN KEY (budget_id) REFERENCES budgets(id)
);
```

Create a `LocalDbService` that wraps SQLite and exposes the same interface as `BudgetService` and `CategoryService`.

---

### 4.6 Sync Service (6–8 hours) — Biggest Piece

The `SyncService` handles the offline→online transition:

```typescript
@Injectable({ providedIn: 'root' })
export class SyncService {
  constructor(
    private network: NetworkService,
    private localDb: LocalDbService,
    private http: HttpClient
  ) {}

  async init() {
    // Sync when app comes online
    this.network.isOnline$.pipe(
      filter(online => online),
      distinctUntilChanged()
    ).subscribe(() => this.sync());
  }

  async sync() {
    await this.pushDirtyRecords();
    await this.pullServerChanges();
  }

  // Push local changes to server
  private async pushDirtyRecords() {
    const dirtyBudgets = await this.localDb.getDirtyBudgets();
    for (const budget of dirtyBudgets) {
      if (budget.deleted) {
        await this.http.delete(`/api/budget/${budget.id}`).toPromise();
      } else if (budget.isNew) {
        await this.http.post('/api/budget', budget).toPromise();
      } else {
        await this.http.put(`/api/budget/${budget.id}`, budget).toPromise();
      }
      await this.localDb.markBudgetClean(budget.id);
    }
    // Same pattern for dirty categories
  }

  // Pull server state and merge
  private async pullServerChanges() {
    const budgets = await this.http.get<Budget[]>('/api/budget').toPromise();
    await this.localDb.mergeBudgets(budgets);
  }
}
```

**Conflict strategy**: Last-write-wins based on `synced_at` timestamp. For a personal finance app with a single user this is sufficient — no multi-device conflict is likely to be destructive.

---

### 4.7 Refactor Existing Services to Use Local DB (4–6 hours)

Modify `BudgetService` and `CategoryService` to read from local DB and write locally first:

```typescript
// Before
createBudget(data): Observable<Budget> {
  return this.http.post<Budget>('/api/budget', data);
}

// After
async createBudget(data: Partial<Budget>): Promise<Budget> {
  const id = crypto.randomUUID(); // client-generated UUID
  const budget = { ...data, id, dirty: true, isNew: true };
  await this.localDb.saveBudget(budget);
  if (this.network.isOnline) {
    // push immediately, mark clean on success
    await this.syncService.pushBudget(budget);
  }
  return budget;
}
```

Since UUIDs are already used on the backend, client-side ID generation for new records works without any server changes.

---

## 5. Backend Changes Required

**Minimal.** The existing API needs only one addition:

### 5.1 `updatedAt` Timestamp on Entities (1–2 hours)

For sync to work correctly, the server needs to tell the client "what changed since you last synced":

```typescript
// In budget.ts and category.ts entities
@UpdateDateColumn()
updatedAt: Date;
```

Add a query parameter to the budget list endpoint:
```
GET /api/budget?since=2026-05-20T10:00:00Z
```

This lets the iOS app do incremental syncs instead of pulling everything each time.

---

## 6. Work Breakdown

| Task | Effort | Priority |
|------|--------|----------|
| Capacitor install + Xcode setup | 1–2 hrs | P0 — prerequisite |
| iOS safe area + status bar fixes | 2–4 hrs | P0 — baseline UX |
| Replace localStorage with Preferences | 1 hr | P1 — security |
| NetworkService | 2 hrs | P1 — required for offline |
| LocalDbService (SQLite schema + CRUD) | 4–6 hrs | P1 — core offline |
| SyncService (push + pull logic) | 6–8 hrs | P1 — core offline |
| Refactor BudgetService to local-first | 3–4 hrs | P1 — core offline |
| Refactor CategoryService to local-first | 3–4 hrs | P1 — core offline |
| Backend: add `updatedAt` + `?since=` param | 1–2 hrs | P2 — incremental sync |
| Pull-to-refresh gesture | 1–2 hrs | P2 — mobile UX |
| Biometric auth (optional) | 2–3 hrs | P3 — nice to have |
| **Total** | **~27–39 hrs** | |

---

## 7. File-Level Change Map

### Files that change
| File | Change |
|------|--------|
| `frontend/src/app/services/auth.service.ts` | Swap localStorage → Capacitor Preferences (async) |
| `frontend/src/app/services/budget.service.ts` | Local-first reads/writes |
| `frontend/src/app/services/category.service.ts` | Local-first reads/writes |
| `frontend/src/app/services/auth.interceptor.ts` | Async token read |
| `frontend/src/app/app.ts` | Init NetworkService + SyncService |
| `frontend/src/styles/base.scss` | Safe area insets |
| `api/src/budget/entity/budget.ts` | Add `updatedAt` column |
| `api/src/budget/entity/category.ts` | Add `updatedAt` column |
| `api/src/budget/controller/budgetController.ts` | Add `?since=` filter |

### New files to create
| File | Purpose |
|------|---------|
| `frontend/src/app/services/network.service.ts` | Connectivity state |
| `frontend/src/app/services/local-db.service.ts` | SQLite wrapper |
| `frontend/src/app/services/sync.service.ts` | Offline sync logic |
| `frontend/capacitor.config.ts` | Capacitor configuration |
| `frontend/ios/` | Generated by `npx cap add ios` |

### Files unchanged
Everything else — all components, pages, routing, charts, notification service, auth guard, event service, types, backend auth, Docker setup.

---

## 8. Recommended Implementation Order

1. **Capacitor setup** — get the app running in the iOS Simulator first, online-only. Shake out any WebView incompatibilities before adding offline complexity.
2. **Safe area + Preferences** — quick wins, improves native feel immediately.
3. **NetworkService** — foundation for everything offline-related.
4. **LocalDbService** — build and test the schema independently.
5. **Refactor services** — start with read-only (getBudgets, getCategories), then mutations.
6. **SyncService** — last, because it depends on all the above.
7. **Backend `updatedAt`** — can be done in parallel with frontend work; not needed until SyncService pull is implemented.

---

## 9. Risks & Mitigations

| Risk | Likelihood | Mitigation |
|------|-----------|------------|
| Bulma CSS breaks in WebView with safe areas | Medium | Add explicit safe-area padding; test on real device |
| SweetAlert2 dialogs behind iOS keyboard | Low | Test modals; use `scrollIntoView` if needed |
| Drag-and-drop reorder not working on iOS touch | Medium | Test `@angular/cdk` drag-drop on iOS Safari; fallback to move buttons (already implemented) |
| Sync conflicts (same budget edited on web + iOS offline) | Low | Last-write-wins is fine for single-user app; document the behavior |
| UUID collision for client-generated IDs | Negligible | `crypto.randomUUID()` collision probability is effectively zero |
| `@capacitor-community/sqlite` maintenance | Low | Actively maintained; Ionic team backs it |

---

## 10. What Stays Exactly the Same

- The web app — **zero changes to web behavior**
- All existing Angular components and templates
- All existing API endpoints and behavior
- Docker setup
- Backend auth, middleware, error handling
- All tests (backend Jest suite)
- CI/CD (if any) for the web app

Capacitor is purely additive. The `ios/` folder is gitignored by default or kept as a separate build artifact.
