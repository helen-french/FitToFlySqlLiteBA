/**
 * Shared mapping rules: screen payloads → roster VMs.
 *
 * Screen adapters (Details / Sectors / History) stay thin and only supply
 * screen-specific extras. Change clock / route / header-date formatting here
 * once so all three screens stay aligned.
 */

import {
  TimelineFlightVM,
  TripHeaderVM,
} from "@/components/roster/types";
import { formatTripStationTzDifference } from "@/lib/formatStationTzDifference";
import { getFormattedTimeDurationPT } from "@/lib/utils";

/** Subset returned by useFlightTimeFormatter.getFlightDisplayDetails */
export interface FlightDisplayDetails {
  displayDepDate: string;
  displayArrDate: string;
  displayDepTime: string;
  displayArrTime: string;
  displayReportTime: string;
}

export type GetFlightDisplayDetails = (
  sector: any,
) => FlightDisplayDetails;

/** Minimal sector fields needed to build a TimelineFlightVM. */
export interface RosterFlightSectorSource {
  carrier: string;
  flightNumber: string;
  departureStation: string;
  arrivalStation: string;
  /** ISO Zulu timestamp — required for local report conversion. */
  departureTime?: string;
  departureTimeLocal?: string | null;
  departureTimeShift?: string | null;
  arrivalTime?: string;
  arrivalTimeLocal?: string | null;
  arrivalTimeShift?: string | null;
  actualReportTime?: string | null;
  flyingHours?: string | null;
  /** "H" when heavy crew. */
  heavyCrewIdentifier?: string | null;
}

/**
 * Clock label rule: strip trailing Local/Zulu suffix from formatter output.
 * e.g. "13:25 (l)" → "13:25"
 */
export function clockLabelFromDisplayTime(displayTime: string): string {
  return displayTime.split(" ")[0] || displayTime;
}

/**
 * Header / sector hours line: "10hrs 25mins" or "10hrs 25mins | 12hrs 25mins".
 * Flying first, duty second — same order on trip header and flight rows.
 */
export function joinHoursLabels(
  flyingHoursLabel?: string | null,
  dutyHoursLabel?: string | null,
): string | undefined {
  const line = [flyingHoursLabel, dutyHoursLabel].filter(Boolean).join(" | ");
  return line || undefined;
}

export function formatFlightLabel(
  carrier: string,
  flightNumber: string,
): string {
  return `${carrier}${flightNumber}`;
}

export function formatRouteLabel(
  departureCode: string,
  arrivalCode: string,
): string {
  return `${departureCode} → ${arrivalCode}`;
}

/**
 * Map one sector + formatter output into a TimelineFlightVM.
 * Screen adapters may pass `extras` for airport names, duty hours, etc.
 */
export function mapSectorToFlightVM(
  sector: RosterFlightSectorSource,
  getFlightDisplayDetails: GetFlightDisplayDetails,
  id: string,
  extras?: Partial<
    Pick<
      TimelineFlightVM,
      | "departureDisplayLabel"
      | "arrivalDisplayLabel"
      | "dutyHoursLabel"
      | "flyingHoursLabel"
    >
  >,
): TimelineFlightVM {
  const sectorForFmt = {
    ...sector,
    actualReportTime: sector.actualReportTime ?? null,
  };
  const fmt = getFlightDisplayDetails(sectorForFmt);

  return {
    kind: "flight",
    id,
    dateLabel: fmt.displayDepDate,
    reportTimeLabel: fmt.displayReportTime || undefined,
    flightLabel: formatFlightLabel(sector.carrier, sector.flightNumber),
    routeLabel: formatRouteLabel(
      sector.departureStation,
      sector.arrivalStation,
    ),
    departureCode: sector.departureStation,
    arrivalCode: sector.arrivalStation,
    departureTimeLabel: clockLabelFromDisplayTime(fmt.displayDepTime),
    arrivalTimeLabel: clockLabelFromDisplayTime(fmt.displayArrTime),
    isHeavyCrew: sector.heavyCrewIdentifier?.trim().toUpperCase() === "H",
    flyingHoursLabel:
      getFormattedTimeDurationPT(sector.flyingHours) ?? undefined,
    ...extras,
  };
}

/**
 * UK-relative time difference for the trip header (first outbound foreign leg).
 */
export function resolveTripStationTzOffsetLabel(
  sectors: Array<RosterFlightSectorSource | null | undefined>,
): string | undefined {
  const refs = sectors.filter(
    (s): s is RosterFlightSectorSource =>
      !!s?.departureStation && !!s?.arrivalStation,
  );
  return formatTripStationTzDifference(refs) ?? undefined;
}

/**
 * Header date labels: prefer first/last flight Local/Zulu formatting,
 * otherwise fall back to the provided raw date labels.
 */
export function resolveTripHeaderDateLabels(
  firstSector: RosterFlightSectorSource | null | undefined,
  lastSector: RosterFlightSectorSource | null | undefined,
  getFlightDisplayDetails: GetFlightDisplayDetails,
  fallbackStartLabel: string,
  fallbackEndLabel: string,
): Pick<TripHeaderVM, "startDateLabel" | "endDateLabel"> {
  const firstFmt = firstSector
    ? getFlightDisplayDetails({
        ...firstSector,
        actualReportTime: firstSector.actualReportTime ?? null,
      })
    : null;
  const lastFmt = lastSector
    ? getFlightDisplayDetails({
        ...lastSector,
        actualReportTime: lastSector.actualReportTime ?? null,
      })
    : null;

  return {
    startDateLabel: firstFmt ? firstFmt.displayDepDate : fallbackStartLabel,
    endDateLabel: lastFmt ? lastFmt.displayArrDate : fallbackEndLabel,
  };
}
