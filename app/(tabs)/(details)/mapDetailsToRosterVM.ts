/**
 * Adapters: Details `UnifiedTimelineRow` payloads → shared roster VMs.
 *
 * Lives next to the Details screen (not in `components/roster/`) so the
 * shared package stays screen-agnostic. History has the parallel
 * `components/history/mapHistoryToRosterVM.ts`.
 *
 * Render-only — does not query DB / touch `loadSummaryData`.
 * Coerces optional `actualReportTime` so `useFlightTimeFormatter` typing is happy.
 *
 * | Export | Used by |
 * | --- | --- |
 * | `mapDetailsTripToDetailVM` | `DetailsTripCard` |
 * | `mapDetailsGroundToVM` | `DetailsGroundCard` |
 */

import {
  GroundDutyVM,
  TimelineItemVM,
  TripDetailVM,
} from "@/components/roster/types";
import {
  formatGroundDutyDateLabel,
  getFormattedTimeDurationPT,
} from "@/lib/utils";

/** Subset returned by useFlightTimeFormatter.getFlightDisplayDetails */
export interface FlightDisplayDetails {
  displayDepDate: string;
  displayArrDate: string;
  displayDepTime: string;
  displayArrTime: string;
  displayReportTime: string;
}

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
  getFlightDisplayDetails: (sector: any) => FlightDisplayDetails,
  isZulu: boolean,
): TripDetailVM {
  const timeline: TimelineItemVM[] = tripData.timeline.map((node, index) => {
    if (node.type === "flight" && node.data) {
      // Formatter expects actualReportTime: string | null (not undefined).
      const sectorForFmt = {
        ...node.data,
        actualReportTime: node.data.actualReportTime ?? null,
      };
      const fmt = getFlightDisplayDetails(sectorForFmt);
      return {
        kind: "flight" as const,
        id: `details-flight-${tripData.tripMeta.tripNumber}-${index}`,
        dateLabel: fmt.displayDepDate,
        reportTimeLabel: fmt.displayReportTime || undefined,
        flightLabel: `${node.data.carrier}${node.data.flightNumber}`,
        routeLabel: `${node.data.departureStation} → ${node.data.arrivalStation}`,
        departureCode: node.data.departureStation,
        arrivalCode: node.data.arrivalStation,
        departureTimeLabel:
          fmt.displayDepTime.split(" ")[0] || fmt.displayDepTime,
        arrivalTimeLabel:
          fmt.displayArrTime.split(" ")[0] || fmt.displayArrTime,
        flyingHoursLabel:
          getFormattedTimeDurationPT(node.data.flyingHours) ?? undefined,
      };
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
  const firstFmt = firstSrc
    ? getFlightDisplayDetails({
        ...firstSrc,
        actualReportTime: firstSrc.actualReportTime ?? null,
      })
    : null;
  const lastFmt = lastSrc
    ? getFlightDisplayDetails({
        ...lastSrc,
        actualReportTime: lastSrc.actualReportTime ?? null,
      })
    : null;

  return {
    header: {
      tripNumber: tripData.tripMeta.tripNumber,
      startDateLabel: firstFmt
        ? firstFmt.displayDepDate
        : formatCardHeaderDate(tripData.calculatedStartDate),
      endDateLabel: lastFmt
        ? lastFmt.displayArrDate
        : formatCardHeaderDate(tripData.calculatedEndDate),
      routingSummary: tripData.routingSummary,
      startDateRaw: tripData.calculatedStartDate,
      endDateRaw: tripData.calculatedEndDate,
      durationDays: isZulu
        ? tripData.trueZuluDurationDays
        : tripData.trueLocalDurationDays,
      totalFlyingHoursLabel:
        getFormattedTimeDurationPT(tripData.tripMeta.creditAmount) ?? undefined,
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
