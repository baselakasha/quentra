# Quentra - AI Coding Agent Instructions

## Project Overview
Quentra is a personal finance management application with:
- Backend: TypeScript, Node.js, Express, TypeORM, SQLite
- Frontend: Angular 20+, RxJS, Bulma CSS


## General Guidelines
- Follow TypeScript best practices
- Do not add unecessary comments; code should be self-explanatory
- DO not explain your changes in comments.
- Avoid using `any` type; use specific types or interfaces

## Architecture

### Backend (`/api`)
- RESTful API with modular organization by domain (auth, budget)
- Each module contains controllers, entities, routes, and tests
- Uses TypeORM with SQLite (configurable via environment)
- JWT-based authentication

### Frontend (`/frontend`)
- Angular standalone components architecture
- Services for API communication
- Environment-based configuration
- Bulma CSS framework for styling

## Key Patterns

### Backend Patterns
- Environment configuration via `.env` file and `config.ts`
- Controller-route-service pattern
- Error handling with `asyncHandler` utility
- TypeORM for database operations

Example controller method:
```typescript
// From budgetController.ts
createBudget = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const budgetData = { ...req.body, userId };
  const budget = await this.budgetRepository.save(budgetData);
  return res.status(201).json(budget);
});
```

### Frontend Patterns
- Standalone Angular components with imports specified in the component decorator
- Services for API communication using Angular HttpClient
- Environment configuration via `/environments` files and ConfigService
- RxJS for async operations

Component pattern:
```typescript
@Component({
  selector: 'app-dropdown',
  templateUrl: './dropdown.html',
  styleUrls: ['./dropdown.scss'],
  standalone: true,
  imports: [CommonModule]
})
```

Service pattern:
```typescript
// API endpoints access via ConfigService
return this.http.get<Budget[]>(this.configService.getFullApiUrl(this.apiEndpoint))
```

## Development Workflow

### Backend
- `yarn dev` - Start development server with hot reload
- `yarn test` - Run tests
- `yarn build` - Build for production

### Frontend  
- `yarn dev` - Start development server
- `yarn test` - Run tests
- `yarn build` - Build for production

## TypeScript Guidelines
- Use interfaces for data structures (see `types/budget.types.ts`)
- Prefer immutable data (const, readonly)
- Use optional chaining (?.) and nullish coalescing (??) operators

## Component Guidelines
- Create standalone components and specify imports in the component decorator
- Use Angular's reactive forms for form handling
- Follow the pattern for dropdown components created in `components/dropdown`

## Key Integration Points
- Authentication via JWT stored in localStorage
- API endpoints accessed through services using ConfigService
- Forms/inputs for creating and updating data

## Debugging
- Backend logs to console during development
- Frontend has error handling in each service call
