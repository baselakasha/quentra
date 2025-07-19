# Quentra Project Structure

Quentra is a personal finance management application with a TypeScript/Node.js/Express backend and an Angular frontend.

## Project Overview

The project is organized into two main directories:
- `/api`: Backend REST API built with TypeScript, Node.js, and Express
- `/frontend`: Angular frontend application

## Backend Structure (`/api`)

### Core Files

- `app.ts`: Main Express application setup and middleware configuration
- `server.ts`: HTTP server initialization and entry point for the application

### Authentication Module (`/auth`)

- `/controller/authController.ts`: Handles user authentication logic (login, registration)
- `/entity/user.ts`: User entity model definition
- `/middleware/authMiddleware.ts`: Authentication middleware for protected routes
- `/route/auth.ts`: Routes for authentication endpoints
- `/tests/auth.spec.ts`: Tests for authentication functionality
- `/util/jwt.ts`: JWT token generation and validation utilities

### Budget Module (`/budget`)

- `/controller/budgetController.ts`: Budget management logic
- `/controller/categoryController.ts`: Category management logic
- `/entity/budget.ts`: Budget entity model definition
- `/entity/category.ts`: Category entity model definition
- `/route/budget.ts`: Routes for budget-related endpoints
- `/route/category.ts`: Routes for category-related endpoints
- `/tests/budget.spec.ts`: Tests for budget functionality
- `/tests/category.spec.ts`: Tests for category functionality

### Configuration (`/config`)

- `config.ts`: Application configuration settings
- `ormconfig.ts`: TypeORM configuration for database connection

### Testing (`/tests`)

- `env-setup.ts`: Test environment setup utilities

### Types (`/types`)

- `express.d.ts`: TypeScript type definitions for Express

### Utilities (`/util`)

- `asyncHandler.ts`: Error handling wrapper for async route handlers

## Frontend Structure (`/frontend`)

### Core Files

- `main.ts`: Application entry point
- `index.html`: Main HTML template
- `app.ts`: Root component for the application
- `app.config.ts`: Application configuration settings
- `app.routes.ts`: Application routing configuration
- `app.html`: Root component template

### Components (`/src/app/components`)

- `/budget/budget.ts`: Budget display component
- `/budget-modal/budget-modal.ts`: Modal for creating/editing budgets
- `/header/header.ts`: Application header component
- `/notebook/notebook.ts`: Notebook-style UI component for consistent styling

### Pages (`/src/app/pages`)

- `/login/login.ts`: User login page
- `/signup/signup.ts`: User registration page

### Home (`/src/app/home`)

- `home.ts`: Home page component showing user's budgets
- `home.html`: Home page template
- `home.scss`: Home page styles

### Services (`/src/app/services`)

- `auth.guard.ts`: Route guard for authenticated routes
- `auth.interceptor.ts`: HTTP interceptor for auth tokens
- `auth.service.ts`: Authentication service for login/signup
- `budget.service.ts`: Service for budget CRUD operations
- `category.service.ts`: Service for category CRUD operations
- `event.service.ts`: Event handling service

### Types (`/src/app/types`)

- `budget.types.ts`: TypeScript interfaces for budget-related data

### Styles (`/src/styles`)

- `/abstracts/_media-quiries.scss`: Media query mixins
- `/abstracts/_variables.scss`: SCSS variables
- `/base/_base.scss`: Base styling rules
- `/base/_typography.scss`: Typography rules
- `/base/_utilities.scss`: Utility classes

## Database

- `db.sqlite`: SQLite database file

## Configuration Files

- `package.json`: NPM package configuration
- `tsconfig.json`: TypeScript compiler configuration
- `jest.config.js`: Jest testing framework configuration
- `angular.json`: Angular CLI configuration

## Project Documentation

- `user_stories.md`: User stories and requirements
- `project-stucture.md`: This file - documentation of project structure