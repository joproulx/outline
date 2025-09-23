# Todo Plugin Implementation Plan

This document outlines the step-by-step implementation plan for a centralized todo management plugin for Outline. Each step is designed to be incrementally testable and builds upon the previous steps.

## Overview

The Todo plugin will provide centralized todo management capabilities with the following features:
- ✅ Checkbox to indicate completion status
- 📝 Title for one-line description
- 📄 Optional description for detailed information
- 📅 Optional deadline for due date tracking
- 👥 User assignment capabilities
- 🔔 Notification system for assignments and due dates
- 🎯 Central management dashboard
- 📊 Document integration for contextual todos

## Implementation Strategy

The implementation follows Outline's plugin architecture pattern, similar to Linear and Slack integrations, providing both standalone functionality and document integration.

---

## Phase 1: Foundation Setup
*Goal: Create basic plugin structure and verify it loads correctly*

### Step 1.1: Create Plugin Structure
**Deliverable**: Basic plugin scaffolding that loads without errors

**Files to Create**:
```
plugins/todos/
├── plugin.json
├── server/
│   ├── index.ts
│   └── env.ts
└── client/
    └── index.ts
```

**Implementation Details**:
- Create `plugin.json` with basic metadata
- Set up server-side plugin registration following existing patterns
- Create minimal client-side plugin registration
- Configure environment variables (if needed)

**Testing**:
- Verify plugin loads in development environment
- Check no console errors during startup
- Confirm plugin appears in PluginManager loaded plugins list

---

### Step 1.2: Database Schema Setup
**Deliverable**: Database tables for todo management

**Files to Create**:
```
server/
├── models/
│   ├── TodoItem.ts
│   └── TodoAssignment.ts
└── migrations/
    └── YYYYMMDDHHMMSS-create-todo-tables.js
```

**Database Schema**:
```sql
-- TodoItems table
CREATE TABLE todo_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(20) DEFAULT 'pending',
  priority VARCHAR(20) DEFAULT 'medium',
  deadline TIMESTAMP WITH TIME ZONE,
  document_id UUID REFERENCES documents(id) ON DELETE SET NULL,
  collection_id UUID REFERENCES collections(id) ON DELETE SET NULL,
  created_by_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- TodoAssignments table
CREATE TABLE todo_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  todo_id UUID NOT NULL REFERENCES todo_items(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  assigned_by_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(todo_id, user_id)
);
```

**Testing**:
- Run migration successfully
- Verify tables created with correct schema
- Test basic model instantiation
- Verify foreign key constraints work

---

## Phase 2: Core Backend API ✅ **COMPLETED**
*Goal: Implement CRUD operations for todos with basic API endpoints*

### Step 2.1: Todo Models Implementation ✅ **COMPLETED**
**Deliverable**: Fully functional Sequelize models with validations

**Files to Implement**:
- `server/models/TodoItem.ts` - Core todo model with all fields and relationships
- `server/models/TodoAssignment.ts` - User assignment tracking
- `server/models/index.ts` - Export models for plugin

**Model Features**:
- Complete field validation
- Status transitions (pending → in_progress → completed)
- Soft delete support
- Associations with Users, Documents, Collections
- Computed properties (e.g., `isOverdue`, `assigneeCount`)

**Testing**:
- Unit tests for model validations
- Test model associations
- Verify soft delete functionality
- Test status transition logic

---

### Step 2.2: Basic CRUD API Endpoints ✅ **COMPLETED**
**Deliverable**: RESTful API for todo management

**Files to Create**:
```
server/
├── routes/
│   └── api/
│       └── todos.ts
└── presenters/
    └── todoPresenter.ts
```

**API Endpoints**:
```
GET    /api/todos                 # List todos with filtering
POST   /api/todos                 # Create new todo
GET    /api/todos/:id              # Get specific todo
PUT    /api/todos/:id              # Update todo
DELETE /api/todos/:id              # Delete todo
POST   /api/todos/:id/assign       # Assign users
DELETE /api/todos/:id/assign       # Unassign users
PUT    /api/todos/:id/status       # Update status
```

