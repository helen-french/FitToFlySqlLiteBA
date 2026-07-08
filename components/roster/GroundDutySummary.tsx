/**
 * GroundDutySummary
 *
 * Flat ground-duty content (date + plane-slash + "Ground Duty | CODE").
 * History wraps this inside its grey card with badge / sync date.
 * Details can later reuse the same block inside its white cards.
 *
 * ## Props
 *
 * | Prop | Type | Notes |
 * | --- | --- | --- |
 * | `duty` | `GroundDutyVM` | date label, code, optional credit |
 * | `themeColors` | `RosterThemeColors` | text palette |
 * | `options?` | `GroundDutyDisplayOptions` | see below |
 *
 * ### Useful `options`
 * - `iconColor?` — plane-slash tint (History passes badge colour)
 * - `showCredit?` — show formatted credit under the title
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
  // History tints this with badgeColor; Details often uses a fixed orange.
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
          {duty.code ? (
            <Text
              style={[
                styles.groundCodeText,
                { color: themeColors.subTextColor },
              ]}
            >
              {" "}
              | {duty.code}
            </Text>
          ) : null}
        </Text>
      </View>

      {options.showCredit && duty.creditLabel ? (
        <Text
          style={[styles.metaLineText, { color: themeColors.subTextColor }]}
        >
          Credit: {duty.creditLabel}
        </Text>
      ) : null}
    </View>
  );
}
