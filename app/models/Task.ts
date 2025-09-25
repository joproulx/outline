import { computed, observable } from "mobx";
import User from "~/models/User";
import Model from "./base/Model";
import Field from "./decorators/Field";
import Relation from "./decorators/Relation";

class Task extends Model {
  static modelName = "Task";

  /**
   * The title of the task item
   */
  @Field
  @observable
  title: string;

  /**
   * Optional description or notes for the task
   */
  @Field
  @observable
  description: string | null;

  /**
   * Priority level (high, medium, low, none)
   */
  @Field
  @observable
  priority: "high" | "medium" | "low" | "none";

  /**
   * Optional due date for the task
   */
  @Field
  @observable
  dueDate: string | null;

  /**
   * Tags associated with this task
   */
  @Field
  @observable
  tags: string[] = [];

  /**
   * The user who created this task
   */
  @Relation(() => User)
  createdBy: User;

  /**
   * The ID of the user who created this task
   */
  createdById: string;

  /**
   * Whether this task is overdue (has a due date in the past)
   */
  @computed
  get isOverdue(): boolean {
    if (!this.dueDate) {
      return false;
    }

    // Parse the date as UTC and extract just the date part to avoid timezone issues
    const due = new Date(this.dueDate);
    const dueUTC = new Date(
      due.getUTCFullYear(),
      due.getUTCMonth(),
      due.getUTCDate()
    );

    const today = new Date();
    const todayUTC = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate()
    );

    return dueUTC < todayUTC;
  }

  /**
   * Whether this task is due today
   */
  @computed
  get isDueToday(): boolean {
    if (!this.dueDate) {
      return false;
    }

    // Parse the date as UTC and extract just the date part to avoid timezone issues
    const due = new Date(this.dueDate);
    const dueUTC = new Date(
      due.getUTCFullYear(),
      due.getUTCMonth(),
      due.getUTCDate()
    );

    const today = new Date();
    const todayUTC = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate()
    );

    return dueUTC.getTime() === todayUTC.getTime();
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

    // Parse the date as UTC and extract just the date part to avoid timezone issues
    const due = new Date(this.dueDate);
    const dueUTC = new Date(
      due.getUTCFullYear(),
      due.getUTCMonth(),
      due.getUTCDate()
    );

    const today = new Date();
    const todayUTC = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate()
    );

    const diffTime = dueUTC.getTime() - todayUTC.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

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

    return dueUTC.toLocaleDateString();
  }
}

export default Task;
