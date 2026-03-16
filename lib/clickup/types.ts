export type ClickUpUser = {
  id: number;
  username: string;
  email?: string;
};

export type ClickUpPriority = {
  id: string;
  priority: string;
  color?: string;
  orderindex?: string;
};

export type ClickUpStatus = {
  status: string;
  color?: string;
  orderindex?: number;
  type?: string;
};

export type ClickUpCustomFieldValue = {
  id: string;
  name: string;
  type: string;
  value?: string | number | boolean | null;
};

export type ClickUpListRef = {
  id: string;
  name: string;
  folder?: ClickUpFolderRef;
  space?: ClickUpSpaceRef;
  task_count?: number;
};

export type ClickUpFolderRef = {
  id: string;
  name: string;
};

export type ClickUpSpaceRef = {
  id: string;
  name: string;
};

export type ClickUpTask = {
  id: string;
  name: string;
  description?: string;
  status: ClickUpStatus;
  orderindex?: string;
  date_created?: string;
  date_updated?: string;
  date_closed?: string | null;
  due_date?: string | null;
  start_date?: string | null;
  time_estimate?: number | null;
  points?: number | null;
  priority?: ClickUpPriority | null;
  assignees?: ClickUpUser[];
  creator?: ClickUpUser;
  parent?: string | null;
  url?: string;
  tags?: Array<{ name: string }>;
  custom_fields?: ClickUpCustomFieldValue[];
  list?: ClickUpListRef;
  folder?: ClickUpFolderRef;
  space?: ClickUpSpaceRef;
};

export type ClickUpTasksResponse = {
  tasks: ClickUpTask[];
  last_page?: boolean;
};

export type ClickUpFolderListsResponse = {
  lists: ClickUpListRef[];
};
