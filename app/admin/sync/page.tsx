import { DashboardShell } from "@/components/dashboard-shell";
import { DashboardCard } from "@/components/dashboard-card";
import { SyncTrigger } from "@/components/sync-trigger";
import { getSyncAdminData } from "@/lib/dashboard";

export default async function SyncAdminPage() {
  const data = await getSyncAdminData();

  return (
    <DashboardShell
      eyebrow="Operations"
      title="Sync Admin"
      description="A control room for ingestion freshness, mapping coverage, and recent ClickUp runs."
      status={data.readyForSync ? "ClickUp credentials detected" : "Running in seed-only mode"}
    >
      <section className="three-up">
        {data.metrics.map((metric) => (
          <DashboardCard
            key={metric.label}
            title={metric.label}
            subtitle="Current state"
            footer="These numbers update as sync runs complete."
          >
            <p className="card-number">{metric.value}</p>
          </DashboardCard>
        ))}
      </section>

      <section className="dashboard-grid">
        <DashboardCard
          title="Run controls"
          subtitle="ClickUp ingestion"
          footer="You can seed locally without credentials, then switch to live ClickUp when tokens are configured."
          accent="gold"
        >
          <div className="bullet-stack">
            <p>Use this screen to monitor ingestion freshness and coverage.</p>
            <p>Recent runs are persisted in the database for auditability.</p>
            <p>Live ClickUp sync is disabled until credentials are configured.</p>
          </div>
          <SyncTrigger disabled={!data.readyForSync} />
        </DashboardCard>

        <DashboardCard
          title="Recent sync runs"
          subtitle="Latest 10"
          footer="This is where data quality and freshness become visible to operators."
        >
          <div className="run-list">
            {data.runs.map((run) => (
              <div className="run-row" key={run.id}>
                <div>
                  <strong>{run.status}</strong>
                  <p>{run.startedAt.toLocaleString()}</p>
                </div>
                <div className="run-meta">
                  <span>{run.recordsRead} read</span>
                  <span>{run.recordsUpserted} upserted</span>
                </div>
              </div>
            ))}
          </div>
        </DashboardCard>
      </section>
    </DashboardShell>
  );
}
