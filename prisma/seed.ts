import { PrismaClient, SourceSystem, TaskStatusGroup, UserRole } from "@prisma/client";

const prisma = new PrismaClient();

type SeedTask = {
  id: string;
  title: string;
  status: string;
  statusGroup: TaskStatusGroup;
  ownerEmail?: string;
  initiativeSlug: string;
  dueInDays?: number;
  startedDaysAgo?: number;
  completedDaysAgo?: number;
  blockedFlag?: boolean;
  estimatePoints?: number;
};

async function main() {
  await prisma.taskAssignment.deleteMany();
  await prisma.taskSnapshot.deleteMany();
  await prisma.taskStatusEvent.deleteMany();
  await prisma.task.deleteMany();
  await prisma.initiative.deleteMany();
  await prisma.user.deleteMany();
  await prisma.team.deleteMany();
  await prisma.syncRun.deleteMany();

  const [platformTeam, deliveryTeam, operationsTeam] = await Promise.all([
    prisma.team.create({
      data: {
        name: "Platform",
        slug: "platform"
      }
    }),
    prisma.team.create({
      data: {
        name: "Client Delivery",
        slug: "client-delivery"
      }
    }),
    prisma.team.create({
      data: {
        name: "Operations",
        slug: "operations"
      }
    })
  ]);

  const users = await Promise.all([
    prisma.user.create({
      data: {
        email: "alicia@clairio.ai",
        name: "Alicia",
        role: UserRole.MANAGER,
        teamId: deliveryTeam.id
      }
    }),
    prisma.user.create({
      data: {
        email: "marcus@clairio.ai",
        name: "Marcus",
        role: UserRole.CONTRIBUTOR,
        teamId: platformTeam.id
      }
    }),
    prisma.user.create({
      data: {
        email: "nina@clairio.ai",
        name: "Nina",
        role: UserRole.EXECUTIVE,
        teamId: operationsTeam.id
      }
    }),
    prisma.user.create({
      data: {
        email: "sam@clairio.ai",
        name: "Sam",
        role: UserRole.CONTRIBUTOR,
        teamId: platformTeam.id
      }
    }),
    prisma.user.create({
      data: {
        email: "jules@clairio.ai",
        name: "Jules",
        role: UserRole.CONTRIBUTOR,
        teamId: deliveryTeam.id
      }
    })
  ]);

  const usersByEmail = new Map(users.map((user) => [user.email, user]));

  const initiatives = await Promise.all([
    prisma.initiative.create({
      data: {
        name: "Care Ops Visibility",
        slug: "care-ops-visibility",
        status: "ON_TRACK",
        ownerId: usersByEmail.get("nina@clairio.ai")?.id
      }
    }),
    prisma.initiative.create({
      data: {
        name: "Client Onboarding Automation",
        slug: "client-onboarding-automation",
        status: "AT_RISK",
        ownerId: usersByEmail.get("alicia@clairio.ai")?.id
      }
    }),
    prisma.initiative.create({
      data: {
        name: "Reliability and Auth",
        slug: "reliability-and-auth",
        status: "ON_TRACK",
        ownerId: usersByEmail.get("marcus@clairio.ai")?.id
      }
    })
  ]);

  const initiativesBySlug = new Map(initiatives.map((initiative) => [initiative.slug, initiative]));
  const now = new Date();
  const day = 24 * 60 * 60 * 1000;

  const tasks: SeedTask[] = [
    {
      id: "seed-task-1",
      title: "Refine executive mission control layout",
      status: "in progress",
      statusGroup: TaskStatusGroup.IN_PROGRESS,
      ownerEmail: "alicia@clairio.ai",
      initiativeSlug: "care-ops-visibility",
      dueInDays: 2,
      startedDaysAgo: 5,
      estimatePoints: 8
    },
    {
      id: "seed-task-2",
      title: "Build ClickUp ingestion worker",
      status: "blocked",
      statusGroup: TaskStatusGroup.BLOCKED,
      ownerEmail: "marcus@clairio.ai",
      initiativeSlug: "reliability-and-auth",
      dueInDays: 1,
      startedDaysAgo: 6,
      blockedFlag: true,
      estimatePoints: 5
    },
    {
      id: "seed-task-3",
      title: "Finalize workload visibility view",
      status: "in progress",
      statusGroup: TaskStatusGroup.IN_PROGRESS,
      ownerEmail: "jules@clairio.ai",
      initiativeSlug: "client-onboarding-automation",
      dueInDays: 4,
      startedDaysAgo: 3,
      estimatePoints: 3
    },
    {
      id: "seed-task-4",
      title: "Publish delivery health definitions",
      status: "done",
      statusGroup: TaskStatusGroup.DONE,
      ownerEmail: "nina@clairio.ai",
      initiativeSlug: "care-ops-visibility",
      completedDaysAgo: 1,
      startedDaysAgo: 8,
      estimatePoints: 2
    },
    {
      id: "seed-task-5",
      title: "Resolve auth timeout regression",
      status: "qa review",
      statusGroup: TaskStatusGroup.IN_PROGRESS,
      ownerEmail: "sam@clairio.ai",
      initiativeSlug: "reliability-and-auth",
      dueInDays: -1,
      startedDaysAgo: 7,
      estimatePoints: 5
    },
    {
      id: "seed-task-6",
      title: "Map legacy ClickUp statuses",
      status: "not started",
      statusGroup: TaskStatusGroup.NOT_STARTED,
      ownerEmail: "alicia@clairio.ai",
      initiativeSlug: "care-ops-visibility",
      dueInDays: 6,
      estimatePoints: 3
    },
    {
      id: "seed-task-7",
      title: "Roll out standup command deck",
      status: "in progress",
      statusGroup: TaskStatusGroup.IN_PROGRESS,
      ownerEmail: "jules@clairio.ai",
      initiativeSlug: "client-onboarding-automation",
      dueInDays: 3,
      startedDaysAgo: 2,
      estimatePoints: 8
    },
    {
      id: "seed-task-8",
      title: "Backfill analytics snapshots",
      status: "done",
      statusGroup: TaskStatusGroup.DONE,
      ownerEmail: "marcus@clairio.ai",
      initiativeSlug: "reliability-and-auth",
      completedDaysAgo: 3,
      startedDaysAgo: 9,
      estimatePoints: 5
    },
    {
      id: "seed-task-9",
      title: "Create burndown alert digest",
      status: "blocked",
      statusGroup: TaskStatusGroup.BLOCKED,
      ownerEmail: "sam@clairio.ai",
      initiativeSlug: "client-onboarding-automation",
      dueInDays: 0,
      startedDaysAgo: 4,
      blockedFlag: true,
      estimatePoints: 2
    },
    {
      id: "seed-task-10",
      title: "Investigate unassigned care ops work",
      status: "in progress",
      statusGroup: TaskStatusGroup.IN_PROGRESS,
      initiativeSlug: "care-ops-visibility",
      dueInDays: 2,
      startedDaysAgo: 2,
      estimatePoints: 1
    }
  ];

  for (const task of tasks) {
    const owner = task.ownerEmail ? usersByEmail.get(task.ownerEmail) : undefined;
    const initiative = initiativesBySlug.get(task.initiativeSlug);
    const createdAt = new Date(now.getTime() - (task.startedDaysAgo ?? 1) * day);
    const dueDate =
      task.dueInDays === undefined ? null : new Date(now.getTime() + task.dueInDays * day);
    const completedAt =
      task.completedDaysAgo === undefined
        ? null
        : new Date(now.getTime() - task.completedDaysAgo * day);

    const record = await prisma.task.create({
      data: {
        id: task.id,
        title: task.title,
        externalSourceId: `cu_${task.id}`,
        sourceSystem: SourceSystem.CLICKUP,
        status: task.status,
        statusGroup: task.statusGroup,
        blockedFlag: task.blockedFlag ?? false,
        ownerId: owner?.id,
        initiativeId: initiative?.id,
        dueDate,
        startDate: createdAt,
        completedAt,
        estimatePoints: task.estimatePoints ?? null,
        createdAt,
        updatedAt: completedAt ?? now
      }
    });

    if (owner) {
      await prisma.taskAssignment.create({
        data: {
          taskId: record.id,
          userId: owner.id,
          assignmentType: "PRIMARY"
        }
      });
    }

    const snapshots = buildSnapshots({
      task,
      taskId: record.id,
      ownerId: owner?.id ?? null,
      dueDate,
      completedAt,
      createdAt,
      now
    });

    for (const snapshot of snapshots) {
      await prisma.taskSnapshot.create({
        data: snapshot
      });
    }

    const statusEvents = buildStatusEvents({
      taskId: record.id,
      task,
      createdAt,
      completedAt,
      now
    });

    for (const statusEvent of statusEvents) {
      await prisma.taskStatusEvent.create({
        data: statusEvent
      });
    }
  }

  await prisma.syncRun.createMany({
    data: [
      {
        sourceSystem: SourceSystem.CLICKUP,
        startedAt: new Date(now.getTime() - 40 * 60 * 1000),
        finishedAt: new Date(now.getTime() - 39 * 60 * 1000),
        status: "SUCCEEDED",
        recordsRead: 52,
        recordsUpserted: 10,
        metadata: {
          mode: "seed",
          freshness: "recent"
        }
      },
      {
        sourceSystem: SourceSystem.CLICKUP,
        startedAt: new Date(now.getTime() - 15 * 60 * 1000),
        finishedAt: new Date(now.getTime() - 14 * 60 * 1000),
        status: "SUCCEEDED",
        recordsRead: 12,
        recordsUpserted: 4,
        metadata: {
          mode: "incremental",
          freshness: "current"
        }
      }
    ]
  });
}

