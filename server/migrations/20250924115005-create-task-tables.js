"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Create task_items table
    await queryInterface.createTable("task_items", {
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
      tags: {
        type: Sequelize.JSON,
        allowNull: true,
        defaultValue: null,
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

    // Create task_assignments table
    await queryInterface.createTable("task_assignments", {
      id: {
        type: Sequelize.UUID,
        allowNull: false,
        primaryKey: true,
      },
      taskId: {
        type: Sequelize.UUID,
        allowNull: false,
        onDelete: "CASCADE",
        references: {
          model: "task_items",
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
    await queryInterface.addIndex("task_items", ["teamId"]);
    await queryInterface.addIndex("task_items", ["createdById"]);
    await queryInterface.addIndex("task_items", ["documentId"]);
    await queryInterface.addIndex("task_items", ["collectionId"]);
    await queryInterface.addIndex("task_items", ["status"]);
    await queryInterface.addIndex("task_items", ["deadline"]);
    await queryInterface.addIndex("task_items", ["createdAt"]);
    await queryInterface.addIndex("task_items", ["deletedAt"]);

    await queryInterface.addIndex("task_assignments", ["taskId"]);
    await queryInterface.addIndex("task_assignments", ["userId"]);
    await queryInterface.addIndex("task_assignments", ["assignedById"]);

    // Add unique constraint to prevent duplicate assignments
    await queryInterface.addConstraint("task_assignments", {
      fields: ["taskId", "userId"],
      type: "unique",
      name: "task_assignments_task_user_unique",
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable("task_assignments");
    await queryInterface.dropTable("task_items");
  },
};
