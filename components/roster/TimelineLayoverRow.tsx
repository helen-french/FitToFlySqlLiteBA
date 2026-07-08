/**
 * TimelineLayoverRow
 *
 * Turnaround node on the pipe (between sectors). Extra turnaround detail
 * text is reserved via options.showTurnaround but not implemented yet.
 *
 * ## Props
 *
 * | Prop | Type | Notes |
 * | --- | --- | --- |
 * | `item` | `TimelineLayoverVM` | date label (+ optional detail later) |
 * | `themeColors` | `RosterThemeColors` | text + accent for hotel icon |
 * | `options?` | `TripDisplayOptions` | `showTurnaround?` reserved for extra detail |
 *
 * Hotel pipe icon always stays **accent blue**.
 *
 * Visibility of these rows is controlled by the parent pipe via
 * `showLayovers` (History: false; Details/Sectors can opt in).
 */

import { FontAwesome6 } from "@expo/vector-icons";
import React from "react";

import { Text, View } from "@/components/Themed";
import { rosterStyles as styles } from "@/components/roster/rosterStyles";
import {
  RosterThemeColors,
  TimelineLayoverVM,
  TripDisplayOptions,
} from "@/components/roster/types";

interface Props {
  item: TimelineLayoverVM;
  themeColors: RosterThemeColors;
  options?: TripDisplayOptions;
}

export function TimelineLayoverRow({
  item,
  themeColors,
  options = {},
}: Props) {
  const pipeColor = themeColors.timelinePipe;
  // Pipe icons stay accent blue; History badge colour is header-only.
  const iconColor = themeColors.accent;

  return (
    <View style={styles.itineraryItemRow}>
      <View
        style={[
          styles.pipeCircleNode,
          {
            borderColor: pipeColor,
            backgroundColor: themeColors.cardBg,
          },
        ]}
      >
        <FontAwesome6 name="hotel" size={9} color={iconColor} />
      </View>

      <View style={styles.elementDataBlock}>
        <View style={styles.itemMetaLine}>
          <Text
            style={[styles.dateLabelText, { color: themeColors.textColor }]}
          >
            {item.dateLabel}
          </Text>
        </View>

        <Text
          style={[styles.layoverText, { color: themeColors.subTextColor }]}
        >
          Turnaround
        </Text>

        {/* Reserved: turnaround details when showTurnaround lands. */}
        {options.showTurnaround && item.turnaroundLabel ? (
          <Text
            style={[
              styles.timeRangeText,
              { color: themeColors.subTextColor, marginTop: 2 },
            ]}
          >
            {item.turnaroundLabel}
          </Text>
        ) : null}
      </View>
    </View>
  );
}