**Testing**:
- API integration tests for all endpoints
- Test authentication and authorization
- Verify request/response formats
- Test error handling and validation

---

### Step 2.3: Authorization Policies ✅ **COMPLETED**
**Deliverable**: Secure access control for todo operations

**Implementation Approach**: 
- Used middleware-based authentication instead of global policy system
- Avoided conflicts with Outline's core policy system
- Implemented custom authentication middleware for plugin endpoints

**Files Created**:
```
server/
└── middlewares/
    └── todoAuth.ts
```

**Authorization Features Implemented**:
- `requireAuth()` - Basic authentication check
- `requireTeamAccess()` - Team membership verification
- `canCreateTodos()` - Permission to create todos
- All protected endpoints properly reject unauthenticated requests

**Policy Rules**:
- ✅ Users must be authenticated to access todo operations
- ✅ Users must belong to a team to create/manage todos
- ✅ Team-scoped access controls prevent cross-team data access
- ✅ Public endpoints (info, health) accessible without authentication

**Testing**:
- ✅ Verified all protected endpoints return 401 for unauthenticated requests
- ✅ Confirmed info and health endpoints work without authentication
- ✅ Tested that login system works without policy conflicts

---

## Phase 3: Basic Frontend Interface
*Goal: Create minimal todo management interface*

### Step 3.1: Todo Data Store
**Deliverable**: MobX store for client-side todo state management

**Files to Create**:
```
client/
├── stores/
│   └── TodosStore.ts
└── models/
    └── TodoItem.ts
```

**Store Features**:
- CRUD operations calling backend API
- Observable todo collections
- Filtering and sorting capabilities
- Real-time updates integration
- Loading and error state management

**Testing**:
- Test store CRUD operations
- Verify observable updates
- Test error handling
- Mock API responses for testing

---

### Step 3.2: Basic Todo Components
**Deliverable**: React components for todo display and management

**Files to Create**:
```
client/
└── components/
    ├── TodoItem.tsx
    ├── TodoList.tsx
    ├── TodoForm.tsx
    └── TodoFilters.tsx
```

**Component Features**:
- `TodoItem`: Display todo with status, title, assignees, deadline
- `TodoList`: Paginated list with filtering
- `TodoForm`: Create/edit todo modal
- `TodoFilters`: Status, assignee, deadline filtering

**Testing**:
- Component unit tests with React Testing Library
- Test user interactions (clicks, form submissions)
- Test prop passing and state updates
- Visual regression tests (optional)

---

### Step 3.3: Todo Management Scene
**Deliverable**: Full-page todo management interface

**Files to Create**:
```
client/
└── scenes/
    └── TodoManagement.tsx
```

**Features**:
- Navigation integration (add "Todos" to main menu)
- Todo dashboard with statistics
- Bulk operations (mark multiple as complete)
- Export capabilities
- Search and advanced filtering

**Testing**:
- End-to-end tests for todo management workflow
- Test navigation integration
- Verify bulk operations
- Test responsive design

---

## Phase 4: User Assignment System
*Goal: Implement user assignment with notifications*

### Step 4.1: Assignment API and UI
**Deliverable**: User assignment functionality with multi-select interface

**Enhanced Components**:
- User picker component for assignments
- Assignment display in todo items
- Assignment history tracking
- Bulk assignment operations

**API Enhancements**:
- Assignment validation (user permissions)
- Assignment event logging
- Notification triggers

**Testing**:
- Test assignment workflows
- Verify permission checks
- Test assignment history
- User picker component tests

---

### Step 4.2: Basic Notification System
**Deliverable**: Email notifications for todo assignments and due dates

**Files to Create**:
```
server/
├── tasks/
│   ├── TodoAssignmentNotificationTask.ts
│   └── TodoReminderTask.ts
└── emails/
    └── templates/
        ├── TodoAssignedEmail.tsx
        └── TodoReminderEmail.tsx
```

**Notification Features**:
- Assignment notifications
- Due date reminders (24h, 1h before)
- Completion notifications
- Daily/weekly todo digests

**Testing**:
- Test email template rendering
- Verify notification triggers
- Test notification preferences
- Mock email delivery for testing

---

