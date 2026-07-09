/**
 * DetailsGroundCard
 *
 * Thin wrapper: maps Details ground payload → GroundDutyVM, then
 * `RosterCardShell` + `GroundDutyAccordion` (shared with History).
 *
 * Collapsed: date range + “Ground Duty”. Expanded: code | credit, then
 * start/end date+local times (no pipe, no duration days).
 *
 * Adapter: `@/components/details/mapDetailsToRosterVM` → `mapDetailsGroundToVM`.
 */

import React, { useMemo } from "react";

import {
  GroundDutyAccordion,
  RosterCardShell,
} from "@/components/roster";
import { useFlightTimeFormatter } from "@/components/useFlightTimeFormatter";
import {
  DetailsGroundData,
  mapDetailsGroundToVM,
} from "@/components/details/mapDetailsToRosterVM";

interface ThemeColors {
  textColor: string;
  subTextColor: string;
  cardBg: string;
  border: string;
  accent: string;
  timelinePipe: string;
  localTime: string;
}

interface Props {
  groundData: DetailsGroundData;
  themeColors: ThemeColors;
  isExpanded: boolean;
  onToggle: () => void;
}

export function DetailsGroundCard({
  groundData,
  themeColors,
  isExpanded,
  onToggle,
}: Props) {
  const { formatCardHeaderDate } = useFlightTimeFormatter();

  const dutyVM = useMemo(
    () => mapDetailsGroundToVM(groundData, formatCardHeaderDate),
    [groundData, formatCardHeaderDate],
  );

  return (
    <RosterCardShell themeColors={themeColors}>
      <GroundDutyAccordion
        duty={dutyVM}
        themeColors={themeColors}
        isExpanded={isExpanded}
        onToggle={onToggle}
        options={{
          // Previous Details UI used fixed orange for ground duties.
          iconColor: "#FF9500",
        }}
      />
    </RosterCardShell>
  );
}

export default DetailsGroundCard;
