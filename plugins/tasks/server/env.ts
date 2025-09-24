import { Environment } from "@server/env";

class TodoPluginEnvironment extends Environment {
  /**
   * Enable/disable todo notifications (optional, defaults to true)
   */
  public TODO_NOTIFICATIONS_ENABLED = this.toBoolean(
    process.env.TODO_NOTIFICATIONS_ENABLED ?? "true"
  );

  /**
   * Todo reminder intervals in hours (optional, defaults to 24,1)
   */
  public TODO_REMINDER_HOURS = this.toOptionalString(
    process.env.TODO_REMINDER_HOURS ?? "24,1"
  );
}

const env = new TodoPluginEnvironment();

export default env;
