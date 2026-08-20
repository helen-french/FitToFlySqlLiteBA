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
 * When `options.timeMode === "local"`, departure / arrival clocks use
 * `themeColors.localTime`. Report time is intentionally blank for now
 * (shows only `Report:`) until local report-time data lands.
 */

import { FontAwesome6 } from "@expo/vector-icons";
import React, { useMemo } from "react";
import { TouchableOpacity } from "react-native";

import { Text, View } from "@/components/Themed";
import { joinHoursLabels } from "@/components/roster/mapRosterAdapters";
import { TimelineActionLinks } from "@/components/roster/TimelineActionLinks";
import { rosterStyles as styles } from "@/components/roster/rosterStyles";
import {
  RosterThemeColors,
  SectorNavParams,
  TimelineFlightVM,
  TripDisplayOptions,
} from "@/components/roster/types";

interface Props {
  item: TimelineFlightVM;
  themeColors: RosterThemeColors;
  options?: TripDisplayOptions;
  /** Built by the parent so this row stays router-free. */
  sectorNavParams?: SectorNavParams;
}

/** Split `"07:45 (z - todo)"` → clock-only (ignore trailing note). */
function splitReportLabel(label: string): { clock: string } {
  const match = label.match(/^(\d{1,2}:\d{2})\s*(.*)$/);
  if (match) {
    return { clock: match[1] };
  }
  return { clock: label };
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

  // Local mode → Colors.localTime for clocks; Zulu → muted subtext.
  const isLocalMode = options.timeMode === "local";
  const timeColor = isLocalMode
    ? themeColors.localTime
    : themeColors.subTextColor;

  const showChevron =
    !!options.showSectorChevron &&
    typeof options.onPressSector === "function" &&
    !!sectorNavParams;


  const showFlightNotes =
    !!options.showFlightNotesActions &&
    !!item.departureCode &&
    !!item.arrivalCode;

  const reportParts = item.reportTimeLabel
    ? splitReportLabel(item.reportTimeLabel)
    : null;
  const reportClockLabel = !isLocalMode && reportParts ? reportParts.clock : "";
  const sectorHoursLine = joinHoursLabels(
    item.flyingHoursLabel,
    item.dutyHoursLabel,
  );

  const flightNoteLinks = useMemo(() => {
    if (!showFlightNotes) return [];
    const infoIconStyle = { marginRight: 5 };
    return [
      {
        label: "Departures",
        leadingIcon: (
          <FontAwesome6
            name="circle-info"
            size={11}
            color={themeColors.accent}
            style={infoIconStyle}
          />
        ),
        onPress: () => options.onPressDepartureNotes?.(item.departureCode),
        accessibilityLabel: `Open departure notes for ${item.departureCode}`,
      },
      {
        label: "Arrivals",
        leadingIcon: (
          <FontAwesome6
            name="circle-info"
            size={11}
            color={themeColors.accent}
            style={infoIconStyle}
          />
        ),
        onPress: () => options.onPressArrivalNotes?.(item.arrivalCode),
        accessibilityLabel: `Open arrival notes for ${item.arrivalCode}`,
      },
    ];
  }, [showFlightNotes, item.departureCode, item.arrivalCode, options, themeColors.accent]);

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
            {options.showReportTime !== false ? (
              <Text
                style={[
                  styles.reportLabelText,
                  { color: themeColors.subTextColor },
                ]}
              >
                | Report:
                {reportClockLabel ? (
                  <>
                    {" "}
                    <Text style={{ color: timeColor }}>{reportClockLabel}</Text>
                  </>
                ) : null}
              </Text>
            ) : null}
          </View>

          <View style={styles.flightRouteRow}>
            <Text
              style={[styles.flightBodyText, { color: themeColors.textColor }]}
            >
              <Text
                style={[styles.flightAccentText, { color: themeColors.accent }]}
              >
                {item.flightLabel}
              </Text>
              {"  "}
            </Text>
            {typeof options.onPressAirportCode === "function" &&
            item.departureCode &&
            item.arrivalCode ? (
              <View style={styles.flightIataLinkRow}>
                <TouchableOpacity
                  activeOpacity={0.6}
                  onPress={() =>
                    options.onPressAirportCode?.(item.departureCode)
                  }
                  accessibilityRole="link"
                  accessibilityLabel={`Airport details for ${item.departureCode}`}
                  hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
                >
                  <Text
                    style={[
                      styles.flightBodyText,
                      {
                        color: themeColors.textColor,
                        textDecorationLine: "underline",
                      },
                    ]}
                  >
                    {item.departureCode}
                  </Text>
                </TouchableOpacity>
                <Text
                  style={[
                    styles.flightBodyText,
                    { color: themeColors.textColor },
                  ]}
                >
                  {" → "}
                </Text>
                <TouchableOpacity
                  activeOpacity={0.6}
                  onPress={() =>
                    options.onPressAirportCode?.(item.arrivalCode)
                  }
                  accessibilityRole="link"
                  accessibilityLabel={`Airport details for ${item.arrivalCode}`}
                  hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
                >
                  <Text
                    style={[
                      styles.flightBodyText,
                      {
                        color: themeColors.textColor,
                        textDecorationLine: "underline",
                      },
                    ]}
                  >
                    {item.arrivalCode}
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              <Text
                style={[styles.flightBodyText, { color: themeColors.textColor }]}
              >
                {item.routeLabel}
              </Text>
            )}
          </View>

          <Text style={[styles.timeRangeText, { color: timeColor }]}>
            {item.departureTimeLabel} — {item.arrivalTimeLabel}
          </Text>

          {options.showFlyingHours && sectorHoursLine ? (
            <Text
              style={[
                styles.timeRangeText,
                { color: themeColors.subTextColor, marginTop: 3 },
              ]}
            >
              {sectorHoursLine}
            </Text>
          ) : null}

          <TimelineActionLinks
            items={flightNoteLinks}
            themeColors={themeColors}
            style={{ marginTop: 6 }}
          />
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
