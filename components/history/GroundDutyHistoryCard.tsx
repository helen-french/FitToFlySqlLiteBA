/**
 * GroundDutyHistoryCard
 *
 * History-owned chrome (badge + sync date). Outer surface is shared
 * `RosterCardShell`; body is shared `GroundDutySummary`.
 */

import React, { useMemo } from "react";

import { Text, View } from "@/components/Themed";
import { cardStyles as styles } from "@/components/history/historyStyles";
import { mapHistoryGroundToVM } from "@/components/history/mapHistoryToRosterVM";
import { GroundDutySummary, RosterCardShell } from "@/components/roster";
import { HistoryThemeColors, HydratedHistoryRow } from "@/db/history-types";

interface Props {
  row: HydratedHistoryRow;
  themeColors: HistoryThemeColors;
}

export function GroundDutyHistoryCard({ row, themeColors }: Props) {
  const dutyVM = useMemo(() => mapHistoryGroundToVM(row), [row]);

  return (
    <RosterCardShell themeColors={themeColors}>
      <View style={styles.badgeMetadataRow}>
        <View style={[styles.badgePill, { backgroundColor: row.badgeColor }]}>
          <Text style={styles.badgeText}>{row.badgeLabel}</Text>
        </View>
        {!!row.captureDate && (
          <Text style={[styles.metaText, { color: themeColors.subTextColor }]}>
            Sync Date: {row.captureDate}
          </Text>
        )}
      </View>

      {dutyVM ? (
        <View style={{ backgroundColor: "transparent", marginTop: 4 }}>
          <GroundDutySummary
            duty={dutyVM}
            themeColors={themeColors}
            options={{
              iconColor: row.badgeColor,
              // History previously omitted credit on ground cards; keep that.
              showCredit: false,
            }}
          />
        </View>
      ) : null}
    </RosterCardShell>
  );
}
