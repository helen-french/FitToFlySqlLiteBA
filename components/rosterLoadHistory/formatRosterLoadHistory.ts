/** Formatting helpers for Roster Load History UI. */

export function getFeedTimestampKey(dateStr: string, timeStr: string): string {
  const date = dateStr?.trim() || "0000-00-00";
  const parts = (timeStr || "00:00").trim().split(":");
  const hours = (parts[0] || "0").padStart(2, "0");
  const minutes = (parts[1] || "0").padStart(2, "0");
  return `${date}T${hours}:${minutes}`;
}

export function formatFeedStamp(dateStr: string, timeStr: string): string {
  const key = getFeedTimestampKey(dateStr, timeStr);
  const [date, time] = key.split("T");
  const [year, month, day] = date.split("-");
  if (!year || !month || !day) return key;
  return `${day}/${month}/${year} ${time}`;
}

export function formatFriendlyDateTime(isoString: string): string {
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return isoString;
    return d.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return isoString;
  }
}

export function formatRosterMonthLabel(rosterMonth: string): string {
  const [year, month] = (rosterMonth || "").split("-");
  const monthIndex = parseInt(month, 10) - 1;
  const yearNum = parseInt(year, 10);
  if (
    isNaN(monthIndex) ||
    isNaN(yearNum) ||
    monthIndex < 0 ||
    monthIndex > 11
  ) {
    return rosterMonth || "—";
  }
  return new Date(yearNum, monthIndex, 1).toLocaleDateString("en-GB", {
    month: "short",
    year: "numeric",
  });
}
