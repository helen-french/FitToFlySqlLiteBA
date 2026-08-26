/**
 * Adapters: Roster screen `UnifiedTimelineRow` payloads → shared roster VMs.
 *
 * Lives under `components/roster/` (not in `app/`) so Expo Router
 * does not treat it as a route. History has the parallel
 * `components/history/mapHistoryToRosterVM.ts`.
 *
 * Render-only — does not query DB / touch `loadSummaryData`.
 * Shared clock / route / header-date rules live in
 * `@/components/roster/mapRosterAdapters`.
 *
 * | Export | Used by |
 * | --- | --- |
 * | `mapDetailsTripToDetailVM` | `RosterTripCard` |
 * | `mapDetailsGroundToVM` | `RosterGroundCard` |
 */

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
import {
  formatGroundDutyDateLabel,
  getFormattedTimeDurationPT,
} from "@/lib/utils";

/** Mirrors Details’ ItineraryItem / tripData without importing the screen file. */
export interface DetailsItineraryItem {
  type: "flight" | "layover";
  dateStr: string;
  endDateStr?: string;
  layoverDurationHours?: number;
  data?: {
    carrier: string;
    flightNumber: string;
    departureStation: string;
    arrivalStation: string;
    departureTime: string;
    departureTimeLocal: string | null;
    departureTimeShift: string | null;
    arrivalTime: string;
    arrivalTimeLocal: string | null;
    arrivalTimeShift: string | null;
    actualReportTime?: string | null;
    flyingHours?: string | null;
    /** "H" when heavy crew. */
    heavyCrewIdentifier?: string | null;
  };
}

export interface DetailsTripData {
  tripMeta: {
    tripNumber: string;
    creditAmount?: string | null;
  };
  routingSummary: string;
  timeline: DetailsItineraryItem[];
  calculatedStartDate: string;
  calculatedEndDate: string;
  trueLocalDurationDays: number;
  trueZuluDurationDays: number;
}

export interface DetailsGroundData {
  startDate: string;
  endDate?: string | null;
  /** Local — ground_duties.start_time */
  startTime?: string | null;
  /** Local — ground_duties.end_time */
  endTime?: string | null;
  crewMovementCode: string;
  creditAmount?: string | null;
}

/**
 * Build TripDetailVM from a Details trip row.
 * @param formatCardHeaderDate — fallback DD/MM/YYYY if no flights
 * @param getFlightDisplayDetails — Local/Zulu aware labels
 * @param isZulu — picks duration days for the header (Details shows this)
 */
export function mapDetailsTripToDetailVM(
  tripData: DetailsTripData,
  formatCardHeaderDate: (dateStr: string) => string,
  getFlightDisplayDetails: GetFlightDisplayDetails,
  isZulu: boolean,
): TripDetailVM {
  const timeline: TimelineItemVM[] = tripData.timeline.map((node, index) => {
    if (node.type === "flight" && node.data) {
      return mapSectorToFlightVM(
        node.data,
        getFlightDisplayDetails,
        `details-flight-${tripData.tripMeta.tripNumber}-${index}`,
      );
    }

    return {
      kind: "layover" as const,
      id: `details-layover-${tripData.tripMeta.tripNumber}-${index}`,
      dateLabel: formatCardHeaderDate(node.dateStr),
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
    formatCardHeaderDate(tripData.calculatedStartDate),
    formatCardHeaderDate(tripData.calculatedEndDate),
  );

  return {
    header: {
      tripNumber: tripData.tripMeta.tripNumber,
      ...headerDates,
      routingSummary: tripData.routingSummary,
      startDateRaw: tripData.calculatedStartDate,
      endDateRaw: tripData.calculatedEndDate,
      durationDays: isZulu
        ? tripData.trueZuluDurationDays
        : tripData.trueLocalDurationDays,
      totalFlyingHoursLabel:
        getFormattedTimeDurationPT(tripData.tripMeta.creditAmount) ?? undefined,
      stationTzOffsetLabel: resolveTripStationTzOffsetLabel(
        flightSources.map((n) => n.data),
      ),
    },
    timeline,
  };
}

export function mapDetailsGroundToVM(
  groundData: DetailsGroundData,
  formatCardHeaderDate: (dateStr: string) => string,
): GroundDutyVM {
  // Shared ground-date rule — same helper History uses (no duration for ground).
  const dateLabel =
    formatGroundDutyDateLabel(
      groundData.startDate,
      groundData.endDate,
      formatCardHeaderDate,
    ) ?? formatCardHeaderDate(groundData.startDate);

  const endIso = groundData.endDate || groundData.startDate;

  return {
    id: `details-ground-${groundData.startDate}-${groundData.crewMovementCode}`,
    dateLabel,
    code: groundData.crewMovementCode,
    // Credit / times live in the accordion body (times always local).
    creditLabel:
      getFormattedTimeDurationPT(groundData.creditAmount) ?? undefined,
    startDateLabel: formatCardHeaderDate(groundData.startDate),
    startTimeLabel: groundData.startTime || undefined,
    endDateLabel: formatCardHeaderDate(endIso),
    endTimeLabel: groundData.endTime || undefined,
  };
}

export default mapDetailsTripToDetailVM;