function buildSnapshots(input: {
  task: SeedTask;
  taskId: string;
  ownerId: string | null;
  dueDate: Date | null;
  completedAt: Date | null;
  createdAt: Date;
  now: Date;
}) {
  const snapshots = [];

  for (let daysAgo = 5; daysAgo >= 0; daysAgo -= 1) {
    const snapshotDate = startOfDay(new Date(input.now.getTime() - daysAgo * 24 * 60 * 60 * 1000));
    const isBeforeTask = snapshotDate < startOfDay(input.createdAt);

    if (isBeforeTask) {
      continue;
    }

    const isDone = input.completedAt !== null && snapshotDate >= startOfDay(input.completedAt);
    const statusGroup = isDone
      ? TaskStatusGroup.DONE
      : daysAgo > 3 && input.task.statusGroup === TaskStatusGroup.NOT_STARTED
        ? TaskStatusGroup.NOT_STARTED
        : input.task.statusGroup;
    const status = isDone ? "done" : input.task.status;

    snapshots.push({
      taskId: input.taskId,
      snapshotDate,
      status,
      statusGroup,
      blockedFlag: statusGroup === TaskStatusGroup.BLOCKED,
      estimatePoints: input.task.estimatePoints ?? null,
      estimateHours: input.task.estimatePoints ? input.task.estimatePoints * 3 : null,
      dueDate: input.dueDate,
      completedAt: isDone ? input.completedAt : null,
      ownerIds: input.ownerId ? [input.ownerId] : []
    });
  }

  return snapshots;
}

function buildStatusEvents(input: {
  taskId: string;
  task: SeedTask;
  createdAt: Date;
  completedAt: Date | null;
  now: Date;
}) {
  const events = [
    {
      taskId: input.taskId,
      previousStatus: null,
      newStatus:
        input.task.statusGroup === TaskStatusGroup.NOT_STARTED ? "not started" : "in progress",
      statusGroup:
        input.task.statusGroup === TaskStatusGroup.NOT_STARTED
          ? TaskStatusGroup.NOT_STARTED
          : TaskStatusGroup.IN_PROGRESS,
      changedAt: input.createdAt
    }
  ];

  if (input.task.statusGroup === TaskStatusGroup.BLOCKED) {
    events.push({
      taskId: input.taskId,
      previousStatus: "in progress",
      newStatus: "blocked",
      statusGroup: TaskStatusGroup.BLOCKED,
      changedAt: new Date(input.now.getTime() - 2 * 24 * 60 * 60 * 1000)
    });
  }

  if (input.completedAt) {
    events.push({
      taskId: input.taskId,
      previousStatus: "in progress",
      newStatus: "done",
      statusGroup: TaskStatusGroup.DONE,
      changedAt: input.completedAt
    });
  }

  return events;
}

function startOfDay(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
