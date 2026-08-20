/**
 * Sectors tab data shapes.
 *
 * Produced by `useSectorsTrip` and consumed by the Sectors screen.
 * Kept out of `components/roster/` (same idea as details-types / history-types).
 */

export interface SectorRowData {
  id: number;
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
  actualReportTime: string | null;
  flyingHours: string | null;
  dutyHours: string | null;
  dutyNumber: number;
  departureNameClean?: string;
  arrivalNameClean?: string;
}

export interface SectorItineraryItem {
  type: "flight" | "layover";
  dateStr: string;
  data?: SectorRowData;
  /**
   * Layover only — previous flight sector (arrival side of the turnaround window).
   * Mapper formats Local/Zulu arr date via useFlightTimeFormatter.
   */
  turnaroundFrom?: SectorRowData;
  /**
   * Layover only — next flight sector (departure side of the turnaround window).
   */
  turnaroundTo?: SectorRowData;
}

export interface UniqueStationItem {
  code: string;
  fullNameClean: string;
}

export interface ActiveTripMeta {
  tripNumber: string;
  /** Display / calendar start (Zulu sector span — same as Details calculatedStart). */
  startDate: string;
  endDate: string;
  routingSummary: string;
  /** Inclusive days via getTripDurationDays (Local + Zulu both available). */
  totalDays: number;
  localDurationDays: number;
  zuluDurationDays: number;
  creditAmount: string | null;
  totalFlyingHoursLabel?: string;
  totalDutyHoursLabel?: string;
  uniqueStationsList: UniqueStationItem[];
}

export interface SectorsNavParams {
  tripNumber?: string;
  startDate?: string;
  endDate?: string;
  routing?: string;
}
