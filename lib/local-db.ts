import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { DatabaseSync } from "node:sqlite";
import {
  SourceSystem,
  TaskStatusGroup,
  UserRole,
  type SourceSystem as SourceSystemValue,
  type TaskStatusGroup as TaskStatusGroupValue
} from "@/lib/domain";
import { slugify } from "@/lib/utils";

type TaskRecord = {
  id: string;
  title: string;
  description: string | null;
  external_source_id: string | null;
  source_system: SourceSystemValue;
  status: string;
  status_group: TaskStatusGroupValue;
  priority: string | null;
  estimate_points: number | null;
  estimate_hours: number | null;
  due_date: string | null;
  start_date: string | null;
  completed_at: string | null;
  blocked_flag: number;
  owner_id: string | null;
  initiative_id: string | null;
  parent_task_id: string | null;
  created_at: string;
  updated_at: string;
  owner_name: string | null;
  initiative_name: string | null;
};

type SyncRunRecord = {
  id: string;
  source_system: SourceSystemValue;
  started_at: string;
  finished_at: string | null;
  status: string;
  records_read: number;
  records_upserted: number;
  error_message: string | null;
  metadata: string | null;
};

export type LocalTaskRow = {
  id: string;
  title: string;
  description: string | null;
  externalSourceId: string | null;
  sourceSystem: SourceSystemValue;
  status: string;
  statusGroup: TaskStatusGroupValue;
  priority: string | null;
  estimatePoints: number | null;
  estimateHours: number | null;
  dueDate: Date | null;
  startDate: Date | null;
  completedAt: Date | null;
  blockedFlag: boolean;
  ownerId: string | null;
  initiativeId: string | null;
  parentTaskId: string | null;
  createdAt: Date;
  updatedAt: Date;
  ownerName: string | null;
  initiativeName: string | null;
};

export type LocalSyncRunRow = {
  id: string;
  sourceSystem: SourceSystemValue;
  startedAt: Date;
  finishedAt: Date | null;
  status: string;
  recordsRead: number;
  recordsUpserted: number;
  errorMessage: string | null;
  metadata: Record<string, unknown> | null;
};

let database: DatabaseSync | null = null;

export function getDb() {
  if (!database) {
    const dataDir = path.join(process.cwd(), "data");
    fs.mkdirSync(dataDir, { recursive: true });
    const dbPath = path.join(dataDir, "mission-control.db");
    database = new DatabaseSync(dbPath);
    initializeSchema(database);
    seedIfEmpty(database);
  }

  return database;
}

export function getTasks(): LocalTaskRow[] {
  const rows = getDb()
    .prepare(
      `
      SELECT
        tasks.*,
        users.name AS owner_name,
        initiatives.name AS initiative_name
      FROM tasks
      LEFT JOIN users ON users.id = tasks.owner_id
      LEFT JOIN initiatives ON initiatives.id = tasks.initiative_id
      `
    )
    .all() as TaskRecord[];

  return rows.map(mapTaskRow);
}

export function getInitiatives() {
  const db = getDb();
  const initiatives = db
    .prepare("SELECT * FROM initiatives ORDER BY name ASC")
    .all() as Array<{
    id: string;
    name: string;
    slug: string;
    status: string;
    owner_id: string | null;
  }>;

  return initiatives.map((initiative) => {
    const tasks = db
      .prepare("SELECT * FROM tasks WHERE initiative_id = ?")
      .all(initiative.id) as TaskRecord[];
    const owner = initiative.owner_id
      ? (db
          .prepare("SELECT name FROM users WHERE id = ?")
          .get(initiative.owner_id) as { name: string } | undefined)
      : undefined;

    return {
      id: initiative.id,
      name: initiative.name,
      slug: initiative.slug,
      status: initiative.status,
      ownerName: owner?.name ?? null,
      tasks: tasks.map(mapTaskRow)
    };
  });
}

