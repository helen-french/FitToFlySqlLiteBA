/**
 * RosterGroundCard
 *
 * Thin wrapper: maps roster ground payload → GroundDutyVM, then
 * `RosterCardShell` + `GroundDutyAccordion` (shared with History).
 *
 * Collapsed: date range + “Ground Duty”. Expanded: code | credit, then
 * start/end date+local times (no pipe, no duration days).
 *
 * Adapter: `@/components/roster/mapDetailsToRosterVM` → `mapDetailsGroundToVM`.
 */

import React, { useMemo } from "react";

import { GroundDutyAccordion } from "@/components/roster/GroundDutyAccordion";
import {
  DetailsGroundData,
  mapDetailsGroundToVM,
} from "@/components/roster/mapDetailsToRosterVM";
import { RosterCardShell } from "@/components/roster/RosterCardShell";
import { useFlightTimeFormatter } from "@/components/useFlightTimeFormatter";

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

export function RosterGroundCard({
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
          iconColor: "#FF9500",
        }}
      />
    </RosterCardShell>
  );
}

export default RosterGroundCard;
