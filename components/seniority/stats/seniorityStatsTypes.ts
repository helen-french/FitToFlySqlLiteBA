export type SeniorityChartPoint = {
  /** DD/MM/YYYY */
  date: string;
  value: number;
};

export type SeniorityStatsData = {
  currentSeniority: number;
  lastUpdated: string;
  feedPoints: SeniorityChartPoint[];
  projectedPoints: SeniorityChartPoint[];
  monthlyChange: SeniorityChartPoint[];
};

export function parseUkDateString(dateStr: string): number {
  const parts = dateStr.trim().split("/");
  if (parts.length !== 3) return 0;
  const day = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10);
  const year = parseInt(parts[2], 10);
  return new Date(year, month - 1, day).getTime();
}

export function formatChartDate(dateStr: string): string {
  const ms = parseUkDateString(dateStr);
  if (!ms) return dateStr;
  return new Date(ms).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
  });
}

export function isoToUkDate(isoString: string): string {
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return isoString;
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  } catch {
    return isoString;
  }
}

export function getChartDateRange(points: SeniorityChartPoint[]) {
  const times = points.map((p) => parseUkDateString(p.date)).filter((t) => t > 0);
  if (times.length === 0) {
    return { min: 0, max: 0 };
  }
  return {
    min: Math.min(...times),
    max: Math.max(...times),
  };
}