export function getTaskSnapshots() {
  const rows = getDb()
    .prepare("SELECT * FROM task_snapshots ORDER BY snapshot_date ASC")
    .all() as Array<{
    task_id: string;
    snapshot_date: string;
    status: string;
    status_group: TaskStatusGroup;
    blocked_flag: number;
    estimate_points: number | null;
    estimate_hours: number | null;
    due_date: string | null;
    completed_at: string | null;
    owner_ids: string;
  }>;

  return rows.map((row) => ({
    taskId: row.task_id,
    snapshotDate: new Date(row.snapshot_date),
    status: row.status,
    statusGroup: row.status_group,
    blockedFlag: Boolean(row.blocked_flag),
    estimatePoints: row.estimate_points,
    estimateHours: row.estimate_hours,
    dueDate: toDate(row.due_date),
    completedAt: toDate(row.completed_at),
    ownerIds: JSON.parse(row.owner_ids) as string[]
  }));
}

export function getTaskStatusEvents() {
  const rows = getDb()
    .prepare("SELECT * FROM task_status_events ORDER BY changed_at ASC")
    .all() as Array<{
    task_id: string;
    previous_status: string | null;
    new_status: string;
    status_group: TaskStatusGroup;
    changed_at: string;
  }>;

  return rows.map((row) => ({
    taskId: row.task_id,
    previousStatus: row.previous_status,
    newStatus: row.new_status,
    statusGroup: row.status_group,
    changedAt: new Date(row.changed_at)
  }));
}

export function getSyncRuns(limit = 10): LocalSyncRunRow[] {
  const rows = getDb()
    .prepare("SELECT * FROM sync_runs ORDER BY started_at DESC LIMIT ?")
    .all(limit) as SyncRunRecord[];

  return rows.map((row) => ({
    id: row.id,
    sourceSystem: row.source_system,
    startedAt: new Date(row.started_at),
    finishedAt: toDate(row.finished_at),
    status: row.status,
    recordsRead: row.records_read,
    recordsUpserted: row.records_upserted,
    errorMessage: row.error_message,
    metadata: row.metadata ? (JSON.parse(row.metadata) as Record<string, unknown>) : null
  }));
}

export function getCounts() {
  const db = getDb();
  const taskCount = (db.prepare("SELECT COUNT(*) as count FROM tasks").get() as { count: number }).count;
  const userCount = (db.prepare("SELECT COUNT(*) as count FROM users").get() as { count: number }).count;
  const initiativeCount = (
    db.prepare("SELECT COUNT(*) as count FROM initiatives").get() as { count: number }
  ).count;
  const latestSnapshot = db.prepare("SELECT MAX(snapshot_date) as date FROM task_snapshots").get() as {
    date: string | null;
  };

  return {
    taskCount,
    userCount,
    initiativeCount,
    latestSnapshotDate: toDate(latestSnapshot.date)
  };
}

export function createSyncRun(sourceSystem: SourceSystemValue, metadata?: Record<string, unknown>) {
  const id = randomUUID();

  getDb()
    .prepare(
      `
      INSERT INTO sync_runs (
        id, source_system, started_at, finished_at, status,
        records_read, records_upserted, error_message, metadata
      ) VALUES (?, ?, ?, NULL, 'RUNNING', 0, 0, NULL, ?)
      `
    )
    .run(id, sourceSystem, new Date().toISOString(), metadata ? JSON.stringify(metadata) : null);

  return id;
}

export function finalizeSyncRun(input: {
  id: string;
  status: string;
  recordsRead: number;
  recordsUpserted: number;
  errorMessage?: string | null;
}) {
  getDb()
    .prepare(
      `
      UPDATE sync_runs
      SET finished_at = ?, status = ?, records_read = ?, records_upserted = ?, error_message = ?
      WHERE id = ?
      `
    )
    .run(
      new Date().toISOString(),
      input.status,
      input.recordsRead,
      input.recordsUpserted,
      input.errorMessage ?? null,
      input.id
    );
}

