import "../stores"; // Import stores before components
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom"; // For custom matchers
import { Provider } from "mobx-react";
import Task from "~/models/Task";
import TasksStore from "~/stores/TasksStore";
import RootStore from "~/stores/RootStore";

// Mock the API client
const mockApiClient = {
  post: jest.fn(),
  get: jest.fn(),
};

jest.mock("~/utils/ApiClient", () => ({
  client: mockApiClient,
}));

// Mock components to avoid complex dependencies
// eslint-disable-next-line arrow-body-style
jest.mock("~/components/TaskForm", () => {
  return function MockTaskForm({
    onSave,
    onCancel,
  }: {
    onSave: (task: Task) => void;
    onCancel: () => void;
  }) {
    return (
      <div data-testid="task-form">
        <button
          data-testid="save-task-button"
          onClick={() => {
            // Import Task inside the function to avoid jest mock issues
            const Task = require("~/models/Task").default;

            // Simulate creating a task
            const newTask = new Task(
              {
                id: "new-task-123",
                title: "New Test Task",
                description: "Test description",
                priority: "medium",
                dueDate: null,
                tags: [],
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                createdById: "user-123",
                assigneeCount: 0,
                assignees: [],
                assignments: [],
              },
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              {} as any
            );
            onSave(newTask);
          }}
        >
          Save Task
        </button>
        <button data-testid="cancel-task-button" onClick={onCancel}>
          Cancel
        </button>
      </div>
    );
  };
});

// eslint-disable-next-line arrow-body-style
jest.mock("~/components/TaskItem", () => {
  return function MockTaskItem({
    task,
    onEdit,
    onDelete,
  }: {
    task: Task;
    onEdit: (task: Task) => void;
    onDelete: (task: Task) => void;
  }) {
    return (
      <div data-testid={`task-item-${task.id}`} className="task-item">
        <span data-testid="task-title">{task.title}</span>
        <span data-testid="task-description">{task.description}</span>
        <button onClick={() => onEdit(task)}>Edit</button>
        <button onClick={() => onDelete(task)}>Delete</button>
      </div>
    );
  };
});

// Create mock stores
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let mockTasksStore: any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let mockRootStore: any;

// Mock the hooks
jest.mock("~/hooks/useStores", () => () => ({
  tasks: mockTasksStore,
}));

jest.mock("~/hooks/useCurrentUser", () => () => ({
  id: "user-123",
  name: "Test User",
  email: "test@example.com",
}));

describe("TaskList Integration Test", () => {
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Create fresh store instances for each test
    mockRootStore = new RootStore();
    mockTasksStore = new TasksStore(mockRootStore);

    // Mock the API responses
    mockApiClient.post.mockImplementation((endpoint, data) => {
      if (endpoint === "/tasks.create") {
        const mockResponse = {
          ok: true,
          data: {
            id: "new-task-123",
            title: data.title,
            description: data.description,
            priority: data.priority,
            dueDate: data.dueDate,
            tags: data.tags || [],
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
      return Promise.reject(new Error("Unknown endpoint"));
    });

    // Mock initial fetch
    mockApiClient.get.mockResolvedValue({
      data: { data: [] }, // Empty list initially
      pagination: { total: 0, limit: 25, offset: 0 },
    });
  });

  const renderTaskList = () => {
    const mockStores = {
      tasks: mockTasksStore,
    };

    const TaskList = require("~/components/TaskList").default;

    return render(
      <Provider {...mockStores}>
        <TaskList />
      </Provider>
    );
  };

  test("should display newly created task in the list", async () => {
    renderTaskList();

    // Initially no tasks should be displayed
    expect(screen.queryByTestId(/task-item-/)).not.toBeInTheDocument();

    // Click the "Add Task" button to show the form
    const addButton = screen.getByText("Add Task");
    fireEvent.click(addButton);

    // The form should be displayed
    await waitFor(() => {
      expect(screen.getByTestId("task-form")).toBeInTheDocument();
    });

    // Get the current task count before creation
    const initialTaskCount = mockTasksStore.all.length;

    // Click save to create the task (this triggers our mock)
    const saveButton = screen.getByTestId("save-task-button");
    fireEvent.click(saveButton);

    // Wait for the task to be created and added to the store
    await waitFor(
      () => {
        const finalTaskCount = mockTasksStore.all.length;
        expect(finalTaskCount).toBe(initialTaskCount + 1);
      },
      { timeout: 3000 }
    );

    // The form should be hidden after successful save
    await waitFor(() => {
      expect(screen.queryByTestId("task-form")).not.toBeInTheDocument();
    });

    // The new task should appear in the list
    await waitFor(
      () => {
        const taskItem = screen.getByTestId("task-item-new-task-123");
        expect(taskItem).toBeInTheDocument();
      },
      { timeout: 3000 }
    );

    // Verify task content
    expect(screen.getByTestId("task-title")).toHaveTextContent("New Test Task");
  });

  test("should handle task creation API errors gracefully", async () => {
    // Mock API to return error
    mockApiClient.post.mockRejectedValueOnce(new Error("API Error"));

    renderTaskList();

    // Click the "Add Task" button to show the form
    const addButton = screen.getByText("Add Task");
    fireEvent.click(addButton);

    // Click save to attempt task creation
    await waitFor(() => {
      expect(screen.getByTestId("task-form")).toBeInTheDocument();
    });

    const initialTaskCount = mockTasksStore.all.length;

    const saveButton = screen.getByTestId("save-task-button");
    fireEvent.click(saveButton);

    // Wait a bit for the API call to complete
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Task count should remain the same (no task added due to error)
    expect(mockTasksStore.all.length).toBe(initialTaskCount);

    // Form should still be visible (since save failed)
    expect(screen.getByTestId("task-form")).toBeInTheDocument();
  });

  test("should filter and display tasks correctly", async () => {
    // Pre-populate store with some tasks
    const task1 = new Task(
      {
        id: "task-1",
        title: "Task 1",
        description: "Description 1",
        priority: "high",
        dueDate: null,
        tags: ["tag1"],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdById: "user-123",
        assigneeCount: 1,
        assignees: [
          { id: "user-123", name: "Test User", email: "test@example.com" },
        ],
        assignments: [],
      },
      mockTasksStore
    );

    const task2 = new Task(
      {
        id: "task-2",
        title: "Task 2",
        description: "Description 2",
        priority: "low",
        dueDate: null,
        tags: ["tag2"],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdById: "user-123",
        assigneeCount: 0,
        assignees: [],
        assignments: [],
      },
      mockTasksStore
    );

    mockTasksStore.add(task1);
    mockTasksStore.add(task2);

    renderTaskList();

    // Both tasks should be displayed initially (all filter)
    expect(screen.getByTestId("task-item-task-1")).toBeInTheDocument();
    expect(screen.getByTestId("task-item-task-2")).toBeInTheDocument();

    // Click on "Assigned" filter - should show only task1
    const assignedButton = screen.getByText(/Assigned/);
    fireEvent.click(assignedButton);

    // Wait for filtering to apply
    await waitFor(() => {
      expect(screen.getByTestId("task-item-task-1")).toBeInTheDocument();
      expect(screen.queryByTestId("task-item-task-2")).not.toBeInTheDocument();
    });
  });
});
