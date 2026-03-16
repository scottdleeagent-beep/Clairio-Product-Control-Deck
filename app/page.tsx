import { DashboardShell } from "@/components/dashboard-shell";
import { DashboardCard } from "@/components/dashboard-card";
import { BurndownChart } from "@/components/burndown-chart";
import { WorkstreamBoard } from "@/components/workstream-board";
import { dashboardData } from "@/lib/mock-data";

export default function HomePage() {
  return (
    <DashboardShell
      eyebrow="Clairio AI"
      title="Mission Control"
      description="A shared operational view of ownership, throughput, and risk across the company."
    >
      <section className="hero-grid">
        <div className="hero-copy panel">
          <p className="kicker">Today at a glance</p>
          <h2>See the shape of work before delivery drift turns into firefighting.</h2>
          <p className="muted">
            Start with ClickUp visibility, then grow into a fully native operating
            system for planning, coordination, and reporting.
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
    </DashboardShell>
  );
}

