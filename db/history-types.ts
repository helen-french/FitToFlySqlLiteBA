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
    creditAmount: string;
    code: string;
  };
}

// Resolved theme palette passed down to the presentational cards.
export interface HistoryThemeColors {
  textColor: string;
  subTextColor: string;
  cardBg: string;
  nestedBoxBg: string;
  border: string;
  accent: string;
  timelinePipe: string;
}

// Sort modes offered by the history screen toggle.
export type HistorySortOrder = "dutyDateAsc" | "changedDateDesc";