export function upsertClickUpUser(input: {
  externalSourceId: string;
  email: string | null;
  name: string;
}) {
  const db = getDb();
  const email = input.email ?? `${slugify(input.name)}-${input.externalSourceId}@clickup.local`;
  const existing = db
    .prepare("SELECT id FROM users WHERE email = ?")
    .get(email) as { id: string } | undefined;

  if (existing) {
    db.prepare(
      "UPDATE users SET name = ?, external_source_id = ?, active = 1, updated_at = ? WHERE id = ?"
    ).run(input.name, input.externalSourceId, new Date().toISOString(), existing.id);
    return { id: existing.id, externalSourceId: input.externalSourceId };
  }

  const id = randomUUID();
  const now = new Date().toISOString();
  db.prepare(
    `
    INSERT INTO users (
      id, email, name, role, external_source_id, active, team_id, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, 1, NULL, ?, ?)
    `
  ).run(id, email, input.name, UserRole.CONTRIBUTOR, input.externalSourceId, now, now);

  return { id, externalSourceId: input.externalSourceId };
}

export function upsertInitiative(input: {
  name: string;
  slug: string;
  status: string;
  externalSourceId: string;
}) {
  const db = getDb();
  const existing = db
    .prepare("SELECT id FROM initiatives WHERE slug = ?")
    .get(input.slug) as { id: string } | undefined;

  if (existing) {
    db.prepare(
      "UPDATE initiatives SET name = ?, status = ?, external_source_id = ?, updated_at = ? WHERE id = ?"
    ).run(input.name, input.status, input.externalSourceId, new Date().toISOString(), existing.id);
    return existing.id;
  }

  const id = randomUUID();
  const now = new Date().toISOString();
  db.prepare(
    `
    INSERT INTO initiatives (
      id, name, slug, status, external_source_id, owner_id, target_date, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, NULL, NULL, ?, ?)
    `
  ).run(id, input.name, input.slug, input.status, input.externalSourceId, now, now);
  return id;
}

export function upsertTask(input: {
  id: string;
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
  ownerId: string | null;
  initiativeId: string | null;
  sourceSystem: SourceSystemValue;
}) {
  const db = getDb();
  const existing = db.prepare("SELECT status FROM tasks WHERE id = ?").get(input.id) as
    | { status: string }
    | undefined;
  const now = new Date().toISOString();

  if (existing) {
    db.prepare(
      `
      UPDATE tasks
      SET
        title = ?, description = ?, external_source_id = ?, source_system = ?, status = ?,
        status_group = ?, priority = ?, estimate_points = ?, estimate_hours = ?, due_date = ?,
        start_date = ?, completed_at = ?, blocked_flag = ?, owner_id = ?, initiative_id = ?,
        updated_at = ?
      WHERE id = ?
      `
    ).run(
      input.title,
      input.description,
      input.externalSourceId,
      input.sourceSystem,
      input.status,
      input.statusGroup,
      input.priority,
      input.estimatePoints,
      input.estimateHours,
      input.dueDate?.toISOString() ?? null,
      input.startDate?.toISOString() ?? null,
      input.completedAt?.toISOString() ?? null,
      input.blockedFlag ? 1 : 0,
      input.ownerId,
      input.initiativeId,
      now,
      input.id
    );

    return { previousStatus: existing.status };
  }

  db.prepare(
    `
    INSERT INTO tasks (
      id, title, description, external_source_id, source_system, status, status_group, priority,
      estimate_points, estimate_hours, due_date, start_date, completed_at, blocked_flag,
      owner_id, initiative_id, parent_task_id, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, ?, ?)
    `
  ).run(
    input.id,
    input.title,
    input.description,
    input.externalSourceId,
    input.sourceSystem,
    input.status,
    input.statusGroup,
    input.priority,
    input.estimatePoints,
    input.estimateHours,
    input.dueDate?.toISOString() ?? null,
    input.startDate?.toISOString() ?? now,
    input.completedAt?.toISOString() ?? null,
    input.blockedFlag ? 1 : 0,
    input.ownerId,
    input.initiativeId,
    now,
    now
  );

  return { previousStatus: null };
}

export function replaceTaskAssignments(taskId: string, userIds: string[]) {
  const db = getDb();
  db.prepare("DELETE FROM task_assignments WHERE task_id = ?").run(taskId);
  const insert = db.prepare(
    "INSERT INTO task_assignments (id, task_id, user_id, assignment_type, created_at) VALUES (?, ?, ?, ?, ?)"
  );
  const now = new Date().toISOString();

  userIds.forEach((userId, index) => {
    insert.run(randomUUID(), taskId, userId, index === 0 ? "PRIMARY" : "COLLABORATOR", now);
  });
}

