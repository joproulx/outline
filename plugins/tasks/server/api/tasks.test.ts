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

  describe("tasks.assign", () => {
    it("should require authentication", async () => {
      const res = await server.post("/api/tasks.assign");
      const body = await res.json();

      expect(res.status).toEqual(401);
      expect(body).toMatchSnapshot();
    });

    it("should assign current user to task when no userId provided", async () => {
      const team = await buildTeam();
      const user = await buildUser({ teamId: team.id });

      // Create task
      const createRes = await server.post("/api/tasks.create", {
        body: {
          token: user.getJwtToken(),
          title: "Test Task",
        },
      });
      const createBody = await createRes.json();

      // Assign to self
      const res = await server.post("/api/tasks.assign", {
        body: {
          token: user.getJwtToken(),
          id: createBody.data.id,
        },
      });
      const body = await res.json();

      expect(res.status).toEqual(200);
      expect(body.ok).toEqual(true);
      expect(body.data.id).toEqual(createBody.data.id);
      expect(body.data.assigneeCount).toEqual(1);
      expect(body.data.assignees).toHaveLength(1);
      expect(body.data.assignees[0].id).toEqual(user.id);
      expect(body.data.assignments).toHaveLength(1);
      expect(body.data.assignments[0].userId).toEqual(user.id);
      expect(body.data.assignments[0].assignedById).toEqual(user.id);
      expect(body.data.assignments[0].assignedAt).toBeDefined();
    });

    it("should assign current user to task when explicitly specified", async () => {
      const team = await buildTeam();
      const user = await buildUser({ teamId: team.id });

      // Create task
      const createRes = await server.post("/api/tasks.create", {
        body: {
          token: user.getJwtToken(),
          title: "Test Task",
        },
      });
      const createBody = await createRes.json();

      // Assign to self explicitly
      const res = await server.post("/api/tasks.assign", {
        body: {
          token: user.getJwtToken(),
          id: createBody.data.id,
          userId: user.id,
        },
      });
      const body = await res.json();

      expect(res.status).toEqual(200);
      expect(body.ok).toEqual(true);
      expect(body.data.assignees).toHaveLength(1);
      expect(body.data.assignees[0].id).toEqual(user.id);
      expect(body.data.assignments[0].userId).toEqual(user.id);
    });

    it("should prevent non-creator/non-admin from assigning task to other users", async () => {
      const team = await buildTeam();
      const taskCreator = await buildUser({ teamId: team.id });
      const user1 = await buildUser({ teamId: team.id });
      const user2 = await buildUser({ teamId: team.id });

      // Create task as taskCreator
      const createRes = await server.post("/api/tasks.create", {
        body: {
          token: taskCreator.getJwtToken(),
          title: "Test Task",
        },
      });
      const createBody = await createRes.json();

      // Try to assign to user2 as user1 (neither creator nor admin)
      const res = await server.post("/api/tasks.assign", {
        body: {
          token: user1.getJwtToken(),
          id: createBody.data.id,
          userId: user2.id,
        },
      });
      const body = await res.json();

      expect(res.status).toEqual(403);
      expect(body.ok).toEqual(false);
      expect(body.error).toEqual(
        "Only task creator or administrators can assign tasks to other users"
      );
    });

    it("should allow task creator to assign task to other users", async () => {
      const team = await buildTeam();
      const taskCreator = await buildUser({ teamId: team.id });
      const user = await buildUser({ teamId: team.id });

      // Create task as taskCreator
      const createRes = await server.post("/api/tasks.create", {
        body: {
          token: taskCreator.getJwtToken(),
          title: "Test Task",
        },
      });
      const createBody = await createRes.json();

      // Assign to user as task creator
      const res = await server.post("/api/tasks.assign", {
        body: {
          token: taskCreator.getJwtToken(),
          id: createBody.data.id,
          userId: user.id,
        },
      });
      const body = await res.json();

      expect(res.status).toEqual(200);
      expect(body.ok).toEqual(true);
      expect(body.data.assignees).toHaveLength(1);
      expect(body.data.assignees[0].id).toEqual(user.id);
      expect(body.data.assignments[0].userId).toEqual(user.id);
      expect(body.data.assignments[0].assignedById).toEqual(taskCreator.id);
      expect(body.data.assignments[0].user.id).toEqual(user.id);
      expect(body.data.assignments[0].assignedBy.id).toEqual(taskCreator.id);
    });

    it("should allow admin to assign task to other users", async () => {
      const team = await buildTeam();
      const admin = await buildUser({ teamId: team.id, role: "admin" });
      const taskCreator = await buildUser({ teamId: team.id });
      const user = await buildUser({ teamId: team.id });

      // Create task as taskCreator
      const createRes = await server.post("/api/tasks.create", {
        body: {
          token: taskCreator.getJwtToken(),
          title: "Test Task",
        },
      });
      const createBody = await createRes.json();

      // Assign to user as admin
      const res = await server.post("/api/tasks.assign", {
        body: {
          token: admin.getJwtToken(),
          id: createBody.data.id,
          userId: user.id,
        },
      });
      const body = await res.json();

      expect(res.status).toEqual(200);
      expect(body.ok).toEqual(true);
      expect(body.data.assignees).toHaveLength(1);
      expect(body.data.assignees[0].id).toEqual(user.id);
      expect(body.data.assignments[0].userId).toEqual(user.id);
      expect(body.data.assignments[0].assignedById).toEqual(admin.id);
      expect(body.data.assignments[0].user.id).toEqual(user.id);
      expect(body.data.assignments[0].assignedBy.id).toEqual(admin.id);
    });

    it("should prevent assignment to user from different team", async () => {
      const team1 = await buildTeam();
      const team2 = await buildTeam();
      const admin1 = await buildUser({ teamId: team1.id, role: "admin" });
      const user2 = await buildUser({ teamId: team2.id });

      // Create task in team1
      const createRes = await server.post("/api/tasks.create", {
        body: {
          token: admin1.getJwtToken(),
          title: "Test Task",
        },
      });
      const createBody = await createRes.json();

      // Try to assign to user from team2
      const res = await server.post("/api/tasks.assign", {
        body: {
          token: admin1.getJwtToken(),
          id: createBody.data.id,
          userId: user2.id,
        },
      });
      const body = await res.json();

      expect(res.status).toEqual(404);
      expect(body.ok).toEqual(false);
      expect(body.error).toEqual("Target user not found in your team");
    });

    it("should prevent double assignment", async () => {
      const team = await buildTeam();
      const user = await buildUser({ teamId: team.id });

      // Create task
      const createRes = await server.post("/api/tasks.create", {
        body: {
          token: user.getJwtToken(),
          title: "Test Task",
        },
      });
      const createBody = await createRes.json();

      // First assignment
      await server.post("/api/tasks.assign", {
        body: {
          token: user.getJwtToken(),
          id: createBody.data.id,
        },
      });

      // Try to assign again
      const res = await server.post("/api/tasks.assign", {
        body: {
          token: user.getJwtToken(),
          id: createBody.data.id,
        },
      });
      const body = await res.json();

      expect(res.status).toEqual(400);
      expect(body.ok).toEqual(false);
      expect(body.error).toEqual("User is already assigned to this task");
    });

    it("should return 404 for non-existent task", async () => {
      const team = await buildTeam();
      const user = await buildUser({ teamId: team.id });

      const res = await server.post("/api/tasks.assign", {
        body: {
          token: user.getJwtToken(),
          id: "00000000-0000-4000-8000-000000000000",
        },
      });
      const body = await res.json();

      expect(res.status).toEqual(404);
      expect(body.error).toEqual("Task not found");
    });

    it("should return 404 for task from different team", async () => {
      const team1 = await buildTeam();
      const team2 = await buildTeam();
      const user1 = await buildUser({ teamId: team1.id });
      const user2 = await buildUser({ teamId: team2.id });

      // Create task in team1
      const createRes = await server.post("/api/tasks.create", {
        body: {
          token: user1.getJwtToken(),
          title: "Team 1 Task",
        },
      });
      const createBody = await createRes.json();

      // Try to assign from team2
      const res = await server.post("/api/tasks.assign", {
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

  describe("tasks.unassign", () => {
    it("should require authentication", async () => {
      const res = await server.post("/api/tasks.unassign");
      const body = await res.json();

      expect(res.status).toEqual(401);
      expect(body).toMatchSnapshot();
    });

    it("should unassign current user from task when no userId provided", async () => {
      const team = await buildTeam();
      const user = await buildUser({ teamId: team.id });

      // Create task
      const createRes = await server.post("/api/tasks.create", {
        body: {
          token: user.getJwtToken(),
          title: "Test Task",
        },
      });
      const createBody = await createRes.json();

      // Assign first
      await server.post("/api/tasks.assign", {
        body: {
          token: user.getJwtToken(),
          id: createBody.data.id,
        },
      });

      // Then unassign
      const res = await server.post("/api/tasks.unassign", {
        body: {
          token: user.getJwtToken(),
          id: createBody.data.id,
        },
      });
      const body = await res.json();

      expect(res.status).toEqual(200);
      expect(body.ok).toEqual(true);
      expect(body.data.deleted).toEqual(true);
      expect(body.data.taskId).toEqual(createBody.data.id);
      expect(body.data.userId).toEqual(user.id);
    });

    it("should unassign current user from task when explicitly specified", async () => {
      const team = await buildTeam();
      const user = await buildUser({ teamId: team.id });

      // Create task
      const createRes = await server.post("/api/tasks.create", {
        body: {
          token: user.getJwtToken(),
          title: "Test Task",
        },
      });
      const createBody = await createRes.json();

      // Assign first
      await server.post("/api/tasks.assign", {
        body: {
          token: user.getJwtToken(),
          id: createBody.data.id,
        },
      });

      // Then unassign explicitly
      const res = await server.post("/api/tasks.unassign", {
        body: {
          token: user.getJwtToken(),
          id: createBody.data.id,
          userId: user.id,
        },
      });
      const body = await res.json();

      expect(res.status).toEqual(200);
      expect(body.ok).toEqual(true);
      expect(body.data.deleted).toEqual(true);
    });

    it("should prevent non-creator/non-admin from unassigning other users", async () => {
      const team = await buildTeam();
      const taskCreator = await buildUser({ teamId: team.id });
      const user1 = await buildUser({ teamId: team.id });
      const user2 = await buildUser({ teamId: team.id });

      // Create task and assign user1 as task creator
      const createRes = await server.post("/api/tasks.create", {
        body: {
          token: taskCreator.getJwtToken(),
          title: "Test Task",
        },
      });
      const createBody = await createRes.json();

      await server.post("/api/tasks.assign", {
        body: {
          token: taskCreator.getJwtToken(),
          id: createBody.data.id,
          userId: user1.id,
        },
      });

      // Try to unassign user1 as user2 (neither creator nor admin)
      const res = await server.post("/api/tasks.unassign", {
        body: {
          token: user2.getJwtToken(),
          id: createBody.data.id,
          userId: user1.id,
        },
      });
      const body = await res.json();

      expect(res.status).toEqual(403);
      expect(body.ok).toEqual(false);
      expect(body.error).toEqual(
        "Only task creator or administrators can unassign tasks from other users"
      );
    });

    it("should allow task creator to unassign other users", async () => {
      const team = await buildTeam();
      const taskCreator = await buildUser({ teamId: team.id });
      const user = await buildUser({ teamId: team.id });

      // Create task and assign user as task creator
      const createRes = await server.post("/api/tasks.create", {
        body: {
          token: taskCreator.getJwtToken(),
          title: "Test Task",
        },
      });
      const createBody = await createRes.json();

      await server.post("/api/tasks.assign", {
        body: {
          token: taskCreator.getJwtToken(),
          id: createBody.data.id,
          userId: user.id,
        },
      });

      // Unassign as task creator
      const res = await server.post("/api/tasks.unassign", {
        body: {
          token: taskCreator.getJwtToken(),
          id: createBody.data.id,
          userId: user.id,
        },
      });
      const body = await res.json();

      expect(res.status).toEqual(200);
      expect(body.ok).toEqual(true);
      expect(body.data.deleted).toEqual(true);
    });

    it("should allow admin to unassign other users", async () => {
      const team = await buildTeam();
      const admin = await buildUser({ teamId: team.id, role: "admin" });
      const taskCreator = await buildUser({ teamId: team.id });
      const user = await buildUser({ teamId: team.id });

      // Create task as taskCreator and assign user
      const createRes = await server.post("/api/tasks.create", {
        body: {
          token: taskCreator.getJwtToken(),
          title: "Test Task",
        },
      });
      const createBody = await createRes.json();

      await server.post("/api/tasks.assign", {
        body: {
          token: taskCreator.getJwtToken(),
          id: createBody.data.id,
          userId: user.id,
        },
      });

      // Unassign as admin
      const res = await server.post("/api/tasks.unassign", {
        body: {
          token: admin.getJwtToken(),
          id: createBody.data.id,
          userId: user.id,
        },
      });
      const body = await res.json();

      expect(res.status).toEqual(200);
      expect(body.ok).toEqual(true);
      expect(body.data.deleted).toEqual(true);
    });

    it("should return 404 for non-existent assignment", async () => {
      const team = await buildTeam();
      const user = await buildUser({ teamId: team.id });

      // Create task but don't assign
      const createRes = await server.post("/api/tasks.create", {
        body: {
          token: user.getJwtToken(),
          title: "Test Task",
        },
      });
      const createBody = await createRes.json();

      // Try to unassign (no assignment exists)
      const res = await server.post("/api/tasks.unassign", {
        body: {
          token: user.getJwtToken(),
          id: createBody.data.id,
        },
      });
      const body = await res.json();

      expect(res.status).toEqual(404);
      expect(body.ok).toEqual(false);
      expect(body.error).toEqual("Assignment not found");
    });

    it("should return 404 for non-existent task", async () => {
      const team = await buildTeam();
      const user = await buildUser({ teamId: team.id });

      const res = await server.post("/api/tasks.unassign", {
        body: {
          token: user.getJwtToken(),
          id: "00000000-0000-4000-8000-000000000000",
        },
      });
      const body = await res.json();

      expect(res.status).toEqual(404);
      expect(body.error).toEqual("Task not found");
    });

    it("should return 404 for task from different team", async () => {
      const team1 = await buildTeam();
      const team2 = await buildTeam();
      const user1 = await buildUser({ teamId: team1.id });
      const user2 = await buildUser({ teamId: team2.id });

      // Create task in team1
      const createRes = await server.post("/api/tasks.create", {
        body: {
          token: user1.getJwtToken(),
          title: "Team 1 Task",
        },
      });
      const createBody = await createRes.json();

      // Try to unassign from team2
      const res = await server.post("/api/tasks.unassign", {
        body: {
          token: user2.getJwtToken(),
          id: createBody.data.id,
        },
      });
      const body = await res.json();

      expect(res.status).toEqual(404);
      expect(body.error).toEqual("Task not found");
    });

    it("should reproduce assignment failure when findByPk fails", async () => {
      const team = await buildTeam();
      const user = await buildUser({ teamId: team.id });

      // Create task
      const createRes = await server.post("/api/tasks.create", {
        body: {
          token: user.getJwtToken(),
          title: "Test Task",
        },
      });
      const createBody = await createRes.json();

      // Try to assign to self - this should succeed normally
      const res = await server.post("/api/tasks.assign", {
        body: {
          token: user.getJwtToken(),
          id: createBody.data.id,
          userId: user.id, // Explicitly provide userId
        },
      });
      const body = await res.json();

      if (res.status === 400) {
        // This test is meant to check if assignment works properly
      }

      // This test should pass, but let's see if we can trigger the failure
      expect(res.status).toEqual(200);
      expect(body.ok).toEqual(true);
      expect(body.data.user).toBeDefined();
      expect(body.data.assignedBy).toBeDefined();
      expect(body.data.user.id).toEqual(user.id);
      expect(body.data.assignedBy.id).toEqual(user.id);
    });
  });
});
