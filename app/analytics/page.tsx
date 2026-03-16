import { DashboardShell } from "@/components/dashboard-shell";
import { DashboardCard } from "@/components/dashboard-card";
import { BurndownChart } from "@/components/burndown-chart";
import { InitiativeHealthList } from "@/components/initiative-health-list";
import { getAnalyticsViewData } from "@/lib/dashboard";

export default async function AnalyticsPage() {
  const dashboardData = await getAnalyticsViewData();

  return (
    <DashboardShell
      eyebrow="Reporting"
      title="Analytics"
      description="Trend views that leadership can trust because the platform stores historical snapshots."
      status="Analytics computed from task snapshots and status history"
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
          title="Initiative health"
          subtitle="Portfolio view"
          footer="This is the review layer leadership can use before opening individual task detail."
          accent="coral"
        >
          <InitiativeHealthList items={dashboardData.initiativeHealth} />
        </DashboardCard>
      </section>
    </DashboardShell>
  );
}
