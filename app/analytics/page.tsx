import { DashboardShell } from "@/components/dashboard-shell";
import { DashboardCard } from "@/components/dashboard-card";
import { BurndownChart } from "@/components/burndown-chart";
import { EpicPortfolioList } from "@/components/epic-portfolio-list";
import { InitiativeHealthList } from "@/components/initiative-health-list";
import { getAnalyticsViewData } from "@/lib/dashboard";

export default async function AnalyticsPage() {
  const dashboardData = await getAnalyticsViewData();

  return (
    <DashboardShell
      eyebrow="Reporting"
      title="Analytics"
      description="Trend views for Clairio Suite that leadership can trust because the platform stores historical snapshots."
      status="Analytics computed only from Clairio Suite history"
    >
      <section className="three-up">
        {dashboardData.analytics.map((metric) => (
          <DashboardCard
            key={metric.title}
            title={metric.title}
            subtitle={metric.window}
            footer={metric.note}
            accent="gold"
          >
            <div className="trend-card">
              <strong>{metric.value}</strong>
              <span className={metric.change.startsWith("+") ? "trend-up" : "trend-down"}>
                {metric.change}
              </span>
            </div>
          </DashboardCard>
        ))}
      </section>

      <section className="dashboard-grid">
        <DashboardCard
          title="Burndown history"
          subtitle="Recent snapshot coverage"
          footer="Remaining work is separated from completed work from the same daily snapshot set."
        >
          <BurndownChart points={dashboardData.burndown} />
        </DashboardCard>
        <DashboardCard
          title="Epic health"
          subtitle="Portfolio view"
          footer="This is the review layer leadership can use before opening individual task detail."
          accent="coral"
        >
          <InitiativeHealthList items={dashboardData.initiativeHealth} />
        </DashboardCard>
      </section>

      <section className="dashboard-grid">
        <DashboardCard
          title="Epic distribution"
          subtitle="Open vs done"
          footer="This makes it easier to spot which Clairio Suite epics are growing faster than they are closing."
          accent="gold"
        >
          <EpicPortfolioList items={dashboardData.epicPortfolio} />
        </DashboardCard>
        <DashboardCard
          title="Interpretation"
          subtitle="What the trend means"
          footer="Use this with burndown and blocked duration to decide whether the issue is planning, staffing, or dependency management."
        >
          <div className="bullet-stack">
            <p>High open and low done inside one epic usually points to bottlenecked execution.</p>
            <p>High blocked counts inside one epic usually point to dependency or ownership gaps.</p>
            <p>Healthy epics should burn down while keeping owner concentration reasonable.</p>
          </div>
        </DashboardCard>
      </section>
    </DashboardShell>
  );
}
