# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Quentra is a personal finance management application. The repo is a monorepo with two independent workspaces:
- `/api` — TypeScript/Express REST API
- `/frontend` — Angular 20 SPA

## Docker

The preferred way to run the full stack is via Docker Compose. Three compose files exist:

| File | Purpose |
|------|---------|
| `docker-compose.yml` | Development — mounts source directories as volumes, hot-reloads enabled |
| `docker-compose.prod.yml` | Production — compiled images, Nginx serves frontend, services on an isolated network |
| `docker-compose.test.yml` | CI — API tests only, in-memory SQLite, no database container |

```bash
# Start full dev stack (postgres + api on :3000 + frontend on :4200)
docker compose up

# Run API tests in Docker
docker compose -f docker-compose.test.yml up --abort-on-container-exit

# Start production stack (requires POSTGRES_USER, POSTGRES_PASSWORD, POSTGRES_DB, JWT_SECRET, FRONTEND_PORT env vars)
docker compose -f docker-compose.prod.yml up
```

In dev, source directories are bind-mounted (`./api:/app`, `./frontend:/app`) so local edits reflect immediately. The API container runs `yarn dev` (nodemon) and the frontend runs `ng serve --host 0.0.0.0`.

## Commands

### API (`/api`)
```bash
npm run dev       # Development server (nodemon + ts-node, auto-reloads on changes)
npm run build     # Compile TypeScript to /api/dist
npm start         # Run compiled build
npm test          # Run all tests (Jest, runs serially with --runInBand)
npm run test:watch  # Watch mode for tests
```

To run a single test file:
```bash
npx jest src/budget/tests/budget.spec.ts
```

### Frontend (`/frontend`)
```bash
npm run dev    # ng serve on port 4200
npm run build  # ng build
npm test       # Karma/Jasmine test runner (opens Chrome)
```

## Architecture

### API

**Entry points**: `src/server.ts` starts the HTTP server; `src/app.ts` configures Express (CORS, JSON parsing, route mounting).

**Route structure**:
- `POST /api/auth/signup`, `POST /api/auth/signin`, `GET /api/auth/me`
- `GET|POST /api/budget`, `GET|PUT|DELETE /api/budget/:id`, `PUT /api/budget/:id/pin`, `PUT /api/budget/:id/unpin`, `POST /api/budget/:id/duplicate`
- `GET|POST /api/category`, `GET|PUT|DELETE /api/category/:id`

**Module layout**: Each domain (auth, budget) follows the same pattern: `entity/` → `controller/` → `route/`. All async route handlers are wrapped with `asyncHandler` from `src/util/asyncHandler.ts` for consistent error forwarding.

**TypeScript path aliases**: `@/` maps to `src/`. Uses `tsconfig-paths` at runtime and `moduleNameMapper` in Jest config.

**Database**: TypeORM with PostgreSQL in development/production. In the test environment (`NODE_ENV=testing`), it automatically switches to an in-memory SQLite database. `synchronize: true` is used — there are no migrations. The `env-setup.ts` file sets `NODE_ENV=testing` and is loaded automatically for all tests via `setupFilesAfterEnv` in `jest.config.js`.

**Data model**:
- `User` → has many `Budget`s (UUID PKs, unique username)
- `Budget` → belongs to `User`, has many `Category`s (unique per user by name, has `isPinned` flag)
- `Category` → belongs to `Budget` (unique per budget by name, has `type: "need" | "want"`, `plannedAmount`, `spentAmount`, `order`)

**Auth**: JWT tokens; the `authMiddleware` attaches `req.user` with `userId`. Controllers access user ID via `(req as any).user.userId || (req as any).user.id`.

### Frontend

**Angular patterns**: Uses standalone components (Angular 20). Services are `providedIn: 'root'`. HTTP is handled via `HttpClient` with RxJS operators. The `AuthInterceptor` automatically attaches the JWT Bearer token from localStorage to requests.

**Configuration**: `ConfigService` wraps `environment.ts` and provides `getFullApiUrl(endpoint)` for building API URLs. The dev environment points to `http://localhost:3000/api`.

**State/events**: `EventService` uses a `BehaviorSubject` to broadcast auth state changes (login/logout) across components.

**Routing**: Four routes — `/` (Home, public), `/login`, `/signup`, `/statistics` (guarded by `AuthGuard`).

**Key services**: `AuthService` (login/signup/token management in localStorage), `BudgetService` (full CRUD + pin/unpin/duplicate + budget summary calculations), `CategoryService`.

**Styling**: SCSS with Bulma CSS framework. Global styles in `src/styles/`; component-level `.scss` files per component. SweetAlert2 for notifications.

**Charts**: Chart.js for budget and spending visualizations (`budget-chart` and `spending-chart` components).

## Environment Variables (API)

The API reads from `/api/.env`. Key variables:
```
NODE_ENV=development
PORT=3000
JWT_SECRET=...
DATABASE_TYPE=postgres
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=quentra
DATABASE_USERNAME=quentra
DATABASE_PASSWORD=quentra_password
CORS_ORIGIN=http://localhost:4200
```
