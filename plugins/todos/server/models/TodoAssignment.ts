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
import TodoItem from "./TodoItem";

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
@Table({ tableName: "todo_assignments", modelName: "todoAssignment" })
@Fix
class TodoAssignment extends ParanoidModel<
  InferAttributes<TodoAssignment>,
  Partial<InferCreationAttributes<TodoAssignment>>
> {
  @Column(DataType.DATE)
  assignedAt: Date;

  // Associations
  @BelongsTo(() => TodoItem, "todoId")
  todoItem: TodoItem;

  @ForeignKey(() => TodoItem)
  @Column(DataType.UUID)
  todoId: string;

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
    todoId: string,
    userId: string,
    assignedById: string
  ): Promise<TodoAssignment> {
    return this.create({
      todoId,
      userId,
      assignedById,
      assignedAt: new Date(),
    });
  }

  static async removeAssignment(
    todoId: string,
    userId: string
  ): Promise<number> {
    return this.destroy({
      where: {
        todoId,
        userId,
      },
    });
  }
}

export default TodoAssignment;
