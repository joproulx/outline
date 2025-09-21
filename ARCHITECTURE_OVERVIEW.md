# Outline Project Architecture Overview

This document provides a comprehensive architectural overview of the Outline project to help maintain context across development sessions.

## Project Overview

**Outline** is a fast, collaborative knowledge base for teams built with React and Node.js. It's a TypeScript monorepo that combines a React frontend with a Node.js backend, sharing code where possible.

- **License**: Business Source License 1.1
- **Node Version**: 20 || 22
- **Primary Languages**: TypeScript, React, Node.js
- **Deployment**: Supports Docker, Heroku, and self-hosting

## Technology Stack

### Frontend
- **Framework**: React with TypeScript
- **Build Tool**: Vite (modern replacement for Webpack)
- **State Management**: MobX with React observables
- **Styling**: Styled Components
- **Routing**: React Router
- **Animation**: Framer Motion with LazyMotion
- **Command Palette**: KBar
- **PWA**: Progressive Web App capabilities with VitePWA

### Backend
- **Runtime**: Node.js with Koa framework
- **Database**: PostgreSQL with Sequelize ORM
- **Caching**: Redis with Bull for queues and async events
- **Authentication**: Passport.js with multiple strategies
- **Authorization**: cancan-based policies
- **Real-time**: WebSockets for collaboration
- **File Processing**: Background jobs with Bull queues

### Shared Infrastructure
- **Language**: TypeScript throughout
- **Editor**: ProseMirror-based rich text editor
- **Internationalization**: i18next
- **Testing**: Jest with multiple project configurations
- **Linting**: Oxlint (fast linter)
- **Formatting**: Prettier
- **Git Hooks**: Husky with lint-staged

## Architecture Layers

### 1. Frontend Architecture (`/app`)

```
app/
├── actions/          # Reusable UI actions (navigate, open, create)
├── components/       # Reusable React components
├── editor/          # Editor-specific React components
├── hooks/           # Custom React hooks
├── menus/           # Context menus used across UI
├── models/          # MobX state models
├── routes/          # Route definitions with async chunk loading
├── scenes/          # Full-page views containing components
├── stores/          # MobX stores (collections of models)
├── types/           # TypeScript type definitions
└── utils/           # Frontend-specific utilities
```

#### Key Frontend Patterns
- **State Management**: MobX stores with observable models
- **Component Organization**: Co-located styles and logic
- **Code Splitting**: Async route-based chunks with React Suspense
- **Plugin System**: Frontend plugins loaded via PluginManager

#### Major Stores
- `AuthStore` - Authentication state
- `DocumentsStore` - Document management
- `CollectionsStore` - Collection hierarchy
- `UiStore` - UI state (modals, sidebars, etc.)
- `UsersStore` - User management
- `CommentsStore` - Document commenting

### 2. Backend Architecture (`/server`)

```
server/
├── routes/           # API and authentication routes
│   ├── api/         # REST API endpoints
│   └── auth/        # Authentication endpoints
├── commands/         # Complex multi-model operations
├── config/          # Database and service configuration
├── emails/          # Transactional email templates
├── middlewares/     # Koa middleware functions
├── migrations/      # Database schema migrations
├── models/          # Sequelize database models
├── policies/        # Authorization logic (cancan-based)
├── presenters/      # JSON API response formatters
├── queues/          # Async job processing
│   ├── processors/  # Event-driven job processors
│   └── tasks/       # Arbitrary async tasks
├── services/        # Service entry points
├── static/          # Static file serving
└── utils/           # Backend-specific utilities
```

#### Core Services
- **web.ts** - Main HTTP API server
- **worker.ts** - Background job processing
- **collaboration.ts** - Real-time collaboration
- **websockets.ts** - WebSocket connections
- **cron.ts** - Scheduled tasks
- **admin.ts** - Admin interface

#### Key Models
- `User` - User accounts and authentication
- `Team` - Organization/workspace management
- `Document` - Core document storage and versioning
- `Collection` - Document organization hierarchy
- `Comment` - Document commenting system
- `Share` - Document sharing and permissions

### 3. Shared Architecture (`/shared`)

```
shared/
├── components/       # Components used in both frontend/backend
├── editor/          # ProseMirror editor implementation
│   ├── commands/    # Editor commands
│   ├── extensions/  # Editor extensions
│   ├── nodes/       # Document node types
│   └── marks/       # Text formatting marks
├── i18n/            # Internationalization
│   └── locales/     # Language files
├── styles/          # Global styles and themes
└── utils/           # Shared utility functions
```

