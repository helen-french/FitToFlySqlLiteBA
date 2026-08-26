/**
 * Adapters that convert History hydration rows into shared roster VMs.
 *
 * Keeping this next to history (not inside roster/) so the shared roster
 * package stays screen-agnostic. Shared clock / route / header-date rules
 * live in `@/components/roster/mapRosterAdapters`.
 */

import { formatDisplayDate } from "@/components/history/historyUtils";
import {
  GetFlightDisplayDetails,
  mapSectorToFlightVM,
  resolveTripHeaderDateLabels,
  resolveTripStationTzOffsetLabel,
} from "@/components/roster/mapRosterAdapters";
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

/**
 * Map a hydrated history trip row into TripDetailVM.
 *
 * @param row - history row (must have tripData)
 * @param getFlightDisplayDetails - from useFlightTimeFormatter so Local/Zulu
 *   labels stay consistent with the Details tab
 */
export function mapHistoryTripToDetailVM(
  row: HydratedHistoryRow,
  getFlightDisplayDetails: GetFlightDisplayDetails,
): TripDetailVM | null {
  if (!row.tripData) return null;

  const { tripData, amendment } = row;
  const timeline: TimelineItemVM[] = tripData.timeline.map((node, index) => {
    if (node.type === "flight" && node.data) {
      return mapSectorToFlightVM(
        node.data,
        getFlightDisplayDetails,
        `hist-flight-${row.id}-${index}`,
      );
    }

    return {
      kind: "layover" as const,
      id: `hist-layover-${row.id}-${index}`,
      dateLabel: formatDisplayDate(node.dateStr),
    };
  });

  const flightSources = tripData.timeline.filter(
    (node) => node.type === "flight" && node.data,
  );
  const firstSrc = flightSources[0]?.data;
  const lastSrc = flightSources[flightSources.length - 1]?.data;
  const headerDates = resolveTripHeaderDateLabels(
    firstSrc,
    lastSrc,
    getFlightDisplayDetails,
    formatDisplayDate(tripData.startDateStr),
    formatDisplayDate(tripData.endDateStr),
  );

  return {
    header: {
      tripNumber: amendment.identifier ?? "",
      ...headerDates,
      routingSummary: tripData.routingSummary,
      startDateRaw: tripData.startDateStr,
      endDateRaw: tripData.endDateStr,
      stationTzOffsetLabel: resolveTripStationTzOffsetLabel(
        flightSources.map((n) => n.data),
      ),
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
