import "../stores"; // Import stores before components
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { TFunction } from "i18next";
import { Provider } from "mobx-react";
import { getI18n } from "react-i18next";
import Task from "~/models/Task";

// Mock problematic components
jest.mock("~/components/Avatar", () => ({
  Avatar: function Avatar({ model, ...props }: unknown) {
    const typedModel = model as { name: string; id: string };
    return (
      <div
        data-testid={`avatar-${typedModel.id}`}
        {...(props as Record<string, unknown>)}
      >
        {typedModel.name.charAt(0)}
      </div>
    );
  },
  AvatarSize: {
    Small: 16,
    Medium: 24,
    Large: 28,
  },
}));

jest.mock(
  "~/components/Facepile",
  () =>
    function Facepile({ users, ...props }: unknown) {
      const typedUsers = users as Array<{ name: string; id: string }>;
      return (
        <div data-testid="facepile" {...(props as Record<string, unknown>)}>
          {typedUsers?.map((user) => (
            <span key={user.id} data-testid={`facepile-user-${user.id}`}>
              {user.name}
            </span>
          ))}
        </div>
      );
    }
);

jest.mock(
  "~/components/Button",
  () =>
    function Button({ children, onClick, disabled, icon, ...props }: unknown) {
      return (
        <button
          onClick={onClick as () => void}
          disabled={disabled as boolean}
          data-testid={props.testId as string}
          {...(props as Record<string, unknown>)}
        >
          {icon && (
            <span data-testid="icon">
              {typeof icon === "object" ? "icon" : icon}
            </span>
          )}
          {children as React.ReactNode}
        </button>
      );
    }
);

jest.mock(
  "~/components/Text",
  () =>
    function Text({ children, ...props }: unknown) {
      return (
        <span {...(props as Record<string, unknown>)}>
          {children as React.ReactNode}
        </span>
      );
    }
);

jest.mock(
  "~/components/Flex",
  () =>
    function Flex({ children, ...props }: unknown) {
      return (
        <div {...(props as Record<string, unknown>)}>
          {children as React.ReactNode}
        </div>
      );
    }
);

jest.mock(
  "~/components/Tooltip",
  () =>
    function Tooltip({ children, tooltip, ...props }: unknown) {
      return (
        <div title={tooltip as string} {...(props as Record<string, unknown>)}>
          {children as React.ReactNode}
        </div>
      );
    }
);

jest.mock("~/hooks/useCurrentUser", () => () => ({
  id: "current-user-id",
  name: "Current User",
  email: "current@example.com",
}));

import TaskAssignmentUI from "./TaskAssignmentUI";

// Mock stores
const mockTasksStore = {
  assign: jest.fn(() => Promise.resolve()),
  unassign: jest.fn(() => Promise.resolve()),
};

const mockUsersStore = {};

const mockStores = {
  tasks: mockTasksStore,
  users: mockUsersStore,
};

