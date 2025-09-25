import { action, computed, runInAction } from "mobx";
import Task from "~/models/Task";
import { client } from "~/utils/ApiClient";
import Logger from "~/utils/Logger";
import RootStore from "./RootStore";
import Store, { type FetchPageParams } from "./base/Store";

export default class TasksStore extends Store<Task> {
  constructor(rootStore: RootStore) {
    super(rootStore, Task);
  }

  /**
   * Get all tasks sorted by creation date (newest first)
   */
  @computed
  get all(): Task[] {
    const result = this.filter(() => true);
    Logger.info("store", "TasksStore.all called", {
      isLoaded: this.isLoaded,
      isFetching: this.isFetching,
      dataSize: this.data.size,
      orderedDataLength: this.orderedData.length,
      resultLength: result.length,
    });
    return result;
  }

  /**
   * Get tasks by priority level
   */
  byPriority(priority: "high" | "medium" | "low" | "none"): Task[] {
    return this.filter((task: Task) => task.priority === priority);
  }

  /**
   * Get overdue tasks (past due date)
   */
  @computed
  get overdue(): Task[] {
    return this.filter((task: Task) => task.isOverdue);
  }

  /**
   * Get tasks due today
   */
  @computed
  get dueToday(): Task[] {
    return this.filter((task: Task) => task.isDueToday);
  }

  /**
   * Get tasks with specific tags
   */
  withTags(tags: string[]): Task[] {
    return this.filter((task: Task) =>
      tags.some((tag) => task.tags.includes(tag))
    );
  }

  /**
   * Get assigned tasks
   */
  @computed
  get assigned(): Task[] {
    const result = this.filter((task: Task) => task.isAssigned);
    Logger.info("store", "TasksStore.assigned called", {
      totalTasks: this.data.size,
      assignedTasks: result.length,
    });
    return result;
  }

  /**
   * Get unassigned tasks
   */
  @computed
  get unassigned(): Task[] {
    const result = this.filter((task: Task) => !task.isAssigned);
    Logger.info("store", "TasksStore.unassigned called", {
      totalTasks: this.data.size,
      unassignedTasks: result.length,
    });
    return result;
  }

  /**
   * Get tasks assigned to current user
   */
  @computed
  get assignedToMe(): Task[] {
    return this.filter((task: Task) => task.isAssignedToMe);
  }

  /**
   * Get count of tasks assigned to current user (for UI counters)
   */
  @computed
  get activeCount(): number {
    return this.assignedToMe.length;
  }

  /**
   * Get tasks by assignee
   */
  byAssignee(userId: string): Task[] {
    return this.filter((task: Task) =>
      task.assignees.some((assignee) => assignee.id === userId)
    );
  }

  /**
   * Search tasks by title or description
   */
  search(query: string): Task[] {
    const searchTerm = query.toLowerCase();
    return this.filter(
      (task: Task) =>
        task.title.toLowerCase().includes(searchTerm) ||
        (task.description &&
          task.description.toLowerCase().includes(searchTerm))
    );
  }

  /**
   * Override fetchPage to handle custom API response format
   */
  @action
  fetchPage = async (params?: FetchPageParams): Promise<Task[]> => {
    this.isFetching = true;

    try {
      const res = await client.post("/tasks.list", params);
      const tasks = res.data || []; // Fixed: res.data is the array, not res.data.data

      runInAction(() => {
        if (Array.isArray(tasks)) {
          this.addPolicies(res.policies);
          tasks.forEach((task) => {
            this.add(task);
          });
          this.isLoaded = true;
        }
      });

      return Array.isArray(tasks) ? tasks : [];
    } catch (_error) {
      // Error already logged by the client
      return [];
    } finally {
      runInAction(() => {
        this.isFetching = false;
      });
    }
  };

  /**
   * Create a new task
   */
  @action
  async create(params: {
    title: string;
    description?: string;
    priority?: "high" | "medium" | "low" | "none";
    dueDate?: string;
    tags?: string[];
  }): Promise<Task> {
    try {
      const res = await client.post("/tasks.create", params);

      // The API returns the task data directly in res.data, not res.data.data
      const taskData = res.data?.data || res.data;

      if (taskData && taskData.id) {
        const task = this.add(taskData);
        return task;
      }

      throw new Error("Failed to create task - no valid data returned");
    } catch (_error) {
      throw new Error("Failed to create task");
    }
  }

  /**
   * Update an existing task
   */
  @action
  async update(
    task: Task,
    params: Partial<{
      title: string;
      description: string | null;
      priority: "high" | "medium" | "low" | "none";
      dueDate: string | null;
      tags: string[];
    }>
  ): Promise<Task> {
    try {
      const res = await client.post("/tasks.update", {
        id: task.id,
        ...params,
      });

      // The API returns the task data directly in res.data, not res.data.data
      const taskData = res.data?.data || res.data;

      if (taskData && taskData.id) {
        Object.assign(task, taskData);
        return task;
      }

      throw new Error("Failed to update task - no valid data returned");
    } catch (_error) {
      throw new Error("Failed to update task");
    }
  }

  /**
   * Delete a task
   */
  @action
  async delete(task: Task): Promise<void> {
    await client.post("/tasks.delete", { id: task.id });
    this.remove(task.id);
  }

  /**
   * Assign a user to a task
   */
  @action
  async assign(task: Task, userId: string): Promise<Task> {
    try {
      const res = await client.post("/tasks.assign", {
        id: task.id,
        userId: userId,
      });

      const taskData = res.data?.data || res.data;

      if (taskData && taskData.id) {
        // Update the task with new assignment data
        Object.assign(task, {
          assigneeCount: taskData.assigneeCount,
          assignees: taskData.assignees,
          assignments: taskData.assignments,
        });
        return task;
      }

      throw new Error("Failed to assign task - no valid data returned");
    } catch (_error) {
      throw new Error("Failed to assign task");
    }
  }

  /**
   * Unassign a user from a task
   */
  @action
  async unassign(task: Task, userId: string): Promise<Task> {
    try {
      const res = await client.post("/tasks.unassign", {
        id: task.id,
        userId: userId,
      });

      const taskData = res.data?.data || res.data;

      if (taskData && taskData.id) {
        // Update the task with new assignment data
        Object.assign(task, {
          assigneeCount: taskData.assigneeCount,
          assignees: taskData.assignees,
          assignments: taskData.assignments,
        });
        return task;
      }

      throw new Error("Failed to unassign task - no valid data returned");
    } catch (_error) {
      throw new Error("Failed to unassign task");
    }
  }

  /**
   * Get all unique tags used across tasks
   */
  @computed
  get allTags(): string[] {
    const tagSet = new Set<string>();
    this.data.forEach((task) => {
      task.tags.forEach((tag) => tagSet.add(tag));
    });
    return Array.from(tagSet).sort();
  }

  /**
   * Get statistics about tasks
   */
  @computed
  get stats() {
    return {
      total: this.data.size,
      overdue: this.overdue.length,
      dueToday: this.dueToday.length,
      high: this.byPriority("high").length,
      medium: this.byPriority("medium").length,
      low: this.byPriority("low").length,
      assigned: this.assigned.length,
      unassigned: this.unassigned.length,
      assignedToMe: this.assignedToMe.length,
    };
  }
}
