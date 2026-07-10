/**
 * Shared View Models + display options for trip / ground / timeline UI.
 *
 * These types are intentionally UI-facing (labels already formatted where
 * practical) so presentational components do not need to know about Drizzle
 * rows or screen-specific hydration. Each screen supplies an adapter that
 * maps its own data shape into these VMs.
 *
 * Phase 1 consumers: History (wired). Details + Sectors come later.
 */

/** Matches the global TimeModeZOrL provider (LOCAL default). */
export type RosterTimeMode = "local" | "zulu";

/**
 * Airport label strategy.
 * "nameAndCode" is reserved until airport lookup is sorted — screens should
 * stick to "code" for now (placeholder fields exist on flight VMs).
 */
export type LocationDisplayMode = "code" | "nameAndCode";

/** Params passed when a disclosure chevron navigates to the Sectors tab. */
export interface SectorNavParams {
  tripNumber: string;
  /** YYYY-MM-DD */
  startDate: string;
  /** YYYY-MM-DD */
  endDate: string;
  routing: string;
}

/**
 * Collapsed / header summary for a trip accordion.
 * Duration and total flying hours are optional so History can omit them
 * while Details / Sectors can opt in later.
 */
export interface TripHeaderVM {
  tripNumber: string;
  startDateLabel: string;
  endDateLabel: string;
  routingSummary: string;
  /** Inclusive calendar-day span; optional per screen. */
  durationDays?: number;
  /** Formatted trip-level flying hours, e.g. "12hrs 30mins". */
  totalFlyingHoursLabel?: string;
  /**
   * Raw values kept so parents can rebuild SectorNavParams without
   * reverse-parsing display labels.
   */
  startDateRaw: string;
  endDateRaw: string;
}

export interface TimelineFlightVM {
  kind: "flight";
  id: string;
  dateLabel: string;
  reportTimeLabel?: string;
  flightLabel: string;
  routeLabel: string;
  departureCode: string;
  arrivalCode: string;
  /**
   * PLACEHOLDER — populate once airport lookup is shared.
   * Until then leave undefined and render codes only.
   */
  departureDisplayLabel?: string;
  arrivalDisplayLabel?: string;
  departureTimeLabel: string;
  arrivalTimeLabel: string;
  /** Per-sector flying hours label (optional). */
  flyingHoursLabel?: string;
  /** Per-duty duty hours label (optional; first sector of each duty). */
  dutyHoursLabel?: string;
}

export interface TimelineLayoverVM {
  kind: "layover";
  id: string;
  /** Optional — Sectors omit so Turnaround is a single untitled pipe node. */
  dateLabel?: string;
  /** Reserved for turnaround display; not implemented in Phase 1. */
  turnaroundLabel?: string;
  /**
   * Layover station IATA for hotel lookup — previous flight’s arrival
   * (destination of the inbound sector).
   */
  hotelStationCode?: string;
}

export type TimelineItemVM = TimelineFlightVM | TimelineLayoverVM;

/** Full trip payload for accordion + pipe. */
export interface TripDetailVM {
  header: TripHeaderVM;
  timeline: TimelineItemVM[];
}

/**
 * Ground duty card VM.
 * Header shows `dateLabel` + code only — credit / start / end live in the
 * accordion body (times are always local per roster feed).
 */
export interface GroundDutyVM {
  id: string;
  /** Header date (single day or "start — end" via formatGroundDutyDateLabel). */
  dateLabel: string;
  code?: string;
  /** Formatted credit for accordion body, e.g. "3hrs 25mins". */
  creditLabel?: string;
  /** Accordion: start date DD/MM/YYYY (local). */
  startDateLabel?: string;
  /** Accordion: start time local, e.g. "00:01". */
  startTimeLabel?: string;
  /** Accordion: end date DD/MM/YYYY (local). */
  endDateLabel?: string;
  /** Accordion: end time local, e.g. "24:00". */
  endTimeLabel?: string;
}

/**
 * Theme tokens the roster presentational layer needs.
 * Compatible with HistoryThemeColors and the details theme object.
 *
 * ## Card surface standard (`cardBg` + `border`)
 * Always pair with `RosterCardShell`. Prefer the exported tokens:
 * - Light: `ROSTER_CARD_LIGHT_BG` + `ROSTER_CARD_LIGHT_BORDER`
 * - Dark: `ROSTER_CARD_DARK_BG` + `ROSTER_CARD_DARK_BORDER`
 *
 * Do **not** pass solid grey `#F2F2F7` as `cardBg` for trip/ground cards —
 * that was the old History-only look and is retired.
 */
