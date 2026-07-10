import { SeniorityStatsData } from "@/components/seniority/stats/seniorityStatsTypes";

export const MOCK_SENIORITY_STATS: SeniorityStatsData = {
  currentSeniority: 4729,
  lastUpdated: "18/07/2026",
  feedPoints: [
    { date: "12/04/2026", value: 5320 },
    { date: "10/05/2026", value: 5207 },
    { date: "08/06/2026", value: 4984 },
    { date: "05/07/2026", value: 4750 },
    { date: "18/07/2026", value: 4729 },
  ],
  projectedPoints: [
    { date: "18/07/2026", value: 4729 },
    { date: "31/07/2026", value: 4688 },
  ],
  monthlyChange: [
    { date: "10/05/2026", value: -113 },
    { date: "08/06/2026", value: -223 },
    { date: "05/07/2026", value: -234 },
    { date: "18/07/2026", value: -21 },
  ],
};
