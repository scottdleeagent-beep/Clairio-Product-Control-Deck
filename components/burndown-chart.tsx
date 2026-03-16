type BurndownPoint = {
  day: string;
  remaining: number;
  completed: number;
};

type BurndownChartProps = {
  points: BurndownPoint[];
};

export function BurndownChart({ points }: BurndownChartProps) {
  const maxValue = Math.max(...points.map((point) => point.remaining));

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

