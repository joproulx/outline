import { action, computed, observable } from "mobx";
import User from "~/models/User";
import Model from "./base/Model";
import Field from "./decorators/Field";
import Relation from "./decorators/Relation";

class Todo extends Model {
  static modelName = "Todo";

  /**
   * The title of the todo item
   */
  @Field
  @observable
  title: string;

  /**
   * Optional description or notes for the todo
   */
  @Field
  @observable
  description: string | null;

  /**
   * Whether the todo is completed
   */
  @Field
  @observable
  completed: boolean;

  /**
   * Priority level (high, medium, low, none)
   */
  @Field
  @observable
  priority: "high" | "medium" | "low" | "none";

  /**
   * Optional due date for the todo
   */
  @Field
  @observable
  dueDate: string | null;

  /**
   * Tags associated with this todo
   */
  @Field
  @observable
  tags: string[] = [];

  /**
   * The user who created this todo
   */
  @Relation(() => User)
  createdBy: User;

  /**
   * The ID of the user who created this todo
   */
  createdById: string;

  /**
   * Mark this todo as completed
   */
  @action
  async complete(): Promise<void> {
    if (this.completed) {
      return;
    }

    this.completed = true;
    await this.save();
  }

  /**
   * Mark this todo as incomplete
   */
  @action
  async uncomplete(): Promise<void> {
    if (!this.completed) {
      return;
    }

    this.completed = false;
    await this.save();
  }

  /**
   * Toggle the completion status
   */
  @action
  async toggle(): Promise<void> {
    this.completed = !this.completed;
    await this.save();
  }

  /**
   * Whether this todo is overdue (has a due date in the past and is not completed)
   */
  @computed
  get isOverdue(): boolean {
    if (!this.dueDate || this.completed) {
      return false;
    }
    return new Date(this.dueDate) < new Date();
  }

  /**
   * Whether this todo is due today
   */
  @computed
  get isDueToday(): boolean {
    if (!this.dueDate) {
      return false;
    }
    const today = new Date();
    const due = new Date(this.dueDate);
    return (
      today.getFullYear() === due.getFullYear() &&
      today.getMonth() === due.getMonth() &&
      today.getDate() === due.getDate()
    );
  }

  /**
   * Get the priority color for UI display
   */
  @computed
  get priorityColor(): string {
    switch (this.priority) {
      case "high":
        return "#e74c3c";
      case "medium":
        return "#f39c12";
      case "low":
        return "#3498db";
      default:
        return "#95a5a6";
    }
  }

  /**
   * Get a formatted due date string
   */
  @computed
  get formattedDueDate(): string | null {
    if (!this.dueDate) {
      return null;
    }

    const due = new Date(this.dueDate);
    const today = new Date();
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return "Today";
    }
    if (diffDays === 1) {
      return "Tomorrow";
    }
    if (diffDays === -1) {
      return "Yesterday";
    }
    if (diffDays < 0) {
      return `${Math.abs(diffDays)} days ago`;
    }
    if (diffDays <= 7) {
      return `In ${diffDays} days`;
    }

    return due.toLocaleDateString();
  }
}

export default Todo;
