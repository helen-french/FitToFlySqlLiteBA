/**
 * TripHistoryCard
 *
 * History-owned shell: grey card + ADDED/REMOVED/CHANGED badge + sync date.
 * Inner trip summary + pipe come from shared roster components so Details /
 * Sectors can converge on the same layout later without losing History chrome.
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
  TripHeaderSummary,
  TripTimelinePipe,
} from "@/components/roster";
import { useFlightTimeFormatter } from "@/components/useFlightTimeFormatter";
import { HistoryThemeColors, HydratedHistoryRow } from "@/db/history-types";

interface Props {
  row: HydratedHistoryRow;
  themeColors: HistoryThemeColors;
  isExpanded: boolean;
  onToggle: () => void;
}

export function TripHistoryCard({
  row,
  themeColors,
  isExpanded,
  onToggle,
}: Props) {
  const { isZulu } = useTimeModeZOrL();
  const { getFlightDisplayDetails } = useFlightTimeFormatter();

  // Rebuild when the row OR the Local/Zulu mode changes (formatter closes over isZulu).
  const tripVM = useMemo(
    () => mapHistoryTripToDetailVM(row, getFlightDisplayDetails),
    [row, getFlightDisplayDetails],
  );

  return (
    <View
      style={[
        styles.historyCard,
        {
          backgroundColor: themeColors.cardBg,
          borderColor: themeColors.border,
        },
      ]}
    >
      <TouchableOpacity
        activeOpacity={0.7}
        disabled={!tripVM}
        onPress={onToggle}
        style={styles.cardHeaderInteractiveRow}
      >
        <View style={{ flex: 1, backgroundColor: "transparent" }}>
          {/* History-only chrome: badge + sync date */}
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

          {tripVM ? (
            <View style={{ backgroundColor: "transparent", marginTop: 4 }}>
              <TripHeaderSummary
                header={tripVM.header}
                themeColors={themeColors}
                options={{
                  // Tint plane icon to match ADDED / REMOVED / CHANGED.
                  iconColor: row.badgeColor,
                }}
              />
            </View>
          ) : null}
        </View>

        {tripVM ? (
          <FontAwesome6
            name={isExpanded ? "chevron-up" : "chevron-down"}
            size={13}
            color={themeColors.subTextColor}
            style={{ marginLeft: 12 }}
          />
        ) : null}
      </TouchableOpacity>

      {tripVM && isExpanded ? (
        <Animated.View
          entering={FadeInUp.duration(200)}
          exiting={FadeOutDown.duration(150)}
          style={styles.detailsTray}
        >
          {/* Amendment variance note — History-only */}
          <Text
            style={[styles.varianceNotes, { color: themeColors.subTextColor }]}
          >
            {row.amendment.details}
          </Text>

          <TripTimelinePipe
            items={tripVM.timeline}
            themeColors={themeColors}
            header={tripVM.header}
            options={{
              // Drives green Local times on dep / arr / report in TimelineFlightRow.
              // Same timeMode / green behaviour will apply when Details + Sectors adopt this pipe.
              timeMode: isZulu ? "zulu" : "local",
              // History: flights only — hide Turnaround nodes between sectors.
              showLayovers: false,
              showReportTime: true,
              // Keep History chevron-free for now; Details can enable later.
              showSectorChevron: false,
              // Pipe node icons stay accent blue — only the header plane uses badgeColor.
              locationDisplayMode: "code",
            }}
          />
        </Animated.View>
      ) : null}
    </View>
  );
}
