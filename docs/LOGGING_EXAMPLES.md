# Logging System Usage in Outline

Outline has a comprehensive logging system with different severity levels. Here's how to use it properly in your code.

## Server-side Logging (`server/logging/Logger.ts`)

### Import the Logger
```typescript
import Logger from "@server/logging/Logger";
```

### Severity Levels (from highest to lowest priority)

1. **fatal** - Critical errors that cause server shutdown
2. **error** - Runtime errors and exceptions  
3. **warn** - Warnings about potential issues
4. **info** - General information messages
5. **debug** - Detailed debugging information
6. **silly** - Very verbose debugging information

### Usage Examples

#### Error Logging (with exceptions)
```typescript
try {
  // Some operation that might fail
  const result = await riskyOperation();
} catch (error) {
  Logger.error("Failed to perform risky operation", error, {
    userId: ctx.state.auth?.user?.id,
    operationId: "risky-op-123",
    additionalContext: someVariable,
  });
  
  // Handle the error appropriately
  ctx.status = 500;
  ctx.body = { ok: false, error: error.message };
}
```

#### Info Logging (successful operations)
```typescript
Logger.info("task", "Task created successfully", {
  taskId: task.id,
  userId: user.id,
  teamId: user.teamId,
  title: task.title,
});
```

#### Debug Logging (development debugging)
```typescript
Logger.debug("database", "Query executed", {
  query: sqlQuery,
  parameters: queryParams,
  duration: executionTime,
});
```

#### Warning Logging (recoverable issues)
```typescript
Logger.warn("Configuration issue detected", {
  setting: "MAX_FILE_SIZE",
  currentValue: process.env.MAX_FILE_SIZE,
  recommendedValue: "50MB",
});
```

### Log Categories

Available categories for server logging:
- `"lifecycle"` - Application startup/shutdown
- `"authentication"` - Auth-related operations  
- `"multiplayer"` - Collaborative editing
- `"http"` - HTTP requests/responses
- `"commands"` - Command processing
- `"worker"` - Background jobs
- `"task"` - Task-related operations (perfect for plugins!)
- `"processor"` - Data processing
- `"email"` - Email operations
- `"queue"` - Queue processing  
- `"websockets"` - WebSocket connections
- `"database"` - Database operations
- `"utils"` - Utility operations
- `"plugins"` - Plugin operations

## Client-side Logging (`app/utils/Logger.ts`)

### Import the Logger
```typescript
import Logger from "~/utils/Logger";
```

### Usage Examples

#### Info Logging
```typescript
Logger.info("store", "Task store updated", {
  taskCount: tasks.length,
  operation: "refresh",
});
```

#### Debug Logging
```typescript
Logger.debug("editor", "Content changed", {
  documentId: doc.id,
  changeType: "insert",
  length: newContent.length,
});
```

#### Error Logging
```typescript
try {
  await apiClient.post("/api/tasks.create", taskData);
} catch (error) {
  Logger.error("Failed to create task via API", error, {
    taskData,
    endpoint: "/api/tasks.create",
  });
}
```

#### Warning Logging
```typescript
Logger.warn("Feature flag not enabled", {
  flag: "ADVANCED_TASKS",
  userRole: currentUser.role,
});
```

## Configuration

### Environment Variables

- `LOG_LEVEL` - Sets minimum log level (`error`, `warn`, `info`, `http`, `verbose`, `debug`, `silly`)
- `DEBUG` - Enable specific debug categories (comma-separated)

### Examples:
```bash
# Show only errors and warnings
LOG_LEVEL=warn

# Show everything including debug info
LOG_LEVEL=debug

# Enable HTTP request logging specifically
DEBUG=http

# Enable multiple debug categories
DEBUG=http,database,task
```

## Production vs Development

### Development
- Logs are formatted with colors and readable structure
- Debug logging is enabled by default
- Console output shows full context

### Production  
- Logs are in JSON format for log aggregation systems
- Sensitive data is automatically sanitized
- Integration with Sentry for error tracking
- Metrics integration for monitoring

## Best Practices

1. **Use appropriate severity levels**
   - `error` for exceptions and failures
   - `warn` for recoverable issues  
   - `info` for important operations
   - `debug` for debugging information

2. **Include relevant context**
   - User IDs, task IDs, team IDs
   - Operation parameters
   - Timing information where relevant

3. **Choose appropriate categories**
   - Use `"task"` for task plugin operations
   - Use `"plugins"` for general plugin operations
   - Match the category to the functional area

4. **Avoid logging sensitive data**
   - The system automatically sanitizes some fields
   - Be cautious with user content, tokens, passwords

5. **Structure your log messages**
   - Start with a clear action description
   - Include the outcome (success/failure)
   - Add context in the extra parameter

## Example from Tasks Plugin

```typescript
// Successful operation
Logger.info("task", `Task assigned successfully`, {
  taskId: id,
  assignedToUserId: targetUserId,
  assignedByUserId: currentUser.id,
  teamId: currentUser.teamId,
});

// Error handling
Logger.error("Failed to assign task", error, {
  userId: ctx.state.auth?.user?.id,
  taskId: id,
  targetUserId: userId,
  teamId: ctx.state.auth?.user?.teamId,
});
```

This logging system integrates with monitoring tools and makes debugging production issues much easier!