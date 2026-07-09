/**
 * TimelineLayoverRow
 *
 * Single Turnaround node on the pipe (between sectors). No date — just the
 * "Turnaround" label lined up with the pipe circle, plus optional Hotel /
 * Location Note actions stacked for the previous flight’s arrival IATA.
 *
 * ## Props
 *
 * | Prop | Type | Notes |
 * | --- | --- | --- |
 * | `item` | `TimelineLayoverVM` | optional hotelStationCode |
 * | `themeColors` | `RosterThemeColors` | text + accent for turnaround icon |
 * | `options?` | `TripDisplayOptions` | Hotel / Notes link flags + handlers |
 *
 * Turnaround icon stays **accent blue** (left-right arrows).
 *
 * Visibility of these rows is controlled by the parent pipe via
 * `showLayovers` (History/Details: false; Sectors: true).
 */

import { FontAwesome6 } from "@expo/vector-icons";
import React, { useMemo } from "react";

import { Text, View } from "@/components/Themed";
import { TimelineActionLinks } from "@/components/roster/TimelineActionLinks";
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
  const stationCode = item.hotelStationCode;

  const showHotel =
    !!options.showHotelAction &&
    typeof options.onPressHotel === "function" &&
    !!stationCode;

  const showNotes =
    !!options.showNotesAction &&
    typeof options.onPressNotes === "function" &&
    !!stationCode;

  const actionLinks = useMemo(() => {
    const links = [];
    if (showHotel) {
      links.push({
        label: "Hotel",
        leadingIcon: (
          <FontAwesome6
            name="hotel"
            size={11}
            color={themeColors.accent}
            style={{ marginRight: 5 }}
          />
        ),
        onPress: () => options.onPressHotel?.(stationCode!),
        accessibilityLabel: `Open hotels for ${stationCode}`,
      });
    }
    if (showNotes) {
      links.push({
        label: "Location Note",
        leadingIcon: (
          <FontAwesome6
            name="map-pin"
            size={11}
            color={themeColors.accent}
            style={{ marginRight: 5 }}
          />
        ),
        onPress: () => options.onPressNotes?.(stationCode!),
        accessibilityLabel: `Open location note for ${stationCode}`,
      });
    }
    return links;
  }, [showHotel, showNotes, stationCode, options, themeColors.accent]);

  return (
    <View
      style={[
        styles.itineraryItemRow,
        {
          marginVertical: 14,
          minHeight: actionLinks.length > 0 ? 56 : 24,
          justifyContent: "center",
        },
      ]}
    >
      <View
        style={[
          styles.pipeCircleNode,
          {
            borderColor: pipeColor,
            backgroundColor: themeColors.cardBg,
            // Centre circle on the 24px-tall content line.
            top: 0,
          },
        ]}
      >
        {/* ↔ turnaround — not hotel. */}
        <FontAwesome6 name="right-left" size={9} color={iconColor} />
      </View>

      <View
        style={[
          styles.elementDataBlock,
          {
            justifyContent: "center",
            paddingBottom: 0,
            minHeight: actionLinks.length > 0 ? 56 : 24,
          },
        ]}
      >
        <Text
          style={[
            styles.layoverText,
            {
              color: themeColors.subTextColor,
              lineHeight: 24,
            },
          ]}
        >
          Turnaround
        </Text>

        <TimelineActionLinks
          items={actionLinks}
          themeColors={themeColors}
          direction="column"
          style={{ marginTop: 4 }}
        />

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
