import { distinctSeniorityHistory } from "@/components/seniority/distinctSeniorityHistory";
import {
  isoToUkDate,
  parseUkDateString,
  SeniorityChartPoint,
  SeniorityStatsData,
} from "@/components/seniority/stats/seniorityStatsTypes";
import { PersonDetails } from "@/db/schema";

function buildProjectedPoints(
  feedPoints: SeniorityChartPoint[],
): SeniorityChartPoint[] {
  if (feedPoints.length < 2) return [];

  const chronological = [...feedPoints].sort(
    (a, b) => parseUkDateString(a.date) - parseUkDateString(b.date),
  );

  const last = chronological[chronological.length - 1];
  const prev = chronological[chronological.length - 2];

  const lastMs = parseUkDateString(last.date);
  const prevMs = parseUkDateString(prev.date);
  const msDelta = lastMs - prevMs;
  if (msDelta <= 0) return [];

  const valueDelta = last.value - prev.value;
  const slope = valueDelta / msDelta;

  const [, , ly] = last.date.split("/").map(Number);

  const endOfMonth = new Date(ly, lm, 0);
  const endDate = `${String(endOfMonth.getDate()).padStart(2, "0")}/${String(endOfMonth.getMonth() + 1).padStart(2, "0")}/${endOfMonth.getFullYear()}`;
  const projectedValue = Math.round(
    last.value + slope * (endOfMonth.getTime() - lastMs),
  );

  return [
    { date: last.date, value: last.value },
    { date: endDate, value: projectedValue },
  ];
}

function buildMonthlyChange(
  feedPoints: SeniorityChartPoint[],
): SeniorityChartPoint[] {
  const chronological = [...feedPoints].sort(
    (a, b) => parseUkDateString(a.date) - parseUkDateString(b.date),
  );

  const changes: SeniorityChartPoint[] = [];
  for (let i = 1; i < chronological.length; i++) {
    changes.push({
      date: chronological[i].date,
      value: chronological[i].value - chronological[i - 1].value,
    });
  }
  return changes;
}

/** Build chart payload from distinct seniority feed rows (newest-first). */
export function buildSeniorityStatsFromTimeline(
  timelineNewestFirst: PersonDetails[],
): SeniorityStatsData | null {
  const timeline = distinctSeniorityHistory(timelineNewestFirst);
  if (timeline.length === 0) return null;

  const feedPoints: SeniorityChartPoint[] = [...timeline]
    .reverse()
    .map((row) => ({
      date: isoToUkDate(row.updatedAt),
      value: Number(row.seniorityNumber ?? 0),
    }));

  const latest = timeline[0];
  const currentSeniority = Number(latest.seniorityNumber ?? 0);

  return {
    currentSeniority,
    lastUpdated: isoToUkDate(latest.updatedAt),
    feedPoints,
    projectedPoints: buildProjectedPoints(feedPoints),
    monthlyChange: buildMonthlyChange(feedPoints),
  };
}
