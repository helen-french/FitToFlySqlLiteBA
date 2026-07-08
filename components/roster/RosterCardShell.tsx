/**
 * RosterCardShell
 *
 * Standard outer card for every place we show trip / ground / amendment data:
 * History list, Details list, Details amendments modal, Sectors (when wired).
 *
 * ## Visual standard
 * - Light: white fill (`#FFFFFF`) + light grey hairline border
 * - Dark: elevated fill (`#1C1C1E`) + muted border
 * - Rounded corners (20) + consistent padding
 *
 * This replaces the old History solid-grey fill (`#F2F2F7`) so all surfaces
 * look the same. Screen themes should pass `cardBg` / `border` that match
 * this standard (see `ROSTER_CARD_LIGHT_*` / `ROSTER_CARD_DARK_*` tokens).
 *
 * ## Props
 *
 * | Prop | Type | Notes |
 * | --- | --- | --- |
 * | `themeColors` | `Pick<RosterThemeColors, "cardBg" \| "border">` | fill + border |
 * | `children` | `React.ReactNode` | badge chrome, header, pipe, etc. |
 * | `style?` | `ViewStyle` | optional overrides (rare) |
 */

import React from "react";
import { StyleProp, ViewStyle } from "react-native";

import { View } from "@/components/Themed";
import { rosterStyles as styles } from "@/components/roster/rosterStyles";
import { RosterThemeColors } from "@/components/roster/types";

/** Canonical light-mode card fill — white, not solid grey. */
export const ROSTER_CARD_LIGHT_BG = "#FFFFFF";
/** Canonical dark-mode card fill. */
export const ROSTER_CARD_DARK_BG = "#1C1C1E";
/** Canonical light-mode border (matches Details / modal). */
export const ROSTER_CARD_LIGHT_BORDER = "rgba(229, 229, 234, 0.6)";
/** Canonical dark-mode border. */
export const ROSTER_CARD_DARK_BORDER = "rgba(56, 56, 58, 0.4)";

interface Props {
  themeColors: Pick<RosterThemeColors, "cardBg" | "border">;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

export function RosterCardShell({ themeColors, children, style }: Props) {
  return (
    <View
      style={[
        styles.cardShell,
        {
          backgroundColor: themeColors.cardBg,
          borderColor: themeColors.border,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}
