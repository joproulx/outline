import Task from "./Task";

// Mock store for Task
const mockStore = {
  add: jest.fn(),
  remove: jest.fn(),
};

describe("Task model", () => {
  describe("Assignment properties", () => {
    it("correctly reports isAssigned when task has assignees", () => {
      const task = new Task(
        {
          id: "task-1",
          title: "Test Task",
          assigneeCount: 2,
          assignees: [
            { id: "user-1", name: "User One", email: "user1@example.com" },
            { id: "user-2", name: "User Two", email: "user2@example.com" },
          ],
          assignments: [],
        },
        mockStore as never
      );

      expect(task.isAssigned).toBe(true);
    });

    it("correctly reports isAssigned when task has no assignees", () => {
      const task = new Task(
        {
          id: "task-1",
          title: "Test Task",
          assigneeCount: 0,
          assignees: [],
          assignments: [],
        },
        mockStore as never
      );

      expect(task.isAssigned).toBe(false);
    });

    it("returns correct assignment summary for unassigned task", () => {
      const task = new Task(
        {
          id: "task-1",
          title: "Test Task",
          assigneeCount: 0,
          assignees: [],
          assignments: [],
        },
        mockStore as never
      );

      expect(task.assignmentSummary).toBe("Unassigned");
    });

    it("returns correct assignment summary for task with one assignee", () => {
      const task = new Task(
        {
          id: "task-1",
          title: "Test Task",
          assigneeCount: 1,
          assignees: [
            { id: "user-1", name: "User One", email: "user1@example.com" },
          ],
          assignments: [],
        },
        mockStore as never
      );

      expect(task.assignmentSummary).toBe("Assigned to User One");
    });

    it("returns correct assignment summary for task with multiple assignees", () => {
      const task = new Task(
        {
          id: "task-1",
          title: "Test Task",
          assigneeCount: 3,
          assignees: [
            { id: "user-1", name: "User One", email: "user1@example.com" },
            { id: "user-2", name: "User Two", email: "user2@example.com" },
            { id: "user-3", name: "User Three", email: "user3@example.com" },
          ],
          assignments: [],
        },
        mockStore as never
      );

      expect(task.assignmentSummary).toBe("Assigned to 3 people");
    });

    it("returns correct assignee names", () => {
      const task = new Task(
        {
          id: "task-1",
          title: "Test Task",
          assigneeCount: 2,
          assignees: [
            { id: "user-1", name: "User One", email: "user1@example.com" },
            { id: "user-2", name: "User Two", email: "user2@example.com" },
          ],
          assignments: [],
        },
        mockStore as never
      );

      expect(task.assigneeNames).toEqual(["User One", "User Two"]);
    });

    it("returns empty array for assignee names when no assignees", () => {
      const task = new Task(
        {
          id: "task-1",
          title: "Test Task",
          assigneeCount: 0,
          assignees: [],
          assignments: [],
        },
        mockStore as never
      );

      expect(task.assigneeNames).toEqual([]);
    });

    it("initializes with default assignment values", () => {
      const task = new Task(
        {
          id: "task-1",
          title: "Test Task",
        },
        mockStore as never
      );

      expect(task.assigneeCount).toBe(0);
      expect(task.assignees).toEqual([]);
      expect(task.assignments).toEqual([]);
      expect(task.isAssigned).toBe(false);
      expect(task.assignmentSummary).toBe("Unassigned");
    });
  });

  describe("Existing functionality", () => {
    it("correctly calculates isOverdue for past due date", () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      const task = new Task(
        {
          id: "task-1",
          title: "Test Task",
          dueDate: yesterday.toISOString(),
        },
        mockStore as never
      );

      expect(task.isOverdue).toBe(true);
    });

    it("correctly calculates isDueToday for today's date", () => {
      const today = new Date();
      const todayStr =
        today.getFullYear() +
        "-" +
        String(today.getMonth() + 1).padStart(2, "0") +
        "-" +
        String(today.getDate()).padStart(2, "0");

      const task = new Task(
        {
          id: "task-1",
          title: "Test Task",
          dueDate: todayStr + "T00:00:00.000Z",
        },
        mockStore as never
      );

      expect(task.isDueToday).toBe(true);
    });

    it("returns correct priority color", () => {
      const highTask = new Task(
        { id: "1", title: "High", priority: "high" },
        mockStore as never
      );
      const mediumTask = new Task(
        { id: "2", title: "Medium", priority: "medium" },
        mockStore as never
      );
      const lowTask = new Task(
        { id: "3", title: "Low", priority: "low" },
        mockStore as never
      );
      const noneTask = new Task(
        { id: "4", title: "None", priority: "none" },
        mockStore as never
      );

      expect(highTask.priorityColor).toBe("#e74c3c");
      expect(mediumTask.priorityColor).toBe("#f39c12");
      expect(lowTask.priorityColor).toBe("#3498db");
      expect(noneTask.priorityColor).toBe("#95a5a6");
    });

    it("formats due date correctly", () => {
      const today = new Date();
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      const todayTask = new Task(
        {
          id: "1",
          title: "Today",
          dueDate:
            today.getFullYear() +
            "-" +
            String(today.getMonth() + 1).padStart(2, "0") +
            "-" +
            String(today.getDate()).padStart(2, "0") +
            "T00:00:00.000Z",
        },
        mockStore as never
      );

      const tomorrowTask = new Task(
        {
          id: "2",
          title: "Tomorrow",
          dueDate:
            tomorrow.getFullYear() +
            "-" +
            String(tomorrow.getMonth() + 1).padStart(2, "0") +
            "-" +
            String(tomorrow.getDate()).padStart(2, "0") +
            "T00:00:00.000Z",
        },
        mockStore as never
      );

      expect(todayTask.formattedDueDate).toBe("Today");
      expect(tomorrowTask.formattedDueDate).toBe("Tomorrow");
    });
  });
});
