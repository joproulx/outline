import "../stores"; // Import stores before components
import { render, screen, fireEvent } from "@testing-library/react";
import { TFunction } from "i18next";
import { Provider } from "mobx-react";
import { getI18n } from "react-i18next";
import Task from "~/models/Task";

// Mock problematic components
jest.mock(
  "~/components/Input",
  () =>
    function Input({ value, onChange, placeholder, ...props }: unknown) {
      return (
        <input
          value={value as string}
          onChange={(e) => onChange && (onChange as Function)(e)}
          placeholder={placeholder as string}
          {...(props as Record<string, unknown>)}
        />
      );
    }
);

jest.mock("~/components/InputSelect", () => ({
  InputSelect: function InputSelect({
    value,
    onChange,
    options,
    ...props
  }: unknown) {
    const typedProps = props as Record<string, unknown>;
    const typedOptions = options as Array<{ value: string; label: string }>;
    return (
      <select
        value={value as string}
        onChange={(e) => onChange && (onChange as Function)(e)}
        {...typedProps}
      >
        {typedOptions?.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    );
  },
}));

jest.mock(
  "~/components/Button",
  () =>
    function Button({ children, onClick, ...props }: unknown) {
      return (
        <button
          onClick={onClick as () => void}
          {...(props as Record<string, unknown>)}
        >
          {children as React.ReactNode}
        </button>
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

import TaskItem from "./TaskItem";

// Mock stores
const mockTasksStore = {
  update: jest.fn(() => Promise.resolve()),
  delete: jest.fn(() => Promise.resolve()),
};

const mockStores = {
  tasks: mockTasksStore,
};

describe("TaskItem", () => {
  const i18n = getI18n();
  const authStore = {};

  const props = {
    i18n,
    tReady: true,
    t: ((key: string) => key) as TFunction,
  };

  const mockTask = new Task(
    {
      id: "task-1",
      title: "Test Task",
      description: "Test description",
      priority: "medium",
      dueDate: "2025-12-31T00:00:00.000Z",
      tags: ["test", "important"],
      completed: false,
      createdAt: "2025-01-01T00:00:00.000Z",
      updatedAt: "2025-01-01T00:00:00.000Z",
      createdById: "user-1",
    },
    mockTasksStore as never
  );

  const defaultProps = {
    task: mockTask,
    isEditing: false,
    onEdit: jest.fn(),
    onDelete: jest.fn(),
    onSave: jest.fn(),
    onCancel: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders task in view mode", () => {
    render(
      <Provider auth={authStore} {...mockStores}>
        <TaskItem {...defaultProps} {...props} />
      </Provider>
    );

    expect(screen.getByText("Test Task")).toBeDefined();
    expect(screen.getByText("Test description")).toBeDefined();
    expect(screen.getByText("12/31/2025")).toBeDefined();
    // Just verify that the component renders without errors
  });

  it("renders in editing mode", () => {
    render(
      <Provider auth={authStore} {...mockStores}>
        <TaskItem {...defaultProps} isEditing={true} {...props} />
      </Provider>
    );

    expect(screen.getByDisplayValue("Test Task")).toBeDefined();
    expect(screen.getByDisplayValue("Test description")).toBeDefined();
    expect(screen.getByDisplayValue("2025-12-31")).toBeDefined();
    expect(screen.getByDisplayValue("test, important")).toBeDefined();
  });

  it("calls onEdit when edit button is clicked", () => {
    const onEdit = jest.fn();

    render(
      <Provider auth={authStore} {...mockStores}>
        <TaskItem {...defaultProps} onEdit={onEdit} {...props} />
      </Provider>
    );

    const editButton = screen.getByText("Edit");
    fireEvent.click(editButton);

    expect(onEdit).toHaveBeenCalledWith(mockTask);
  });

  it("calls onDelete when delete button is clicked", () => {
    const onDelete = jest.fn();

    render(
      <Provider auth={authStore} {...mockStores}>
        <TaskItem {...defaultProps} onDelete={onDelete} {...props} />
      </Provider>
    );

    const deleteButton = screen.getByText("Delete");
    fireEvent.click(deleteButton);

    expect(onDelete).toHaveBeenCalledWith(mockTask);
  });

  it("calls onCancel when cancel button is clicked", () => {
    const onCancel = jest.fn();

    render(
      <Provider auth={authStore} {...mockStores}>
        <TaskItem
          {...defaultProps}
          isEditing={true}
          onCancel={onCancel}
          {...props}
        />
      </Provider>
    );

    const cancelButton = screen.getByText("Cancel");
    fireEvent.click(cancelButton);

    expect(onCancel).toHaveBeenCalled();
  });
});
