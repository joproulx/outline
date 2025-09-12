# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Essential Commands

### Development
- `yarn dev:watch` - Run both backend and frontend in development mode with auto-reload
- `yarn dev:backend` - Run only backend with auto-reload  
- `yarn vite:dev` - Run only frontend development server
- `make up` - Start development environment with Docker services (Redis, Postgres) and SSL setup

### Building
- `yarn build` - Full production build (frontend + backend + i18n)
- `yarn build:server` - Build only backend
- `yarn vite:build` - Build only frontend

### Testing  
- `make test` - Run all tests with Docker test database setup
- `yarn test` - Run all test suites
- `yarn test:server` - Run backend tests only
- `yarn test:app` - Run frontend tests only
- `yarn test:shared` - Run shared code tests
- `yarn test:server myTestFile` - Run specific backend test

### Code Quality
- `yarn lint` - Run oxlint on all TypeScript files
- `yarn format` - Format code with Prettier
- `yarn format:check` - Check formatting without changes

### Database
- `yarn db:migrate` - Run database migrations
- `yarn db:create-migration` - Create new migration
- `yarn db:reset` - Drop, recreate, and migrate database

## Architecture Overview

Outline is a monorepo with three main areas:

### Frontend (`app/`)
- React + TypeScript with Vite build system
- MobX for state management, Styled Components for styling  
- Key directories:
  - `components/` - Reusable React components
  - `stores/` - MobX stores for data management
  - `scenes/` - Full-page views
  - `models/` - Data models with MobX observables
  - `hooks/` - Custom React hooks
  - `utils/` - Frontend-specific utilities

### Backend (`server/`)
- Koa.js API server with Sequelize ORM
- Redis + Bull for queues, PostgreSQL database
- Key directories:
  - `routes/` - API endpoint definitions
  - `models/` - Sequelize database models  
  - `policies/` - Authorization logic (cancan-based)
  - `commands/` - Complex multi-model operations
  - `presenters/` - JSON response formatting
  - `migrations/` - Database schema changes
  - `middlewares/` - Koa middleware functions

### Shared (`shared/`)
- Code shared between frontend and backend
- `editor/` - ProseMirror-based rich text editor
- `i18n/` - Internationalization files
- `utils/` - Shared utility functions
- `components/` - Shared React components

## Development Guidelines

### Path Aliases
- `~/` → `app/` (frontend only)
- `@server/` → `server/` 
- `@shared/` → `shared/`

### Testing Structure
- Tests are co-located with source files using `.test.ts` extension
- Four Jest projects: `server`, `app`, `shared-node`, `shared-jsdom`
- Database tests require Docker PostgreSQL instance

### Code Style
- TypeScript with strict settings enabled
- Oxlint for linting, Prettier for formatting
- Components and styles are co-located
- MobX observables for client state, Sequelize for server models

### Key Technologies
- **Frontend**: React 17, MobX 4, Styled Components, Vite
- **Backend**: Koa, Sequelize, Bull, Redis, PostgreSQL
- **Editor**: ProseMirror with custom extensions
- **Collaboration**: Hocuspocus (Y.js) for real-time editing