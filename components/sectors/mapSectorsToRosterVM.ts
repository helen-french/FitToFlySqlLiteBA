/**
 * Adapters: Sectors `ActiveTripMeta` + itinerary → shared roster VMs.
 *
 * Parallel to Details `mapDetailsToRosterVM` / History `mapHistoryToRosterVM`.
 * Render-only — does not query DB (`useSectorsTrip` owns hydration).
 *
 * Shared clock / route / header-date rules live in
 * `@/components/roster/mapRosterAdapters`. Sectors-specific: first-sector-of-duty
 * hours on the deep-dive pipe.
 */

import {
  GetFlightDisplayDetails,
  mapSectorToFlightVM,
  resolveTripHeaderDateLabels,
} from "@/components/roster/mapRosterAdapters";
import {
  TimelineItemVM,
  TripDetailVM,
} from "@/components/roster/types";
import {
  ActiveTripMeta,
  SectorItineraryItem,
} from "@/db/sectors-types";
import { getFormattedTimeDurationPT } from "@/lib/utils";

/**
 * Build TripDetailVM for the Sectors screen.
 *
 * @param isZulu — picks local vs zulu duration + header date bounds
 *
 * Turnaround nodes omit dateLabel (label only, inline with pipe).
 */
export function mapSectorsTripToDetailVM(
  activeTrip: ActiveTripMeta,
  itinerary: SectorItineraryItem[],
  formatCardHeaderDate: (dateStr: string) => string,
  getFlightDisplayDetails: GetFlightDisplayDetails,
  isZulu: boolean,
): TripDetailVM {
  const seenDutyNumbers = new Set<number>();

  const timeline: TimelineItemVM[] = itinerary.map((node, index) => {
    if (node.type === "flight" && node.data) {
      const isFirstSectorForDuty = !seenDutyNumbers.has(node.data.dutyNumber);
      seenDutyNumbers.add(node.data.dutyNumber);

      return mapSectorToFlightVM(
        node.data,
        getFlightDisplayDetails,
        `sectors-flight-${activeTrip.tripNumber}-${index}`,
        {
          dutyHoursLabel: isFirstSectorForDuty
            ? getFormattedTimeDurationPT(node.data.dutyHours) ?? undefined
            : undefined,
        },
      );
    }

    // Turnaround: no date — label + Hotel chip via hotelStationCode (prev arrival).
    return {
      kind: "layover" as const,
      id: `sectors-layover-${activeTrip.tripNumber}-${index}`,
      hotelStationCode: node.turnaroundFrom?.arrivalStation,
    };
  });

  const durationDays = isZulu
    ? activeTrip.zuluDurationDays
    : activeTrip.localDurationDays;

  const flightNodes = itinerary.filter((n) => n.type === "flight" && n.data);
  const firstSrc = flightNodes[0]?.data;
  const lastSrc = flightNodes[flightNodes.length - 1]?.data;
  const headerDates = resolveTripHeaderDateLabels(
    firstSrc,
    lastSrc,
    getFlightDisplayDetails,
    formatCardHeaderDate(activeTrip.startDate),
    formatCardHeaderDate(activeTrip.endDate),
  );

  return {
    header: {
      tripNumber: activeTrip.tripNumber,
      ...headerDates,
      routingSummary: activeTrip.routingSummary,
      startDateRaw: activeTrip.startDate,
      endDateRaw: activeTrip.endDate,
      durationDays,
      totalFlyingHoursLabel: activeTrip.totalFlyingHoursLabel,
      totalDutyHoursLabel: activeTrip.totalDutyHoursLabel,
    },
    timeline,
  };
}

export default mapSectorsTripToDetailVM;