describe("TaskAssignmentUI", () => {
  const i18n = getI18n();
  const authStore = {};

  const props = {
    i18n,
    tReady: true,
    t: ((key: string) => key) as TFunction,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Compact Mode", () => {
    it("shows 'Unassigned' when no assignees", () => {
      const mockTask = new Task(
        {
          id: "task-1",
          title: "Test Task",
          assigneeCount: 0,
          assignees: [],
          assignments: [],
        },
        mockTasksStore as never
      );

      render(
        <Provider auth={authStore} {...mockStores}>
          <TaskAssignmentUI
            task={mockTask}
            compact={true}
            showControls={false}
            {...props}
          />
        </Provider>
      );

      expect(screen.getByText("Unassigned")).toBeDefined();
    });

    it("shows Facepile when there are assignees", () => {
      const mockTask = new Task(
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
        mockTasksStore as never
      );

      render(
        <Provider auth={authStore} {...mockStores}>
          <TaskAssignmentUI
            task={mockTask}
            compact={true}
            showControls={false}
            {...props}
          />
        </Provider>
      );

      expect(screen.getByTestId("facepile")).toBeDefined();
      expect(screen.getByTestId("facepile-user-user-1")).toBeDefined();
      expect(screen.getByTestId("facepile-user-user-2")).toBeDefined();
    });
  });

  describe("Full Mode", () => {
    it("shows assignment summary", () => {
      const mockTask = new Task(
        {
          id: "task-1",
          title: "Test Task",
          assigneeCount: 1,
          assignees: [
            { id: "user-1", name: "User One", email: "user1@example.com" },
          ],
          assignments: [],
        },
        mockTasksStore as never
      );

      render(
        <Provider auth={authStore} {...mockStores}>
          <TaskAssignmentUI
            task={mockTask}
            compact={false}
            showControls={true}
            {...props}
          />
        </Provider>
      );

      expect(screen.getByText("Assigned to User One")).toBeDefined();
    });

    it("shows 'Assign to me' button when not assigned", () => {
      const mockTask = new Task(
        {
          id: "task-1",
          title: "Test Task",
          assigneeCount: 0,
          assignees: [],
          assignments: [],
        },
        mockTasksStore as never
      );

      render(
        <Provider auth={authStore} {...mockStores}>
          <TaskAssignmentUI
            task={mockTask}
            compact={false}
            showControls={true}
            {...props}
          />
        </Provider>
      );

      expect(screen.getByText("Assign to me")).toBeDefined();
    });

    it("shows 'Unassign me' button when assigned to current user", () => {
      const mockTask = new Task(
        {
          id: "task-1",
          title: "Test Task",
          assigneeCount: 1,
          assignees: [
            {
              id: "current-user-id",
              name: "Current User",
              email: "current@example.com",
            },
          ],
          assignments: [],
        },
        mockTasksStore as never
      );

      render(
        <Provider auth={authStore} {...mockStores}>
          <TaskAssignmentUI
            task={mockTask}
            compact={false}
            showControls={true}
            {...props}
          />
        </Provider>
      );

      expect(screen.getByText("Unassign me")).toBeDefined();
    });

    it("calls assign when 'Assign to me' is clicked", async () => {
      const mockTask = new Task(
        {
          id: "task-1",
          title: "Test Task",
          assigneeCount: 0,
          assignees: [],
          assignments: [],
        },
        mockTasksStore as never
      );

      render(
        <Provider auth={authStore} {...mockStores}>
          <TaskAssignmentUI
            task={mockTask}
            compact={false}
            showControls={true}
            {...props}
          />
        </Provider>
      );

      const assignButton = screen.getByText("Assign to me");
      fireEvent.click(assignButton);

      await waitFor(() => {
        expect(mockTasksStore.assign).toHaveBeenCalledWith(
          mockTask,
          "current-user-id"
        );
      });
    });

    it("calls unassign when 'Unassign me' is clicked", async () => {
      const mockTask = new Task(
        {
          id: "task-1",
          title: "Test Task",
          assigneeCount: 1,
          assignees: [
            {
              id: "current-user-id",
              name: "Current User",
              email: "current@example.com",
            },
          ],
          assignments: [],
        },
        mockTasksStore as never
      );

      render(
        <Provider auth={authStore} {...mockStores}>
          <TaskAssignmentUI
            task={mockTask}
            compact={false}
            showControls={true}
            {...props}
          />
        </Provider>
      );

      const unassignButton = screen.getByText("Unassign me");
      fireEvent.click(unassignButton);

      await waitFor(() => {
        expect(mockTasksStore.unassign).toHaveBeenCalledWith(
          mockTask,
          "current-user-id"
        );
      });
    });

    it("shows assignee list with avatars and names", () => {
      const mockTask = new Task(
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
        mockTasksStore as never
      );

      render(
        <Provider auth={authStore} {...mockStores}>
          <TaskAssignmentUI
            task={mockTask}
            compact={false}
            showControls={true}
            {...props}
          />
        </Provider>
      );

      expect(screen.getByTestId("avatar-user-1")).toBeDefined();
      expect(screen.getByTestId("avatar-user-2")).toBeDefined();
      expect(screen.getByText("User One")).toBeDefined();
      expect(screen.getByText("User Two")).toBeDefined();
      expect(screen.getByText("user1@example.com")).toBeDefined();
      expect(screen.getByText("user2@example.com")).toBeDefined();
    });

    it("shows remove button for current user assignment", () => {
      const mockTask = new Task(
        {
          id: "task-1",
          title: "Test Task",
          assigneeCount: 2,
          assignees: [
            {
              id: "current-user-id",
              name: "Current User",
              email: "current@example.com",
            },
            { id: "user-2", name: "User Two", email: "user2@example.com" },
          ],
          assignments: [],
        },
        mockTasksStore as never
      );

      render(
        <Provider auth={authStore} {...mockStores}>
          <TaskAssignmentUI
            task={mockTask}
            compact={false}
            showControls={true}
            {...props}
          />
        </Provider>
      );

      // Should show "Unassign me" in main controls since current user is assigned
      expect(screen.getByText("Unassign me")).toBeDefined();
      // Should show Current User in the assignee list
      expect(screen.getByText("Current User")).toBeDefined();
    });

    it("disables buttons while assignment is in progress", async () => {
      const mockTask = new Task(
        {
          id: "task-1",
          title: "Test Task",
          assigneeCount: 0,
          assignees: [],
          assignments: [],
        },
        mockTasksStore as never
      );

      // Mock a slow assign operation
      mockTasksStore.assign.mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 100))
      );

      render(
        <Provider auth={authStore} {...mockStores}>
          <TaskAssignmentUI
            task={mockTask}
            compact={false}
            showControls={true}
            {...props}
          />
        </Provider>
      );

      const assignButton = screen.getByText("Assign to me");
      fireEvent.click(assignButton);

      // Button should be disabled and show loading text
      expect(screen.getByText("Assigning...")).toBeDefined();
      expect(assignButton.disabled).toBe(true);
    });
  });

  describe("Controls Visibility", () => {
    it("hides controls when showControls is false", () => {
      const mockTask = new Task(
        {
          id: "task-1",
          title: "Test Task",
          assigneeCount: 0,
          assignees: [],
          assignments: [],
        },
        mockTasksStore as never
      );

      render(
        <Provider auth={authStore} {...mockStores}>
          <TaskAssignmentUI
            task={mockTask}
            compact={false}
            showControls={false}
            {...props}
          />
        </Provider>
      );

      expect(screen.queryByText("Assign to me")).toBeNull();
    });
  });
});
