import { DashboardShell } from "@/components/dashboard-shell";
import { DashboardCard } from "@/components/dashboard-card";
import { BurndownChart } from "@/components/burndown-chart";
import { EpicPortfolioList } from "@/components/epic-portfolio-list";
import { WorkstreamBoard } from "@/components/workstream-board";
import { getOverviewData } from "@/lib/dashboard";

export default async function HomePage() {
  const dashboardData = await getOverviewData();

  return (
    <DashboardShell
      eyebrow="Clairio AI"
      title="Mission Control"
      description="A shared operational view of ownership, throughput, and risk for everything inside the Clairio Suite folder."
      status={dashboardData.syncStatus}
    >
      <section className="hero-grid">
        <div className="hero-copy panel">
          <p className="kicker">Today at a glance</p>
          <h2>See the shape of execution before delivery drift turns into noise.</h2>
          <p className="muted">
            Mission Control is now scoped specifically to the Clairio Suite folder in ClickUp,
            so the dashboard reflects the actual product epics, tasks, blockers, trends,
            and burndown for Clairio product delivery.
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
          subtitle="Clairio Suite delivery"
          footer="Burndown is now computed only from work inside the Clairio Suite folder."
        >
          <BurndownChart points={dashboardData.burndown} />
        </DashboardCard>
        <DashboardCard
          title="Who owns what"
          subtitle="Active Clairio Suite work by person"
          footer="Grouped by current epic focus, with blockers and due-date pressure visible."
        >
          <WorkstreamBoard groups={dashboardData.workstreams} />
        </DashboardCard>
      </section>

      <section className="dashboard-grid">
        <DashboardCard
          title="Epic portfolio"
          subtitle="Clairio Suite"
          footer="Lists inside the Clairio Suite folder are treated as the active delivery epics."
          accent="gold"
        >
          <EpicPortfolioList items={dashboardData.epicPortfolio} />
        </DashboardCard>
        <DashboardCard
          title="Epic focus"
          subtitle="What leadership should watch"
          footer="This keeps the Mission Control layer tied to the actual product breakdown instead of generic task counts."
          accent="coral"
        >
          <div className="bullet-stack">
            <p>Open work shows where execution load is accumulating by epic.</p>
            <p>Blocked counts reveal which epics need intervention, not just which tasks are stuck.</p>
            <p>Owner coverage shows whether work is concentrated too narrowly inside an epic.</p>
          </div>
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
