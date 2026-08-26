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
 * - `showTotalFlyingHours?` — show trip-level flying | duty hours under routing
 * - `showStationTzOffset?` — show UK time-difference line (default true)
 * - `onPressAirportCode?` — make each IATA in the routing line tappable
 * - `showCreditAction?` — £ Credit link under hours (opens parent modal)
 */

import { FontAwesome6 } from "@expo/vector-icons";
import React, { useMemo } from "react";
import { TouchableOpacity } from "react-native";

import { Text, View } from "@/components/Themed";
import { joinHoursLabels } from "@/components/roster/mapRosterAdapters";
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
}

function splitRoutingStations(routingSummary: string): string[] {
  return routingSummary
    .split(/\s*→\s*/)
    .map((part) => part.trim())
    .filter(Boolean);
}

export function TripHeaderSummary({
  header,
  themeColors,
  options = {},
  trailing,
  showCreditAction = false,
  onPressCredit,
}: Props) {
  // History can tint the plane to match ADDED/REMOVED/CHANGED; otherwise accent.
  const iconColor = options.iconColor ?? themeColors.accent;
  const tripHoursLine = joinHoursLabels(
    header.totalFlyingHoursLabel,
    header.totalDutyHoursLabel,
  );

  const routingStations = useMemo(
    () => splitRoutingStations(header.routingSummary),
    [header.routingSummary],
  );
  const linkRouting =
    typeof options.onPressAirportCode === "function" &&
    routingStations.length > 0;

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

      {options.showStationTzOffset !== false && header.stationTzOffsetLabel ? (
        <Text
          style={[styles.metaLineText, { color: themeColors.subTextColor }]}
        >
          {header.stationTzOffsetLabel}
        </Text>
      ) : null}

      {/* Trip-level flying | duty hours — same pairing as sector rows. */}
      {options.showTotalFlyingHours && tripHoursLine ? (
        <Text
          style={[styles.metaLineText, { color: themeColors.subTextColor }]}
        >
          {tripHoursLine}
        </Text>
      ) : null}

      {showCreditAction && typeof onPressCredit === "function" ? (
        <TouchableOpacity
          activeOpacity={0.5}
          onPress={onPressCredit}
          accessibilityRole="button"
          accessibilityLabel="Open credit"
          hitSlop={{ top: 6, bottom: 6, left: 4, right: 4 }}
          style={{
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: "transparent",
            marginTop: 4,
          }}
        >
          <FontAwesome6
            name="sterling-sign"
            size={11}
            color={themeColors.accent}
            style={{ marginRight: 5 }}
          />
          <Text
            style={{
              fontFamily: "GoogleSans",
              fontSize: 14,
              color: themeColors.accent,
            }}
          >
            Credit
          </Text>
        </TouchableOpacity>
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
