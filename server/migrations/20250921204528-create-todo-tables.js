"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Create todo_items table
    await queryInterface.createTable("todo_items", {
      id: {
        type: Sequelize.UUID,
        allowNull: false,
        primaryKey: true,
      },
      title: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      status: {
        type: Sequelize.STRING(20),
        allowNull: false,
        defaultValue: "pending",
      },
      priority: {
        type: Sequelize.STRING(20),
        allowNull: false,
        defaultValue: "medium",
      },
      deadline: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      documentId: {
        type: Sequelize.UUID,
        allowNull: true,
        onDelete: "SET NULL",
        references: {
          model: "documents",
        },
      },
      collectionId: {
        type: Sequelize.UUID,
        allowNull: true,
        onDelete: "SET NULL",
        references: {
          model: "collections",
        },
      },
      createdById: {
        type: Sequelize.UUID,
        allowNull: false,
        onDelete: "CASCADE",
        references: {
          model: "users",
        },
      },
      teamId: {
        type: Sequelize.UUID,
        allowNull: false,
        onDelete: "CASCADE",
        references: {
          model: "teams",
        },
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      completedAt: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      deletedAt: {
        type: Sequelize.DATE,
        allowNull: true,
      },
    });

    // Create todo_assignments table
    await queryInterface.createTable("todo_assignments", {
      id: {
        type: Sequelize.UUID,
        allowNull: false,
        primaryKey: true,
      },
      todoId: {
        type: Sequelize.UUID,
        allowNull: false,
        onDelete: "CASCADE",
        references: {
          model: "todo_items",
        },
      },
      userId: {
        type: Sequelize.UUID,
        allowNull: false,
        onDelete: "CASCADE",
        references: {
          model: "users",
        },
      },
      assignedById: {
        type: Sequelize.UUID,
        allowNull: false,
        onDelete: "CASCADE",
        references: {
          model: "users",
        },
      },
      assignedAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    });

    // Add indexes for performance
    await queryInterface.addIndex("todo_items", ["teamId"]);
    await queryInterface.addIndex("todo_items", ["createdById"]);
    await queryInterface.addIndex("todo_items", ["documentId"]);
    await queryInterface.addIndex("todo_items", ["collectionId"]);
    await queryInterface.addIndex("todo_items", ["status"]);
    await queryInterface.addIndex("todo_items", ["deadline"]);
    await queryInterface.addIndex("todo_items", ["createdAt"]);
    await queryInterface.addIndex("todo_items", ["deletedAt"]);

    await queryInterface.addIndex("todo_assignments", ["todoId"]);
    await queryInterface.addIndex("todo_assignments", ["userId"]);
    await queryInterface.addIndex("todo_assignments", ["assignedById"]);

    // Add unique constraint to prevent duplicate assignments
    await queryInterface.addConstraint("todo_assignments", {
      fields: ["todoId", "userId"],
      type: "unique",
      name: "todo_assignments_todo_user_unique",
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable("todo_assignments");
    await queryInterface.dropTable("todo_items");
  },
};
