/**
 * GenericHistoryCard
 *
 * Fallback for amendment item types without a dedicated layout.
 * Uses the same `RosterCardShell` surface as trip / ground cards.
 */

import React from "react";

import { Text, View } from "@/components/Themed";
import { cardStyles as styles } from "@/components/history/historyStyles";
import { RosterCardShell } from "@/components/roster";
import { HistoryThemeColors, HydratedHistoryRow } from "@/db/history-types";

interface Props {
  row: HydratedHistoryRow;
  themeColors: HistoryThemeColors;
}

export function GenericHistoryCard({ row, themeColors }: Props) {
  return (
    <RosterCardShell themeColors={themeColors}>
      <View style={styles.badgeMetadataRow}>
        <View style={[styles.badgePill, { backgroundColor: row.badgeColor }]}>
          <Text style={styles.badgeText}>{row.badgeLabel}</Text>
        </View>
        <Text style={[styles.metaText, { color: themeColors.subTextColor }]}>
          Roster Update
          {row.captureDate ? ` • Sync Date: ${row.captureDate}` : ""}
        </Text>
      </View>
      <Text
        style={[
          styles.genericDetailsText,
          { color: themeColors.textColor, marginTop: 4 },
        ]}
      >
        {row.amendment.details}
      </Text>
    </RosterCardShell>
  );
}
