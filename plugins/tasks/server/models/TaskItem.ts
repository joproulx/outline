import { InferAttributes, InferCreationAttributes } from "sequelize";
import {
  AfterDestroy,
  BelongsTo,
  Column,
  DataType,
  DefaultScope,
  ForeignKey,
  HasMany,
  Length,
  Table,
} from "sequelize-typescript";
import { Collection, Document, Team, User } from "@server/models";
import ParanoidModel from "@server/models/base/ParanoidModel";
import { type HookContext } from "@server/models/base/Model";
import Fix from "@server/models/decorators/Fix";
import TaskAssignment from "./TaskAssignment";

export enum TaskPriority {
  Low = "low",
  Medium = "medium",
  High = "high",
  Urgent = "urgent",
}

@DefaultScope(() => ({
  include: [
    {
      model: User,
      as: "createdBy",
      paranoid: false,
    },
    {
      model: TaskAssignment,
      as: "assignments",
      include: [
        {
          model: User,
          as: "user",
          paranoid: false,
        },
      ],
    },
  ],
}))
@Table({ tableName: "task_items", modelName: "taskItem" })
@Fix
class TaskItem extends ParanoidModel<
  InferAttributes<TaskItem>,
  Partial<InferCreationAttributes<TaskItem>>
> {
  @Length({
    max: 255,
    msg: "Task title must be 255 characters or less",
  })
  @Column(DataType.STRING)
  title: string;

  @Column(DataType.TEXT)
  description?: string;

  @Column({
    type: DataType.STRING,
    defaultValue: TaskPriority.Medium,
    validate: {
      isIn: [Object.values(TaskPriority)],
    },
  })
  priority: TaskPriority;

  @Column(DataType.DATE)
  deadline?: Date;

  @Column(DataType.JSON)
  tags?: string[];

  @Column(DataType.DATE)
  completedAt?: Date;

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

  @HasMany(() => TaskAssignment, "taskId")
  assignments: TaskAssignment[];

  // Computed properties
  get isOverdue(): boolean {
    if (!this.deadline) {
      return false;
    }
    return new Date() > this.deadline;
  }

  get assigneeCount(): number {
    return this.assignments?.length || 0;
  }

  get assignees(): User[] {
    return this.assignments?.map((assignment) => assignment.user) || [];
  }

  // hooks

  @AfterDestroy
  public static async deleteTaskAssignments(model: TaskItem, ctx: HookContext) {
    const { transaction } = ctx;

    const lock = transaction
      ? {
          level: transaction.LOCK.UPDATE,
          of: this,
        }
      : undefined;

    const assignments = await TaskAssignment.findAll({
      where: { taskId: model.id },
      transaction,
      lock,
    });

    await Promise.all(
      assignments.map((assignment) => assignment.destroy({ transaction }))
    );
  }
}

export default TaskItem;
