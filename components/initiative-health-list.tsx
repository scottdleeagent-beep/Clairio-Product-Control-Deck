type InitiativeHealthItem = {
  name: string;
  owner: string;
  open: number;
  blocked: number;
  overdue: number;
  health: string;
};

type InitiativeHealthListProps = {
  items: InitiativeHealthItem[];
};

export function InitiativeHealthList({ items }: InitiativeHealthListProps) {
  return (
    <div className="health-list">
      {items.map((item) => (
        <div className="health-row" key={item.name}>
          <div>
            <strong>{item.name}</strong>
            <p>{item.owner}</p>
          </div>
          <div className="health-meta">
            <span>{item.open} open</span>
            <span>{item.blocked} blocked</span>
            <span>{item.overdue} overdue</span>
            <span className={item.health === "On track" ? "health-good" : "health-alert"}>
              {item.health}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
