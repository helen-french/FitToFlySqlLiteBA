/**
 * TimelineActionLinks
 *
 * iOS-style plain text actions for pipe rows: `Hotel · Notes`, `Dep · Arr`.
 * No pill chrome — easy to swap back to tinted chips if needed.
 */

import React from "react";
import { StyleProp, TouchableOpacity, ViewStyle } from "react-native";

import { Text, View } from "@/components/Themed";
import { RosterThemeColors } from "@/components/roster/types";

export interface TimelineActionLinkItem {
  label: string;
  onPress: () => void;
  accessibilityLabel: string;
  leadingIcon?: React.ReactNode;
}

interface Props {
  items: TimelineActionLinkItem[];
  themeColors: RosterThemeColors;
  style?: StyleProp<ViewStyle>;
  /** `row` = `Hotel · Notes` (flights); `column` = Notes under Hotel (turnaround). */
  direction?: "row" | "column";
}

export function TimelineActionLinks({
  items,
  themeColors,
  style,
  direction = "row",
}: Props) {
  if (items.length === 0) return null;

  const linkStyle = {
    fontFamily: "GoogleSans" as const,
    fontSize: 14,
    color: themeColors.accent,
  };

  const separatorStyle = {
    fontFamily: "GoogleSans" as const,
    fontSize: 14,
    color: themeColors.subTextColor,
  };

  if (direction === "column") {
    return (
      <View
        style={[
          {
            backgroundColor: "transparent",
            gap: 2,
          },
          style,
        ]}
      >
        {items.map((item, index) => (
          <TouchableOpacity
            key={`${item.label}-${index}`}
            activeOpacity={0.5}
            onPress={item.onPress}
            accessibilityRole="button"
            accessibilityLabel={item.accessibilityLabel}
            hitSlop={{ top: 6, bottom: 6, left: 4, right: 4 }}
            style={styles.linkRow}
          >
            {item.leadingIcon}
            <Text style={linkStyle}>{item.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  }

  return (
    <View
      style={[
        {
          flexDirection: "row",
          flexWrap: "wrap",
          alignItems: "center",
          backgroundColor: "transparent",
        },
        style,
      ]}
    >
      {items.map((item, index) => (
        <React.Fragment key={`${item.label}-${index}`}>
          {index > 0 ? <Text style={separatorStyle}> · </Text> : null}
          <TouchableOpacity
            activeOpacity={0.5}
            onPress={item.onPress}
            accessibilityRole="button"
            accessibilityLabel={item.accessibilityLabel}
            hitSlop={{ top: 6, bottom: 6, left: 4, right: 4 }}
            style={styles.linkRow}
          >
            {item.leadingIcon}
            <Text style={linkStyle}>{item.label}</Text>
          </TouchableOpacity>
        </React.Fragment>
      ))}
    </View>
  );
}

const styles = {
  linkRow: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    backgroundColor: "transparent" as const,
  },
};
