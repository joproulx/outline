// Shared utilities for todo plugin
// This will contain shared types and utilities used by both client and server

export type TodoPriority = "high" | "medium" | "low";

export interface TodoAttributes {
  checked: boolean;
  title: string;
  description: string;
  expectedDate: string | null; // ISO string
  priority: TodoPriority;
  tags: string[];
}

export const DEFAULT_TODO_ATTRS: TodoAttributes = {
  checked: false,
  title: "",
  description: "",
  expectedDate: null,
  priority: "medium",
  tags: [],
};
