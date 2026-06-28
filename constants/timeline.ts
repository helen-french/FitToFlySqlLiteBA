import { GroundDuty, Sector, Trip } from "@/db/schema";

export interface TripItem {
  type: "flight" | "layover";
  dateStr: string;
  endDateStr?: string;
  layoverDurationHours?: number;
  data?: Sector & { actualReportTime?: string | null };
}

export interface TimelineRow {
  id: string;
  type: "T" | "G"; // T for Trip, G for Ground
  startDate: string;
  tripData?: {
    tripMeta: Trip;
    routingSummary: string;
    timeline: TripItem[];
    calculatedStartDate: string;
    calculatedEndDate: string;
    trueLocalDurationDays: number;
    trueZuluDurationDays: number;
  };
  groundData?: GroundDuty & { creditAmount?: string | null };
}
