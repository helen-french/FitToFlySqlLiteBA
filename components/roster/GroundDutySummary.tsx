/**
 * GroundDutySummary
 *
 * Collapsed header only: date range + plane-slash + "Ground Duty".
 * Movement code lives in the accordion body (`CODE | credit`), not here.
 *
 * ## Props
 *
 * | Prop | Type | Notes |
 * | --- | --- | --- |
 * | `duty` | `GroundDutyVM` | uses `dateLabel` |
 * | `themeColors` | `RosterThemeColors` | text palette |
 * | `options?` | `GroundDutyDisplayOptions` | `iconColor?` for plane-slash |
 */

import { FontAwesome6 } from "@expo/vector-icons";
import React from "react";

import { Text, View } from "@/components/Themed";
import { rosterStyles as styles } from "@/components/roster/rosterStyles";
import {
  GroundDutyDisplayOptions,
  GroundDutyVM,
  RosterThemeColors,
} from "@/components/roster/types";

interface Props {
  duty: GroundDutyVM;
  themeColors: RosterThemeColors;
  options?: GroundDutyDisplayOptions;
}

export function GroundDutySummary({
  duty,
  themeColors,
  options = {},
}: Props) {
  const iconColor = options.iconColor ?? "#FF9500";

  return (
    <View style={styles.groundBlock}>
      <Text style={[styles.dateRangeText, { color: themeColors.textColor }]}>
        {duty.dateLabel}
      </Text>

      <View style={styles.routingRow}>
        <FontAwesome6
          name="plane-slash"
          size={13}
          color={iconColor}
          style={{ marginRight: 8 }}
        />
        <Text
          style={[styles.groundTitleText, { color: themeColors.textColor }]}
        >
          Ground Duty
        </Text>
      </View>
    </View>
  );
}
