/**
 * Barrel export for shared roster trip / ground / pipe UI.
 * Screens and history cards should import from here rather than deep paths.
 */

export { GroundDutyAccordion } from "./GroundDutyAccordion";
export { GroundDutySummary } from "./GroundDutySummary";
export {
  clockLabelFromDisplayTime,
  formatFlightLabel,
  formatRouteLabel,
  mapSectorToFlightVM,
  resolveTripHeaderDateLabels,
} from "./mapRosterAdapters";
export type {
  FlightDisplayDetails,
  GetFlightDisplayDetails,
  RosterFlightSectorSource,
} from "./mapRosterAdapters";
export {
  RosterCardShell,
  ROSTER_CARD_DARK_BG,
  ROSTER_CARD_DARK_BORDER,
  ROSTER_CARD_LIGHT_BG,
  ROSTER_CARD_LIGHT_BORDER,
} from "./RosterCardShell";
export { TimelineFlightRow } from "./TimelineFlightRow";
export { TimelineLayoverRow } from "./TimelineLayoverRow";
export { TripHeaderSummary } from "./TripHeaderSummary";
export { TripTimelinePipe } from "./TripTimelinePipe";
export type {
  GroundDutyDisplayOptions,
  GroundDutyVM,
  LocationDisplayMode,
  RosterThemeColors,
  RosterTimeMode,
  SectorNavParams,
  TimelineFlightVM,
  TimelineItemVM,
  TimelineLayoverVM,
  TripDetailVM,
  TripDisplayOptions,
  TripHeaderVM,
} from "./types";
