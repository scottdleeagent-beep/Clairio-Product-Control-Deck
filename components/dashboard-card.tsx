type DashboardCardProps = {
  title: string;
  subtitle?: string;
  accent?: "teal" | "coral" | "gold";
  footer?: string;
  children: React.ReactNode;
};

export function DashboardCard({
  title,
  subtitle,
  accent = "teal",
  footer,
  children
}: DashboardCardProps) {
  return (
    <article className={`dashboard-card panel accent-${accent}`}>
      <header className="card-header">
        <div>
          <h3>{title}</h3>
          {subtitle ? <span>{subtitle}</span> : null}
        </div>
      </header>
      <div className="card-body">{children}</div>
      {footer ? <footer className="card-footer">{footer}</footer> : null}
    </article>
  );
}

