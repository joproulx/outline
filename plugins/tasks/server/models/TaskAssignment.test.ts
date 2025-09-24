import {
  buildUser,
  buildTaskItem,
  buildTaskAssignment,
} from "@server/test/factories";
import TaskAssignment from "./TaskAssignment";

// Import the plugin to ensure models are registered
import "../index";

describe("TaskAssignment model", () => {
  describe("creation", () => {
    it("should create a task assignment with required fields", async () => {
      const task = await buildTaskItem();
      const user = await buildUser({ teamId: task.teamId });
      const assignedBy = await buildUser({ teamId: task.teamId });
      const assignedAt = new Date();

      const assignment = await TaskAssignment.create({
        taskId: task.id,
        userId: user.id,
        assignedById: assignedBy.id,
        assignedAt: assignedAt,
      });

      expect(assignment.taskId).toEqual(task.id);
      expect(assignment.userId).toEqual(user.id);
      expect(assignment.assignedById).toEqual(assignedBy.id);
      expect(assignment.assignedAt).toEqual(assignedAt);
      expect(assignment.id).toBeDefined();
      expect(assignment.createdAt).toBeDefined();
    });

    it("should use factory builder", async () => {
      const task = await buildTaskItem();
      const user = await buildUser({ teamId: task.teamId });

      const assignment = await buildTaskAssignment({
        taskId: task.id,
        userId: user.id,
      });

      expect(assignment.taskId).toEqual(task.id);
      expect(assignment.userId).toEqual(user.id);
      expect(assignment.assignedById).toBeDefined();
      expect(assignment.assignedAt).toBeDefined();
    });
  });

  describe("validation", () => {
    it("should require taskId", async () => {
      const user = await buildUser();
      const assignedBy = await buildUser();

      await expect(
        TaskAssignment.create({
          userId: user.id,
          assignedById: assignedBy.id,
          assignedAt: new Date(),
          // Missing taskId
        })
      ).rejects.toThrow();
    });

    it("should require userId", async () => {
      const task = await buildTaskItem();
      const assignedBy = await buildUser({ teamId: task.teamId });

      await expect(
        TaskAssignment.create({
          taskId: task.id,
          assignedById: assignedBy.id,
          assignedAt: new Date(),
          // Missing userId
        })
      ).rejects.toThrow();
    });

    it("should require assignedById", async () => {
      const task = await buildTaskItem();
      const user = await buildUser({ teamId: task.teamId });

      await expect(
        TaskAssignment.create({
          taskId: task.id,
          userId: user.id,
          assignedAt: new Date(),
          // Missing assignedById
        })
      ).rejects.toThrow();
    });
  });

  describe("associations", () => {
    it("should belong to a task item", async () => {
      const assignment = await buildTaskAssignment();
      const taskItem = await assignment.$get("taskItem");

      expect(taskItem).toBeDefined();
      expect(taskItem.id).toEqual(assignment.taskId);
    });

    it("should belong to a user (assignee)", async () => {
      const assignment = await buildTaskAssignment();
      const user = await assignment.$get("user");

      expect(user).toBeDefined();
      expect(user.id).toEqual(assignment.userId);
    });

    it("should belong to a user (assigned by)", async () => {
      const assignment = await buildTaskAssignment();
      const assignedBy = await assignment.$get("assignedBy");

      expect(assignedBy).toBeDefined();
      expect(assignedBy.id).toEqual(assignment.assignedById);
    });
  });

  describe("soft delete (paranoid)", () => {
    it("should soft delete by default", async () => {
      const assignment = await buildTaskAssignment();
      const assignmentId = assignment.id;

      await assignment.destroy();

      // Should not be found in regular query
      const foundAssignment = await TaskAssignment.findByPk(assignmentId);
      expect(foundAssignment).toBeNull();

      // Should be found in paranoid query
      const deletedAssignment = await TaskAssignment.findByPk(assignmentId, {
        paranoid: false,
      });
      expect(deletedAssignment).toBeDefined();
      expect(deletedAssignment.deletedAt).toBeDefined();
    });

    it("should restore soft deleted assignment", async () => {
      const assignment = await buildTaskAssignment();
      const assignmentId = assignment.id;

      await assignment.destroy();
      await assignment.restore();

      const restoredAssignment = await TaskAssignment.findByPk(assignmentId);
      expect(restoredAssignment).toBeDefined();
      expect(restoredAssignment.deletedAt).toBeNull();
    });
  });

  describe("scopes", () => {
    it("should include user and assignedBy in default scope", async () => {
      const assignment = await buildTaskAssignment();
      const assignmentWithIncludes = await TaskAssignment.findByPk(
        assignment.id
      );

      expect(assignmentWithIncludes.user).toBeDefined();
      expect(assignmentWithIncludes.assignedBy).toBeDefined();
      expect(assignmentWithIncludes.user.id).toEqual(assignment.userId);
      expect(assignmentWithIncludes.assignedBy.id).toEqual(
        assignment.assignedById
      );
    });
  });

  describe("unique constraints", () => {
    it("should prevent duplicate assignments", async () => {
      const task = await buildTaskItem();
      const user = await buildUser({ teamId: task.teamId });
      const assignedBy = await buildUser({ teamId: task.teamId });

      // Create first assignment
      await TaskAssignment.create({
        taskId: task.id,
        userId: user.id,
        assignedById: assignedBy.id,
        assignedAt: new Date(),
      });

      // Try to create duplicate assignment
      await expect(
        TaskAssignment.create({
          taskId: task.id,
          userId: user.id,
          assignedById: assignedBy.id,
          assignedAt: new Date(),
        })
      ).rejects.toThrow();
    });
  });

  describe("timestamps", () => {
    it("should automatically set createdAt and updatedAt", async () => {
      const assignment = await buildTaskAssignment();

      expect(assignment.createdAt).toBeDefined();
      expect(assignment.updatedAt).toBeDefined();
      expect(assignment.createdAt).toEqual(assignment.updatedAt);
    });

    it("should update updatedAt on changes", async () => {
      const assignment = await buildTaskAssignment();
      const originalUpdatedAt = assignment.updatedAt;

      // Wait a bit to ensure timestamp difference
      await new Promise((resolve) => setTimeout(resolve, 10));

      assignment.assignedAt = new Date();
      await assignment.save();

      expect(assignment.updatedAt).not.toEqual(originalUpdatedAt);
      expect(assignment.updatedAt > originalUpdatedAt).toBe(true);
    });
  });

  describe("cascade operations", () => {
    it("should delete assignments when task is deleted", async () => {
      const task = await buildTaskItem();
      const assignment = await buildTaskAssignment({ taskId: task.id });
      const assignmentId = assignment.id;

      await task.destroy();

      // Assignment should also be soft deleted
      const foundAssignment = await TaskAssignment.findByPk(assignmentId);
      expect(foundAssignment).toBeNull();
    });
  });

  describe("queries", () => {
    it("should find assignments by task", async () => {
      const task = await buildTaskItem();
      const user1 = await buildUser({ teamId: task.teamId });
      const user2 = await buildUser({ teamId: task.teamId });

      const assignment1 = await buildTaskAssignment({
        taskId: task.id,
        userId: user1.id,
      });
      const assignment2 = await buildTaskAssignment({
        taskId: task.id,
        userId: user2.id,
      });

      const assignments = await TaskAssignment.findAll({
        where: { taskId: task.id },
      });

      expect(assignments.length).toEqual(2);
      expect(assignments.map((a) => a.id)).toContain(assignment1.id);
      expect(assignments.map((a) => a.id)).toContain(assignment2.id);
    });

    it("should find assignments by user", async () => {
      const user = await buildUser();
      const task1 = await buildTaskItem({ teamId: user.teamId });
      const task2 = await buildTaskItem({ teamId: user.teamId });

      const assignment1 = await buildTaskAssignment({
        taskId: task1.id,
        userId: user.id,
      });
      const assignment2 = await buildTaskAssignment({
        taskId: task2.id,
        userId: user.id,
      });

      const assignments = await TaskAssignment.findAll({
        where: { userId: user.id },
      });

      expect(assignments.length).toEqual(2);
      expect(assignments.map((a) => a.id)).toContain(assignment1.id);
      expect(assignments.map((a) => a.id)).toContain(assignment2.id);
    });
  });
});