export function upsertTaskSnapshot(input: {
  taskId: string;
  snapshotDate: Date;
  status: string;
  statusGroup: TaskStatusGroupValue;
  blockedFlag: boolean;
  estimatePoints: number | null;
  estimateHours: number | null;
  dueDate: Date | null;
  completedAt: Date | null;
  ownerIds: string[];
}) {
  const db = getDb();
  const existing = db
    .prepare("SELECT id FROM task_snapshots WHERE task_id = ? AND snapshot_date = ?")
    .get(input.taskId, input.snapshotDate.toISOString()) as { id: string } | undefined;

  if (existing) {
    db.prepare(
      `
      UPDATE task_snapshots
      SET status = ?, status_group = ?, blocked_flag = ?, estimate_points = ?, estimate_hours = ?,
          due_date = ?, completed_at = ?, owner_ids = ?
      WHERE id = ?
      `
    ).run(
      input.status,
      input.statusGroup,
      input.blockedFlag ? 1 : 0,
      input.estimatePoints,
      input.estimateHours,
      input.dueDate?.toISOString() ?? null,
      input.completedAt?.toISOString() ?? null,
      JSON.stringify(input.ownerIds),
      existing.id
    );
    return;
  }

  db.prepare(
    `
    INSERT INTO task_snapshots (
      id, task_id, snapshot_date, status, status_group, blocked_flag, estimate_points,
      estimate_hours, due_date, completed_at, owner_ids
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `
  ).run(
    randomUUID(),
    input.taskId,
    input.snapshotDate.toISOString(),
    input.status,
    input.statusGroup,
    input.blockedFlag ? 1 : 0,
    input.estimatePoints,
    input.estimateHours,
    input.dueDate?.toISOString() ?? null,
    input.completedAt?.toISOString() ?? null,
    JSON.stringify(input.ownerIds)
  );
}

export function insertStatusEvent(input: {
  taskId: string;
  previousStatus: string | null;
  newStatus: string;
  statusGroup: TaskStatusGroupValue;
  changedAt: Date;
}) {
  getDb()
    .prepare(
      `
      INSERT INTO task_status_events (
        id, task_id, previous_status, new_status, status_group, changed_at
      ) VALUES (?, ?, ?, ?, ?, ?)
      `
    )
    .run(
      randomUUID(),
      input.taskId,
      input.previousStatus,
      input.newStatus,
      input.statusGroup,
      input.changedAt.toISOString()
    );
}

