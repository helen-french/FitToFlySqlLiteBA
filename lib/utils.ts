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

function parseClockToMinutes(time: string): number {
  const normalized = time.includes("T") ? time.split("T")[1] || time : time;
  const [hours, minutes] = normalized.slice(0, 5).split(":").map(Number);
  return (hours || 0) * 60 + (minutes || 0);
}

/**
 * Resolve the Zulu calendar date of arrival for a sector.
 * Arrival is often stored as HH:MM only — overnight sectors roll to the next day
 * when arrival clock is earlier than departure clock.
 */
export function resolveSectorZuluArrivalDate(
  departureTime: string,
  arrivalTime: string,
): string {
  if (arrivalTime.includes("T")) {
    return arrivalTime.split("T")[0];
  }

  const zuluDepDate = departureTime.includes("T")
    ? departureTime.split("T")[0]
    : departureTime;

  const depMinutes = parseClockToMinutes(departureTime);
  const arrMinutes = parseClockToMinutes(arrivalTime);

  if (arrMinutes < depMinutes) {
    const arrivalDate = new Date(`${zuluDepDate}T12:00:00`);
    if (!isNaN(arrivalDate.getTime())) {
      arrivalDate.setDate(arrivalDate.getDate() + 1);
      return arrivalDate.toISOString().split("T")[0];
    }
  }

  return zuluDepDate;
}

export function applyDayShiftToDate(
  baseDateStr: string,
  shiftStr: string | null,
): string {
  const shiftDays = shiftStr ? parseInt(shiftStr, 10) || 0 : 0;
  const dateObj = new Date(`${baseDateStr}T12:00:00`);
  if (isNaN(dateObj.getTime())) return baseDateStr;
  if (shiftDays !== 0) {
    dateObj.setDate(dateObj.getDate() + shiftDays);
  }
  return dateObj.toISOString().split("T")[0];
}

/** Minimal sector fields needed for Local/Zulu trip date span. */
export interface TripSectorDateFields {
  departureTime: string;
  departureTimeShift: string | null;
  arrivalTime: string;
  arrivalTimeShift: string | null;
}

/**
 * Resolve Zulu + Local start/end dates and inclusive part-day durations from the
 * first and last sector of a trip (same rules as Details hydration).
 *
 * - Zulu start = first departure calendar date
 * - Zulu end = last arrival calendar date (overnight-aware)
 * - Local = those dates shifted by departureTimeShift / arrivalTimeShift
 */
export function computeTripDateSpan(
  firstSector: TripSectorDateFields,
  lastSector: TripSectorDateFields,
): {
  zuluStartDate: string;
  zuluEndDate: string;
  localStartDate: string;
  localEndDate: string;
  localDurationDays: number;
  zuluDurationDays: number;
} {
  const zuluStartDate = firstSector.departureTime.split("T")[0];
  const zuluEndDate = resolveSectorZuluArrivalDate(
    lastSector.departureTime,
    lastSector.arrivalTime,
  );

  const localStartDate = applyDayShiftToDate(
    zuluStartDate,
    firstSector.departureTimeShift,
  );
  const localEndDate = applyDayShiftToDate(
    zuluEndDate,
    lastSector.arrivalTimeShift,
  );

  return {
    zuluStartDate,
    zuluEndDate,
    localStartDate,
    localEndDate,
    localDurationDays: getTripDurationDays(localStartDate, localEndDate),
    zuluDurationDays: getTripDurationDays(zuluStartDate, zuluEndDate),
  };
}

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

/** Sum multiple ISO-8601 PT durations (e.g. duty flying/duty hours per trip). */
export const sumIsoDurationsPT = (
  durations: (string | null | undefined)[],
): string | null => {
  let totalMinutes = 0;

  for (const raw of durations) {
    if (!raw?.trim()) continue;
    const hoursMatch = raw.match(/(\d+)H/);
    const minutesMatch = raw.match(/(\d+)M/);
    totalMinutes += (hoursMatch ? parseInt(hoursMatch[1], 10) : 0) * 60;
    totalMinutes += minutesMatch ? parseInt(minutesMatch[1], 10) : 0;
  }

  if (totalMinutes === 0) return null;

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) return `PT${minutes}M`;
  if (minutes === 0) return `PT${hours}H`;
  return `PT${hours}H${minutes}M`;
};

/** YYYY-MM-DD for the device's local calendar today. */
export function getLocalTodayDateString(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Local calendar “today” at noon — stable for date-key matching in lists/calendars. */
export function startOfTodayLocal(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12, 0, 0);
}
