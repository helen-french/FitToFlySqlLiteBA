/**
 * Shared empty state for Trip, Sectors, and History when there is nothing to show.
 */

import { Text, View } from "@/components/Themed";
import { FontAwesome6 } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, type ViewStyle } from "react-native";

export const EMPTY_ROSTER_DATA_MESSAGE =
  "No roster data has been loaded for this period.";

type Props = {
  textColor: string;
  subTextColor: string;
  /** Extra layout when the panel sits mid-screen (e.g. Sectors). */
  contentStyle?: ViewStyle;
};

export function EmptyStatePanel({
  textColor,
  subTextColor,
  contentStyle,
}: Props) {
  return (
    <View style={[styles.wrap, contentStyle]}>
      <FontAwesome6
        name="plane-slash"
        size={28}
        color={subTextColor}
        style={styles.icon}
      />
      <Text style={[styles.message, { color: textColor }]}>
        {EMPTY_ROSTER_DATA_MESSAGE}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 28,
    paddingVertical: 36,
    backgroundColor: "transparent",
  },
  icon: {
    marginBottom: 14,
  },
  message: {
    fontFamily: "GoogleSans",
    fontSize: 15,
    lineHeight: 22,
    textAlign: "center",
    letterSpacing: -0.1,
  },
});
