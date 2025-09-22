import { Hook, PluginManager } from "@server/utils/PluginManager";
import config from "../plugin.json";
import router from "./api/todos";
import env from "./env";

// Todo plugin is always enabled as it doesn't require external services
const enabled = true;

if (enabled) {
  PluginManager.add([
    {
      ...config,
      type: Hook.API,
      value: router,
    },
  ]);
}

export { env };
