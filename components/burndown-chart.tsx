type BurndownPoint = {
  day: string;
  remaining: number;
  completed: number;
};

type BurndownChartProps = {
  points: BurndownPoint[];
};

export function BurndownChart({ points }: BurndownChartProps) {
  if (points.length === 0) {
    return <div className="empty-state">No snapshot history yet.</div>;
  }

  const maxValue = Math.max(
    1,
    ...points.map((point) => Math.max(point.remaining, point.completed))
  );

  return (
    <div className="chart" aria-label="Burndown chart">
      {points.map((point) => {
        const remainingHeight = `${(point.remaining / maxValue) * 100}%`;
        const completedHeight = `${(point.completed / maxValue) * 100}%`;

        return (
          <div className="chart-column" key={point.day}>
            <div className="chart-bars">
              <div
                aria-label={`${point.day} remaining ${point.remaining}`}
                className="chart-bar remaining"
                style={{ height: remainingHeight }}
              />
              <div
                aria-label={`${point.day} completed ${point.completed}`}
                className="chart-bar completed"
                style={{ height: completedHeight }}
              />
            </div>
            <span className="chart-label">{point.day}</span>
          </div>
        );
      })}
    </div>
  );
}
