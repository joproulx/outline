import Router from "koa-router";
import SimpleTaskItem, {
  TaskStatus,
  TaskPriority,
} from "../models/SimpleTaskItem";
import auth from "@server/middlewares/authentication";

const router = new Router();

// Debug endpoint to verify plugin is working
router.post("tasks.info", async (ctx) => {
  ctx.body = {
    ok: true,
    message: "Tasks plugin is working",
    timestamp: new Date().toISOString(),
  };
});

// Create a new task item
router.post("tasks.create", auth(), async (ctx) => {
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
    let backendPriority = TaskPriority.Medium; // default
    if (priority === "low") {
      backendPriority = TaskPriority.Low;
    } else if (priority === "medium") {
      backendPriority = TaskPriority.Medium;
    } else if (priority === "high") {
      backendPriority = TaskPriority.High;
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

    const task = await SimpleTaskItem.create({
      title,
      description: description || null,
      priority: backendPriority,
      deadline: parsedDeadline,
      tags: tags || [],
      documentId: documentId || undefined,
      collectionId: collectionId || undefined,
      createdById: user.id,
      teamId: user.teamId,
      status: TaskStatus.Pending,
    });

    // Convert to frontend format
    const convertedTask = {
      id: task.id,
      title: task.title,
      description: task.description,
      priority: task.priority.toLowerCase(),
      dueDate: task.deadline?.toISOString(),
      tags: task.tags || [],
      completed: task.status === TaskStatus.Completed,
      createdAt: task.createdAt?.toISOString(),
      updatedAt: task.updatedAt?.toISOString(),
      createdById: task.createdById,
    };

    ctx.body = {
      ok: true,
      data: convertedTask,
    };
  } catch (error) {
    ctx.status = 400;
    ctx.body = {
      ok: false,
      error: error.message,
    };
  }
});

// List tasks
router.post("tasks.list", auth(), async (ctx) => {
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

    const tasks = await SimpleTaskItem.findAll({
      where,
      order: [["createdAt", "DESC"]],
    });

    // Convert backend format to frontend format
    const convertedTasks = tasks.map((task) => ({
      id: task.id,
      title: task.title,
      description: task.description,
      priority: task.priority.toLowerCase(),
      dueDate: task.deadline?.toISOString(),
      tags: task.tags || [],
      completed: task.status === TaskStatus.Completed,
      createdAt: task.createdAt?.toISOString(),
      updatedAt: task.updatedAt?.toISOString(),
      createdById: task.createdById,
    }));

    ctx.body = {
      ok: true,
      data: convertedTasks,
    };
  } catch (error) {
    ctx.status = 500;
    ctx.body = {
      ok: false,
      error: error.message,
    };
  }
});

// Update task
router.post("tasks.update", auth(), async (ctx) => {
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
    const task = await SimpleTaskItem.findOne({
      where: {
        id,
        teamId: user.teamId,
      },
    });

    if (!task) {
      ctx.status = 404;
      ctx.body = {
        ok: false,
        error: "Task not found",
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
      finalStatus = completed ? TaskStatus.Completed : TaskStatus.Pending;
    }

    await task.update({
      ...(title !== undefined && { title }),
      ...(description !== undefined && { description }),
      ...(finalStatus !== undefined && { status: finalStatus }),
      ...(priority !== undefined && { priority }),
      ...(deadlineDate !== undefined && {
        deadline: parsedDeadline,
      }),
      ...(tags !== undefined && { tags }),
      ...(finalStatus === TaskStatus.Completed && { completedAt: new Date() }),
      ...(finalStatus !== TaskStatus.Completed && { completedAt: undefined }),
    });

    // Convert to frontend format
    const convertedTask = {
      id: task.id,
      title: task.title,
      description: task.description,
      priority: task.priority.toLowerCase(),
      dueDate: task.deadline?.toISOString(),
      tags: task.tags || [],
      completed: task.status === TaskStatus.Completed,
      createdAt: task.createdAt?.toISOString(),
      updatedAt: task.updatedAt?.toISOString(),
      createdById: task.createdById,
    };

    ctx.body = {
      ok: true,
      data: convertedTask,
    };
  } catch (error) {
    ctx.status = 400;
    ctx.body = {
      ok: false,
      error: error.message,
    };
  }
});

// Delete task
router.post("tasks.delete", auth(), async (ctx) => {
  const { id } = ctx.request.body;
  const { user } = ctx.state.auth;

  try {
    const task = await SimpleTaskItem.findOne({
      where: {
        id,
        teamId: user.teamId,
      },
    });

    if (!task) {
      ctx.status = 404;
      ctx.body = {
        ok: false,
        error: "Task not found",
      };
      return;
    }

    await task.destroy();

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
