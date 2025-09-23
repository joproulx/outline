import Router from "koa-router";
import SimpleTodoItem, {
  TodoStatus,
  TodoPriority,
} from "../models/SimpleTodoItem";

const router = new Router();

// Plugin info endpoint
router.post("todos.info", async (ctx) => {
  try {
    // This endpoint doesn't require authentication for testing
    ctx.body = {
      ok: true,
      data: {
        plugin: "todos",
        version: "1.0.0",
        status: "initialized",
        auth: !!ctx.state.auth,
        user: ctx.state.auth?.user?.id || "none",
      },
    };
  } catch (error) {
    ctx.status = 500;
    ctx.body = {
      ok: false,
      error: error.message,
    };
  }
});

// Health check endpoint for testing model functionality - no auth required
router.post("todos.health", async (ctx) => {
  try {
    // Test if we can access the SimpleTodoItem model
    const modelInfo = {
      tableName: SimpleTodoItem.tableName,
      modelName: SimpleTodoItem.name,
    };

    // Test if we can do a simple query (count)
    const count = await SimpleTodoItem.count();

    ctx.body = {
      ok: true,
      data: {
        message: "Todo model is working",
        modelInfo,
        count,
      },
    };
  } catch (error: unknown) {
    ctx.body = {
      ok: false,
      error: "model_error",
      message: `Model test failed: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
});

// Create a new todo item
router.post("todos.create", async (ctx) => {
  const { title, description, priority, deadline, documentId, collectionId } =
    ctx.request.body;

  // Check if user is authenticated
  if (!ctx.state.auth || !ctx.state.auth.user) {
    ctx.status = 401;
    ctx.body = {
      ok: false,
      error: "authentication_required",
      message: "You must be logged in to create todos",
    };
    return;
  }

  const { user } = ctx.state.auth;

  try {
    const todo = await SimpleTodoItem.create({
      title,
      description,
      priority: priority || TodoPriority.Medium,
      deadline: deadline ? new Date(deadline) : undefined,
      documentId,
      collectionId,
      createdById: user.id,
      teamId: user.teamId,
    });

    ctx.body = {
      ok: true,
      data: todo,
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
router.post("todos.list", async (ctx) => {
  try {
    // Check if user is authenticated
    if (!ctx.state.auth || !ctx.state.auth.user) {
      ctx.status = 401;
      ctx.body = {
        ok: false,
        error: "authentication_required",
        message: "This endpoint requires authentication",
      };
      return;
    }

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

    // For now, return empty list since we're testing
    const todos: unknown[] = [];

    ctx.body = {
      ok: true,
      data: todos,
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
router.post("todos.update", async (ctx) => {
  const { id, title, description, status, priority, deadline } =
    ctx.request.body;
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

    await todo.update({
      ...(title !== undefined && { title }),
      ...(description !== undefined && { description }),
      ...(status !== undefined && { status }),
      ...(priority !== undefined && { priority }),
      ...(deadline !== undefined && {
        deadline: deadline ? new Date(deadline) : undefined,
      }),
      ...(status === TodoStatus.Completed && { completedAt: new Date() }),
      ...(status !== TodoStatus.Completed && { completedAt: undefined }),
    });

    ctx.body = {
      ok: true,
      data: todo,
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
router.post("todos.delete", async (ctx) => {
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
