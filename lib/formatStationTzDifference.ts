/**
 * Timezone difference relative to UK (Europe/London) for a trip.
 *
 * BA-oriented: originating base is the UK. Prefer the first outbound sector
 * (UK → foreign); otherwise the first sector with a non-UK station. Compares
 * that foreign station to London at the sector’s departure UTC instant.
 *
 * Sign: positive = that station is ahead of UK; negative = behind.
 */

import { getTimezoneOffset } from "date-fns-tz";

import { getAirportByIataCode } from "@/db/airport-queries";

const UK_TZ = "Europe/London";

export type StationTzSectorRef = {
  departureStation: string;
  arrivalStation: string;
  departureTime?: string | null;
};

function parseDepartureUtc(departureTimeIso: string): Date | null {
  if (!departureTimeIso?.includes("T")) return null;
  const date = departureTimeIso.split("T")[0];
  const clock = departureTimeIso.split("T")[1]?.slice(0, 5);
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;
  if (!clock || !/^\d{1,2}:\d{2}$/.test(clock)) return null;

  const [hRaw, mRaw] = clock.split(":");
  const hh = hRaw.padStart(2, "0");
  const utc = new Date(`${date}T${hh}:${mRaw}:00.000Z`);
  return Number.isNaN(utc.getTime()) ? null : utc;
}

function formatDeltaSentence(deltaMs: number): string | null {
  const totalMinutes = Math.round(deltaMs / 60_000);
  if (totalMinutes === 0) return null;

  const sign = totalMinutes > 0 ? "+" : "-";
  const abs = Math.abs(totalMinutes);
  const hours = Math.floor(abs / 60);
  const mins = abs % 60;

  let amount: string;
  if (mins === 0) {
    amount = `${hours} hours`;
  } else if (mins === 30) {
    amount = `${hours}.5 hours`;
  } else {
    amount = `${hours} hours ${mins} minutes`;
  }

  return `Time difference: ${sign}${amount}`;
}

function tzForIata(iata: string): string | null {
  return getAirportByIataCode(iata)[0]?.tz ?? null;
}

function differenceForSector(sector: StationTzSectorRef): string | null {
  const tzDep = tzForIata(sector.departureStation);
  const tzArr = tzForIata(sector.arrivalStation);
  if (!tzDep || !tzArr || !sector.departureTime) return null;

  const depIsUk = tzDep === UK_TZ;
  const arrIsUk = tzArr === UK_TZ;

  let otherTz: string | null = null;
  if (depIsUk && !arrIsUk) otherTz = tzArr;
  else if (!depIsUk && arrIsUk) otherTz = tzDep;
  else if (!depIsUk && !arrIsUk) otherTz = tzArr;
  else return null;

  const instant = parseDepartureUtc(sector.departureTime);
  if (!instant) return null;

  try {
    const offsetUk = getTimezoneOffset(UK_TZ, instant);
    const offsetOther = getTimezoneOffset(otherTz, instant);
    return formatDeltaSentence(offsetOther - offsetUk);
  } catch {
    return null;
  }
}

/**
 * Trip-level UK offset: first UK→foreign sector, else first sector with a label.
 * e.g. "Time difference: -6 hours"
 */
export function formatTripStationTzDifference(
  sectors: StationTzSectorRef[],
): string | null {
  if (!sectors.length) return null;

  const outbound = sectors.find((s) => {
    const tzDep = tzForIata(s.departureStation);
    const tzArr = tzForIata(s.arrivalStation);
    return tzDep === UK_TZ && !!tzArr && tzArr !== UK_TZ;
  });
  if (outbound) {
    const label = differenceForSector(outbound);
    if (label) return label;
  }

  for (const sector of sectors) {
    const label = differenceForSector(sector);
    if (label) return label;
  }
  return null;
}
