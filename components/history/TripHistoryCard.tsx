/**
 * TripHistoryCard
 *
 * History/amendment chrome: ADDED/REMOVED/CHANGED badge + sync date.
 * Outer surface uses shared `RosterCardShell` (white + grey border standard).
 * Inner trip summary + pipe come from shared roster components.
 *
 * ## Props
 *
 * | Prop | Type | Notes |
 * | --- | --- | --- |
 * | `row` | `HydratedHistoryRow` | hydrated amendment + trip timeline |
 * | `themeColors` | `HistoryThemeColors` | includes roster card tokens |
 * | `expandable?` | `boolean` | default `true` = History accordion. `false` = flat summary only (Details modal): no chevron, no pipe, not tappable to expand |
 * | `isExpanded?` | `boolean` | used when `expandable` (History) |
 * | `onToggle?` | `() => void` | used when `expandable` (History) |
 */

import { FontAwesome6 } from "@expo/vector-icons";
import React, { useMemo } from "react";
import { TouchableOpacity } from "react-native";
import Animated, { FadeInUp, FadeOutDown } from "react-native-reanimated";

import { Text, View } from "@/components/Themed";
import { useTimeModeZOrL } from "@/components/TimeModeZOrL";
import { cardStyles as styles } from "@/components/history/historyStyles";
import { mapHistoryTripToDetailVM } from "@/components/history/mapHistoryToRosterVM";
import {
  RosterCardShell,
  TripHeaderSummary,
  TripTimelinePipe,
} from "@/components/roster";
import { useFlightTimeFormatter } from "@/components/useFlightTimeFormatter";
import { HistoryThemeColors, HydratedHistoryRow } from "@/db/history-types";

interface Props {
  row: HydratedHistoryRow;
  themeColors: HistoryThemeColors;
  /**
   * History list: `true` (default) — chevron + expand/collapse pipe.
   * Details amendments modal: `false` — flat summary only (badge, sync, dates,
   * routing). No disclosure arrow, no accordion, no timeline pipe.
   */
  expandable?: boolean;
  isExpanded?: boolean;
  onToggle?: () => void;
}

export function TripHistoryCard({
  row,
  themeColors,
  expandable = true,
  isExpanded = false,
  onToggle,
}: Props) {
  const { isZulu } = useTimeModeZOrL();
  const { getFlightDisplayDetails } = useFlightTimeFormatter();

  // Rebuild when the row OR the Local/Zulu mode changes (formatter closes over isZulu).
  const tripVM = useMemo(
    () => mapHistoryTripToDetailVM(row, getFlightDisplayDetails),
    [row, getFlightDisplayDetails],
  );

  // Accordion pipe only when this is an expandable History row that is open.
  // Modal (`expandable={false}`) never shows the accordion body.
  const showAccordionBody = expandable && isExpanded && !!tripVM;

  const headerBlock = (
    <View style={{ flex: 1, backgroundColor: "transparent" }}>
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

      {tripVM ? (
        <View style={{ backgroundColor: "transparent", marginTop: 4 }}>
          <TripHeaderSummary
            header={tripVM.header}
            themeColors={themeColors}
            options={{
              iconColor: row.badgeColor,
            }}
          />
        </View>
      ) : null}
    </View>
  );

  return (
    <RosterCardShell themeColors={themeColors}>
      {expandable ? (
        <TouchableOpacity
          activeOpacity={0.7}
          disabled={!tripVM}
          onPress={onToggle}
          style={styles.cardHeaderInteractiveRow}
        >
          {headerBlock}
          {tripVM ? (
            <FontAwesome6
              name={isExpanded ? "chevron-up" : "chevron-down"}
              size={13}
              color={themeColors.subTextColor}
              style={{ marginLeft: 12 }}
            />
          ) : null}
        </TouchableOpacity>
      ) : (
        // Flat modal card: same summary as History, zero accordion chrome.
        <View style={styles.cardHeaderInteractiveRow}>{headerBlock}</View>
      )}

      {showAccordionBody ? (
        <Animated.View
          entering={FadeInUp.duration(200)}
          exiting={FadeOutDown.duration(150)}
          style={styles.detailsTray}
        >
          <Text
            style={[styles.varianceNotes, { color: themeColors.subTextColor }]}
          >
            {row.amendment.details}
          </Text>

          <TripTimelinePipe
            items={tripVM!.timeline}
            themeColors={themeColors}
            header={tripVM!.header}
            options={{
              timeMode: isZulu ? "zulu" : "local",
              showLayovers: false,
              showReportTime: true,
              showSectorChevron: false,
              locationDisplayMode: "code",
            }}
          />
        </Animated.View>
      ) : null}
    </RosterCardShell>
  );
}
