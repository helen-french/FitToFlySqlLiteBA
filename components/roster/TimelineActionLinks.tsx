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
}

interface Props {
  items: TimelineActionLinkItem[];
  themeColors: RosterThemeColors;
  style?: StyleProp<ViewStyle>;
}

export function TimelineActionLinks({ items, themeColors, style }: Props) {
  if (items.length === 0) return null;

  const linkStyle = {
    fontFamily: "GoogleSans" as const,
    fontSize: 13,
    color: themeColors.accent,
  };

  const separatorStyle = {
    fontFamily: "GoogleSans" as const,
    fontSize: 13,
    color: themeColors.subTextColor,
  };

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
          >
            <Text style={linkStyle}>{item.label}</Text>
          </TouchableOpacity>
        </React.Fragment>
      ))}
    </View>
  );
}
