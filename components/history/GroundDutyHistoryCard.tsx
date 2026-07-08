/**
 * GroundDutyHistoryCard
 *
 * History-owned chrome (badge + sync date) + shared GroundDutyAccordion.
 * Expandable like trips; credit / start / end live in the accordion body.
 */

import React, { useMemo } from "react";

import { Text, View } from "@/components/Themed";
import { cardStyles as styles } from "@/components/history/historyStyles";
import { mapHistoryGroundToVM } from "@/components/history/mapHistoryToRosterVM";
import { GroundDutyAccordion, RosterCardShell } from "@/components/roster";
import { HistoryThemeColors, HydratedHistoryRow } from "@/db/history-types";

interface Props {
  row: HydratedHistoryRow;
  themeColors: HistoryThemeColors;
  /** History: accordion. RosterUpdatesModal: pass expandable={false}. */
  expandable?: boolean;
  isExpanded?: boolean;
  onToggle?: () => void;
}

export function GroundDutyHistoryCard({
  row,
  themeColors,
  expandable = true,
  isExpanded = false,
  onToggle,
}: Props) {
  const dutyVM = useMemo(() => mapHistoryGroundToVM(row), [row]);

  if (!dutyVM) {
    return (
      <RosterCardShell themeColors={themeColors}>
        <View style={styles.badgeMetadataRow}>
          <View
            style={[styles.badgePill, { backgroundColor: row.badgeColor }]}
          >
            <Text style={styles.badgeText}>{row.badgeLabel}</Text>
          </View>
          {!!row.captureDate && (
            <Text
              style={[styles.metaText, { color: themeColors.subTextColor }]}
            >
              Sync Date: {row.captureDate}
            </Text>
          )}
        </View>
      </RosterCardShell>
    );
  }

  const badgeAccessory = (
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
  );

  return (
    <RosterCardShell themeColors={themeColors}>
      <GroundDutyAccordion
        duty={dutyVM}
        themeColors={themeColors}
        expandable={expandable}
        isExpanded={!!isExpanded}
        onToggle={onToggle ?? (() => {})}
        headerAccessory={badgeAccessory}
        options={{
          iconColor: row.badgeColor,
        }}
      />
    </RosterCardShell>
  );
}
