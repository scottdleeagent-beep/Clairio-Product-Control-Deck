import { DashboardShell } from "@/components/dashboard-shell";
import { DashboardCard } from "@/components/dashboard-card";
import { EpicPortfolioList } from "@/components/epic-portfolio-list";
import { getTeamViewData } from "@/lib/dashboard";

export default async function TeamPage() {
  const dashboardData = await getTeamViewData();

  return (
    <DashboardShell
      eyebrow="Execution"
      title="Team View"
      description="Use this view for Clairio Suite standups, staffing conversations, and overload checks."
      status="Team workloads scoped to Clairio Suite"
    >
      <section className="table-panel panel">
        <div className="table-header">
          <h2>Current ownership</h2>
          <p className="muted">Focused on in-flight work, blockers, and due-date risk.</p>
        </div>
        <table>
          <thead>
            <tr>
              <th>Owner</th>
              <th>Focus</th>
              <th>Active</th>
              <th>Blocked</th>
              <th>Due This Week</th>
            </tr>
          </thead>
          <tbody>
            {dashboardData.workstreams.map((group) => (
              <tr key={group.owner}>
                <td>{group.owner}</td>
                <td>{group.focus}</td>
                <td>{group.active}</td>
                <td>{group.blocked}</td>
                <td>{group.dueThisWeek}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="three-up">
        {dashboardData.teamHighlights.map((item) => (
          <DashboardCard
            key={item.title}
            title={item.title}
            subtitle={item.subtitle}
            footer={item.footer}
          >
            <p className="card-number">{item.value}</p>
          </DashboardCard>
        ))}
      </section>

      <section className="dashboard-grid">
        <DashboardCard
          title="Epic load"
          subtitle="Where the team is concentrated"
          footer="This view helps you see which Clairio Suite epics are absorbing the most active work."
          accent="gold"
        >
          <EpicPortfolioList items={dashboardData.epicPortfolio} />
        </DashboardCard>
        <DashboardCard
          title="Standup framing"
          subtitle="How to use this page"
          footer="Use owners for daily execution, and use epic load to catch resourcing imbalances earlier."
        >
          <div className="bullet-stack">
            <p>Start with blocked owners, then move to high-open epics.</p>
            <p>Check overdue work inside the epics carrying the most open tasks.</p>
            <p>Use the epic count and owner count together before reassigning work.</p>
          </div>
        </DashboardCard>
      </section>
    </DashboardShell>
  );
}
