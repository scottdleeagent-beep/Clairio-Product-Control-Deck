import { ClickUpClient } from "@/lib/clickup/client";
import { normalizeClickUpTask } from "@/lib/clickup/normalize";
import {
  SourceSystem,
  TaskStatusGroup,
  type TaskStatusGroup as TaskStatusGroupValue
} from "@/lib/domain";
import { getClickUpScopeConfig } from "@/lib/env";
import {
  createSyncRun,
  finalizeSyncRun,
  insertStatusEvent,
  replaceTaskAssignments,
  upsertClickUpUser,
  upsertInitiative,
  upsertTask,
  upsertTaskSnapshot
} from "@/lib/local-db";

export type ClickUpSyncResult = {
  syncRunId: string;
  recordsRead: number;
  recordsUpserted: number;
  syncedAt: string;
};

export async function runClickUpSync(options?: {
  updatedAfter?: Date;
}): Promise<ClickUpSyncResult> {
  const syncRunId = createSyncRun(SourceSystem.CLICKUP, {
    updatedAfter: options?.updatedAfter?.toISOString() ?? null
  });

  try {
    const client = new ClickUpClient();
    const rawTasks = await client.getScopedFolderTasks(options?.updatedAfter);
    const scopedTasks = rawTasks.filter(isClairioSuiteTask);
    const normalizedTasks = scopedTasks.map(normalizeClickUpTask);
    const snapshotDate = startOfDay(new Date());

    for (const normalizedTask of normalizedTasks) {
      const initiativeId = upsertInitiative({
        name: normalizedTask.initiativeName,
        slug: normalizedTask.initiativeSlug,
        status: "ACTIVE",
        externalSourceId: normalizedTask.initiativeExternalSourceId
      });

      const assignmentUsers = normalizedTask.assignments.map((assignment) =>
        upsertClickUpUser({
          externalSourceId: assignment.externalSourceId,
          email: assignment.email,
          name: assignment.name
        })
      );

      const ownerId =
        assignmentUsers.find((user) => user.externalSourceId === normalizedTask.ownerExternalSourceId)
          ?.id ?? null;
      const taskId = `clickup_${normalizedTask.externalSourceId}`;

      const { previousStatus } = upsertTask({
        id: taskId,
        externalSourceId: normalizedTask.externalSourceId,
        title: normalizedTask.title,
        description: normalizedTask.description,
        status: normalizedTask.status,
        statusGroup: normalizedTask.statusGroup,
        priority: normalizedTask.priority,
        estimatePoints: normalizedTask.estimatePoints,
        estimateHours: normalizedTask.estimateHours,
        dueDate: normalizedTask.dueDate,
        startDate: normalizedTask.startDate,
        completedAt: normalizedTask.completedAt,
        blockedFlag: normalizedTask.blockedFlag,
        ownerId,
        initiativeId,
        sourceSystem: SourceSystem.CLICKUP
      });

      replaceTaskAssignments(
        taskId,
        assignmentUsers.map((user) => user.id)
      );

      upsertTaskSnapshot({
        taskId,
        snapshotDate,
        status: normalizedTask.status,
        statusGroup: normalizedTask.statusGroup,
        blockedFlag: normalizedTask.blockedFlag,
        estimatePoints: normalizedTask.estimatePoints,
        estimateHours: normalizedTask.estimateHours,
        dueDate: normalizedTask.dueDate,
        completedAt: normalizedTask.completedAt,
        ownerIds: assignmentUsers.map((user) => user.id)
      });

      if (previousStatus !== normalizedTask.status) {
        insertStatusEvent({
          taskId,
          previousStatus,
          newStatus: normalizedTask.status,
          statusGroup: normalizedTask.statusGroup,
          changedAt: new Date()
        });
      }
    }

    finalizeSyncRun({
      id: syncRunId,
      status: "SUCCEEDED",
      recordsRead: scopedTasks.length,
      recordsUpserted: normalizedTasks.length
    });

    return {
      syncRunId,
      recordsRead: scopedTasks.length,
      recordsUpserted: normalizedTasks.length,
      syncedAt: new Date().toISOString()
    };
  } catch (error) {
    finalizeSyncRun({
      id: syncRunId,
      status: "FAILED",
      recordsRead: 0,
      recordsUpserted: 0,
      errorMessage: error instanceof Error ? error.message : "Unknown sync error"
    });
    throw error;
  }
}

export function getStatusSummary(tasks: Array<{ statusGroup: TaskStatusGroupValue }>) {
  return tasks.reduce(
    (summary, task) => {
      summary[task.statusGroup] += 1;
      return summary;
    },
    {
      [TaskStatusGroup.NOT_STARTED]: 0,
      [TaskStatusGroup.IN_PROGRESS]: 0,
      [TaskStatusGroup.BLOCKED]: 0,
      [TaskStatusGroup.DONE]: 0
    }
  );
}

function startOfDay(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function isClairioSuiteTask(task: {
  folder?: { id: string; name: string } | null;
}) {
  const scope = getClickUpScopeConfig();

  if (scope.folderId && task.folder?.id === scope.folderId) {
    return true;
  }

  if (scope.folderName && task.folder?.name === scope.folderName) {
    return true;
  }

  return false;
}
