// ========================================================================
// ROSTER AMENDMENT BANNER
// ========================================================================
// Purpose:
// A reusable, self-contained UI notification banner designed to alert
// aircrew of background schedule alterations (Deltas) for a given month.
//
// Key Mechanics:
// 1. Context-Aware: Consumes the custom 'useAmendments' hook, looking up
//    the active data load cycle for the user's currently viewed month.
// 2. Zero-Clutter UI: Returns 'null' and stays completely hidden if no
//    amendments (Creations, Updates, Deletions) exist for that month.
// 3. Adaptive Styling: Dynamically shifts background opacity between light
//    and dark system modes while preserving an operational warning color.
//
// Usage:
// Drop into any tab or screen layout. Pass the current viewing Date object
// and an onPress callback to launch the change review presentation tray.
// ========================================================================
//

import { Text } from "@/components/Themed";
import { useAmendments } from "@/components/useAmendments";
import { FontAwesome6 } from "@expo/vector-icons";
import React from "react";
import {
  StyleSheet,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import Animated, { FadeInUp, FadeOutDown } from "react-native-reanimated";

interface RosterAmendmentBannerProps {
  viewingDate: Date;
  onPress: () => void;
}

export default function RosterAmendmentBanner({
  viewingDate,
  onPress,
}: RosterAmendmentBannerProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const { amendments } = useAmendments(viewingDate);

  // If there are no background schedule variations logged, render nothing
  if (amendments.length === 0) return null;

  return (
    <Animated.View
      entering={FadeInUp.duration(300)}
      exiting={FadeOutDown.duration(250)}
      style={styles.bannerWrapper}
    >
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={onPress}
        style={[
          styles.interactiveContainer,
          { backgroundColor: isDark ? "rgba(255, 149, 0, 0.25)" : "#FF9500" },
        ]}
      >
        <View style={styles.contentBlock}>
          <FontAwesome6
            name="circle-exclamation"
            size={15}
            color="#FFFFFF"
            style={{ marginRight: 8 }}
          />
          <Text style={styles.bannerLabel}>
            {amendments.length} Roster{" "}
            {amendments.length === 1 ? "Update" : "Updates"}
          </Text>
        </View>
        <FontAwesome6 name="arrow-right-long" size={13} color="#FFFFFF" />
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  bannerWrapper: {
    paddingHorizontal: 20,
    marginTop: 4,
    marginBottom: 8,
    width: "100%",
  },
  interactiveContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  contentBlock: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "transparent",
    flex: 1,
  },
  bannerLabel: {
    fontFamily: "GoogleSansBold",
    fontSize: 13,
    color: "#FFFFFF",
    letterSpacing: -0.1,
  },
});
