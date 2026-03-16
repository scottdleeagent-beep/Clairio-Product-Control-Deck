import { DashboardShell } from "@/components/dashboard-shell";
import { ConnectClickUpButton } from "@/components/connect-clickup-button";
import { DashboardCard } from "@/components/dashboard-card";
import { SyncTrigger } from "@/components/sync-trigger";
import { getSyncAdminData } from "@/lib/dashboard";

export default async function SyncAdminPage() {
  const data = await getSyncAdminData();

  return (
    <DashboardShell
      eyebrow="Operations"
      title="Sync Admin"
      description="A control room for Clairio Suite ingestion freshness, mapping coverage, and recent ClickUp runs."
      status={
        data.oauthConnected
          ? `ClickUp connected across ${data.oauthWorkspaceCount} workspace(s), scoped to Clairio Suite`
          : data.readyForSync
            ? "ClickUp credentials detected for Clairio Suite"
            : "Running in seed-only mode"
      }
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
          subtitle="Clairio Suite ingestion"
          footer="Only work from the Clairio Suite folder is included in the dashboard."
          accent="gold"
        >
          <div className="bullet-stack">
            <p>Use this screen to monitor Clairio Suite ingestion freshness and coverage.</p>
            <p>Recent runs are persisted in the database for auditability.</p>
            <p>
              {data.oauthConnected
                ? "OAuth is connected. Sync now pulls only the Clairio Suite folder."
                : "Connect ClickUp with OAuth or add a personal token to enable live Clairio Suite sync."}
            </p>
          </div>
          <ConnectClickUpButton disabled={!data.hasOAuthConfig} />
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
