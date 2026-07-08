/**
 * TripHeaderSummary
 *
 * Presentational header for a trip: date range, plane-departure icon +
 * routing summary, plus optional duration / total flying hours / trip number.
 *
 * History keeps its own badge + sync-date chrome above this block.
 * Details / Sectors can later embed this inside their own card shells.
 *
 * ## Props
 *
 * | Prop | Type | Notes |
 * | --- | --- | --- |
 * | `header` | `TripHeaderVM` | date labels, routing, optional duration / flying hours |
 * | `themeColors` | `RosterThemeColors` | text / accent / pipe palette |
 * | `options?` | `TripDisplayOptions` | feature flags (see below) |
 *
 * ### Useful `options` for this component
 * - `iconColor?` — tints the **header** plane-departure only (History badge colour)
 * - `showDuration?` — show inclusive day count
 * - `showTripNumber?` — show "Trip {n}"
 * - `showTotalFlyingHours?` — show trip-level flying hours under routing
 */

import { FontAwesome6 } from "@expo/vector-icons";
import React from "react";

import { Text, View } from "@/components/Themed";
import { rosterStyles as styles } from "@/components/roster/rosterStyles";
import {
  RosterThemeColors,
  TripDisplayOptions,
  TripHeaderVM,
} from "@/components/roster/types";

interface Props {
  header: TripHeaderVM;
  themeColors: RosterThemeColors;
  options?: TripDisplayOptions;
}

export function TripHeaderSummary({
  header,
  themeColors,
  options = {},
}: Props) {
  // History can tint the plane to match ADDED/REMOVED/CHANGED; otherwise accent.
  const iconColor = options.iconColor ?? themeColors.accent;

  return (
    <View style={styles.headerBlock}>
      <Text style={[styles.dateRangeText, { color: themeColors.textColor }]}>
        {header.startDateLabel} — {header.endDateLabel}
      </Text>

      <View style={styles.routingRow}>
        <FontAwesome6
          name="plane-departure"
          size={12}
          color={iconColor}
          style={{ marginRight: 6 }}
        />
        <Text
          style={[styles.routingSummaryText, { color: themeColors.textColor }]}
        >
          {header.routingSummary}
        </Text>
      </View>

      {/* Optional trip-level total flying hours (was informally "credit"). */}
      {options.showTotalFlyingHours && header.totalFlyingHoursLabel ? (
        <Text
          style={[styles.metaLineText, { color: themeColors.subTextColor }]}
        >
          {header.totalFlyingHoursLabel}
        </Text>
      ) : null}

      {/* Optional inclusive day count — Details shows this; History usually omits. */}
      {options.showDuration && header.durationDays != null ? (
        <Text
          style={[styles.metaLineText, { color: themeColors.subTextColor }]}
        >
          {header.durationDays}{" "}
          {header.durationDays === 1 ? "Day" : "Days"}
        </Text>
      ) : null}

      {options.showTripNumber ? (
        <Text
          style={[styles.tripNumberText, { color: themeColors.subTextColor }]}
        >
          Trip {header.tripNumber}
        </Text>
      ) : null}
    </View>
  );
}
