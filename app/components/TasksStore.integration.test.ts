// Mock the API client - needs to be hoisted
jest.mock("~/utils/ApiClient", () => ({
  client: {
    post: jest.fn(),
    get: jest.fn(),
  },
}));

import TasksStore from "~/stores/TasksStore";
import RootStore from "~/stores/RootStore";
import { client } from "~/utils/ApiClient";

const mockApiClient = client as jest.Mocked<typeof client>;

// Create a simple functional test of the TasksStore
describe("TasksStore Integration", () => {
  let tasksStore: TasksStore;
  let rootStore: RootStore;

  beforeEach(() => {
    jest.clearAllMocks();
    rootStore = new RootStore();
    tasksStore = new TasksStore(rootStore);

    // Mock successful API response - FIXED to match real API format
    mockApiClient.post.mockImplementation((endpoint, data) => {
      if (endpoint === "/tasks.create") {
        const taskData = data as unknown as {
          title?: string;
          description?: string;
          priority?: string;
          dueDate?: string;
          tags?: string[];
        };
        const mockResponse = {
          ok: true,
          data: {
            id: "new-task-123",
            title: taskData?.title || "Default Title",
            description: taskData?.description || "",
            priority: taskData?.priority || "medium",
            dueDate: taskData?.dueDate || null,
            tags: taskData?.tags || [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            createdById: "user-123",
            assigneeCount: 0,
            assignees: [],
            assignments: [],
          },
        };

        return Promise.resolve(mockResponse);
      }

      // ADDED: Mock for tasks.list to match real API format
      if (endpoint === "/tasks.list") {
        const mockTasks = [
          {
            id: "task-1",
            title: "Existing Task 1",
            description: "Description 1",
            priority: "high",
            dueDate: null,
            tags: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            createdById: "user-123",
            assigneeCount: 0,
            assignees: [],
            assignments: [],
          },
          {
            id: "task-2",
            title: "Existing Task 2",
            description: "Description 2",
            priority: "low",
            dueDate: null,
            tags: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            createdById: "user-123",
            assigneeCount: 1,
            assignees: [
              { id: "user-456", name: "Test User", email: "test@example.com" },
            ],
            assignments: [],
          },
        ];

        // Real API format: data is directly the array, not nested
        const mockResponse = {
          ok: true,
          data: mockTasks, // This matches the real API response format
        };

        return Promise.resolve(mockResponse);
      }

      return Promise.reject(new Error("Unknown endpoint"));
    });
  });

  test("should add task to store when create is called", async () => {
    // Initial state - no tasks
    expect(tasksStore.all.length).toBe(0);

    // Create a task
    const taskData = {
      title: "Test Task",
      description: "Test description",
      priority: "medium" as const,
      dueDate: undefined,
      tags: ["test"],
    };

    const createdTask = await tasksStore.create(taskData);

    // Verify the task was added to the store
    expect(tasksStore.all.length).toBe(1);
    expect(createdTask.id).toBe("new-task-123");
    expect(createdTask.title).toBe("Test Task");
    expect(createdTask.description).toBe("Test description");
    expect(createdTask.priority).toBe("medium");

    // Verify the task is in the store's all array
    const taskInStore = tasksStore.all.find((t) => t.id === "new-task-123");
    expect(taskInStore).toBeDefined();
    expect(taskInStore?.title).toBe("Test Task");
  });

  test("should handle create API errors", async () => {
    // Mock API error
    mockApiClient.post.mockRejectedValueOnce(new Error("API Error"));

    const initialCount = tasksStore.all.length;

    const taskData = {
      title: "Test Task",
      description: "Test description",
      priority: "medium" as const,
    };

    await expect(tasksStore.create(taskData)).rejects.toThrow(
      "Failed to create task"
    );

    // Store should remain unchanged
    expect(tasksStore.all.length).toBe(initialCount);
  });

  test("should properly filter tasks", async () => {
    // Create tasks using the store's create method (which should populate the store properly)
    const task1Data = {
      title: "Assigned Task",
      description: "Description 1",
      priority: "high" as const,
    };

    const task2Data = {
      title: "Unassigned Task",
      description: "Description 2",
      priority: "low" as const,
    };

    // Mock different responses for each create call
    let callCount = 0;
    mockApiClient.post.mockImplementation((endpoint, data) => {
      if (endpoint === "/tasks.create") {
        callCount++;
        const taskData = data as unknown as {
          title?: string;
          description?: string;
          priority?: string;
          dueDate?: string;
          tags?: string[];
        };
        const mockResponse = {
          ok: true,
          data: {
            id: `task-${callCount}`,
            title: taskData?.title || "Default Title",
            description: taskData?.description || "",
            priority: taskData?.priority || "medium",
            dueDate: taskData?.dueDate || null,
            tags: taskData?.tags || [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            createdById: "user-123",
            assigneeCount: callCount === 1 ? 1 : 0,
            assignees:
              callCount === 1
                ? [
                    {
                      id: "user-123",
                      name: "Test User",
                      email: "test@example.com",
                    },
                  ]
                : [],
            assignments: [],
          },
        };

        return Promise.resolve(mockResponse);
      }
      return Promise.reject(new Error("Unknown endpoint"));
    });

    await tasksStore.create(task1Data);
    await tasksStore.create(task2Data);

    // Test filtering
    expect(tasksStore.all.length).toBe(2);
    expect(tasksStore.assigned.length).toBe(1);
    expect(tasksStore.unassigned.length).toBe(1);
    expect(tasksStore.assigned[0].id).toBe("task-1");
    expect(tasksStore.unassigned[0].id).toBe("task-2");
  });

  test("should fetch and load existing tasks on fetchPage", async () => {
    // Initial state - no tasks
    expect(tasksStore.all.length).toBe(0);
    expect(tasksStore.isLoaded).toBe(false);

    // Call fetchPage (simulates page refresh scenario)
    const fetchedTasks = await tasksStore.fetchPage();

    // Verify the tasks were loaded correctly
    expect(tasksStore.all.length).toBe(2);
    expect(tasksStore.isLoaded).toBe(true);
    expect(fetchedTasks.length).toBe(2);

    // Verify task content
    const task1 = tasksStore.all.find((t) => t.id === "task-1");
    const task2 = tasksStore.all.find((t) => t.id === "task-2");

    expect(task1).toBeDefined();
    expect(task1?.title).toBe("Existing Task 1");
    expect(task1?.assigneeCount).toBe(0);

    expect(task2).toBeDefined();
    expect(task2?.title).toBe("Existing Task 2");
    expect(task2?.assigneeCount).toBe(1);

    // Verify filtering works with fetched tasks
    expect(tasksStore.assigned.length).toBe(1);
    expect(tasksStore.unassigned.length).toBe(1);
    expect(tasksStore.assigned[0].id).toBe("task-2");
    expect(tasksStore.unassigned[0].id).toBe("task-1");
  });

  test("should handle fetchPage API errors gracefully", async () => {
    // Mock API error for tasks.list
    mockApiClient.post.mockImplementation((endpoint) => {
      if (endpoint === "/tasks.list") {
        return Promise.reject(new Error("Network error"));
      }
      return Promise.reject(new Error("Unknown endpoint"));
    });

    const initialCount = tasksStore.all.length;

    // fetchPage should not throw, but return empty array
    const result = await tasksStore.fetchPage();

    expect(result).toEqual([]);
    expect(tasksStore.all.length).toBe(initialCount);
    expect(tasksStore.isFetching).toBe(false);
  });
});
