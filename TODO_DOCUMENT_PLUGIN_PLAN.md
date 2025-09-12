# Todo Document Plugin - Implementation Plan

## Overview
Create a new document type that enables users to create and manage Todo lists within Outline documents. Each Todo item will have a title, description, expected date, and completion status.

## Analysis of Current Architecture

### Document System
- Documents use ProseMirror editor with custom nodes/extensions
- Document model has `template` field for different document types
- Editor supports rich content with various node types (CheckboxList, CheckboxItem, etc.)
- Documents are stored with both content (JSON) and state (binary) for backward compatibility

### Plugin System  
- Plugins located in `/plugins/` directory with standardized structure
- Each plugin has `plugin.json` with id, name, priority, description
- Plugins can have `client/`, `server/`, and `shared/` directories
- Server plugins register with main application through index.ts exports

### Existing Todo/Checkbox Implementation
- `CheckboxList` and `CheckboxItem` nodes already exist in ProseMirror editor
- CheckboxItem has `checked` attribute and click handling
- Supports markdown serialization: `[x]` for checked, `[ ]` for unchecked
- Basic checkbox functionality is already available

## Implementation Strategy

### Phase 1: Basic Todo Document Type (MVP)
**Goal**: Create a specialized document template with enhanced todo functionality

#### Step 1.1: Create Todo Plugin Structure
- [X] Create `/plugins/todo/` directory
- [X] Add `plugin.json` with basic metadata
- [X] Set up client, server, shared directories
- [X] Create plugin index files

#### Step 1.2: Enhance ProseMirror Todo Nodes  
- [X] Create `TodoItem` node extending CheckboxItem
- [X] Add attributes: title, description, expectedDate, completed
- [X] Implement custom rendering with proper UI controls
- [X] Add keyboard shortcuts and commands

#### Step 1.3: Todo Document Template
- [ ] Create todo document template with default content structure
- [ ] Add template to onboarding or templates system
- [ ] Implement basic todo list functionality

#### Step 1.4: Basic UI Components
- [ ] Create TodoItem component for editor
- [ ] Add date picker for expected date
- [ ] Implement basic styling and layout

### Phase 2: Enhanced Todo Features
**Goal**: Add advanced todo management features

#### Step 2.1: Todo Management Commands
- [ ] Add/Delete todo items
- [ ] Reorder todo items (drag & drop)
- [ ] Bulk operations (mark all complete, delete completed)
- [ ] Due date notifications/highlighting

#### Step 2.2: Todo Document Views
- [ ] Summary view showing all todos with statuses
- [ ] Filter/sort todos by date, completion, etc.
- [ ] Progress indicators (completed/total counts)

#### Step 2.3: Advanced Todo Properties
- [ ] Priority levels (high, medium, low)
- [ ] Categories/tags for todos
- [ ] Assignment to users (if in team context)
- [ ] Subtasks/nested todos

### Phase 3: Integration & Polish
**Goal**: Integrate with Outline's ecosystem and add polish

#### Step 3.1: Document Integration
- [ ] Todo document type in document creation flow
- [ ] Collection-specific todo templates
- [ ] Search integration for todo content

#### Step 3.2: Collaboration Features
- [ ] Real-time todo updates via Y.js collaboration
- [ ] Comments on individual todo items
- [ ] Activity feed for todo changes

#### Step 3.3: Export/Import
- [ ] Export todos to various formats (CSV, JSON, etc.)
- [ ] Import from other todo applications
- [ ] Markdown export with proper checkbox syntax

## Technical Implementation Details

### Data Persistence Strategy

**No Database Schema Changes Needed!** 

Todo data will be stored in the existing `documents.content` column as ProseMirror JSON:

```typescript
// TodoItem node will store data in attrs
{
  type: "todo_item",
  attrs: {
    checked: boolean,
    title: string,
    description: string,
    expectedDate: Date | null,
    priority: 'high' | 'medium' | 'low',
    tags: string[]
  },
  content: [...] // Rich text content for additional notes
}
```

**How Data Flows:**
1. User edits todo → ProseMirror transaction updates node.attrs
2. Y.js syncs changes in real-time for collaboration  
3. `documentCollaborativeUpdater` converts Y.doc to ProsemirrorData JSON
4. JSON saved to `documents.content` column in database

**Benefits:**
- ✅ No migrations needed
- ✅ Automatic collaboration via Y.js
- ✅ Full history/versioning via document revisions
- ✅ Rich text editing within todo items
- ✅ Search indexing works automatically

**Future Considerations:**
- For advanced queries (e.g., "show all overdue todos across workspace"), consider extracting todo metadata to dedicated table
- Current approach perfect for MVP and document-centric todo lists

### ProseMirror Node Structure
```typescript
// TodoItem node attributes
{
  title: string,
  description: string,
  expectedDate: Date | null,
  completed: boolean,
  priority: 'high' | 'medium' | 'low',
  tags: string[]
}
```

### Plugin Structure
```
plugins/todo/
├── plugin.json
├── client/
│   ├── index.tsx
│   ├── Icon.tsx
│   └── components/
│       ├── TodoItem.tsx
│       ├── TodoList.tsx
│       └── TodoDatePicker.tsx
├── server/
│   └── index.ts
└── shared/
    └── TodoUtils.ts
```

### Integration Points
1. **Document Templates**: Register todo template in template system
2. **Editor Extensions**: Add TodoItem and TodoList nodes to richExtensions
3. **Search**: Ensure todo content is searchable
4. **Export**: Add todo-specific export handlers

## Development Approach

### Small, Verifiable Steps
1. Start with plugin structure and basic TodoItem node
2. Implement basic rendering and interaction
3. Add one feature at a time (dates, descriptions, etc.)
4. Test each step thoroughly before proceeding
5. Ensure backward compatibility with existing CheckboxItems

### Testing Strategy
- Unit tests for TodoItem node behavior
- Integration tests for document creation/editing
- UI tests for todo interactions
- Performance tests for large todo lists

### Migration Strategy
- New plugin doesn't affect existing documents
- Existing CheckboxItems continue to work normally
- Users opt-in to todo document type
- Future: Migration tool to convert checkbox lists to todo lists

## Success Criteria

### Phase 1 (MVP)
- [ ] Can create documents with enhanced todo items
- [ ] Todo items have title, description, expected date
- [ ] Basic completion functionality works
- [ ] No regression in existing checkbox functionality

### Phase 2 (Enhanced)
- [ ] Advanced todo management (reorder, bulk ops, filters)
- [ ] Rich todo properties (priority, tags, assignment)
- [ ] Good user experience for todo-focused workflows

### Phase 3 (Production Ready)
- [ ] Seamless integration with Outline ecosystem
- [ ] Collaborative todo editing
- [ ] Import/export capabilities
- [ ] Performance optimized for large todo lists

## Risk Mitigation

### Technical Risks
- **ProseMirror Complexity**: Start with simple node extension, iterate
- **Performance**: Test with large documents, implement pagination if needed
- **Collaboration**: Ensure Y.js compatibility from start

### UX Risks  
- **Confusion with existing checkboxes**: Clear differentiation in UI
- **Feature creep**: Stick to planned phases, resist scope expansion
- **Learning curve**: Provide good documentation and examples

## Next Steps

1. Create basic plugin structure (Step 1.1)
2. Implement simple TodoItem node extending CheckboxItem
3. Create minimal UI for todo editing
4. Test basic functionality end-to-end
5. Iterate based on feedback

---

**Note**: This plan will be updated as implementation progresses and requirements evolve.