import { Hook, PluginManager } from "@server/utils/PluginManager";
import config from "../plugin.json";
import router from "./api/todos";
import env from "./env";
import { sequelize } from "@server/storage/database";
import SimpleTodoItem from "./models/SimpleTodoItem";

// Todo plugin is always enabled as it doesn't require external services
const enabled = true;

if (enabled) {
  // Try to register the todo model with the existing sequelize instance
  try {
    sequelize.addModels([SimpleTodoItem]);

    // Temporarily disable policies to fix login issue
    // TODO: Debug policy system integration for plugin models
    // require("./policies/todoPolicy");
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
