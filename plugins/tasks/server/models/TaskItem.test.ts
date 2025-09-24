import { buildUser, buildTeam, buildTaskItem, buildTaskAssignment } from "@server/test/factories";
import TaskItem, { TaskStatus, TaskPriority } from "./TaskItem";

// Import the plugin to ensure models are registered
import "../index";

describe("TaskItem model", () => {
    describe("creation", () => {
        it("should create a task item with required fields", async () => {
            const team = await buildTeam();
            const user = await buildUser({ teamId: team.id });

            const task = await TaskItem.create({
                title: "Test Task",
                description: "A test task",
                priority: TaskPriority.High,
                deadline: new Date("2025-12-31"),
                tags: ["work", "urgent"],
                createdById: user.id,
                teamId: team.id,
            });

            expect(task.title).toBe("Test Task");
            expect(task.description).toBe("A test task");
            expect(task.status).toBe("pending");
            expect(task.priority).toBe("high");
            expect(task.deadline?.toISOString()).toBe("2025-12-31T00:00:00.000Z");
            expect(task.tags).toEqual(["work", "urgent"]);
            expect(task.teamId).toEqual(team.id);
            expect(task.createdById).toEqual(user.id);
            expect(task.id).toBeDefined();
            expect(task.createdAt).toBeDefined();
        });

        it("should create a task with all optional fields", async () => {
            const team = await buildTeam();
            const user = await buildUser({ teamId: team.id });
            const deadline = new Date("2025-12-31");
            const tags = ["important", "urgent"];

            const task = await TaskItem.create({
                title: "Complete Project",
                description: "Finish the project by year end",
                teamId: team.id,
                createdById: user.id,
                status: TaskStatus.InProgress,
                priority: TaskPriority.High,
                deadline: deadline,
                tags: tags,
            });

            expect(task.title).toEqual("Complete Project");
            expect(task.description).toEqual("Finish the project by year end");
            expect(task.status).toEqual(TaskStatus.InProgress);
            expect(task.priority).toEqual(TaskPriority.High);
            expect(task.deadline).toEqual(deadline);
            expect(task.tags).toEqual(tags);
        });

        it("should use factory builder", async () => {
            const task = await buildTaskItem({
                title: "Factory Task",
                priority: TaskPriority.Low,
            });

            expect(task.title).toEqual("Factory Task");
            expect(task.priority).toEqual(TaskPriority.Low);
            expect(task.id).toBeDefined();
            expect(task.teamId).toBeDefined();
            expect(task.createdById).toBeDefined();
        });
    });

    describe("validation", () => {
        it("should require title", async () => {
            const team = await buildTeam();
            const user = await buildUser({ teamId: team.id });

            await expect(
                TaskItem.create({
                    teamId: team.id,
                    createdById: user.id,
                    status: TaskStatus.Pending,
                    priority: TaskPriority.Medium,
                    // Missing title
                })
            ).rejects.toThrow();
        });

        it("should validate title length", async () => {
            const team = await buildTeam();
            const user = await buildUser({ teamId: team.id });
            const longTitle = "a".repeat(256); // Assuming max length is 255

            await expect(
                TaskItem.create({
                    title: longTitle,
                    teamId: team.id,
                    createdById: user.id,
                    status: TaskStatus.Pending,
                    priority: TaskPriority.Medium,
                })
            ).rejects.toThrow();
        });

        it("should require teamId", async () => {
            const user = await buildUser();

            await expect(
                TaskItem.create({
                    title: "Test Task",
                    createdById: user.id,
                    status: TaskStatus.Pending,
                    priority: TaskPriority.Medium,
                    // Missing teamId
                })
            ).rejects.toThrow();
        });

        it("should require createdById", async () => {
            const team = await buildTeam();

            await expect(
                TaskItem.create({
                    title: "Test Task",
                    teamId: team.id,
                    status: TaskStatus.Pending,
                    priority: TaskPriority.Medium,
                    // Missing createdById
                })
            ).rejects.toThrow();
        });
    });

    describe("status enum", () => {
        it("should accept all valid status values", async () => {
            const team = await buildTeam();
            const user = await buildUser({ teamId: team.id });

            for (const status of Object.values(TaskStatus)) {
                const task = await TaskItem.create({
                    title: `Task with ${status} status`,
                    teamId: team.id,
                    createdById: user.id,
                    status: status,
                    priority: TaskPriority.Medium,
                });

                expect(task.status).toEqual(status);
            }
        });
    });

    describe("priority enum", () => {
        it("should accept all valid priority values", async () => {
            const team = await buildTeam();
            const user = await buildUser({ teamId: team.id });

            for (const priority of Object.values(TaskPriority)) {
                const task = await TaskItem.create({
                    title: `Task with ${priority} priority`,
                    teamId: team.id,
                    createdById: user.id,
                    status: TaskStatus.Pending,
                    priority: priority,
                });

                expect(task.priority).toEqual(priority);
            }
        });
    });

    describe("associations", () => {
        it("should belong to a user (creator)", async () => {
            const task = await buildTaskItem();
            const creator = await task.$get("createdBy");

            expect(creator).toBeDefined();
            expect(creator!.id).toEqual(task.createdById);
        });

        it("should belong to a team", async () => {
            const task = await buildTaskItem();
            const team = await task.$get("team");

            expect(team).toBeDefined();
            expect(team!.id).toEqual(task.teamId);
        });

        it("should have many assignments", async () => {
            const task = await buildTaskItem();
            const user1 = await buildUser({ teamId: task.teamId });
            const user2 = await buildUser({ teamId: task.teamId });

            // Create assignments
            const assignment1 = await buildTaskAssignment({
                taskId: task.id,
                userId: user1.id,
            });
            const assignment2 = await buildTaskAssignment({
                taskId: task.id,
                userId: user2.id,
            });

            const assignments = await task.$get("assignments");

            expect(assignments).toBeDefined();
            expect(assignments.length).toEqual(2);
            expect(assignments.map(a => a.id)).toContain(assignment1.id);
            expect(assignments.map(a => a.id)).toContain(assignment2.id);
        });
    });

    describe("soft delete (paranoid)", () => {
        it("should soft delete by default", async () => {
            const task = await buildTaskItem({ title: "Task to delete" });
            const taskId = task.id;

            await task.destroy();

            // Should not be found in regular query
            const foundTask = await TaskItem.findByPk(taskId);
            expect(foundTask).toBeNull();

            // Should be found in paranoid query
            const deletedTask = await TaskItem.findByPk(taskId, { paranoid: false });
            expect(deletedTask).toBeDefined();
            expect(deletedTask!.deletedAt).toBeDefined();
        });

        it("should restore soft deleted task", async () => {
            const task = await buildTaskItem({ title: "Task to restore" });
            const taskId = task.id;

            await task.destroy();
            await task.restore();

            const restoredTask = await TaskItem.findByPk(taskId);
            expect(restoredTask).toBeDefined();
            expect(restoredTask!.deletedAt).toBeNull();
        });
    });

    describe("scopes", () => {
        it("should include creator and assignments in default scope", async () => {
            const task = await buildTaskItem();

            // Create assignment to test inclusion
            await buildTaskAssignment({ taskId: task.id });

            const taskWithIncludes = await TaskItem.findByPk(task.id);

            expect(taskWithIncludes).toBeDefined();
            expect(taskWithIncludes!.createdBy).toBeDefined();
            expect(taskWithIncludes!.assignments).toBeDefined();
            expect(taskWithIncludes!.assignments.length).toBeGreaterThan(0);
            expect(taskWithIncludes!.assignments[0].user).toBeDefined();
        });
    });

    describe("timestamps", () => {
        it("should automatically set createdAt and updatedAt", async () => {
            const task = await buildTaskItem();

            expect(task.createdAt).toBeDefined();
            expect(task.updatedAt).toBeDefined();
            expect(task.createdAt).toEqual(task.updatedAt);
        });

        it("should update updatedAt on changes", async () => {
            const task = await buildTaskItem();
            const originalUpdatedAt = task.updatedAt;

            // Wait a bit to ensure timestamp difference
            await new Promise(resolve => setTimeout(resolve, 10));

            task.title = "Updated Title";
            await task.save();

            expect(task.updatedAt).not.toEqual(originalUpdatedAt);
            expect(task.updatedAt > originalUpdatedAt).toBe(true);
        });
    });

    describe("JSON fields", () => {
        it("should handle tags as array", async () => {
            const tags = ["urgent", "important", "project"];
            const task = await buildTaskItem({
                tags: tags,
            });

            expect(task.tags).toEqual(tags);
        });

        it("should handle empty tags", async () => {
            const task = await buildTaskItem({ tags: undefined });
            expect(task.tags).toBeNull();

            const taskWithEmptyTags = await buildTaskItem({ tags: [] });
            expect(taskWithEmptyTags.tags).toEqual([]);
        });
    });
});