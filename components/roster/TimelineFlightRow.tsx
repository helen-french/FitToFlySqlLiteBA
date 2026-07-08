/**
 * TimelineFlightRow
 *
 * One flight node on the green "pipe" timeline: circle + date/report +
 * flight label/route/times, with an optional disclosure chevron that
 * navigates to the Sectors screen (parent supplies onPressSector).
 *
 * ## Props
 *
 * | Prop | Type | Notes |
 * | --- | --- | --- |
 * | `item` | `TimelineFlightVM` | labels already formatted by the screen adapter |
 * | `themeColors` | `RosterThemeColors` | pipe border + accent for plane icon |
 * | `options?` | `TripDisplayOptions` | report / flying hours / chevron / location mode |
 * | `sectorNavParams?` | `SectorNavParams` | required for chevron; built by `TripTimelinePipe` |
 *
 * Pipe plane icon always stays **accent blue** (not History badge colour).
 *
 * When `options.timeMode === "local"`, departure / arrival / report times
 * render in green (`#34C759`) so Local mode is visually distinct from Zulu.
 */

import { FontAwesome6 } from "@expo/vector-icons";
import React from "react";
import { TouchableOpacity } from "react-native";

import { Text, View } from "@/components/Themed";
import { rosterStyles as styles } from "@/components/roster/rosterStyles";
import {
  RosterThemeColors,
  SectorNavParams,
  TimelineFlightVM,
  TripDisplayOptions,
} from "@/components/roster/types";

/** Matches the Local toggle / pipe green used across the app. */
const LOCAL_TIME_COLOR = "#34C759";

interface Props {
  item: TimelineFlightVM;
  themeColors: RosterThemeColors;
  options?: TripDisplayOptions;
  /** Built by the parent so this row stays router-free. */
  sectorNavParams?: SectorNavParams;
}

export function TimelineFlightRow({
  item,
  themeColors,
  options = {},
  sectorNavParams,
}: Props) {
  const pipeColor = themeColors.timelinePipe;
  // Pipe icons stay accent blue; History badge colour is header-only.
  const iconColor = themeColors.accent;

  // Local mode → green operational times; Zulu (or unset) → muted subtext.
  const isLocalMode = options.timeMode === "local";
  const timeColor = isLocalMode ? LOCAL_TIME_COLOR : themeColors.subTextColor;

  // Airport name enrichments are parked — fall back to code→code route label.
  // When lookup lands, prefer departureDisplayLabel / arrivalDisplayLabel.
  const useNameAndCode = options.locationDisplayMode === "nameAndCode";
  const routeOrLocationLine =
    useNameAndCode && item.departureDisplayLabel && item.arrivalDisplayLabel
      ? `${item.departureDisplayLabel} to ${item.arrivalDisplayLabel}`
      : null;

  const showChevron =
    !!options.showSectorChevron &&
    typeof options.onPressSector === "function" &&
    !!sectorNavParams;

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
        <FontAwesome6
          name="plane"
          size={9}
          color={iconColor}
          style={{ transform: [{ rotate: "-45deg" }] }}
        />
      </View>

      <View style={styles.interactiveRowWrapper}>
        <View style={styles.elementDataBlock}>
          <View style={styles.itemMetaLine}>
            <Text
              style={[styles.dateLabelText, { color: themeColors.textColor }]}
            >
              {item.dateLabel}
            </Text>
            {options.showReportTime !== false && item.reportTimeLabel ? (
              <Text style={[styles.reportLabelText, { color: timeColor }]}>
                | Report: {item.reportTimeLabel}
              </Text>
            ) : null}
          </View>

          {/* Optional enriched airport names (placeholder until lookup is ready). */}
          {routeOrLocationLine ? (
            <Text
              style={[
                styles.flightBodyText,
                {
                  color: themeColors.textColor,
                  fontFamily: "GoogleSansBold",
                  marginBottom: 3,
                },
              ]}
            >
              {routeOrLocationLine}
            </Text>
          ) : null}

          <Text
            style={[styles.flightBodyText, { color: themeColors.textColor }]}
          >
            <Text
              style={[
                styles.flightAccentText,
                { color: themeColors.accent },
              ]}
            >
              {item.flightLabel}
            </Text>{" "}
            {item.routeLabel}
          </Text>

          <Text style={[styles.timeRangeText, { color: timeColor }]}>
            {item.departureTimeLabel} — {item.arrivalTimeLabel}
          </Text>

          {options.showFlyingHours && item.flyingHoursLabel ? (
            <Text
              style={[
                styles.timeRangeText,
                { color: themeColors.subTextColor, marginTop: 3 },
              ]}
            >
              {item.flyingHoursLabel}
            </Text>
          ) : null}
        </View>

        {showChevron ? (
          <TouchableOpacity
            activeOpacity={0.6}
            onPress={() => options.onPressSector?.(sectorNavParams!)}
            style={styles.tabRedirectArrow}
            accessibilityLabel="Open sector details"
          >
            <FontAwesome6
              name="chevron-right"
              size={12}
              color={themeColors.subTextColor}
            />
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
}
