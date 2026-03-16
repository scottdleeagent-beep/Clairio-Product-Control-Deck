import { SourceSystem, TaskStatusGroup, type TaskStatusGroup as TaskStatusGroupValue } from "@/lib/domain";
import {
  getCounts,
  getInitiatives,
  getSyncRuns,
  getTaskSnapshots,
  getTasks,
  getTaskStatusEvents
} from "@/lib/local-db";

export async function getOverviewData() {
  const now = new Date();
  const tasks = getTasks();
  const initiatives = getInitiatives();
  const latestSyncRun = getSyncRuns(1)[0];

  const openTasks = tasks.filter((task) => task.statusGroup !== TaskStatusGroup.DONE);
  const blockedTasks = openTasks.filter((task) => task.statusGroup === TaskStatusGroup.BLOCKED);
  const overdueTasks = openTasks.filter((task) => task.dueDate && task.dueDate < now);
  const atRiskInitiatives = initiatives.filter((initiative) =>
    initiative.tasks.some(
      (task) =>
        task.statusGroup === TaskStatusGroup.BLOCKED ||
        (task.dueDate !== null && task.dueDate < now && task.statusGroup !== TaskStatusGroup.DONE)
    )
  );
  const scopeAdded = tasks.filter((task) => task.createdAt >= daysAgo(7)).length;
  const completedThisWeek = tasks
    .filter((task) => task.completedAt && task.completedAt >= daysAgo(7))
    .reduce((sum, task) => sum + (task.estimatePoints ?? 1), 0);

  return {
    summary: [
      { label: "Open work", value: String(openTasks.length) },
      { label: "Blocked", value: String(blockedTasks.length) },
      { label: "Overdue", value: String(overdueTasks.length) },
      { label: "At risk", value: `${atRiskInitiatives.length} initiatives` }
    ],
    signals: [
      { label: "Scope added", detail: "Created in the last 7 days", value: `+${scopeAdded}` },
      {
        label: "Completed",
        detail: "Estimate points finished this week",
        value: `${completedThisWeek} pts`
      },
      {
        label: "Workload skew",
        detail: "Owners above active-work threshold",
        value: countOwnersAboveThreshold(openTasks, 2) > 0 ? "High" : "Balanced"
      }
    ],
    burndown: getBurndownPoints(),
    workstreams: getWorkstreams(tasks),
    syncStatus: latestSyncRun
      ? `Last ClickUp sync ${formatRelativeMinutes(latestSyncRun.finishedAt ?? latestSyncRun.startedAt)}`
      : "No ClickUp sync yet"
  };
}

export async function getTeamViewData() {
  const tasks = getTasks();
  const openTasks = tasks.filter((task) => task.statusGroup !== TaskStatusGroup.DONE);
  const dueSoon = openTasks.filter(
    (task) => task.dueDate !== null && task.dueDate <= daysAhead(3)
  ).length;

  return {
    workstreams: getWorkstreams(tasks),
    teamHighlights: [
      {
        title: "Unassigned work",
        subtitle: "Needs owner",
        value: String(openTasks.filter((task) => task.ownerId === null).length),
        footer: "Assigning these first improves reporting trust immediately."
      },
      {
        title: "Overloaded owners",
        subtitle: "Above threshold",
        value: String(countOwnersAboveThreshold(openTasks, 2)),
        footer: "Use this to rebalance in-flight work before the next planning cycle."
      },
      {
        title: "Tasks due in 72h",
        subtitle: "Delivery watchlist",
        value: String(dueSoon),
        footer: "The fastest leading indicator of deadline pressure right now."
      }
    ]
  };
}

export async function getAnalyticsViewData() {
  const tasks = getTasks();
  const snapshots = getTaskSnapshots();
  const statusEvents = getTaskStatusEvents();
  const initiatives = getInitiatives();

  const currentWeekCompleted = tasks.filter(
    (task) => task.completedAt && task.completedAt >= daysAgo(7)
  ).length;
  const previousWeekCompleted = tasks.filter(
    (task) =>
      task.completedAt &&
      task.completedAt >= daysAgo(14) &&
      task.completedAt < daysAgo(7)
  ).length;
  const throughputChange = percentageChange(previousWeekCompleted, currentWeekCompleted);

  const completedDurations = tasks
    .filter((task) => task.completedAt && task.startDate)
    .map((task) => diffInDays(task.startDate as Date, task.completedAt as Date));

  const blockedDurations = getBlockedDurations(statusEvents);
  const snapshotDensity = new Set(
    snapshots.map((snapshot) => snapshot.snapshotDate.toISOString().slice(0, 10))
  ).size;

  return {
    analytics: [
      {
        title: "Weekly throughput",
        window: "Last 7 days",
        value: `${currentWeekCompleted} tasks`,
        change: formatSignedPercent(throughputChange),
        note: "Completions compared to the previous 7-day window."
      },
      {
        title: "Cycle time",
        window: "Median",
        value: `${getMedian(completedDurations).toFixed(1)} days`,
        change: `${completedDurations.length} samples`,
        note: "Measured from start date to completion across done tasks."
      },
      {
        title: "Blocked duration",
        window: "Average",
        value: `${getAverage(blockedDurations).toFixed(1)} days`,
        change: `${snapshotDensity} snapshot days`,
        note: "Estimated from blocked status transitions and recent history coverage."
      }
    ],
    burndown: getBurndownPoints(),
    initiativeHealth: initiatives.map((initiative) => {
      const open = initiative.tasks.filter((task) => task.statusGroup !== TaskStatusGroup.DONE);
      const blocked = open.filter((task) => task.statusGroup === TaskStatusGroup.BLOCKED).length;
      const overdue = open.filter((task) => task.dueDate && task.dueDate < new Date()).length;

      return {
        name: initiative.name,
        owner: initiative.ownerName ?? "Unassigned",
        open: open.length,
        blocked,
        overdue,
        health: blocked > 0 || overdue > 0 ? "Needs attention" : "On track"
      };
    })
  };
}

