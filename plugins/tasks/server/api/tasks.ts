import Router from "koa-router";
import TaskItem, { TaskPriority } from "../models/TaskItem";
import TaskAssignment from "../models/TaskAssignment";
import { User } from "@server/models";
import auth from "@server/middlewares/authentication";
import Logger from "@server/logging/Logger";

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
    Logger.info("task", `Creating new task: ${title}`, {
      userId: user.id,
      teamId: user.teamId,
      priority,
      documentId,
      collectionId,
    });

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

    const task = await TaskItem.create({
      title,
      description: description || null,
      priority: backendPriority,
      deadline: parsedDeadline,
      tags: tags || [],
      documentId: documentId || undefined,
      collectionId: collectionId || undefined,
      createdById: user.id,
      teamId: user.teamId,
    });

    // Convert to frontend format
    const convertedTask = {
      id: task.id,
      title: task.title,
      description: task.description,
      priority: task.priority.toLowerCase(),
      dueDate: task.deadline?.toISOString(),
      tags: task.tags || [],
      createdAt: task.createdAt?.toISOString(),
      updatedAt: task.updatedAt?.toISOString(),
      createdById: task.createdById,
      assigneeCount: task.assigneeCount,
      assignees:
        task.assignees?.map((assignee) => ({
          id: assignee.id,
          name: assignee.name,
          email: assignee.email,
        })) || [],
      assignments:
        task.assignments?.map((assignment) => ({
          id: assignment.id,
          userId: assignment.userId,
          assignedById: assignment.assignedById,
          assignedAt: assignment.assignedAt?.toISOString(),
          user: {
            id: assignment.user.id,
            name: assignment.user.name,
            email: assignment.user.email,
          },
          assignedBy: {
            id: assignment.assignedBy.id,
            name: assignment.assignedBy.name,
            email: assignment.assignedBy.email,
          },
        })) || [],
    };

    ctx.body = {
      ok: true,
      data: convertedTask,
    };
  } catch (error) {
    Logger.error("Failed to create task", error, {
      userId: ctx.state.auth?.user?.id,
      title,
      description,
      priority,
      dueDate,
      deadline,
      tags,
      documentId,
      collectionId,
    });

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
    const { documentId, collectionId } = ctx.request.body;

    const where: Record<string, unknown> = {
      teamId: user.teamId,
    };

    if (documentId) {
      where.documentId = documentId;
    }
    if (collectionId) {
      where.collectionId = collectionId;
    }

    const tasks = await TaskItem.findAll({
      where,
      order: [["createdAt", "DESC"]],
      include: [
        {
          model: TaskAssignment,
          as: "assignments",
          include: [
            {
              model: User,
              as: "user",
              paranoid: true,
              attributes: ["id", "name", "email", "avatarUrl", "color"],
            },
            {
              model: User,
              as: "assignedBy",
              paranoid: true,
              attributes: ["id", "name", "email", "avatarUrl", "color"],
            },
          ],
        },
      ],
    });

    // Convert backend format to frontend format
    const convertedTasks = tasks.map((task) => ({
      id: task.id,
      title: task.title,
      description: task.description,
      priority: task.priority.toLowerCase(),
      dueDate: task.deadline?.toISOString(),
      tags: task.tags || [],
      createdAt: task.createdAt?.toISOString(),
      updatedAt: task.updatedAt?.toISOString(),
      createdById: task.createdById,
      assigneeCount: task.assigneeCount,
      assignees:
        task.assignees?.map((assignee) => ({
          id: assignee.id,
          name: assignee.name,
          email: assignee.email,
          avatarUrl: assignee.avatarUrl || null,
          color: assignee.color || null,
        })) || [],
      assignments:
        task.assignments?.map((assignment) => ({
          id: assignment.id,
          userId: assignment.userId,
          assignedById: assignment.assignedById,
          assignedAt: assignment.assignedAt?.toISOString(),
          user: {
            id: assignment.user.id,
            name: assignment.user.name,
            email: assignment.user.email,
            avatarUrl: assignment.user.avatarUrl || null,
            color: assignment.user.color || null,
          },
          assignedBy: {
            id: assignment.assignedBy.id,
            name: assignment.assignedBy.name,
            email: assignment.assignedBy.email,
            avatarUrl: assignment.assignedBy.avatarUrl || null,
            color: assignment.assignedBy.color || null,
          },
        })) || [],
    }));

    ctx.body = {
      ok: true,
      data: convertedTasks,
    };
  } catch (error) {
    Logger.error("Failed to list tasks", error, {
      userId: ctx.state.auth?.user?.id,
      documentId: ctx.request.body?.documentId,
      collectionId: ctx.request.body?.collectionId,
    });

    ctx.status = 500;
    ctx.body = {
      ok: false,
      error: error.message,
    };
  }
});

