/**
 * GroundDutyAccordion
 *
 * Trip-style expand/collapse without a pipe. Expanded body is compact:
 *
 *   SWOP | 15hrs
 *   04/07/2026 09:05 - 06/07/2026 06:26
 *
 * No field labels. Times are always local (`themeColors.localTime` from
 * `Colors.localTime`). Code is shown only when expanded (not in the
 * collapsed header). Code is bold; separator and credit are not.
 *
 * ## Props
 *
 * | Prop | Type | Notes |
 * | --- | --- | --- |
 * | `duty` | `GroundDutyVM` | code, credit, start/end date+time labels |
 * | `themeColors` | `RosterThemeColors` | |
 * | `isExpanded` / `onToggle` | accordion state | |
 * | `expandable?` | default true; false = flat (RosterUpdatesModal) |
 * | `headerAccessory?` | History badge row | |
 */

import { FontAwesome6 } from "@expo/vector-icons";
import React from "react";
import { TouchableOpacity } from "react-native";
import Animated, { FadeInUp, FadeOutDown } from "react-native-reanimated";

import { Text, View } from "@/components/Themed";
import { GroundDutySummary } from "@/components/roster/GroundDutySummary";
import { rosterStyles as styles } from "@/components/roster/rosterStyles";
import {
  GroundDutyDisplayOptions,
  GroundDutyVM,
  RosterThemeColors,
} from "@/components/roster/types";

interface Props {
  duty: GroundDutyVM;
  themeColors: RosterThemeColors;
  isExpanded: boolean;
  onToggle: () => void;
  options?: GroundDutyDisplayOptions;
  headerAccessory?: React.ReactNode;
  expandable?: boolean;
}

/** One bound: date in text colour, optional local time via Colors.localTime. */
function DateTimePart({
  dateLabel,
  timeLabel,
  themeColors,
}: {
  dateLabel?: string;
  timeLabel?: string;
  themeColors: RosterThemeColors;
}) {
  if (!dateLabel && !timeLabel) return null;

  return (
    <Text style={[styles.groundCompactWindow, { color: themeColors.textColor }]}>
      {dateLabel ? dateLabel : null}
      {dateLabel && timeLabel ? " " : null}
      {timeLabel ? (
        <Text style={{ color: themeColors.localTime }}>{timeLabel}</Text>
      ) : null}
    </Text>
  );
}

export function GroundDutyAccordion({
  duty,
  themeColors,
  isExpanded,
  onToggle,
  options = {},
  headerAccessory,
  expandable = true,
}: Props) {
  // Line 1 uses code + credit separately (credit not bold).
  const hasCodeCredit = !!(duty.code || duty.creditLabel);

  const hasStart = !!(duty.startDateLabel || duty.startTimeLabel);
  const hasEnd = !!(duty.endDateLabel || duty.endTimeLabel);
  const hasWindow = hasStart || hasEnd;

  const headerMain = (
    <View style={{ flex: 1, backgroundColor: "transparent" }}>
      {headerAccessory}
      <GroundDutySummary
        duty={duty}
        themeColors={themeColors}
        options={options}
      />
    </View>
  );

  const hasDetails = !!(hasCodeCredit || hasWindow);

  const detailsBody = hasDetails ? (
    <Animated.View
      entering={FadeInUp.duration(250)}
      exiting={FadeOutDown.duration(200)}
      style={styles.groundDetailsTray}
    >
      <View
        style={[
          styles.groundDetailsDivider,
          { borderBottomColor: themeColors.border },
        ]}
      />

      {duty.code || duty.creditLabel ? (
        <Text
          style={[
            styles.groundCompactPrimary,
            { color: themeColors.textColor },
          ]}
        >
          {duty.code ? (
            <Text
              style={{
                fontFamily: "GoogleSansBold",
                color: themeColors.textColor,
              }}
            >
              {duty.code}
            </Text>
          ) : null}
          {duty.code && duty.creditLabel ? (
            <Text
              style={{
                fontFamily: "GoogleSans",
                fontWeight: "400",
                color: themeColors.textColor,
              }}
            >
              {" | "}
            </Text>
          ) : null}
          {duty.creditLabel ? (
            <Text
              style={{
                fontFamily: "GoogleSans",
                fontWeight: "400",
                color: themeColors.textColor,
              }}
            >
              {duty.creditLabel}
            </Text>
          ) : null}
        </Text>
      ) : null}

      {hasWindow ? (
        <View
          style={{
            flexDirection: "row",
            flexWrap: "wrap",
            alignItems: "center",
            backgroundColor: "transparent",
            marginTop: hasCodeCredit ? 6 : 0,
          }}
        >
          <DateTimePart
            dateLabel={duty.startDateLabel}
            timeLabel={duty.startTimeLabel}
            themeColors={themeColors}
          />
          {hasStart && hasEnd ? (
            <Text
              style={[
                styles.groundCompactWindow,
                { color: themeColors.textColor },
              ]}
            >
              {" - "}
            </Text>
          ) : null}
          <DateTimePart
            dateLabel={duty.endDateLabel}
            timeLabel={duty.endTimeLabel}
            themeColors={themeColors}
          />
        </View>
      ) : null}
    </Animated.View>
  ) : null;

  if (!expandable) {
    return (
      <View style={{ backgroundColor: "transparent", width: "100%" }}>
        {headerMain}
      </View>
    );
  }

  return (
    <View style={{ backgroundColor: "transparent", width: "100%" }}>
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={onToggle}
        style={styles.groundAccordionHeaderRow}
      >
        {headerMain}
        <FontAwesome6
          name={isExpanded ? "chevron-up" : "chevron-down"}
          size={14}
          color={themeColors.subTextColor}
          style={{ marginLeft: 12 }}
        />
      </TouchableOpacity>

      {isExpanded ? detailsBody : null}
    </View>
  );
}
