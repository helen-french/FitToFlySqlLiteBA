/**
 * Get the current sky type based on the time of day
 * Example: "2026-02-03T09:00:00Z" -> "09:00"
 */
import { Appearance } from "react-native";

export type SkyType = "night" | "day" | "day2" | "sunrise" | "sunset";
export const getSkyByTime = (): SkyType => {
  const isDarkModeActive = Appearance.getColorScheme() === "dark";
  // set to  night theme if system dark mode is enabled
  if (isDarkModeActive) {
    return "night";
  }

  const hour = new Date().getHours();
  // const hour = 23; // Force it to night for testing
  if (hour >= 5 && hour < 9) return "sunrise"; // 5am - 8:59am
  if (hour >= 9 && hour < 17) return "day"; // 9am - 1:59pm
  //if (hour >= 14 && hour < 17) return "day2"; // 2pm - 4:59pm
  if (hour >= 17 && hour < 22) return "sunset"; // 5pm - 9:59pm
  return "night"; // 10pm - 4:59am
};

/**
 * Canonical trip duration (inclusive calendar days).
 *
 * **Use this everywhere** Details / Sectors / History adapters need a day count.
 * Pass already-resolved Local or Zulu YYYY-MM-DD bounds (Details applies
 * departure/arrival time shifts before calling this).
 *
 * Do not reimplement duration in screen files (the old Sectors hour-wrap
 * shortcut was incorrect).
 */
export const getTripDurationDays = (
  startDateStr: string,
  endDateStr: string,
): number => {
  const startObj = new Date(`${startDateStr}T12:00:00`);
  const endObj = new Date(`${endDateStr}T12:00:00`);

  if (isNaN(startObj.getTime()) || isNaN(endObj.getTime())) {
    return 1;
  }

  const timeDiffMs = Math.abs(endObj.getTime() - startObj.getTime());
  const daysDiff = Math.ceil(timeDiffMs / (1000 * 60 * 60 * 24));

  return daysDiff + 1;
};

/**
 * Display label for trip duration days, e.g. "1 Day" / "3 Days".
 * Ground duties do **not** show duration — only trips (Details header, Sectors meta).
 */
export const formatTripDurationLabel = (durationDays: number): string => {
  const days = Number.isFinite(durationDays) && durationDays > 0 ? durationDays : 1;
  return `${days} ${days === 1 ? "Day" : "Days"}`;
};

/**
 * Shared ground-duty date label rule (History + Details + future Sectors/modal).
 *
 * - No start → null (caller may fall back)
 * - Same day, or missing/equal end → formatted start only
 * - End after start → "DD/MM/YYYY — DD/MM/YYYY" (trip-style range)
 *
 * Ground duties never attach a duration day count — only this date label.
 *
 * @param startDateStr YYYY-MM-DD
 * @param endDateStr YYYY-MM-DD or null/undefined
 * @param formatDate converts YYYY-MM-DD → display (e.g. DD/MM/YYYY)
 */
export const formatGroundDutyDateLabel = (
  startDateStr: string | null | undefined,
  endDateStr: string | null | undefined,
  formatDate: (isoDate: string) => string,
): string | null => {
  if (!startDateStr) return null;

  if (endDateStr && endDateStr > startDateStr) {
    return `${formatDate(startDateStr)} — ${formatDate(endDateStr)}`;
  }

  return formatDate(startDateStr);
};

/**
 * Converts ISO 8601 duration strings (e.g., "PT1H30M") into a readable format.
 */
export const getFormattedTimeDurationPT = (
  rawDuration: string | null | undefined,
): string | null => {
  if (!rawDuration) return null;

  // Extract hours and minutes using regex
  const hoursMatch = rawDuration.match(/(\d+)H/);
  const minutesMatch = rawDuration.match(/(\d+)M/);

  const hours = hoursMatch ? parseInt(hoursMatch[1], 10) : 0;
  const minutes = minutesMatch ? parseInt(minutesMatch[1], 10) : 0;

  if (hours === 0 && minutes === 0) return null;

  // Build the string dynamically
  const parts = [];
  if (hours > 0) parts.push(`${hours}hrs`);
  if (minutes > 0) parts.push(`${minutes}mins`);

  return parts.join(" ");
};
