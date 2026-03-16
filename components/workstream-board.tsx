type WorkstreamGroup = {
  owner: string;
  focus: string;
  active: number;
  blocked: number;
  dueThisWeek: number;
};

type WorkstreamBoardProps = {
  groups: WorkstreamGroup[];
};

export function WorkstreamBoard({ groups }: WorkstreamBoardProps) {
  return (
    <div className="workstream-board">
      {groups.map((group) => (
        <div className="workstream-row" key={group.owner}>
          <div>
            <strong>{group.owner}</strong>
            <p>{group.focus}</p>
          </div>
          <div className="workstream-meta">
            <span>{group.active} active</span>
            <span>{group.blocked} blocked</span>
            <span>{group.dueThisWeek} due this week</span>
          </div>
        </div>
      ))}
    </div>
  );
}

