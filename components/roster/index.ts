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
  joinHoursLabels,
  mapSectorToFlightVM,
  resolveTripHeaderDateLabels,
} from "./mapRosterAdapters";
export type {
  FlightDisplayDetails,
  GetFlightDisplayDetails,
  RosterFlightSectorSource,
} from "./mapRosterAdapters";
export {
  mapDetailsGroundToVM,
  mapDetailsTripToDetailVM,
} from "./mapDetailsToRosterVM";
export type {
  DetailsGroundData,
  DetailsItineraryItem,
  DetailsTripData,
} from "./mapDetailsToRosterVM";
export {
  RosterCardShell,
  ROSTER_CARD_DARK_BG,
  ROSTER_CARD_DARK_BORDER,
  ROSTER_CARD_LIGHT_BG,
  ROSTER_CARD_LIGHT_BORDER,
} from "./RosterCardShell";
export { RosterGroundCard } from "./RosterGroundCard";
export { RosterTripCard } from "./RosterTripCard";
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