// Update task
router.post("tasks.update", auth(), async (ctx) => {
  const { id, title, description, priority, deadline, dueDate, tags } =
    ctx.request.body;
  const { user } = ctx.state.auth;

  try {
    const task = await TaskItem.findOne({
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

    await task.update({
      ...(title !== undefined && { title }),
      ...(description !== undefined && { description }),
      ...(priority !== undefined && { priority }),
      ...(deadlineDate !== undefined && {
        deadline: parsedDeadline,
      }),
      ...(tags !== undefined && { tags }),
    });

    // Convert to frontend format
    const convertedTask = {
      id: task.id,
      title: task.title,
      description: task.description,
      priority: task.priority.toLowerCase(),
      dueDate: task.deadline?.toISOString(),
      tags: task.tags || [],
      createdAt: task.createdAt?.toISOString(),
      updatedAt: task.updatedAt?.toISOString(),
      createdById: task.createdById,
      assigneeCount: task.assigneeCount,
      assignees:
        task.assignees?.map((assignee) => ({
          id: assignee.id,
          name: assignee.name,
          email: assignee.email,
        })) || [],
      assignments:
        task.assignments?.map((assignment) => ({
          id: assignment.id,
          userId: assignment.userId,
          assignedById: assignment.assignedById,
          assignedAt: assignment.assignedAt?.toISOString(),
          user: {
            id: assignment.user.id,
            name: assignment.user.name,
            email: assignment.user.email,
          },
          assignedBy: {
            id: assignment.assignedBy.id,
            name: assignment.assignedBy.name,
            email: assignment.assignedBy.email,
          },
        })) || [],
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
    const task = await TaskItem.findOne({
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

// Assign user to task
router.post("tasks.assign", auth(), async (ctx) => {
  const { id, userId } = ctx.request.body;
  const { user: currentUser } = ctx.state.auth;

  try {
    // Find the task and verify access
    const task = await TaskItem.findOne({
      where: {
        id,
        teamId: currentUser.teamId,
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

    // Determine who to assign
    let targetUserId = userId;

    // If no userId specified, assign to self
    if (!targetUserId) {
      targetUserId = currentUser.id;
    } else if (targetUserId !== currentUser.id) {
      // Only task creator or admins can assign tasks to other users
      if (task.createdById !== currentUser.id && !currentUser.isAdmin) {
        ctx.status = 403;
        ctx.body = {
          ok: false,
          error:
            "Only task creator or administrators can assign tasks to other users",
        };
        return;
      }
    }

    // Verify target user exists and is in same team
    if (targetUserId !== currentUser.id) {
      const targetUser = await User.findOne({
        where: {
          id: targetUserId,
          teamId: currentUser.teamId,
        },
      });

      if (!targetUser) {
        ctx.status = 404;
        ctx.body = {
          ok: false,
          error: "Target user not found in your team",
        };
        return;
      }
    }

    // Check if already assigned
    const existingAssignment = await TaskAssignment.findOne({
      where: {
        taskId: id,
        userId: targetUserId,
      },
    });

    if (existingAssignment) {
      ctx.status = 400;
      ctx.body = {
        ok: false,
        error: "User is already assigned to this task",
      };
      return;
    }

    // Create assignment
    const assignment = await TaskAssignment.createAssignment(
      id,
      targetUserId,
      currentUser.id
    );

    // Load the assignment with user data for response
    const assignmentWithUser = await TaskAssignment.findByPk(assignment.id, {
      include: [
        {
          model: User,
          as: "user",
          paranoid: false,
        },
        {
          model: User,
          as: "assignedBy",
          paranoid: false,
        },
      ],
    });
    if (!assignmentWithUser) {
      throw new Error("Assignment not found");
    }

    if (!assignmentWithUser.user) {
      throw new Error("Assignment user not found");
    }

    if (!assignmentWithUser.assignedBy) {
      throw new Error("Assignment assignedBy not found");
    }

    Logger.info("task", `Task assigned successfully`, {
      taskId: id,
      assignedToUserId: targetUserId,
      assignedByUserId: currentUser.id,
      teamId: currentUser.teamId,
    });

    // Reload the task with updated assignment data
    const updatedTask = await TaskItem.findByPk(id, {
      include: [
        {
          model: TaskAssignment,
          as: "assignments",
          include: [
            { model: User, as: "user", paranoid: false },
            { model: User, as: "assignedBy", paranoid: false },
          ],
        },
      ],
    });

    if (!updatedTask) {
      throw new Error("Task not found after assignment");
    }

    ctx.body = {
      ok: true,
      data: {
        id: updatedTask.id,
        title: updatedTask.title,
        description: updatedTask.description,
        priority: updatedTask.priority.toLowerCase(),
        dueDate: updatedTask.deadline?.toISOString(),
        tags: updatedTask.tags || [],
        createdAt: updatedTask.createdAt?.toISOString(),
        updatedAt: updatedTask.updatedAt?.toISOString(),
        createdById: updatedTask.createdById,
        assigneeCount: updatedTask.assigneeCount,
        assignees:
          updatedTask.assignees?.map((assignee) => ({
            id: assignee.id,
            name: assignee.name,
            email: assignee.email,
          })) || [],
        assignments:
          updatedTask.assignments?.map((assignment) => ({
            id: assignment.id,
            userId: assignment.userId,
            assignedById: assignment.assignedById,
            assignedAt: assignment.assignedAt?.toISOString(),
            user: {
              id: assignment.user.id,
              name: assignment.user.name,
              email: assignment.user.email,
            },
            assignedBy: {
              id: assignment.assignedBy.id,
              name: assignment.assignedBy.name,
              email: assignment.assignedBy.email,
            },
          })) || [],
      },
    };
  } catch (error) {
    Logger.error("Failed to assign task", error, {
      userId: ctx.state.auth?.user?.id,
      taskId: id,
      targetUserId: userId,
      teamId: ctx.state.auth?.user?.teamId,
    });

    ctx.status = 400;
    ctx.body = {
      ok: false,
      error: error.message,
    };
  }
});

// Unassign user from task
router.post("tasks.unassign", auth(), async (ctx) => {
  const { id, userId } = ctx.request.body;
  const { user: currentUser } = ctx.state.auth;

  try {
    // Find the task and verify access
    const task = await TaskItem.findOne({
      where: {
        id,
        teamId: currentUser.teamId,
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

    // Determine who to unassign
    let targetUserId = userId;

    // If no userId specified, unassign self
    if (!targetUserId) {
      targetUserId = currentUser.id;
    } else if (targetUserId !== currentUser.id) {
      // Only task creator or admins can unassign tasks from other users
      if (task.createdById !== currentUser.id && !currentUser.isAdmin) {
        ctx.status = 403;
        ctx.body = {
          ok: false,
          error:
            "Only task creator or administrators can unassign tasks from other users",
        };
        return;
      }
    }

    // Check if assignment exists
    const assignment = await TaskAssignment.findOne({
      where: {
        taskId: id,
        userId: targetUserId,
      },
    });

    if (!assignment) {
      ctx.status = 404;
      ctx.body = {
        ok: false,
        error: "Assignment not found",
      };
      return;
    }

    // Remove assignment
    const deletedCount = await TaskAssignment.removeAssignment(
      id,
      targetUserId
    );

    ctx.body = {
      ok: true,
      data: {
        deleted: deletedCount > 0,
        taskId: id,
        userId: targetUserId,
      },
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
