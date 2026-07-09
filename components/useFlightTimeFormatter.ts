/* MD]
 * ============================================================================
 * WHAT IT IS:
 * A pure structural Custom Hook handling operational date and time formatting.
 *
 * WHAT IT DOES:
 * It bridges the gap between raw database Zulu strings and client-facing display
 * rows. It dynamically intercepts flight timelines and formats departure, arrival,
 * and report times with appropriate text-brackets flags based on the active preference.
 *
 * HOW IT WORKS:
 * 1. It taps into 'useTimeModeZOrL()' to check whether 'isZulu' is active.
 * 2. 'getFlightDisplayDetails()' processes a database sector row object.
 * 3. Departure/Arrival times toggle gracefully between (l) and (z).
 * 4. Actual Report Time is locked strictly to raw format with a temporary (z - todo) tag.
 * ============================================================================
 */

import { useCallback } from "react";
import {
  applyDayShiftToDate,
  resolveSectorZuluArrivalDate,
} from "@/lib/utils";
import { useTimeModeZOrL } from "./TimeModeZOrL";

interface SectorRowData {
  departureTime: string;
  departureTimeLocal: string | null;
  departureTimeShift: string | null;
  arrivalTime: string;
  arrivalTimeLocal: string | null;
  arrivalTimeShift: string | null;
  actualReportTime: string | null;
}

export function useFlightTimeFormatter() {
  const { timeMode, isZulu } = useTimeModeZOrL();

  // Helper: Converts standard YYYY-MM-DD to cleaner DD/MM/YYYY presentation format
  const formatCardHeaderDate = useCallback((dateStr: string) => {
    if (!dateStr || !dateStr.includes("-")) return dateStr;
    const [year, month, day] = dateStr.split("-");
    return `${day}/${month}/${year}`;
  }, []);

  // Helper: Takes a base ISO string and offsets it by a day-shift integer string
  const getShiftedDate = useCallback(
    (baseZuluDateStr: string, shiftStr: string | null) =>
      applyDayShiftToDate(baseZuluDateStr, shiftStr),
    [],
  );

  // Main Calculation Processor
  const getFlightDisplayDetails = useCallback(
    (sector: SectorRowData) => {
      const zuluDepDate = sector.departureTime.split("T")[0];
      const zuluArrDate = resolveSectorZuluArrivalDate(
        sector.departureTime,
        sector.arrivalTime,
      );

      // 1. Resolve localized day shifts based on current settings mode
      const depDateRaw = isZulu
        ? zuluDepDate
        : getShiftedDate(zuluDepDate, sector.departureTimeShift);
      const arrDateRaw = isZulu
        ? zuluArrDate
        : getShiftedDate(zuluArrDate, sector.arrivalTimeShift);

      const displayDepDate = formatCardHeaderDate(depDateRaw);
      const displayArrDate = formatCardHeaderDate(arrDateRaw);

      // 2. Format flight times with brackets strings
      const displayDepTime =
        sector.departureTimeLocal && !isZulu
          ? `${sector.departureTimeLocal} (l)`
          : `${sector.departureTime.split("T")[1]?.slice(0, 5) || sector.departureTime} (z)`;

      const displayArrTime =
        sector.arrivalTimeLocal && !isZulu
          ? `${sector.arrivalTimeLocal} (l)`
          : `${sector.arrivalTime.includes("T") ? sector.arrivalTime.split("T")[1]?.slice(0, 5) : sector.arrivalTime} (z)`;

      // 3. Format crew report times strictly with custom reminder bracket
      let displayReportTime = "";
      if (sector.actualReportTime) {
        displayReportTime = `${sector.actualReportTime} (z - todo)`;
      }

      return {
        displayDepDate,
        displayArrDate,
        displayDepTime,
        displayArrTime,
        displayReportTime,
      };
    },
    [isZulu, getShiftedDate, formatCardHeaderDate],
  );

  return {
    timeMode,
    isZulu,
    getFlightDisplayDetails,
    formatCardHeaderDate,
    getShiftedDate,
  };
}
