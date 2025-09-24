import { createLazyComponent } from "~/components/LazyLoad";
import { Hook, PluginManager } from "~/utils/PluginManager";
import config from "../plugin.json";
import Icon from "./Icon";

PluginManager.add([
  {
    ...config,
    type: Hook.Settings,
    value: {
      group: "Features",
      icon: Icon,
      description:
        "Centralized todo management with user assignments, due dates, and document integration.",
      component: createLazyComponent(() => import("./Settings")),
      enabled: () => true,
    },
  },
  {
    ...config,
    type: Hook.Icon,
    value: Icon,
  },
]);
