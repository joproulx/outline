import { buildUser, buildTeam } from "@server/test/factories";
import { getTestServer } from "@server/test/support";

// Import the plugin to ensure models are registered and API routes loaded
import "../index";

const server = getTestServer();

describe("tasks API", () => {
  describe("tasks.info", () => {
    it("should return plugin info", async () => {
      const res = await server.post("/api/tasks.info");
      const body = await res.json();

      expect(res.status).toEqual(200);
      expect(body.ok).toEqual(true);
      expect(body.message).toEqual("Tasks plugin is working");
      expect(body.timestamp).toBeDefined();
    });
  });

  describe("tasks.create", () => {
    it("should require authentication", async () => {
      const res = await server.post("/api/tasks.create");
      const body = await res.json();

      expect(res.status).toEqual(401);
      expect(body).toMatchSnapshot();
    });

    it("should create a task with minimal data", async () => {
      const team = await buildTeam();
      const user = await buildUser({ teamId: team.id });

      const res = await server.post("/api/tasks.create", {
        body: {
          token: user.getJwtToken(),
          title: "Test Task",
        },
      });
      const body = await res.json();

      expect(res.status).toEqual(200);
      expect(body.ok).toEqual(true);
      expect(body.data.title).toEqual("Test Task");
      expect(body.data.priority).toEqual("medium");
      expect(body.data.completed).toEqual(false);
      expect(body.data.createdById).toEqual(user.id);
    });

    it("should create a task with full data", async () => {
      const team = await buildTeam();
      const user = await buildUser({ teamId: team.id });
      const dueDate = "2025-12-31";

      const res = await server.post("/api/tasks.create", {
        body: {
          token: user.getJwtToken(),
          title: "Complete Project",
          description: "Finish the project by year end",
          priority: "high",
          dueDate: dueDate,
          tags: ["project", "urgent"],
        },
      });
      const body = await res.json();

      expect(res.status).toEqual(200);
      expect(body.ok).toEqual(true);
      expect(body.data.title).toEqual("Complete Project");
      expect(body.data.description).toEqual("Finish the project by year end");
      expect(body.data.priority).toEqual("high");
      expect(body.data.dueDate).toEqual("2025-12-31T00:00:00.000Z");
      expect(body.data.tags).toEqual(["project", "urgent"]);
      expect(body.data.completed).toEqual(false);
    });

    it("should handle date format correctly", async () => {
      const team = await buildTeam();
      const user = await buildUser({ teamId: team.id });
      const dueDate = "2025-12-25T15:30:00.000Z";

      const res = await server.post("/api/tasks.create", {
        body: {
          token: user.getJwtToken(),
          title: "Christmas Task",
          dueDate: dueDate,
        },
      });
      const body = await res.json();

      expect(res.status).toEqual(200);
      expect(body.data.dueDate).toEqual(dueDate);
    });

    it("should handle different priority values", async () => {
      const team = await buildTeam();
      const user = await buildUser({ teamId: team.id });

      const priorities = ["low", "medium", "high"];

      for (const priority of priorities) {
        const res = await server.post("/api/tasks.create", {
          body: {
            token: user.getJwtToken(),
            title: `${priority} priority task`,
            priority: priority,
          },
        });
        const body = await res.json();

        expect(res.status).toEqual(200);
        expect(body.data.priority).toEqual(priority);
      }
    });

    it("should return error for invalid data", async () => {
      const team = await buildTeam();
      const user = await buildUser({ teamId: team.id });

      const res = await server.post("/api/tasks.create", {
        body: {
          token: user.getJwtToken(),
          // Missing required title
          description: "Task without title",
        },
      });
      const body = await res.json();

      expect(res.status).toEqual(400);
      expect(body.ok).toEqual(false);
      expect(body.error).toBeDefined();
    });
  });

  describe("tasks.list", () => {
    it("should require authentication", async () => {
      const res = await server.post("/api/tasks.list");
      const body = await res.json();

      expect(res.status).toEqual(401);
      expect(body).toMatchSnapshot();
    });

    it("should return empty list when no tasks", async () => {
      const team = await buildTeam();
      const user = await buildUser({ teamId: team.id });

      const res = await server.post("/api/tasks.list", {
        body: {
          token: user.getJwtToken(),
        },
      });
      const body = await res.json();

      expect(res.status).toEqual(200);
      expect(body.ok).toEqual(true);
      expect(body.data).toEqual([]);
    });

    it("should return user's tasks", async () => {
      const team = await buildTeam();
      const user = await buildUser({ teamId: team.id });

      // Create tasks for this user
      await server.post("/api/tasks.create", {
        body: {
          token: user.getJwtToken(),
          title: "Task 1",
        },
      });

      await server.post("/api/tasks.create", {
        body: {
          token: user.getJwtToken(),
          title: "Task 2",
          priority: "high",
        },
      });

      const res = await server.post("/api/tasks.list", {
        body: {
          token: user.getJwtToken(),
        },
      });
      const body = await res.json();

      expect(res.status).toEqual(200);
      expect(body.ok).toEqual(true);
      expect(body.data.length).toEqual(2);
      expect(body.data[0].title).toEqual("Task 2"); // Most recent first
      expect(body.data[1].title).toEqual("Task 1");
    });

    it("should filter tasks by status", async () => {
      const team = await buildTeam();
      const user = await buildUser({ teamId: team.id });

      // Create completed task
      const createRes = await server.post("/api/tasks.create", {
        body: {
          token: user.getJwtToken(),
          title: "Completed Task",
        },
      });
      const createBody = await createRes.json();

      // Mark it as completed
      await server.post("/api/tasks.update", {
        body: {
          token: user.getJwtToken(),
          id: createBody.data.id,
          completed: true,
        },
      });

      // Create pending task
      await server.post("/api/tasks.create", {
        body: {
          token: user.getJwtToken(),
          title: "Pending Task",
        },
      });

      // Filter by completed status
      const res = await server.post("/api/tasks.list", {
        body: {
          token: user.getJwtToken(),
          status: "completed",
        },
      });
      const body = await res.json();

      expect(res.status).toEqual(200);
      expect(body.data.length).toEqual(1);
      expect(body.data[0].title).toEqual("Completed Task");
      expect(body.data[0].completed).toEqual(true);
    });

    it("should not return tasks from other teams", async () => {
      const team1 = await buildTeam();
      const team2 = await buildTeam();
      const user1 = await buildUser({ teamId: team1.id });
      const user2 = await buildUser({ teamId: team2.id });

      // Create task for user1
      await server.post("/api/tasks.create", {
        body: {
          token: user1.getJwtToken(),
          title: "Team 1 Task",
        },
      });

      // User2 should not see team1's tasks
      const res = await server.post("/api/tasks.list", {
        body: {
          token: user2.getJwtToken(),
        },
      });
      const body = await res.json();

      expect(res.status).toEqual(200);
      expect(body.data.length).toEqual(0);
    });
  });

  describe("tasks.update", () => {
    it("should require authentication", async () => {
      const res = await server.post("/api/tasks.update");
      const body = await res.json();

      expect(res.status).toEqual(401);
      expect(body).toMatchSnapshot();
    });

    it("should update task title", async () => {
      const team = await buildTeam();
      const user = await buildUser({ teamId: team.id });

      // Create task
      const createRes = await server.post("/api/tasks.create", {
        body: {
          token: user.getJwtToken(),
          title: "Original Title",
        },
      });
      const createBody = await createRes.json();

      // Update title
      const res = await server.post("/api/tasks.update", {
        body: {
          token: user.getJwtToken(),
          id: createBody.data.id,
          title: "Updated Title",
        },
      });
      const body = await res.json();

      expect(res.status).toEqual(200);
      expect(body.ok).toEqual(true);
      expect(body.data.title).toEqual("Updated Title");
    });

    it("should update task completion status", async () => {
      const team = await buildTeam();
      const user = await buildUser({ teamId: team.id });

      // Create task
      const createRes = await server.post("/api/tasks.create", {
        body: {
          token: user.getJwtToken(),
          title: "Task to Complete",
        },
      });
      const createBody = await createRes.json();

      // Mark as completed
      const res = await server.post("/api/tasks.update", {
        body: {
          token: user.getJwtToken(),
          id: createBody.data.id,
          completed: true,
        },
      });
      const body = await res.json();

      expect(res.status).toEqual(200);
      expect(body.data.completed).toEqual(true);
    });

    it("should update multiple fields at once", async () => {
      const team = await buildTeam();
      const user = await buildUser({ teamId: team.id });

      // Create task
      const createRes = await server.post("/api/tasks.create", {
        body: {
          token: user.getJwtToken(),
          title: "Original Task",
          priority: "low",
        },
      });
      const createBody = await createRes.json();

      // Update multiple fields
      const res = await server.post("/api/tasks.update", {
        body: {
          token: user.getJwtToken(),
          id: createBody.data.id,
          title: "Updated Task",
          description: "New description",
          priority: "high",
          dueDate: "2025-12-31",
          tags: ["updated", "important"],
        },
      });
      const body = await res.json();

      expect(res.status).toEqual(200);
      expect(body.data.title).toEqual("Updated Task");
      expect(body.data.description).toEqual("New description");
      expect(body.data.priority).toEqual("high");
      expect(body.data.dueDate).toEqual("2025-12-31T00:00:00.000Z");
      expect(body.data.tags).toEqual(["updated", "important"]);
    });

    it("should return 404 for non-existent task", async () => {
      const team = await buildTeam();
      const user = await buildUser({ teamId: team.id });

      const res = await server.post("/api/tasks.update", {
        body: {
          token: user.getJwtToken(),
          id: "00000000-0000-0000-0000-000000000000", // Valid UUID but non-existent
          title: "Updated Title",
        },
      });
      const body = await res.json();

      expect(res.status).toEqual(404);
      expect(body.ok).toEqual(false);
      expect(body.error).toEqual("Task not found");
    });

    it("should not allow updating tasks from other teams", async () => {
      const team1 = await buildTeam();
      const team2 = await buildTeam();
      const user1 = await buildUser({ teamId: team1.id });
      const user2 = await buildUser({ teamId: team2.id });

      // Create task for user1
      const createRes = await server.post("/api/tasks.create", {
        body: {
          token: user1.getJwtToken(),
          title: "Team 1 Task",
        },
      });
      const createBody = await createRes.json();

      // Try to update with user2
      const res = await server.post("/api/tasks.update", {
        body: {
          token: user2.getJwtToken(),
          id: createBody.data.id,
          title: "Hacked Title",
        },
      });
      const body = await res.json();

      expect(res.status).toEqual(404);
      expect(body.error).toEqual("Task not found");
    });
  });

  describe("tasks.delete", () => {
    it("should require authentication", async () => {
      const res = await server.post("/api/tasks.delete");
      const body = await res.json();

      expect(res.status).toEqual(401);
      expect(body).toMatchSnapshot();
    });

    it("should delete a task", async () => {
      const team = await buildTeam();
      const user = await buildUser({ teamId: team.id });

      // Create task
      const createRes = await server.post("/api/tasks.create", {
        body: {
          token: user.getJwtToken(),
          title: "Task to Delete",
        },
      });
      const createBody = await createRes.json();

      // Delete task
      const res = await server.post("/api/tasks.delete", {
        body: {
          token: user.getJwtToken(),
          id: createBody.data.id,
        },
      });
      const body = await res.json();

      expect(res.status).toEqual(200);
      expect(body.ok).toEqual(true);
      expect(body.data.deleted).toEqual(true);

      // Verify task is deleted
      const listRes = await server.post("/api/tasks.list", {
        body: {
          token: user.getJwtToken(),
        },
      });
      const listBody = await listRes.json();

      expect(listBody.data.length).toEqual(0);
    });

    it("should return 404 for non-existent task", async () => {
      const team = await buildTeam();
      const user = await buildUser({ teamId: team.id });

      const res = await server.post("/api/tasks.delete", {
        body: {
          token: user.getJwtToken(),
          id: "00000000-0000-0000-0000-000000000000", // Valid UUID but non-existent
        },
      });
      const body = await res.json();

      expect(res.status).toEqual(404);
      expect(body.ok).toEqual(false);
      expect(body.error).toEqual("Task not found");
    });

    it("should not allow deleting tasks from other teams", async () => {
      const team1 = await buildTeam();
      const team2 = await buildTeam();
      const user1 = await buildUser({ teamId: team1.id });
      const user2 = await buildUser({ teamId: team2.id });

      // Create task for user1
      const createRes = await server.post("/api/tasks.create", {
        body: {
          token: user1.getJwtToken(),
          title: "Team 1 Task",
        },
      });
      const createBody = await createRes.json();

      // Try to delete with user2
      const res = await server.post("/api/tasks.delete", {
        body: {
          token: user2.getJwtToken(),
          id: createBody.data.id,
        },
      });
      const body = await res.json();

      expect(res.status).toEqual(404);
      expect(body.error).toEqual("Task not found");
    });
  });
});
