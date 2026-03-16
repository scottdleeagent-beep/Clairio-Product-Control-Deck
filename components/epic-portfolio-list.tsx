type EpicPortfolioItem = {
  name: string;
  open: number;
  done: number;
  blocked: number;
  owners: number;
};

export function EpicPortfolioList({
  items
}: {
  items: EpicPortfolioItem[];
}) {
  return (
    <div className="health-list">
      {items.map((item) => (
        <div className="health-row" key={item.name}>
          <div>
            <strong>{item.name}</strong>
            <p>{item.owners} owner{item.owners === 1 ? "" : "s"} engaged</p>
          </div>
          <div className="health-meta">
            <span>{item.open} open</span>
            <span>{item.done} done</span>
            <span>{item.blocked} blocked</span>
          </div>
        </div>
      ))}
    </div>
  );
}
