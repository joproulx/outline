import SimpleTodoItem from "./SimpleTodoItem";

// Export the model and its types
export {
  default as SimpleTodoItem,
  TodoStatus,
  TodoPriority,
} from "./SimpleTodoItem";

// Function to initialize the model with the database instance
export function initializeTodoModels(sequelize: unknown) {
  try {
    // Add the model to the sequelize instance
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (sequelize as any).addModels([SimpleTodoItem]);
    return true;
  } catch (_error) {
    return false;
  }
}
