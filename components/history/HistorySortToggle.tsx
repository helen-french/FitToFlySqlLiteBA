/* Two-state sort toggle for the Change History screen.

Mirrors the pill + sliding-thumb design of AnimatedTimeZoneToggle, but adds a
label per side so the two sort modes read clearly:
  • "Duty ↑"    → dutyDateAsc     (by trip/ground-duty start date, ascending)
  • "Changed ↓" → changedDateDesc (by amendment sync/created date, descending) */

import React from "react";
import { StyleSheet, TouchableOpacity } from "react-native";
import Animated, {
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";

import { Text, View } from "@/components/Themed";
import { HistorySortOrder, HistoryThemeColors } from "@/db/history-types";

interface Props {
  value: HistorySortOrder;
  onChange: (next: HistorySortOrder) => void;
  themeColors: HistoryThemeColors;
}

const SEGMENT_WIDTH = 92;

export function HistorySortToggle({ value, onChange, themeColors }: Props) {
  const isDutyAsc = value === "dutyDateAsc";

  const animatedThumbStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          translateX: withTiming(isDutyAsc ? 2 : SEGMENT_WIDTH + 2, {
            duration: 200,
          }),
        },
      ],
    };
  }, [isDutyAsc]);

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: themeColors.cardBg,
          borderColor: themeColors.border,
        },
      ]}
    >
      <Animated.View
        pointerEvents="none"
        style={[
          styles.thumb,
          { backgroundColor: themeColors.accent },
          animatedThumbStyle,
        ]}
      />

      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => onChange("dutyDateAsc")}
        style={styles.segment}
      >
        <Text
          style={[
            styles.label,
            { color: isDutyAsc ? "#FFFFFF" : themeColors.subTextColor },
          ]}
        >
          Duty ↑
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => onChange("changedDateDesc")}
        style={styles.segment}
      >
        <Text
          style={[
            styles.label,
            { color: !isDutyAsc ? "#FFFFFF" : themeColors.subTextColor },
          ]}
        >
          Changed ↓
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    padding: 2,
    position: "relative",
  },
  thumb: {
    position: "absolute",
    top: 2,
    left: 0,
    width: SEGMENT_WIDTH,
    height: 28,
    borderRadius: 15,
  },
  segment: {
    width: SEGMENT_WIDTH,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
  },
  label: {
    fontFamily: "GoogleSansBold",
    fontSize: 13,
  },
});
