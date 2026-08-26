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
 * - `showTotalFlyingHours?` — labeled Flying / Duty rows under routing
 * - `showStationTzOffset?` — show UK time-difference line (default true)
 * - `onPressAirportCode?` — make each IATA in the routing line tappable
 * - `showCreditAction?` — £ Credit outlined button (opens parent modal)
 * - `showLocationAction?` — Location Notes outlined button
 */

import { FontAwesome6, Ionicons } from "@expo/vector-icons";
import React, { useMemo } from "react";
import { TouchableOpacity } from "react-native";

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
  showCreditAction?: boolean;
  onPressCredit?: () => void;
  showLocationAction?: boolean;
  onPressLocation?: () => void;
}

function splitRoutingStations(routingSummary: string): string[] {
  return routingSummary
    .split(/\s*→\s*/)
    .map((part) => part.trim())
    .filter(Boolean);
}

function HeaderDetailRow({
  label,
  value,
  themeColors,
}: {
  label: string;
  value: string;
  themeColors: RosterThemeColors;
}) {
  return (
    <View style={styles.headerDetailRow}>
      <Text
        style={[styles.headerDetailLabel, { color: themeColors.subTextColor }]}
      >
        {label}
      </Text>
      <Text
        style={[styles.headerDetailValue, { color: themeColors.textColor }]}
      >
        {value}
      </Text>
    </View>
  );
}

export function TripHeaderSummary({
  header,
  themeColors,
  options = {},
  trailing,
  showCreditAction = false,
  onPressCredit,
  showLocationAction = false,
  onPressLocation,
}: Props) {
  // History can tint the plane to match ADDED/REMOVED/CHANGED; otherwise accent.
  const iconColor = options.iconColor ?? themeColors.accent;

  const routingStations = useMemo(
    () => splitRoutingStations(header.routingSummary),
    [header.routingSummary],
  );
  const linkRouting =
    typeof options.onPressAirportCode === "function" &&
    routingStations.length > 0;

  const showTz =
    options.showStationTzOffset !== false && !!header.stationTzOffsetLabel;
  const showFlying =
    !!options.showTotalFlyingHours && !!header.totalFlyingHoursLabel;
  const showDuty =
    !!options.showTotalFlyingHours && !!header.totalDutyHoursLabel;
  const showCredit =
    showCreditAction && typeof onPressCredit === "function";
  const showLocation =
    showLocationAction && typeof onPressLocation === "function";
  const showDetails =
    showTz || showFlying || showDuty || showCredit || showLocation;

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
        {linkRouting ? (
          <View style={styles.routingLinksRow}>
            {routingStations.map((station, index) => (
              <View key={`${station}-${index}`} style={styles.routingLinkPiece}>
                {index > 0 ? (
                  <Text
                    style={[
                      styles.routingSummaryText,
                      { color: themeColors.textColor },
                    ]}
                  >
                    {" → "}
                  </Text>
                ) : null}
                <TouchableOpacity
                  activeOpacity={0.6}
                  onPress={() => options.onPressAirportCode?.(station)}
                  accessibilityRole="link"
                  accessibilityLabel={`Airport details for ${station}`}
                  hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
                >
                  <Text
                    style={[
                      styles.routingSummaryText,
                      {
                        color: themeColors.textColor,
                        textDecorationLine: "underline",
                      },
                    ]}
                  >
                    {station}
                  </Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        ) : (
          <Text
            style={[
              styles.routingSummaryText,
              { color: themeColors.textColor },
            ]}
          >
            {header.routingSummary}
          </Text>
        )}
      </View>

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

      {showDetails ? (
        <View
          style={[
            styles.headerDetailsBlock,
            { borderTopColor: themeColors.border },
          ]}
        >
          {showTz ? (
            <Text
              style={[
                styles.metaLineText,
                { color: themeColors.subTextColor, marginTop: 0 },
              ]}
            >
              {header.stationTzOffsetLabel}
            </Text>
          ) : null}

          {showFlying ? (
            <HeaderDetailRow
              label="Flying"
              value={header.totalFlyingHoursLabel!}
              themeColors={themeColors}
            />
          ) : null}

          {showDuty ? (
            <HeaderDetailRow
              label="Duty"
              value={header.totalDutyHoursLabel!}
              themeColors={themeColors}
            />
          ) : null}

          {showCredit || showLocation ? (
            <View
              style={{
                flexDirection: "row",
                flexWrap: "wrap",
                alignItems: "center",
                backgroundColor: "transparent",
                marginTop: 12,
                gap: 8,
              }}
            >
              {showCredit ? (
                <TouchableOpacity
                  activeOpacity={0.5}
                  onPress={onPressCredit}
                  accessibilityRole="button"
                  accessibilityLabel="Open credit"
                  hitSlop={{ top: 6, bottom: 6, left: 4, right: 4 }}
                  style={[
                    styles.actionPillButton,
                    { borderColor: themeColors.border },
                  ]}
                >
                  <FontAwesome6
                    name="sterling-sign"
                    size={11}
                    color={themeColors.accent}
                    style={{ marginRight: 5 }}
                  />
                  <Text
                    style={[
                      styles.actionPillText,
                      { color: themeColors.textColor },
                    ]}
                  >
                    Credit
                  </Text>
                </TouchableOpacity>
              ) : null}

              {showLocation ? (
                <TouchableOpacity
                  activeOpacity={0.5}
                  onPress={onPressLocation}
                  accessibilityRole="button"
                  accessibilityLabel="Open location notes"
                  hitSlop={{ top: 6, bottom: 6, left: 4, right: 4 }}
                  style={[
                    styles.actionPillButton,
                    { borderColor: themeColors.border },
                  ]}
                >
                  <Ionicons
                    name="location-outline"
                    size={14}
                    color={themeColors.accent}
                    style={{ marginRight: 5 }}
                  />
                  <Text
                    style={[
                      styles.actionPillText,
                      { color: themeColors.textColor },
                    ]}
                  >
                    Location
                  </Text>
                </TouchableOpacity>
              ) : null}
            </View>
          ) : null}
        </View>
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
