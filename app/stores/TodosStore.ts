import { action, computed, runInAction } from "mobx";
import Todo from "~/models/Todo";
import { client } from "~/utils/ApiClient";
import RootStore from "./RootStore";
import Store, { type FetchPageParams } from "./base/Store";

export default class TodosStore extends Store<Todo> {
  constructor(rootStore: RootStore) {
    super(rootStore, Todo);
  }

  /**
   * Get all todos sorted by creation date (newest first)
   */
  @computed
  get all(): Todo[] {
    return this.orderedData.slice();
  }

  /**
   * Get all active (incomplete) todos
   */
  @computed
  get active(): Todo[] {
    return this.filter((todo: Todo) => !todo.completed);
  }

  /**
   * Get all completed todos
   */
  @computed
  get completed(): Todo[] {
    return this.filter((todo: Todo) => todo.completed);
  }

  /**
   * Get todos by priority level
   */
  byPriority(priority: "high" | "medium" | "low" | "none"): Todo[] {
    return this.filter((todo: Todo) => todo.priority === priority);
  }

  /**
   * Get overdue todos (past due date and not completed)
   */
  @computed
  get overdue(): Todo[] {
    return this.filter((todo: Todo) => todo.isOverdue);
  }

  /**
   * Get todos due today
   */
  @computed
  get dueToday(): Todo[] {
    return this.filter((todo: Todo) => todo.isDueToday);
  }

  /**
   * Get todos with specific tags
   */
  withTags(tags: string[]): Todo[] {
    return this.filter((todo: Todo) =>
      tags.some((tag) => todo.tags.includes(tag))
    );
  }

  /**
   * Search todos by title or description
   */
  search(query: string): Todo[] {
    const searchTerm = query.toLowerCase();
    return this.filter(
      (todo: Todo) =>
        todo.title.toLowerCase().includes(searchTerm) ||
        (todo.description &&
          todo.description.toLowerCase().includes(searchTerm))
    );
  }

  /**
   * Override fetchPage to handle custom API response format
   */
  async fetchPage(params?: FetchPageParams): Promise<Todo[]> {
    this.isFetching = true;

    try {
      const res = await client.post("/api/todos", params);
      const todos = res.data?.data || [];

      runInAction(() => {
        if (Array.isArray(todos)) {
          this.addPolicies(res.policies);
          todos.forEach((todo) => this.add(todo));
          this.isLoaded = true;
        }
      });

      return Array.isArray(todos) ? todos : [];
    } catch (_error) {
      return [];
    } finally {
      runInAction(() => {
        this.isFetching = false;
      });
    }
  }

  /**
   * Get count of active todos
   */
  @computed
  get activeCount(): number {
    return this.active.length;
  }

  /**
   * Get count of completed todos
   */
  @computed
  get completedCount(): number {
    return this.completed.length;
  }

  /**
   * Create a new todo
   */
  @action
  async create(params: {
    title: string;
    description?: string;
    priority?: "high" | "medium" | "low" | "none";
    dueDate?: string;
    tags?: string[];
  }): Promise<Todo> {
    const todo = await super.create({
      title: params.title,
      description: params.description || null,
      priority: params.priority || "none",
      dueDate: params.dueDate || null,
      tags: params.tags || [],
      completed: false,
    });

    return todo;
  }

  /**
   * Update an existing todo
   */
  @action
  async update(
    todo: Todo,
    params: Partial<{
      title: string;
      description: string | null;
      priority: "high" | "medium" | "low" | "none";
      dueDate: string | null;
      tags: string[];
      completed: boolean;
    }>
  ): Promise<Todo> {
    Object.assign(todo, params);
    await todo.save();
    return todo;
  }

  /**
   * Delete a todo
   */
  @action
  async delete(todo: Todo): Promise<void> {
    await super.delete(todo);
  }

  /**
   * Mark all active todos as completed
   */
  @action
  async completeAll(): Promise<void> {
    const activeTodos = this.active;
    await Promise.all(activeTodos.map((todo) => todo.complete()));
  }

  /**
   * Delete all completed todos
   */
  @action
  async deleteCompleted(): Promise<void> {
    const completedTodos = this.completed;
    await Promise.all(completedTodos.map((todo) => this.delete(todo)));
  }

  /**
   * Get all unique tags used across todos
   */
  @computed
  get allTags(): string[] {
    const tagSet = new Set<string>();
    this.data.forEach((todo) => {
      todo.tags.forEach((tag) => tagSet.add(tag));
    });
    return Array.from(tagSet).sort();
  }

  /**
   * Get statistics about todos
   */
  @computed
  get stats() {
    return {
      total: this.data.size,
      active: this.activeCount,
      completed: this.completedCount,
      overdue: this.overdue.length,
      dueToday: this.dueToday.length,
      high: this.byPriority("high").length,
      medium: this.byPriority("medium").length,
      low: this.byPriority("low").length,
    };
  }
}
