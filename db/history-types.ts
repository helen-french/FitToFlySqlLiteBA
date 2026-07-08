/* Shared types for the Change History feature.

These are intentionally UI-agnostic so both the data layer (useHistoryLogs)
and the presentational components (components/history/*) can depend on them
without pulling in each other. */

import { RosterAmendment, Sector } from "@/db/schema";

export interface HistoryItineraryItem {
  type: "flight" | "layover";
  dateStr: string;
  data?: Sector & { actualReportTime?: string | null };
}

export interface HydratedHistoryRow {
  id: string;
  amendment: RosterAmendment;
  captureDate: string;
  badgeColor: string;
  badgeLabel: string;
  // Canonical "YYYY-MM-DD" key used for sorting rows by duty date.
  sortDate: string;
  tripData?: {
    startDateStr: string;
    endDateStr: string;
    routingSummary: string;
    timeline: HistoryItineraryItem[];
  };
  groundDutyData?: {
    startDateStr: string;
    endDateStr: string;
    /** Local start time from ground_duties.start_time (e.g. "00:01"). */
    startTime?: string | null;
    /** Local end time from ground_duties.end_time (e.g. "24:00"). */
    endTime?: string | null;
    creditAmount: string;
    code: string;
  };
}

// Resolved theme palette passed down to the presentational cards.
// cardBg / border should use the shared roster tokens (white + grey border),
// not the retired solid-grey History fill.
export interface HistoryThemeColors {
  textColor: string;
  subTextColor: string;
  cardBg: string;
  /** Same translucent grey as Details CalendarCard (not the white roster card fill). */
  calendarCardBg: string;
  nestedBoxBg: string;
  border: string;
  accent: string;
  timelinePipe: string;
  /** Local-mode times — from `Colors.[theme].localTime`. */
  localTime: string;
}

// Sort modes offered by the history screen toggle.
export type HistorySortOrder = "dutyDateAsc" | "changedDateDesc";
