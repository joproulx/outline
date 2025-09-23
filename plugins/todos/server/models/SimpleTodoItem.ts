import { InferAttributes, InferCreationAttributes } from "sequelize";
import {
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
  Length,
  Table,
} from "sequelize-typescript";
import { Collection, Document, Team, User } from "@server/models";
import ParanoidModel from "@server/models/base/ParanoidModel";
import Fix from "@server/models/decorators/Fix";

export enum TodoStatus {
  Pending = "pending",
  InProgress = "in_progress",
  Completed = "completed",
  Cancelled = "cancelled",
}

export enum TodoPriority {
  Low = "low",
  Medium = "medium",
  High = "high",
  Urgent = "urgent",
}

@Table({ tableName: "todo_items", modelName: "todoItem" })
@Fix
class SimpleTodoItem extends ParanoidModel<
  InferAttributes<SimpleTodoItem>,
  Partial<InferCreationAttributes<SimpleTodoItem>>
> {
  @Length({
    max: 255,
    msg: "Todo title must be 255 characters or less",
  })
  @Column(DataType.STRING)
  title: string;

  @Column(DataType.TEXT)
  description?: string;

  @Column({
    type: DataType.STRING,
    defaultValue: TodoStatus.Pending,
    validate: {
      isIn: [Object.values(TodoStatus)],
    },
  })
  status: TodoStatus;

  @Column({
    type: DataType.STRING,
    defaultValue: TodoPriority.Medium,
    validate: {
      isIn: [Object.values(TodoPriority)],
    },
  })
  priority: TodoPriority;

  @Column(DataType.DATE)
  deadline?: Date;

  @Column(DataType.DATE)
  completedAt?: Date;

  @Column(DataType.JSON)
  tags?: string[];

  // Associations
  @BelongsTo(() => Document, "documentId")
  document?: Document;

  @ForeignKey(() => Document)
  @Column(DataType.UUID)
  documentId?: string;

  @BelongsTo(() => Collection, "collectionId")
  collection?: Collection;

  @ForeignKey(() => Collection)
  @Column(DataType.UUID)
  collectionId?: string;

  @BelongsTo(() => User, "createdById")
  createdBy: User;

  @ForeignKey(() => User)
  @Column(DataType.UUID)
  createdById: string;

  @BelongsTo(() => Team, "teamId")
  team: Team;

  @ForeignKey(() => Team)
  @Column(DataType.UUID)
  teamId: string;

  // Computed properties
  get isOverdue(): boolean {
    if (!this.deadline || this.status === TodoStatus.Completed) {
      return false;
    }
    return new Date() > this.deadline;
  }

  // Instance methods
  async markCompleted(): Promise<void> {
    this.status = TodoStatus.Completed;
    this.completedAt = new Date();
    await this.save();
  }

  async markPending(): Promise<void> {
    this.status = TodoStatus.Pending;
    this.completedAt = undefined;
    await this.save();
  }
}

export default SimpleTodoItem;