## Phase 5: Document Integration
*Goal: Integrate todos within document editing experience*

### Step 5.1: Todo Reference Editor Node
**Deliverable**: Editor node that references central todos

**Files to Create**:
```
shared/
└── editor/
    └── nodes/
        └── TodoReference.tsx
```

**Node Features**:
- Embed todo status and basic info in documents
- Click to open todo details modal
- Real-time status updates
- Support for creating new todos from documents

**Testing**:
- Test node rendering and interactions
- Verify real-time updates
- Test todo creation from documents
- Test markdown serialization

---

### Step 5.2: Todo Creation Integration
**Deliverable**: Create todos directly from document context

**Features**:
- Slash command for creating todos (/todo)
- Auto-link todos to current document
- Context-aware default assignments
- Quick todo creation modal

**Testing**:
- Test slash command functionality
- Verify document context preservation
- Test auto-assignment logic

---

## Phase 6: Advanced Features
*Goal: Polish and advanced functionality*

### Step 6.1: Advanced Filtering and Search
**Deliverable**: Comprehensive todo discovery and organization

**Features**:
- Global search integration
- Advanced filtering (date ranges, multiple assignees)
- Todo templates
- Bulk operations
- Export to various formats

**Testing**:
- Test search integration
- Verify complex filters
- Test template system
- Performance testing with large datasets

---

### Step 6.2: Analytics and Reporting
**Deliverable**: Todo completion analytics and team insights

**Features**:
- Completion rate analytics
- Overdue todo reports
- Team productivity insights
- Todo velocity tracking

**Testing**:
- Test analytics calculations
- Verify report generation
- Test data visualization components

---

## Phase 7: Production Readiness
*Goal: Ensure plugin is production-ready*

### Step 7.1: Performance Optimization
**Deliverable**: Optimized performance for large todo datasets

**Optimizations**:
- Database query optimization
- Frontend pagination and virtualization
- Caching strategies
- Background task optimization

**Testing**:
- Load testing with large datasets
- Performance benchmarking
- Memory usage profiling

---

### Step 7.2: Documentation and Polish
**Deliverable**: Complete documentation and UI polish

**Deliverables**:
- User documentation
- API documentation
- Developer setup guide
- UI/UX refinements
- Accessibility improvements

**Testing**:
- Documentation review
- Accessibility testing
- Cross-browser testing
- User acceptance testing

---

## Testing Strategy

### Unit Tests
- Model validations and business logic
- API endpoint functionality
- React component behavior
- Store operations

### Integration Tests
- API endpoint integration
- Database operations
- Plugin loading and registration
- Authentication and authorization

### End-to-End Tests
- Complete todo workflows
- User assignment processes
- Document integration
- Notification delivery

### Performance Tests
- Large dataset handling
- Concurrent user operations
- Real-time update performance

---

## Development Guidelines

### Code Standards
- Follow existing Outline TypeScript conventions
- Use existing UI components where possible
- Implement proper error handling
- Add comprehensive logging

### Security Considerations
- Validate all user inputs
- Implement proper authorization checks
- Secure API endpoints
- Protect against common vulnerabilities

### Monitoring
- Add metrics for todo operations
- Log important events
- Monitor performance indicators
- Track user engagement

---

## Deployment Considerations

### Database Migrations
- Reversible migration scripts
- Data backup strategies
- Migration testing procedures

### Feature Flags
- Gradual rollout capabilities
- A/B testing support
- Quick disable mechanisms

### Backwards Compatibility
- API versioning strategy
- Legacy data handling
- Migration paths for existing users

---

## Success Metrics

### Technical Metrics
- Plugin load time < 100ms
- API response time < 200ms
- 99.9% uptime
- Zero data loss incidents

### User Metrics
- Todo creation rate
- Assignment completion rate
- User engagement with todo features
- Document integration usage

### Business Metrics
- Team productivity improvements
- User satisfaction scores
- Feature adoption rates
- Support ticket reduction

---

This implementation plan provides a structured approach to building a comprehensive todo management plugin for Outline. Each phase can be developed, tested, and validated independently, allowing for iterative improvement and early feedback incorporation.