#### Editor Architecture
The editor is built on ProseMirror and includes:
- Custom nodes (headings, tables, embeds)
- Text marks (bold, italic, links)
- Commands for document manipulation
- Real-time collaboration via Y.js
- Plugin system for extensibility

### 4. Plugin System (`/plugins`)

Each plugin is a self-contained module with:
- `plugin.json` - Plugin metadata and configuration
- `server/` - Backend integration (auth, API routes)
- `app/` - Frontend components and functionality

#### Available Plugins
- **Authentication**: Azure AD, Google, GitHub, Slack, OIDC
- **Integrations**: Linear, Notion, Zapier, Webhooks
- **Analytics**: Google Analytics, Matomo, Umami
- **Storage**: File storage backends
- **Communication**: Discord, Slack, Email
- **Utilities**: Todo lists, link previews (Iframely)

## Data Flow

### 1. Request Lifecycle
```
Client Request → Koa Middleware → Route Handler → Policy Check → Model Operation → Presenter → JSON Response
```

### 2. Real-time Collaboration
```
Editor Change → WebSocket → Collaboration Service → Y.js Document → Broadcast to Clients
```

### 3. Background Processing
```
User Action → Event Emission → Bull Queue → Background Worker → Database Update
```

## Key Features

### Document Management
- Rich text editing with ProseMirror
- Real-time collaboration with operational transformation
- Version history and document revisions
- Document templates and imports
- Full-text search capabilities

### Team Collaboration
- Multi-user workspaces (teams)
- Role-based permissions (Admin, Member, Viewer, Guest)
- Document comments and reactions
- Notification system
- Public document sharing

### Authentication & Authorization
- Multiple authentication providers via plugins
- OAuth 2.0 support
- API key authentication
- Fine-grained permissions with policies
- Team domain restrictions

## Development Workflow

### Build Process
- **Frontend**: Vite builds React app with TypeScript
- **Backend**: Custom build script compiles TypeScript server
- **I18n**: i18next extracts and builds translation files
- **Development**: Concurrent frontend/backend development servers

### Testing Strategy
- **Frontend Tests**: `yarn test:app` - React component testing
- **Backend Tests**: `yarn test:server` - API and model testing
- **Shared Tests**: `yarn test:shared` - Utility and shared code testing
- **Integration**: Full stack testing capabilities

### Database Management
- **Migrations**: Sequelize-based schema migrations
- **Models**: TypeScript Sequelize models with validation
- **Relationships**: Complex document-collection-team hierarchies

## Deployment Architecture

### Production Setup
- **Database**: PostgreSQL for primary data storage
- **Cache**: Redis for sessions, queues, and caching
- **File Storage**: Configurable backends (S3, Azure, local)
- **Load Balancing**: Multiple service instances supported
- **SSL**: Built-in SSL certificate management

### Environment Configuration
- Environment-specific configuration via `.env` files
- Feature flags and plugin configuration
- Database connection pooling
- Redis cluster support

## Security Considerations

- **Authentication**: Multiple provider support with OAuth 2.0
- **Authorization**: Policy-based access control
- **Data Validation**: Input validation on all endpoints
- **CSRF Protection**: Built-in CSRF middleware
- **Rate Limiting**: Configurable rate limiting
- **SSL/TLS**: HTTPS enforcement in production

## Performance Optimizations

- **Frontend**: Code splitting, lazy loading, image optimization
- **Backend**: Database query optimization, caching strategies
- **Real-time**: Efficient WebSocket connection management
- **CDN**: Static asset optimization and delivery

## Monitoring & Observability

- **Logging**: Structured logging with Winston
- **Metrics**: Custom metrics collection
- **Error Tracking**: Sentry integration available
- **Health Checks**: Built-in health monitoring endpoints

## Extension Points

### Adding New Features
1. **Models**: Add new Sequelize models in `/server/models`
2. **API Routes**: Create routes in `/server/routes/api`
3. **Frontend Components**: Add React components in `/app/components`
4. **Stores**: Create MobX stores for state management

### Plugin Development
1. Create plugin directory in `/plugins`
2. Define `plugin.json` with metadata
3. Implement server-side integration
4. Add frontend components if needed
5. Register plugin in PluginManager

This architecture provides a solid foundation for understanding the Outline codebase and making informed decisions about modifications, debugging, and feature development.