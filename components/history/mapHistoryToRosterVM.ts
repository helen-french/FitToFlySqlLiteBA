/**
 * Adapters that convert History hydration rows into shared roster VMs.
 *
 * Keeping this next to history (not inside roster/) so the shared roster
 * package stays screen-agnostic. Details / Sectors will get their own
 * adapters later.
 */

import { formatDisplayDate } from "@/components/history/historyUtils";
import {
  GroundDutyVM,
  TimelineItemVM,
  TripDetailVM,
} from "@/components/roster/types";
import { HydratedHistoryRow } from "@/db/history-types";
import {
  formatGroundDutyDateLabel,
  getFormattedTimeDurationPT,
} from "@/lib/utils";

/** Subset of fields useFlightTimeFormatter.getFlightDisplayDetails returns. */
export interface FlightDisplayDetails {
  displayDepDate: string;
  displayArrDate: string;
  displayDepTime: string;
  displayArrTime: string;
  displayReportTime: string;
}

/**
 * Map a hydrated history trip row into TripDetailVM.
 *
 * @param row - history row (must have tripData)
 * @param getFlightDisplayDetails - from useFlightTimeFormatter so Local/Zulu
 *   labels stay consistent with the Details tab
 */
export function mapHistoryTripToDetailVM(
  row: HydratedHistoryRow,
  getFlightDisplayDetails: (sector: any) => FlightDisplayDetails,
): TripDetailVM | null {
  if (!row.tripData) return null;

  const { tripData, amendment } = row;
  const timeline: TimelineItemVM[] = tripData.timeline.map((node, index) => {
    if (node.type === "flight" && node.data) {
      const fmt = getFlightDisplayDetails(node.data);
      return {
        kind: "flight" as const,
        id: `hist-flight-${row.id}-${index}`,
        dateLabel: fmt.displayDepDate,
        // Report time still carries the temporary "(z - todo)" note from the formatter.
        reportTimeLabel: fmt.displayReportTime || undefined,
        flightLabel: `${node.data.carrier}${node.data.flightNumber}`,
        routeLabel: `${node.data.departureStation} → ${node.data.arrivalStation}`,
        departureCode: node.data.departureStation,
        arrivalCode: node.data.arrivalStation,
        // Airport name enrichment parked — leave display labels undefined.
        departureTimeLabel: fmt.displayDepTime.split(" ")[0] || fmt.displayDepTime,
        arrivalTimeLabel: fmt.displayArrTime.split(" ")[0] || fmt.displayArrTime,
        flyingHoursLabel: getFormattedTimeDurationPT(
          (node.data as { flyingHours?: string | null }).flyingHours,
        ) ?? undefined,
      };
    }

    return {
      kind: "layover" as const,
      id: `hist-layover-${row.id}-${index}`,
      dateLabel: formatDisplayDate(node.dateStr),
    };
  });

  // Prefer flight-derived header dates when possible (respects Local/Zulu).
  // End date uses arrival-side formatting (same approach as Details).
  const flightSources = tripData.timeline.filter(
    (node) => node.type === "flight" && node.data,
  );
  const firstSrc = flightSources[0]?.data;
  const lastSrc = flightSources[flightSources.length - 1]?.data;
  const firstFmt = firstSrc ? getFlightDisplayDetails(firstSrc) : null;
  const lastFmt = lastSrc ? getFlightDisplayDetails(lastSrc) : null;

  return {
    header: {
      tripNumber: amendment.identifier ?? "",
      startDateLabel: firstFmt
        ? firstFmt.displayDepDate
        : formatDisplayDate(tripData.startDateStr),
      endDateLabel: lastFmt
        ? lastFmt.displayArrDate
        : formatDisplayDate(tripData.endDateStr),
      routingSummary: tripData.routingSummary,
      startDateRaw: tripData.startDateStr,
      endDateRaw: tripData.endDateStr,
      // Duration / total flying hours omitted for History by default;
      // callers can still read raw trip data if they opt-in later.
    },
    timeline,
  };
}

/** Map a hydrated history ground-duty row into GroundDutyVM. */
export function mapHistoryGroundToVM(
  row: HydratedHistoryRow,
): GroundDutyVM | null {
  const gd = row.groundDutyData;

  // Shared ground-date rule (lib/utils). Fallback scrapes amendment text if
  // hydration could not resolve start/end — History-only edge case.
  let dateLabel =
    formatGroundDutyDateLabel(
      gd?.startDateStr,
      gd?.endDateStr,
      formatDisplayDate,
    ) ?? null;

  if (!dateLabel) {
    const scraped = row.amendment.details?.match(/\d{4}-\d{2}-\d{2}/)?.[0];
    dateLabel = scraped ? formatDisplayDate(scraped) : "—";
  }

  return {
    id: row.id,
    dateLabel,
    code: gd?.code,
    // Credit / local start-end times live in the accordion body.
    creditLabel: getFormattedTimeDurationPT(gd?.creditAmount) ?? undefined,
    startDateLabel: gd?.startDateStr
      ? formatDisplayDate(gd.startDateStr)
      : undefined,
    startTimeLabel: gd?.startTime || undefined,
    endDateLabel: gd?.endDateStr
      ? formatDisplayDate(gd.endDateStr)
      : undefined,
    endTimeLabel: gd?.endTime || undefined,
  };
}
