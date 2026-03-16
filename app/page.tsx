import { DashboardShell } from "@/components/dashboard-shell";
import { DashboardCard } from "@/components/dashboard-card";
import { BurndownChart } from "@/components/burndown-chart";
import { WorkstreamBoard } from "@/components/workstream-board";
import { getOverviewData } from "@/lib/dashboard";

export default async function HomePage() {
  const dashboardData = await getOverviewData();

  return (
    <DashboardShell
      eyebrow="Clairio AI"
      title="Mission Control"
      description="A shared operational view of ownership, throughput, and risk across the company."
      status={dashboardData.syncStatus}
    >
      <section className="hero-grid">
        <div className="hero-copy panel">
          <p className="kicker">Today at a glance</p>
          <h2>See the shape of execution before delivery drift turns into noise.</h2>
          <p className="muted">
            Mission Control gives Clairio one operational surface for ownership,
            blockers, trends, and burndown, starting with ClickUp and growing into a
            native system of record.
          </p>
          <div className="hero-stats">
            {dashboardData.summary.map((item) => (
              <div className="stat-chip" key={item.label}>
                <span>{item.label}</span>
                <strong>{item.value}</strong>
              </div>
            ))}
          </div>
        </div>
        <DashboardCard
          title="Delivery posture"
          subtitle="This week"
          accent="coral"
          footer="Updated from ClickUp every 15 minutes"
        >
          <div className="signal-list">
            {dashboardData.signals.map((signal) => (
              <div className="signal-row" key={signal.label}>
                <div>
                  <p>{signal.label}</p>
                  <span>{signal.detail}</span>
                </div>
                <strong>{signal.value}</strong>
              </div>
            ))}
          </div>
        </DashboardCard>
      </section>

      <section className="dashboard-grid">
        <DashboardCard
          title="Sprint burndown"
          subtitle="Platform + Client Delivery"
          footer="Scope changes are separated from completions for cleaner trend analysis."
        >
          <BurndownChart points={dashboardData.burndown} />
        </DashboardCard>
        <DashboardCard
          title="Who owns what"
          subtitle="Active work by person"
          footer="Grouped by current focus, with blockers and overdue work visible."
        >
          <WorkstreamBoard groups={dashboardData.workstreams} />
        </DashboardCard>
      </section>

      <section className="three-up">
        <DashboardCard
          title="Operational cadence"
          subtitle="What this replaces"
          footer="This product becomes the control surface while ClickUp remains the source of truth during transition."
          accent="gold"
        >
          <div className="bullet-stack">
            <p>Leadership review with delivery posture and initiative risk.</p>
            <p>Standups with owner-based workload and blockers.</p>
            <p>Planning with real burndown, scope drift, and overdue work.</p>
          </div>
        </DashboardCard>
        <DashboardCard
          title="Quality of data"
          subtitle="Why dashboards are trusted"
          footer="Historical snapshots and explicit status mapping prevent misleading trends."
        >
          <div className="bullet-stack">
            <p>Daily snapshots preserve reporting history even when tasks change later.</p>
            <p>Blocked work is separated from generic in-progress activity.</p>
            <p>Sync freshness is visible directly in the shell status rail.</p>
          </div>
        </DashboardCard>
        <DashboardCard
          title="Migration path"
          subtitle="ClickUp to Clairio"
          footer="The app is designed to absorb native workflows in later phases."
          accent="coral"
        >
          <div className="bullet-stack">
            <p>Phase 1: read-only visibility and analytics.</p>
            <p>Phase 2: blockers, dependencies, and coordination workflows.</p>
            <p>Phase 3: native task execution and ClickUp retirement.</p>
          </div>
        </DashboardCard>
      </section>
    </DashboardShell>
  );
}
