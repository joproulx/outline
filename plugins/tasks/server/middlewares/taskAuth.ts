import { Context, Next } from "koa";
import { APIContext } from "@server/types";

/**
 * Middleware to ensure the user is authenticated for task operations
 */
export function requireAuth() {
  return async (ctx: Context, next: Next) => {
    const apiCtx = ctx as APIContext;

    if (!apiCtx.state.auth?.user) {
      ctx.status = 401;
      ctx.body = {
        ok: false,
        error: "authentication_required",
        message: "You must be logged in to perform this action",
      };
      return;
    }

    await next();
  };
}

/**
 * Middleware to ensure the user is authenticated and has access to the team
 */
export function requireTeamAccess() {
  return async (ctx: Context, next: Next) => {
    const apiCtx = ctx as APIContext;
    const user = apiCtx.state.auth?.user;

    if (!user) {
      ctx.status = 401;
      ctx.body = {
        ok: false,
        error: "authentication_required",
        message: "You must be logged in to perform this action",
      };
      return;
    }

    if (!user.teamId) {
      ctx.status = 403;
      ctx.body = {
        ok: false,
        error: "team_required",
        message: "You must be a member of a team to access tasks",
      };
      return;
    }

    await next();
  };
}

/**
 * Middleware to check if user can create tasks
 */
export function canCreateTasks() {
  return async (ctx: Context, next: Next) => {
    const apiCtx = ctx as APIContext;
    const user = apiCtx.state.auth?.user;

    if (!user) {
      ctx.status = 401;
      ctx.body = {
        ok: false,
        error: "authentication_required",
        message: "You must be logged in to create tasks",
      };
      return;
    }

    // For now, all authenticated team members can create tasks
    // This can be extended with more granular permissions later
    if (!user.teamId) {
      ctx.status = 403;
      ctx.body = {
        ok: false,
        error: "insufficient_permissions",
        message: "You don't have permission to create tasks",
      };
      return;
    }

    await next();
  };
}
