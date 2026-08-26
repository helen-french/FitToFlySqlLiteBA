/**
 * Convert a Zulu report clock (HH:mm) to local time at the departure airport.
 *
 * Roster XML stores ActualReportTime as a Zulu clock only. We combine it with
 * the sector's Zulu departure date; if the report clock is later than the
 * departure clock (e.g. report 23:20, dep 00:35), the report falls on the
 * previous UTC calendar day.
 */

import { subDays } from "date-fns";
import { formatInTimeZone } from "date-fns-tz";

import { getAirportByIataCode } from "@/db/airport-queries";

const CLOCK_RE = /^(\d{1,2}):(\d{2})$/;

function normalizeClock(raw: string): string | null {
  const match = raw.trim().match(CLOCK_RE);
  if (!match) return null;
  const hours = match[1].padStart(2, "0");
  const minutes = match[2];
  const h = Number(hours);
  const m = Number(minutes);
  if (h > 23 || m > 59) return null;
  return `${hours}:${minutes}`;
}

/**
 * Returns local HH:mm at the departure station, or null if conversion fails.
 */
export function formatReportTimeLocal(
  actualReportTime: string,
  departureTimeIso: string,
  departureStationIata: string,
): string | null {
  const reportClock = normalizeClock(actualReportTime);
  if (!reportClock) return null;

  const depDate = departureTimeIso?.split("T")[0];
  if (!depDate || !/^\d{4}-\d{2}-\d{2}$/.test(depDate)) return null;

  const depClockRaw = departureTimeIso.includes("T")
    ? departureTimeIso.split("T")[1]?.slice(0, 5)
    : null;
  const depClock = depClockRaw ? normalizeClock(depClockRaw) : null;

  let reportDateStr = depDate;
  if (depClock && reportClock > depClock) {
    const prev = subDays(new Date(`${depDate}T12:00:00Z`), 1);
    reportDateStr = prev.toISOString().slice(0, 10);
  }

  const airports = getAirportByIataCode(departureStationIata);
  const tz = airports[0]?.tz;
  if (!tz) return null;

  const utcInstant = new Date(`${reportDateStr}T${reportClock}:00.000Z`);
  if (Number.isNaN(utcInstant.getTime())) return null;

  try {
    return formatInTimeZone(utcInstant, tz, "HH:mm");
  } catch {
    return null;
  }
}
