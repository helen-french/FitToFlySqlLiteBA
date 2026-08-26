/**
 * Roster tab data shapes.
 *
 * Produced by `useDetailsTimeline` and consumed by the Roster screen /
 * `RosterTripCard` / `RosterGroundCard`. Payload types for timeline rows live
 * here (same idea as history-types); shared paint VMs live in `components/roster`.
 */

import { GroundDuty, Sector, Trip } from "@/db/schema";

/** One node on a trip’s pipe (flight or layover). Built during hydration. */
export interface DetailsItineraryItem {
  type: "flight" | "layover";
  dateStr: string;
  endDateStr?: string;
  layoverDurationHours?: number;
  data?: Sector & { actualReportTime?: string | null };
}

/**
 * FlatList row: either a trip (T) or ground duty (G).
 * Cards map `tripData` / `groundData` via `mapDetailsToRosterVM`.
 */
export interface UnifiedTimelineRow {
  id: string;
  type: "T" | "G";
  startDate: string;
  tripData?: {
    tripMeta: Trip;
    routingSummary: string;
    timeline: DetailsItineraryItem[];
    /** Zulu span used for calendar scroll / markers (sector dates). */
    calculatedStartDate: string;
    calculatedEndDate: string;
    trueLocalDurationDays: number;
    trueZuluDurationDays: number;
  };
  groundData?: GroundDuty & { creditAmount?: string | null };
}
