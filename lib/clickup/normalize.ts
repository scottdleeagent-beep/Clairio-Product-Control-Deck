import type { ClickUpTask } from "@/lib/clickup/types";
import { TaskStatusGroup, type TaskStatusGroup as TaskStatusGroupValue } from "@/lib/domain";
import { getClickUpScopeConfig } from "@/lib/env";
import { slugify, toDate, toNullableNumber } from "@/lib/utils";

export type NormalizedAssignment = {
  externalSourceId: string;
  email: string | null;
  name: string;
};

export type NormalizedTask = {
  externalSourceId: string;
  title: string;
  description: string | null;
  status: string;
  statusGroup: TaskStatusGroupValue;
  priority: string | null;
  estimatePoints: number | null;
  estimateHours: number | null;
  dueDate: Date | null;
  startDate: Date | null;
  completedAt: Date | null;
  blockedFlag: boolean;
  ownerExternalSourceId: string | null;
  parentTaskExternalId: string | null;
  initiativeExternalSourceId: string;
  initiativeName: string;
  initiativeSlug: string;
  assignments: NormalizedAssignment[];
  metadata: {
    clickupUrl: string | null;
    listName: string | null;
    listId: string | null;
    folderName: string | null;
    folderId: string | null;
    spaceName: string | null;
    spaceId: string | null;
    tags: string[];
  };
};

export function mapClickUpStatusGroup(status?: string): TaskStatusGroupValue {
  const normalized = (status ?? "").toLowerCase();

  if (normalized.includes("block")) {
    return TaskStatusGroup.BLOCKED;
  }

  if (
    normalized.includes("done") ||
    normalized.includes("complete") ||
    normalized.includes("closed")
  ) {
    return TaskStatusGroup.DONE;
  }

  if (
    normalized.includes("progress") ||
    normalized.includes("review") ||
    normalized.includes("qa") ||
    normalized.includes("active")
  ) {
    return TaskStatusGroup.IN_PROGRESS;
  }

  return TaskStatusGroup.NOT_STARTED;
}

export function normalizeClickUpTask(task: ClickUpTask): NormalizedTask {
  const scope = getClickUpScopeConfig();
  const assignments =
    task.assignees?.map((assignee) => ({
      externalSourceId: String(assignee.id),
      email: assignee.email ?? null,
      name: assignee.username
    })) ?? [];

  const isClairioSuiteTask =
    (scope.folderId && task.folder?.id === scope.folderId) ||
    (scope.folderName && task.folder?.name === scope.folderName);
  const initiativeName = isClairioSuiteTask
    ? task.list?.name ?? task.folder?.name ?? "Clairio Suite"
    : task.folder?.name ?? task.list?.name ?? task.space?.name ?? "Unmapped Initiative";
  const priority = task.priority?.priority ?? null;
  const points = toNullableNumber(task.points);
  const hours = task.time_estimate ? Number((task.time_estimate / 3600000).toFixed(2)) : null;
  const tags = task.tags?.map((tag) => tag.name) ?? [];
  const statusGroup = mapClickUpStatusGroup(task.status?.status);

  return {
    externalSourceId: task.id,
    title: task.name,
    description: task.description ?? null,
    status: task.status?.status ?? "unknown",
    statusGroup,
    priority,
    estimatePoints: points,
    estimateHours: hours,
    dueDate: toDate(task.due_date),
    startDate: toDate(task.start_date),
    completedAt: toDate(task.date_closed),
    blockedFlag: statusGroup === TaskStatusGroup.BLOCKED,
    ownerExternalSourceId: assignments[0]?.externalSourceId ?? null,
    parentTaskExternalId: task.parent ?? null,
    initiativeExternalSourceId: isClairioSuiteTask
      ? task.list?.id ?? task.folder?.id ?? "unmapped"
      : task.folder?.id ?? task.list?.id ?? task.space?.id ?? "unmapped",
    initiativeName,
    initiativeSlug: slugify(initiativeName),
    assignments,
    metadata: {
      clickupUrl: task.url ?? null,
      listName: task.list?.name ?? null,
      listId: task.list?.id ?? null,
      folderName: task.folder?.name ?? null,
      folderId: task.folder?.id ?? null,
      spaceName: task.space?.name ?? null,
      spaceId: task.space?.id ?? null,
      tags
    }
  };
}
