import Router from "koa-router";
import SimpleTodoItem, {
  TodoStatus,
  TodoPriority,
} from "../models/SimpleTodoItem";
import auth from "@server/middlewares/authentication";

const router = new Router();

// Debug endpoint to verify plugin is working
router.post("todos.info", async (ctx) => {
  ctx.body = {
    ok: true,
    message: "Todos plugin is working",
    timestamp: new Date().toISOString(),
  };
});

// Create a new todo item
router.post("todos.create", auth(), async (ctx) => {
  const {
    title,
    description,
    priority,
    dueDate,
    deadline,
    tags,
    documentId,
    collectionId,
  } = ctx.request.body;

  const { user } = ctx.state.auth;

  try {
    // Convert frontend priority values to backend enum values
    let backendPriority = TodoPriority.Medium; // default
    if (priority === "low") {
      backendPriority = TodoPriority.Low;
    } else if (priority === "medium") {
      backendPriority = TodoPriority.Medium;
    } else if (priority === "high") {
      backendPriority = TodoPriority.High;
    }

    // Use dueDate if provided, fallback to deadline for backward compatibility
    const deadlineDate = dueDate || deadline;

    // Ensure date is handled consistently - if it's just a date string, treat it as UTC date
    let parsedDeadline;
    if (deadlineDate) {
      if (
        typeof deadlineDate === "string" &&
        /^\d{4}-\d{2}-\d{2}$/.test(deadlineDate)
      ) {
        // If it's a date string without time, append time to avoid timezone issues
        parsedDeadline = new Date(deadlineDate + "T00:00:00.000Z");
      } else {
        parsedDeadline = new Date(deadlineDate);
      }
    }

    const todo = await SimpleTodoItem.create({
      title,
      description: description || null,
      priority: backendPriority,
      deadline: parsedDeadline,
      tags: tags || [],
      documentId: documentId || undefined,
      collectionId: collectionId || undefined,
      createdById: user.id,
      teamId: user.teamId,
      status: TodoStatus.Pending,
    });

    // Convert to frontend format
    const convertedTodo = {
      id: todo.id,
      title: todo.title,
      description: todo.description,
      priority: todo.priority.toLowerCase(),
      dueDate: todo.deadline?.toISOString(),
      tags: todo.tags || [],
      completed: todo.status === TodoStatus.Completed,
      createdAt: todo.createdAt?.toISOString(),
      updatedAt: todo.updatedAt?.toISOString(),
      createdById: todo.createdById,
    };

    ctx.body = {
      ok: true,
      data: convertedTodo,
    };
  } catch (error) {
    ctx.status = 400;
    ctx.body = {
      ok: false,
      error: error.message,
    };
  }
});

// List todos
router.post("todos.list", auth(), async (ctx) => {
  try {
    const { user } = ctx.state.auth;
    const { documentId, collectionId, status } = ctx.request.body;

    const where: Record<string, unknown> = {
      teamId: user.teamId,
    };

    if (documentId) {
      where.documentId = documentId;
    }
    if (collectionId) {
      where.collectionId = collectionId;
    }
    if (status) {
      where.status = status;
    }

    const todos = await SimpleTodoItem.findAll({
      where,
      order: [["createdAt", "DESC"]],
    });

    // Convert backend format to frontend format
    const convertedTodos = todos.map((todo) => ({
      id: todo.id,
      title: todo.title,
      description: todo.description,
      priority: todo.priority.toLowerCase(),
      dueDate: todo.deadline?.toISOString(),
      tags: todo.tags || [],
      completed: todo.status === TodoStatus.Completed,
      createdAt: todo.createdAt?.toISOString(),
      updatedAt: todo.updatedAt?.toISOString(),
      createdById: todo.createdById,
    }));

    ctx.body = {
      ok: true,
      data: convertedTodos,
    };
  } catch (error) {
    ctx.status = 500;
    ctx.body = {
      ok: false,
      error: error.message,
    };
  }
});

// Update todo
router.post("todos.update", auth(), async (ctx) => {
  const {
    id,
    title,
    description,
    status,
    priority,
    deadline,
    dueDate,
    tags,
    completed,
  } = ctx.request.body;
  const { user } = ctx.state.auth;

  try {
    const todo = await SimpleTodoItem.findOne({
      where: {
        id,
        teamId: user.teamId,
      },
    });

    if (!todo) {
      ctx.status = 404;
      ctx.body = {
        ok: false,
        error: "Todo not found",
      };
      return;
    }

    // Use dueDate if provided, fallback to deadline for backward compatibility
    const deadlineDate = dueDate || deadline;

    // Ensure date is handled consistently - if it's just a date string, treat it as UTC date
    let parsedDeadline;
    if (deadlineDate) {
      if (
        typeof deadlineDate === "string" &&
        /^\d{4}-\d{2}-\d{2}$/.test(deadlineDate)
      ) {
        // If it's a date string without time, append time to avoid timezone issues
        parsedDeadline = new Date(deadlineDate + "T00:00:00.000Z");
      } else {
        parsedDeadline = new Date(deadlineDate);
      }
    }

    // Convert completed boolean to status if provided
    let finalStatus = status;
    if (completed !== undefined) {
      finalStatus = completed ? TodoStatus.Completed : TodoStatus.Pending;
    }

    await todo.update({
      ...(title !== undefined && { title }),
      ...(description !== undefined && { description }),
      ...(finalStatus !== undefined && { status: finalStatus }),
      ...(priority !== undefined && { priority }),
      ...(deadlineDate !== undefined && {
        deadline: parsedDeadline,
      }),
      ...(tags !== undefined && { tags }),
      ...(finalStatus === TodoStatus.Completed && { completedAt: new Date() }),
      ...(finalStatus !== TodoStatus.Completed && { completedAt: undefined }),
    });

    // Convert to frontend format
    const convertedTodo = {
      id: todo.id,
      title: todo.title,
      description: todo.description,
      priority: todo.priority.toLowerCase(),
      dueDate: todo.deadline?.toISOString(),
      tags: todo.tags || [],
      completed: todo.status === TodoStatus.Completed,
      createdAt: todo.createdAt?.toISOString(),
      updatedAt: todo.updatedAt?.toISOString(),
      createdById: todo.createdById,
    };

    ctx.body = {
      ok: true,
      data: convertedTodo,
    };
  } catch (error) {
    ctx.status = 400;
    ctx.body = {
      ok: false,
      error: error.message,
    };
  }
});

// Delete todo
router.post("todos.delete", auth(), async (ctx) => {
  const { id } = ctx.request.body;
  const { user } = ctx.state.auth;

  try {
    const todo = await SimpleTodoItem.findOne({
      where: {
        id,
        teamId: user.teamId,
      },
    });

    if (!todo) {
      ctx.status = 404;
      ctx.body = {
        ok: false,
        error: "Todo not found",
      };
      return;
    }

    await todo.destroy();

    ctx.body = {
      ok: true,
      data: { deleted: true },
    };
  } catch (error) {
    ctx.status = 400;
    ctx.body = {
      ok: false,
      error: error.message,
    };
  }
});

export default router;
