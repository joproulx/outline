"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Check if the column already exists before adding it
    const table = await queryInterface.describeTable("task_assignments");

    if (!table.deletedAt) {
      await queryInterface.addColumn("task_assignments", "deletedAt", {
        type: Sequelize.DATE,
        allowNull: true,
      });

      // Add index for deletedAt for performance with paranoid queries
      await queryInterface.addIndex("task_assignments", ["deletedAt"]);
    }
  },

  async down(queryInterface, Sequelize) {
    // Remove the deletedAt column and its index
    await queryInterface.removeIndex("task_assignments", ["deletedAt"]);
    await queryInterface.removeColumn("task_assignments", "deletedAt");
  },
};
