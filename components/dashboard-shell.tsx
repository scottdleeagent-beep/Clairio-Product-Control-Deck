import Link from "next/link";

const navigation = [
  { href: "/", label: "Overview" },
  { href: "/team", label: "Team View" },
  { href: "/analytics", label: "Analytics" }
];

type DashboardShellProps = {
  eyebrow: string;
  title: string;
  description: string;
  children: React.ReactNode;
};

export function DashboardShell({
  eyebrow,
  title,
  description,
  children
}: DashboardShellProps) {
  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="brand-block">
          <span className="eyebrow">{eyebrow}</span>
          <h1 className="page-title">{title}</h1>
          <p className="page-description">{description}</p>
        </div>
        <nav className="nav-pills" aria-label="Primary">
          {navigation.map((item) => (
            <Link href={item.href} key={item.href}>
              {item.label}
            </Link>
          ))}
        </nav>
      </header>
      <div className="content-stack">{children}</div>
    </main>
  );
}