export interface RosterThemeColors {
  textColor: string;
  subTextColor: string;
  cardBg: string;
  border: string;
  accent: string;
  timelinePipe: string;
  /** Local-mode dep/arr/report/ground times — from `Colors.[theme].localTime`. */
  localTime: string;
}

/**
 * Feature flags that let each screen show a slightly different subset
 * of the same master layout (details vs history vs sectors).
 *
 * ## All `TripDisplayOptions` at a glance
 *
 * | Flag | Affects | Notes |
 * | --- | --- | --- |
 * | `timeMode?` | callers + `TimelineFlightRow` | `"local"` \| `"zulu"` — formatting upstream; Local paints dep/arr + report clock green (not "Report:" / "(z - todo)") |
 * | `showDuration?` | `TripHeaderSummary` | inclusive day count |
 * | `showTripNumber?` | `TripHeaderSummary` | "Trip {n}" |
 * | `showTotalFlyingHours?` | `TripHeaderSummary` | trip-level flying hours line |
 * | `showLayovers?` | `TripTimelinePipe` | default true; false = hide Turnaround nodes (History) |
 * | `showReportTime?` | `TimelineFlightRow` | report time beside date |
 * | `showFlyingHours?` | `TimelineFlightRow` | per-sector flying hours |
 * | `showTurnaround?` | `TimelineLayoverRow` | reserved extra turnaround detail / not implemented |
 * | `showHotelAction?` | `TimelineLayoverRow` | Hotel chip (needs hotelStationCode) |
 * | `onPressHotel?` | `TimelineLayoverRow` | `(stationCode) => void` |
 * | `showNotesAction?` | `TimelineLayoverRow` | Notes chip → Notes Enroute (needs hotelStationCode) |
 * | `onPressNotes?` | `TimelineLayoverRow` | `(stationCode) => void` |
 * | `showFlightNotesActions?` | `TimelineFlightRow` | Dep/Arr note chips on flight rows |
 * | `onPressDepartureNotes?` | `TimelineFlightRow` | `(stationCode) => void` |
 * | `onPressArrivalNotes?` | `TimelineFlightRow` | `(stationCode) => void` |
 * | `showSectorChevron?` | `TimelineFlightRow` | disclosure → Sectors |
 * | `onPressSector?` | `TimelineFlightRow` | `(SectorNavParams) => void` |
 * | `iconColor?` | **`TripHeaderSummary` only** | badge colour for header plane; pipe icons stay blue |
 * | `locationDisplayMode?` | `TimelineFlightRow` | `"code"` (default) or parked `"nameAndCode"` |
 */
export interface TripDisplayOptions {
  /** Drive Local / Zulu label formatting decisions upstream; reserved for callers. */
  timeMode?: RosterTimeMode;

  showDuration?: boolean;
  showTripNumber?: boolean;
  /** Trip-level total flying hours under the routing line. */
  showTotalFlyingHours?: boolean;

  showLayovers?: boolean;
  showReportTime?: boolean;
  /** Per-flight-row flying hours. */
  showFlyingHours?: boolean;
  /** Reserved — turnaround UI not built yet. */
  showTurnaround?: boolean;

  /** Show Hotel chip on turnaround when hotelStationCode is set. */
  showHotelAction?: boolean;
  /** Open Hotels for the layover station IATA (Sectors modal or Tools screen). */
  onPressHotel?: (stationCode: string) => void;

  /** Show Notes chip on turnaround when hotelStationCode is set (Enroute). */
  showNotesAction?: boolean;
  /** Navigate to Notes with the layover station IATA (category E). */
  onPressNotes?: (stationCode: string) => void;

  /** Show Dep/Arr Notes chips on flight rows when station codes exist. */
  showFlightNotesActions?: boolean;
  /** Navigate to Notes for departure station (category D). */
  onPressDepartureNotes?: (stationCode: string) => void;
  /** Navigate to Notes for arrival station (category A). */
  onPressArrivalNotes?: (stationCode: string) => void;

  showSectorChevron?: boolean;
  onPressSector?: (params: SectorNavParams) => void;

  /**
   * Tints the **header** plane-departure icon only (e.g. History badge colour).
   * Pipe node icons always use theme accent blue.
   */
  iconColor?: string;

  /** Parked: keep "code" until airport lookup is ready. */
  locationDisplayMode?: LocationDisplayMode;
}

export interface GroundDutyDisplayOptions {
  /**
   * @deprecated Credit moved into the ground accordion body — no longer shown
   * under the header. Kept optional so old call sites compile until cleaned up.
   */
  showCredit?: boolean;
  /** History passes badgeColour so the plane-slash matches ADDED/REMOVED. */
  iconColor?: string;
}
