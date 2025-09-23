import Router from "koa-router";

const router = new Router();

// Placeholder route - will be implemented in Phase 2.2
router.post("todos.info", async (ctx) => {
  ctx.body = {
    ok: true,
    data: {
      plugin: "todos",
      version: "1.0.0",
      status: "initialized",
    },
  };
});

export default router;
