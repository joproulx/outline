"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    // Remove status column from task_items table
    await queryInterface.removeColumn("task_items", "status");
  },

  async down(queryInterface, Sequelize) {
    // Add back status column if we need to rollback
    await queryInterface.addColumn("task_items", "status", {
      type: Sequelize.STRING,
      allowNull: false,
      defaultValue: "pending",
      validate: {
        isIn: [["pending", "in_progress", "completed", "cancelled"]],
      },
    });
  },
};