function initializeSchema(db: DatabaseSync) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS teams (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      parent_team_id TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      role TEXT NOT NULL,
      external_source_id TEXT,
      active INTEGER NOT NULL,
      team_id TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS initiatives (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      status TEXT NOT NULL,
      external_source_id TEXT,
      owner_id TEXT,
      target_date TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      external_source_id TEXT,
      source_system TEXT NOT NULL,
      status TEXT NOT NULL,
      status_group TEXT NOT NULL,
      priority TEXT,
      estimate_points REAL,
      estimate_hours REAL,
      due_date TEXT,
      start_date TEXT,
      completed_at TEXT,
      blocked_flag INTEGER NOT NULL,
      owner_id TEXT,
      initiative_id TEXT,
      parent_task_id TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS task_assignments (
      id TEXT PRIMARY KEY,
      task_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      assignment_type TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS task_snapshots (
      id TEXT PRIMARY KEY,
      task_id TEXT NOT NULL,
      snapshot_date TEXT NOT NULL,
      status TEXT NOT NULL,
      status_group TEXT NOT NULL,
      blocked_flag INTEGER NOT NULL,
      estimate_points REAL,
      estimate_hours REAL,
      due_date TEXT,
      completed_at TEXT,
      owner_ids TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS task_status_events (
      id TEXT PRIMARY KEY,
      task_id TEXT NOT NULL,
      previous_status TEXT,
      new_status TEXT NOT NULL,
      status_group TEXT NOT NULL,
      changed_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sync_runs (
      id TEXT PRIMARY KEY,
      source_system TEXT NOT NULL,
      started_at TEXT NOT NULL,
      finished_at TEXT,
      status TEXT NOT NULL,
      records_read INTEGER NOT NULL,
      records_upserted INTEGER NOT NULL,
      error_message TEXT,
      metadata TEXT
    );
  `);
}

function seedIfEmpty(db: DatabaseSync) {
  const count = db.prepare("SELECT COUNT(*) as count FROM tasks").get() as { count: number };

  if (count.count > 0) {
    return;
  }

  const now = new Date();
  const teams = [
    { id: "team_platform", name: "Platform", slug: "platform" },
    { id: "team_delivery", name: "Client Delivery", slug: "client-delivery" },
    { id: "team_ops", name: "Operations", slug: "operations" }
  ];

  const users = [
    { id: "user_alicia", email: "alicia@clairio.ai", name: "Alicia", role: UserRole.MANAGER, teamId: "team_delivery" },
    { id: "user_marcus", email: "marcus@clairio.ai", name: "Marcus", role: UserRole.CONTRIBUTOR, teamId: "team_platform" },
    { id: "user_nina", email: "nina@clairio.ai", name: "Nina", role: UserRole.EXECUTIVE, teamId: "team_ops" },
    { id: "user_sam", email: "sam@clairio.ai", name: "Sam", role: UserRole.CONTRIBUTOR, teamId: "team_platform" },
    { id: "user_jules", email: "jules@clairio.ai", name: "Jules", role: UserRole.CONTRIBUTOR, teamId: "team_delivery" }
  ];

  const initiatives = [
    { id: "init_care", name: "Care Ops Visibility", slug: "care-ops-visibility", status: "ON_TRACK", ownerId: "user_nina" },
    { id: "init_onboarding", name: "Client Onboarding Automation", slug: "client-onboarding-automation", status: "AT_RISK", ownerId: "user_alicia" },
    { id: "init_auth", name: "Reliability and Auth", slug: "reliability-and-auth", status: "ON_TRACK", ownerId: "user_marcus" }
  ];

  const tasks = [
    makeTask("task_1", "Refine executive mission control layout", TaskStatusGroup.IN_PROGRESS, "in progress", "user_alicia", "init_care", addDays(now, 2), addDays(now, -5), null, 8),
    makeTask("task_2", "Build ClickUp ingestion worker", TaskStatusGroup.BLOCKED, "blocked", "user_marcus", "init_auth", addDays(now, 1), addDays(now, -6), null, 5),
    makeTask("task_3", "Finalize workload visibility view", TaskStatusGroup.IN_PROGRESS, "in progress", "user_jules", "init_onboarding", addDays(now, 4), addDays(now, -3), null, 3),
    makeTask("task_4", "Publish delivery health definitions", TaskStatusGroup.DONE, "done", "user_nina", "init_care", null, addDays(now, -8), addDays(now, -1), 2),
    makeTask("task_5", "Resolve auth timeout regression", TaskStatusGroup.IN_PROGRESS, "qa review", "user_sam", "init_auth", addDays(now, -1), addDays(now, -7), null, 5),
    makeTask("task_6", "Map legacy ClickUp statuses", TaskStatusGroup.NOT_STARTED, "not started", "user_alicia", "init_care", addDays(now, 6), null, null, 3),
    makeTask("task_7", "Roll out standup command deck", TaskStatusGroup.IN_PROGRESS, "in progress", "user_jules", "init_onboarding", addDays(now, 3), addDays(now, -2), null, 8),
    makeTask("task_8", "Backfill analytics snapshots", TaskStatusGroup.DONE, "done", "user_marcus", "init_auth", null, addDays(now, -9), addDays(now, -3), 5),
    makeTask("task_9", "Create burndown alert digest", TaskStatusGroup.BLOCKED, "blocked", "user_sam", "init_onboarding", addDays(now, 0), addDays(now, -4), null, 2),
    makeTask("task_10", "Investigate unassigned care ops work", TaskStatusGroup.IN_PROGRESS, "in progress", null, "init_care", addDays(now, 2), addDays(now, -2), null, 1)
  ];

  const insertTeam = db.prepare(
    "INSERT INTO teams (id, name, slug, parent_team_id, created_at, updated_at) VALUES (?, ?, ?, NULL, ?, ?)"
  );
  const insertUser = db.prepare(
    "INSERT INTO users (id, email, name, role, external_source_id, active, team_id, created_at, updated_at) VALUES (?, ?, ?, ?, NULL, 1, ?, ?, ?)"
  );
  const insertInitiative = db.prepare(
    "INSERT INTO initiatives (id, name, slug, status, external_source_id, owner_id, target_date, created_at, updated_at) VALUES (?, ?, ?, ?, NULL, ?, NULL, ?, ?)"
  );
  const insertTask = db.prepare(
    `
    INSERT INTO tasks (
      id, title, description, external_source_id, source_system, status, status_group, priority,
      estimate_points, estimate_hours, due_date, start_date, completed_at, blocked_flag, owner_id,
      initiative_id, parent_task_id, created_at, updated_at
    ) VALUES (?, ?, NULL, ?, ?, ?, ?, NULL, ?, ?, ?, ?, ?, ?, ?, ?, NULL, ?, ?)
    `
  );
  const insertAssignment = db.prepare(
    "INSERT INTO task_assignments (id, task_id, user_id, assignment_type, created_at) VALUES (?, ?, ?, ?, ?)"
  );
  const insertSnapshot = db.prepare(
    `
    INSERT INTO task_snapshots (
      id, task_id, snapshot_date, status, status_group, blocked_flag, estimate_points, estimate_hours,
      due_date, completed_at, owner_ids
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `
  );
  const insertStatusEvent = db.prepare(
    "INSERT INTO task_status_events (id, task_id, previous_status, new_status, status_group, changed_at) VALUES (?, ?, ?, ?, ?, ?)"
  );
  const insertSyncRun = db.prepare(
    "INSERT INTO sync_runs (id, source_system, started_at, finished_at, status, records_read, records_upserted, error_message, metadata) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)"
  );

  teams.forEach((team) => insertTeam.run(team.id, team.name, team.slug, now.toISOString(), now.toISOString()));
  users.forEach((user) =>
    insertUser.run(user.id, user.email, user.name, user.role, user.teamId, now.toISOString(), now.toISOString())
  );
  initiatives.forEach((initiative) =>
    insertInitiative.run(
      initiative.id,
      initiative.name,
      initiative.slug,
      initiative.status,
      initiative.ownerId,
      now.toISOString(),
      now.toISOString()
    )
  );

  tasks.forEach((task) => {
    insertTask.run(
      task.id,
      task.title,
      `cu_${task.id}`,
      SourceSystem.CLICKUP,
      task.status,
      task.statusGroup,
      task.estimatePoints,
      task.estimatePoints * 3,
      task.dueDate?.toISOString() ?? null,
      task.startDate?.toISOString() ?? null,
      task.completedAt?.toISOString() ?? null,
      task.statusGroup === TaskStatusGroup.BLOCKED ? 1 : 0,
      task.ownerId,
      task.initiativeId,
      task.createdAt.toISOString(),
      task.updatedAt.toISOString()
    );

    if (task.ownerId) {
      insertAssignment.run(randomUUID(), task.id, task.ownerId, "PRIMARY", now.toISOString());
    }

    buildSnapshots(task, now).forEach((snapshot) => {
      insertSnapshot.run(
        randomUUID(),
        task.id,
        snapshot.snapshotDate.toISOString(),
        snapshot.status,
        snapshot.statusGroup,
        snapshot.statusGroup === TaskStatusGroup.BLOCKED ? 1 : 0,
        task.estimatePoints,
        task.estimatePoints * 3,
        task.dueDate?.toISOString() ?? null,
        snapshot.statusGroup === TaskStatusGroup.DONE ? task.completedAt?.toISOString() ?? null : null,
        JSON.stringify(task.ownerId ? [task.ownerId] : [])
      );
    });

    buildStatusEvents(task, now).forEach((event) => {
      insertStatusEvent.run(
        randomUUID(),
        task.id,
        event.previousStatus,
        event.newStatus,
        event.statusGroup,
        event.changedAt.toISOString()
      );
    });
  });

  insertSyncRun.run(
    randomUUID(),
    SourceSystem.CLICKUP,
    addMinutes(now, -40).toISOString(),
    addMinutes(now, -39).toISOString(),
    "SUCCEEDED",
    52,
    10,
    null,
    JSON.stringify({ mode: "seed", freshness: "recent" })
  );
  insertSyncRun.run(
    randomUUID(),
    SourceSystem.CLICKUP,
    addMinutes(now, -15).toISOString(),
    addMinutes(now, -14).toISOString(),
    "SUCCEEDED",
    12,
    4,
    null,
    JSON.stringify({ mode: "incremental", freshness: "current" })
  );
}

function makeTask(
  id: string,
  title: string,
  statusGroup: TaskStatusGroupValue,
  status: string,
  ownerId: string | null,
  initiativeId: string,
  dueDate: Date | null,
  startDate: Date | null,
  completedAt: Date | null,
  estimatePoints: number
) {
  return {
    id,
    title,
    statusGroup,
    status,
    ownerId,
    initiativeId,
    dueDate,
    startDate,
    completedAt,
    estimatePoints,
    createdAt: startDate ?? new Date(),
    updatedAt: completedAt ?? new Date()
  };
}

function buildSnapshots(task: ReturnType<typeof makeTask>, now: Date) {
  const snapshots = [];

  for (let daysAgo = 5; daysAgo >= 0; daysAgo -= 1) {
    const snapshotDate = startOfDay(addDays(now, -daysAgo));

    if (task.startDate && snapshotDate < startOfDay(task.startDate)) {
      continue;
    }

    const done = task.completedAt && snapshotDate >= startOfDay(task.completedAt);
    snapshots.push({
      snapshotDate,
      status: done ? "done" : task.status,
      statusGroup: done ? TaskStatusGroup.DONE : task.statusGroup
    });
  }

  return snapshots;
}

function buildStatusEvents(task: ReturnType<typeof makeTask>, now: Date) {
  const events = [
    {
      previousStatus: null,
      newStatus: task.statusGroup === TaskStatusGroup.NOT_STARTED ? "not started" : "in progress",
      statusGroup:
        task.statusGroup === TaskStatusGroup.NOT_STARTED
          ? TaskStatusGroup.NOT_STARTED
          : TaskStatusGroup.IN_PROGRESS,
      changedAt: task.startDate ?? addDays(now, -1)
    }
  ];

  if (task.statusGroup === TaskStatusGroup.BLOCKED) {
    events.push({
      previousStatus: "in progress",
      newStatus: "blocked",
      statusGroup: TaskStatusGroup.BLOCKED,
      changedAt: addDays(now, -2)
    });
  }

  if (task.completedAt) {
    events.push({
      previousStatus: "in progress",
      newStatus: "done",
      statusGroup: TaskStatusGroup.DONE,
      changedAt: task.completedAt
    });
  }

  return events;
}

function mapTaskRow(row: TaskRecord): LocalTaskRow {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    externalSourceId: row.external_source_id,
    sourceSystem: row.source_system,
    status: row.status,
    statusGroup: row.status_group,
    priority: row.priority,
    estimatePoints: row.estimate_points,
    estimateHours: row.estimate_hours,
    dueDate: toDate(row.due_date),
    startDate: toDate(row.start_date),
    completedAt: toDate(row.completed_at),
    blockedFlag: Boolean(row.blocked_flag),
    ownerId: row.owner_id,
    initiativeId: row.initiative_id,
    parentTaskId: row.parent_task_id,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
    ownerName: row.owner_name,
    initiativeName: row.initiative_name
  };
}

function toDate(value: string | null) {
  return value ? new Date(value) : null;
}

function startOfDay(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function addDays(date: Date, days: number) {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
}

function addMinutes(date: Date, minutes: number) {
  return new Date(date.getTime() + minutes * 60 * 1000);
}
