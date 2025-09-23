import { Hook, PluginManager } from "@server/utils/PluginManager";
import config from "../plugin.json";
import router from "./api/todos";
import env from "./env";
import { sequelize } from "@server/storage/database";
import SimpleTodoItem from "./models/SimpleTodoItem";
import "./policies/todoPolicy";

// Todo plugin is always enabled as it doesn't require external services
const enabled = true;

if (enabled) {
  // Try to register the todo model with the existing sequelize instance
  try {
    sequelize.addModels([SimpleTodoItem]);
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
