export interface User {
  id: string
  name: string
  roles: string[]
}

/**
 * The system user is a special user that is used when no user is logged in.
 * It is used to represent the system itself, and is used to perform operations
 * that do not require a user to be logged in.
 *
 * Examples:
 * - Ingesting documents from a file system
 * - Running scheduled tasks
 */
export const SYSTEM_USER: User = {
  id: "$$__system__",
  name: "System (No User)",
  roles: ["__system__"],
}
