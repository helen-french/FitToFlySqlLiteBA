/**
 * Adapters: Sectors `ActiveTripMeta` + itinerary → shared roster VMs.
 *
 * Parallel to Details `mapDetailsToRosterVM` / History `mapHistoryToRosterVM`.
 * Render-only — does not query DB (`useSectorsTrip` owns hydration).
 *
 * Sectors-specific: populates airport name display labels so
 * `locationDisplayMode: "nameAndCode"` can show cleaned names on the pipe.
 */

import {
  TimelineItemVM,
  TripDetailVM,
} from "@/components/roster/types";
import {
  ActiveTripMeta,
  SectorItineraryItem,
} from "@/db/sectors-types";
import { getFormattedTimeDurationPT } from "@/lib/utils";

/** Subset returned by useFlightTimeFormatter.getFlightDisplayDetails */
export interface FlightDisplayDetails {
  displayDepDate: string;
  displayArrDate: string;
  displayDepTime: string;
  displayArrTime: string;
  displayReportTime: string;
}

/**
 * Build TripDetailVM for the Sectors screen.
 *
 * @param isZulu — picks local vs zulu duration + header date bounds
 */
export function mapSectorsTripToDetailVM(
  activeTrip: ActiveTripMeta,
  itinerary: SectorItineraryItem[],
  formatCardHeaderDate: (dateStr: string) => string,
  getFlightDisplayDetails: (sector: any) => FlightDisplayDetails,
  isZulu: boolean,
): TripDetailVM {
  const timeline: TimelineItemVM[] = itinerary.map((node, index) => {
    if (node.type === "flight" && node.data) {
      const sectorForFmt = {
        ...node.data,
        actualReportTime: node.data.actualReportTime ?? null,
      };
      const fmt = getFlightDisplayDetails(sectorForFmt);

      const depCode = node.data.departureStation;
      const arrCode = node.data.arrivalStation;
      // Prefer cleaned airport names from useSectorsTrip; fall back to code.
      const depName = node.data.departureNameClean || depCode;
      const arrName = node.data.arrivalNameClean || arrCode;

      return {
        kind: "flight" as const,
        id: `sectors-flight-${activeTrip.tripNumber}-${index}`,
        dateLabel: fmt.displayDepDate,
        reportTimeLabel: fmt.displayReportTime || undefined,
        flightLabel: `${node.data.carrier}${node.data.flightNumber}`,
        routeLabel: `${depCode} → ${arrCode}`,
        departureCode: depCode,
        arrivalCode: arrCode,
        // "Name (CODE)" — matches previous Sectors pipe copy.
        departureDisplayLabel: `${depName} (${depCode})`,
        arrivalDisplayLabel: `${arrName} (${arrCode})`,
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
      id: `sectors-layover-${activeTrip.tripNumber}-${index}`,
      dateLabel: formatCardHeaderDate(node.dateStr),
    };
  });

  const durationDays = isZulu
    ? activeTrip.zuluDurationDays
    : activeTrip.localDurationDays;

  // Header dates: prefer formatted flight bounds when available (Local/Zulu aware).
  const flightNodes = itinerary.filter((n) => n.type === "flight" && n.data);
  const firstSrc = flightNodes[0]?.data;
  const lastSrc = flightNodes[flightNodes.length - 1]?.data;
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
      tripNumber: activeTrip.tripNumber,
      startDateLabel: firstFmt
        ? firstFmt.displayDepDate
        : formatCardHeaderDate(activeTrip.startDate),
      endDateLabel: lastFmt
        ? lastFmt.displayArrDate
        : formatCardHeaderDate(activeTrip.endDate),
      routingSummary: activeTrip.routingSummary,
      startDateRaw: activeTrip.startDate,
      endDateRaw: activeTrip.endDate,
      durationDays,
      totalFlyingHoursLabel:
        getFormattedTimeDurationPT(activeTrip.creditAmount) ?? undefined,
    },
    timeline,
  };
}
