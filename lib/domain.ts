export const SourceSystem = {
  CLICKUP: "CLICKUP",
  NATIVE: "NATIVE"
} as const;

export type SourceSystem = (typeof SourceSystem)[keyof typeof SourceSystem];

export const TaskStatusGroup = {
  NOT_STARTED: "NOT_STARTED",
  IN_PROGRESS: "IN_PROGRESS",
  BLOCKED: "BLOCKED",
  DONE: "DONE"
} as const;

export type TaskStatusGroup = (typeof TaskStatusGroup)[keyof typeof TaskStatusGroup];

export const UserRole = {
  EXECUTIVE: "EXECUTIVE",
  MANAGER: "MANAGER",
  CONTRIBUTOR: "CONTRIBUTOR",
  ADMIN: "ADMIN"
} as const;

export type UserRole = (typeof UserRole)[keyof typeof UserRole];
