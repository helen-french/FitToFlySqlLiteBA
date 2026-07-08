/**
 * TripHeaderSummary
 *
 * Presentational header for a trip: date range, plane-departure icon +
 * routing summary, plus optional duration / total flying hours / trip number.
 *
 * History keeps its own badge + sync-date chrome above this block.
 * Details embeds this beside an expand chevron; Sectors beside a duration pill.
 *
 * ## Props
 *
 * | Prop | Type | Notes |
 * | --- | --- | --- |
 * | `header` | `TripHeaderVM` | date labels, routing, optional duration / flying hours |
 * | `themeColors` | `RosterThemeColors` | text / accent / pipe palette |
 * | `options?` | `TripDisplayOptions` | feature flags (see below) |
 * | `trailing?` | `ReactNode` | optional right-side slot (duration, chevron) |
 *
 * ### Useful `options` for this component
 * - `iconColor?` — tints the **header** plane-departure only (History badge colour)
 * - `showDuration?` — show inclusive day count under routing
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
import { formatTripDurationLabel } from "@/lib/utils";

interface Props {
  header: TripHeaderVM;
  themeColors: RosterThemeColors;
  options?: TripDisplayOptions;
  /** Right-side slot beside the date/routing block (e.g. duration, chevron). */
  trailing?: React.ReactNode;
}

export function TripHeaderSummary({
  header,
  themeColors,
  options = {},
  trailing,
}: Props) {
  // History can tint the plane to match ADDED/REMOVED/CHANGED; otherwise accent.
  const iconColor = options.iconColor ?? themeColors.accent;

  const body = (
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

      {/* Optional inclusive day count under routing (when not using `trailing`). */}
      {options.showDuration && header.durationDays != null ? (
        <Text
          style={[styles.metaLineText, { color: themeColors.subTextColor }]}
        >
          {formatTripDurationLabel(header.durationDays)}
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

  if (!trailing) return body;

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "flex-start",
        justifyContent: "space-between",
        backgroundColor: "transparent",
        width: "100%",
      }}
    >
      {body}
      <View
        style={{
          marginLeft: 12,
          paddingTop: 1,
          backgroundColor: "transparent",
        }}
      >
        {trailing}
      </View>
    </View>
  );
}
