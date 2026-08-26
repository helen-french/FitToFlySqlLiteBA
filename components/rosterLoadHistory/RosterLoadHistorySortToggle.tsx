/**
 * History-style sort pills for Roster Load History.
 * Feed = roster creation stamp; Loaded = app created_at.
 * Tap active segment to flip direction; tap other to switch key (default desc).
 */

import React from "react";
import { StyleSheet, TouchableOpacity } from "react-native";
import Animated, {
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";

import { Text, View } from "@/components/Themed";
import type {
  RosterLoadHistorySortDirection,
  RosterLoadHistorySortKey,
  RosterLoadHistorySortState,
} from "./useRosterLoadHistory";

type Theme = {
  textColor: string;
  subTextColor: string;
  cardBg: string;
  border: string;
  accent: string;
};

type Props = {
  value: RosterLoadHistorySortState;
  onChange: (next: RosterLoadHistorySortState) => void;
  theme: Theme;
};

const SEGMENT_WIDTH = 92;

function labelFor(
  key: RosterLoadHistorySortKey,
  direction: RosterLoadHistorySortDirection,
) {
  const arrow = direction === "asc" ? "↑" : "↓";
  return key === "feed" ? `Feed ${arrow}` : `Loaded ${arrow}`;
}

export function RosterLoadHistorySortToggle({ value, onChange, theme }: Props) {
  const isLoaded = value.key === "loaded";

  const animatedThumbStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          translateX: withTiming(isLoaded ? 2 : SEGMENT_WIDTH + 2, {
            duration: 200,
          }),
        },
      ],
    };
  }, [isLoaded]);

  const selectKey = (key: RosterLoadHistorySortKey) => {
    if (value.key === key) {
      onChange({
        key,
        direction: value.direction === "asc" ? "desc" : "asc",
      });
      return;
    }
    onChange({ key, direction: "desc" });
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.cardBg,
          borderColor: theme.border,
        },
      ]}
    >
      <Animated.View
        pointerEvents="none"
        style={[
          styles.thumb,
          { backgroundColor: theme.accent },
          animatedThumbStyle,
        ]}
      />

      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => selectKey("loaded")}
        style={styles.segment}
        accessibilityRole="button"
        accessibilityLabel="Sort by load time"
      >
        <Text
          style={[
            styles.label,
            { color: isLoaded ? "#FFFFFF" : theme.subTextColor },
          ]}
        >
          {labelFor("loaded", isLoaded ? value.direction : "desc")}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => selectKey("feed")}
        style={styles.segment}
        accessibilityRole="button"
        accessibilityLabel="Sort by feed creation time"
      >
        <Text
          style={[
            styles.label,
            { color: !isLoaded ? "#FFFFFF" : theme.subTextColor },
          ]}
        >
          {labelFor("feed", !isLoaded ? value.direction : "desc")}
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
