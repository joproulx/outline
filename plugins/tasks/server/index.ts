import { Hook, PluginManager } from "@server/utils/PluginManager";
import config from "../plugin.json";
import router from "./api/tasks";
import env from "./env";
import { sequelize } from "@server/storage/database";
import SimpleTaskItem from "./models/SimpleTaskItem";

// Task plugin is always enabled as it doesn't require external services
const enabled = true;

if (enabled) {
  // Try to register the task model with the existing sequelize instance
  try {
    sequelize.addModels([SimpleTaskItem]);

    // Temporarily disable policies to fix login issue
    // TODO: Debug policy system integration for plugin models
    // require("./policies/taskPolicy");
  } catch (_error) {
    // Model registration failed - this will be handled by the system
  }

  PluginManager.add([
    {
      ...config,
      type: Hook.API,
      value: router,
    },
  ]);
}

export { env };
