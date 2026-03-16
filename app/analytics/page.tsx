import { DashboardShell } from "@/components/dashboard-shell";
import { DashboardCard } from "@/components/dashboard-card";
import { dashboardData } from "@/lib/mock-data";

export default function AnalyticsPage() {
  return (
    <DashboardShell
      eyebrow="Reporting"
      title="Analytics"
      description="Trend views that leadership can trust because the platform stores historical snapshots."
    >
      <section className="three-up">
        {dashboardData.analytics.map((metric) => (
          <DashboardCard
            key={metric.title}
            title={metric.title}
            subtitle={metric.window}
            footer={metric.note}
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
    </DashboardShell>
  );
}

