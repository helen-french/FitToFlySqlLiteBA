/**
 * StationIataBadge
 *
 * Compact IATA pill shared by Hotel cards and the Airport modal.
 */

import React from "react";
import {
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";

type Props = {
  code: string;
  style?: StyleProp<ViewStyle>;
};

export function StationIataBadge({ code, style }: Props) {
  const label = code.trim().toUpperCase();
  if (!label) return null;

  return (
    <View style={[styles.iataBadge, style]}>
      <Text style={styles.iataBadgeText}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  iataBadge: {
    backgroundColor: "#e7f5ff",
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
    alignSelf: "flex-start",
  },
  iataBadgeText: {
    color: "#228be6",
    fontFamily: "GoogleSansBold",
    fontSize: 11,
    fontWeight: "bold",
  },
});
