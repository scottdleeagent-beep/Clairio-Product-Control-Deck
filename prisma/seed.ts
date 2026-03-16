import { PrismaClient, SourceSystem, TaskStatusGroup, UserRole } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const platformTeam = await prisma.team.upsert({
    where: { slug: "platform" },
    update: {},
    create: {
      name: "Platform",
      slug: "platform"
    }
  });

  const deliveryTeam = await prisma.team.upsert({
    where: { slug: "client-delivery" },
    update: {},
    create: {
      name: "Client Delivery",
      slug: "client-delivery"
    }
  });

  const [alicia, marcus, nina] = await Promise.all([
    prisma.user.upsert({
      where: { email: "alicia@clairio.ai" },
      update: {},
      create: {
        email: "alicia@clairio.ai",
        name: "Alicia",
        role: UserRole.MANAGER,
        teamId: deliveryTeam.id
      }
    }),
    prisma.user.upsert({
      where: { email: "marcus@clairio.ai" },
      update: {},
      create: {
        email: "marcus@clairio.ai",
        name: "Marcus",
        role: UserRole.CONTRIBUTOR,
        teamId: platformTeam.id
      }
    }),
    prisma.user.upsert({
      where: { email: "nina@clairio.ai" },
      update: {},
      create: {
        email: "nina@clairio.ai",
        name: "Nina",
        role: UserRole.EXECUTIVE,
        teamId: deliveryTeam.id
      }
    })
  ]);

  const initiative = await prisma.initiative.upsert({
    where: { slug: "care-ops-visibility" },
    update: {},
    create: {
      name: "Care Ops Visibility",
      slug: "care-ops-visibility",
      status: "ON_TRACK",
      ownerId: nina.id
    }
  });

  await prisma.task.upsert({
    where: { id: "seed-task-alicia" },
    update: {},
    create: {
      id: "seed-task-alicia",
      title: "Refine daily command center dashboard",
      externalSourceId: "cu_1001",
      sourceSystem: SourceSystem.CLICKUP,
      status: "in progress",
      statusGroup: TaskStatusGroup.IN_PROGRESS,
      blockedFlag: false,
      ownerId: alicia.id,
      initiativeId: initiative.id
    }
  });

  await prisma.task.upsert({
    where: { id: "seed-task-marcus" },
    update: {},
    create: {
      id: "seed-task-marcus",
      title: "Build initial ClickUp ingestion worker",
      externalSourceId: "cu_1002",
      sourceSystem: SourceSystem.CLICKUP,
      status: "blocked",
      statusGroup: TaskStatusGroup.BLOCKED,
      blockedFlag: true,
      ownerId: marcus.id,
      initiativeId: initiative.id
    }
  });
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