export async function getSyncAdminData() {
  const runs = getSyncRuns(10).filter((run) => run.sourceSystem === SourceSystem.CLICKUP);
  const counts = getCounts();

  return {
    runs,
    metrics: [
      { label: "Tasks in database", value: String(counts.taskCount) },
      { label: "People mapped", value: String(counts.userCount) },
      { label: "Initiatives mapped", value: String(counts.initiativeCount) },
      {
        label: "Latest snapshot",
        value: counts.latestSnapshotDate ? counts.latestSnapshotDate.toISOString().slice(0, 10) : "none"
      }
    ],
    readyForSync: Boolean(process.env.CLICKUP_API_TOKEN && process.env.CLICKUP_WORKSPACE_ID)
  };
}

function getBurndownPoints() {
  const snapshots = getTaskSnapshots().filter((snapshot) => snapshot.snapshotDate >= daysAgo(5));
  const grouped = new Map<string, { day: string; remaining: number; completed: number }>();

  for (const snapshot of snapshots) {
    const key = snapshot.snapshotDate.toISOString().slice(0, 10);
    const current = grouped.get(key) ?? {
      day: snapshot.snapshotDate.toLocaleDateString("en-US", { weekday: "short" }),
      remaining: 0,
      completed: 0
    };
    const weight = snapshot.estimatePoints ?? 1;

    if (snapshot.statusGroup === TaskStatusGroup.DONE) {
      current.completed += weight;
    } else {
      current.remaining += weight;
    }

    grouped.set(key, current);
  }

  return Array.from(grouped.values());
}

function getWorkstreams(tasks: ReturnType<typeof getTasks>) {
  const groups = new Map<
    string,
    { owner: string; focus: string; active: number; blocked: number; dueThisWeek: number }
  >();

  for (const task of tasks) {
    if (task.statusGroup === TaskStatusGroup.DONE) {
      continue;
    }

    const owner = task.ownerName ?? "Unassigned";
    const current = groups.get(owner) ?? {
      owner,
      focus: task.initiativeName ?? "General ops",
      active: 0,
      blocked: 0,
      dueThisWeek: 0
    };

    current.active += 1;

    if (task.statusGroup === TaskStatusGroup.BLOCKED) {
      current.blocked += 1;
    }

    if (task.dueDate && task.dueDate <= daysAhead(7) && task.dueDate >= startOfDay(new Date())) {
      current.dueThisWeek += 1;
    }

    groups.set(owner, current);
  }

  return Array.from(groups.values()).sort((a, b) => b.active - a.active);
}

function countOwnersAboveThreshold(
  tasks: Array<{ ownerId: string | null }>,
  threshold: number
) {
  const counts = new Map<string, number>();

  tasks.forEach((task) => {
    if (!task.ownerId) {
      return;
    }

    counts.set(task.ownerId, (counts.get(task.ownerId) ?? 0) + 1);
  });

  return Array.from(counts.values()).filter((value) => value > threshold).length;
}

function getBlockedDurations(
  events: Array<{ taskId: string; statusGroup: TaskStatusGroupValue; changedAt: Date }>
) {
  const grouped = new Map<string, Array<{ statusGroup: TaskStatusGroup; changedAt: Date }>>();

  events.forEach((event) => {
    const list = grouped.get(event.taskId) ?? [];
    list.push(event);
    grouped.set(event.taskId, list);
  });

  const durations: number[] = [];

  grouped.forEach((list) => {
    list.sort((a, b) => a.changedAt.getTime() - b.changedAt.getTime());

    list.forEach((event, index) => {
      const next = list[index + 1];

      if (event.statusGroup === TaskStatusGroup.BLOCKED) {
        durations.push(diffInDays(event.changedAt, next?.changedAt ?? new Date()));
      }
    });
  });

  return durations;
}

function formatRelativeMinutes(date: Date) {
  const diffMinutes = Math.max(0, Math.round((Date.now() - date.getTime()) / (60 * 1000)));

  if (diffMinutes < 1) {
    return "just now";
  }

  if (diffMinutes < 60) {
    return `${diffMinutes} min ago`;
  }

  const hours = Math.round(diffMinutes / 60);
  return `${hours}h ago`;
}

function percentageChange(previous: number, current: number) {
  if (previous === 0) {
    return current === 0 ? 0 : 100;
  }

  return ((current - previous) / previous) * 100;
}

function formatSignedPercent(value: number) {
  const rounded = Math.round(value);
  return `${rounded >= 0 ? "+" : ""}${rounded}%`;
}

function getMedian(values: number[]) {
  if (values.length === 0) {
    return 0;
  }

  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[middle - 1] + sorted[middle]) / 2
    : sorted[middle];
}

function getAverage(values: number[]) {
  return values.length === 0 ? 0 : values.reduce((sum, value) => sum + value, 0) / values.length;
}

function diffInDays(start: Date, end: Date) {
  return (end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000);
}

function daysAgo(days: number) {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
}

function daysAhead(days: number) {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}
