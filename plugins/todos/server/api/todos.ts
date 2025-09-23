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

    const todo = await SimpleTodoItem.create({
      title,
      description: description || null,
      priority: backendPriority,
      deadline: deadlineDate ? new Date(deadlineDate) : undefined,
      documentId: documentId || undefined,
      collectionId: collectionId || undefined,
      createdById: user.id,
      teamId: user.teamId,
      status: TodoStatus.Pending,
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
router.post("todos.update", auth(), async (ctx) => {
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
