import { InferAttributes, InferCreationAttributes } from "sequelize";
import {
  BelongsTo,
  Column,
  DataType,
  DefaultScope,
  ForeignKey,
  Table,
} from "sequelize-typescript";
import { User } from "@server/models";
import ParanoidModel from "@server/models/base/ParanoidModel";
import Fix from "@server/models/decorators/Fix";
import TaskItem from "./TaskItem";

@DefaultScope(() => ({
  include: [
    {
      model: User,
      as: "user",
      paranoid: false,
    },
    {
      model: User,
      as: "assignedBy",
      paranoid: false,
    },
  ],
}))
@Table({ tableName: "task_assignments", modelName: "taskAssignment" })
@Fix
class TaskAssignment extends ParanoidModel<
  InferAttributes<TaskAssignment>,
  Partial<InferCreationAttributes<TaskAssignment>>
> {
  @Column(DataType.DATE)
  assignedAt: Date;

  // Associations
  @BelongsTo(() => TaskItem, "taskId")
  taskItem: TaskItem;

  @ForeignKey(() => TaskItem)
  @Column(DataType.UUID)
  taskId: string;

  @BelongsTo(() => User, "userId")
  user: User;

  @ForeignKey(() => User)
  @Column(DataType.UUID)
  userId: string;

  @BelongsTo(() => User, "assignedById")
  assignedBy: User;

  @ForeignKey(() => User)
  @Column(DataType.UUID)
  assignedById: string;

  // Instance methods
  static async createAssignment(
    taskId: string,
    userId: string,
    assignedById: string
  ): Promise<TaskAssignment> {
    return this.create({
      taskId,
      userId,
      assignedById,
      assignedAt: new Date(),
    });
  }

  static async removeAssignment(
    taskId: string,
    userId: string
  ): Promise<number> {
    return this.destroy({
      where: {
        taskId,
        userId,
      },
    });
  }
}

export default TaskAssignment;
