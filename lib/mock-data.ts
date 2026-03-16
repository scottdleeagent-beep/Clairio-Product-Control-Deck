export const dashboardData = {
  summary: [
    { label: "Open work", value: "184" },
    { label: "Blocked", value: "17" },
    { label: "Overdue", value: "11" },
    { label: "At risk", value: "6 initiatives" }
  ],
  signals: [
    { label: "Scope added", detail: "Since sprint start", value: "+23 pts" },
    { label: "Completed", detail: "This week", value: "41 pts" },
    { label: "Workload skew", detail: "Two teams above target", value: "High" }
  ],
  burndown: [
    { day: "Mon", remaining: 108, completed: 14 },
    { day: "Tue", remaining: 92, completed: 21 },
    { day: "Wed", remaining: 84, completed: 28 },
    { day: "Thu", remaining: 66, completed: 41 },
    { day: "Fri", remaining: 49, completed: 57 }
  ],
  workstreams: [
    {
      owner: "Alicia",
      focus: "Client onboarding automation",
      active: 7,
      blocked: 1,
      dueThisWeek: 3
    },
    {
      owner: "Marcus",
      focus: "Platform reliability and auth",
      active: 6,
      blocked: 0,
      dueThisWeek: 2
    },
    {
      owner: "Nina",
      focus: "Care ops dashboard refresh",
      active: 5,
      blocked: 2,
      dueThisWeek: 4
    },
    {
      owner: "Sam",
      focus: "Model QA and eval loop",
      active: 4,
      blocked: 1,
      dueThisWeek: 1
    }
  ],
  analytics: [
    {
      title: "Weekly throughput",
      window: "Last 6 weeks",
      value: "38 tasks",
      change: "+12%",
      note: "Measured as completed tasks normalized by workflow type."
    },
    {
      title: "Cycle time",
      window: "Median",
      value: "4.2 days",
      change: "-9%",
      note: "Calculated from in-progress to done across synced work."
    },
    {
      title: "Blocked duration",
      window: "Average",
      value: "1.1 days",
      change: "+18%",
      note: "Good early signal for staffing or dependency risk."
    }
  ],
  teamHighlights: [
    {
      title: "Unassigned work",
      subtitle: "Needs owner",
      value: "8",
      footer: "Assigning these first improves reporting quality immediately."
    },
    {
      title: "Overloaded owners",
      subtitle: "Above capacity",
      value: "3",
      footer: "Use this to rebalance active work before the next planning cycle."
    },
    {
      title: "Tasks due in 72h",
      subtitle: "Delivery watchlist",
      value: "14",
      footer: "A focused team review here should reduce surprise deadline slips."
    }
  ]
};

