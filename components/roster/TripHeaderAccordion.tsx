/**
 * TripHeaderAccordion
 *
 * Collapsible trip header for screens that show more meta than Roster
 * (hours, UK time difference, Location / Credit). Collapsed looks Roster-like:
 * dates + routing + duration + chevron. Expanding reveals the extras.
 *
 * Owns expand state and collapses when `header.tripNumber` changes.
 */

import { FontAwesome6 } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import { TouchableOpacity } from "react-native";

import { Text, View } from "@/components/Themed";
import { TripHeaderSummary } from "@/components/roster/TripHeaderSummary";
import {
  RosterThemeColors,
  TripHeaderVM,
} from "@/components/roster/types";
import { formatTripDurationLabel } from "@/lib/utils";

interface Props {
  header: TripHeaderVM;
  themeColors: RosterThemeColors;
  onPressAirportCode?: (stationCode: string) => void;
  onPressCredit?: () => void;
  onPressLocation?: () => void;
  /**
   * When this value changes, the accordion collapses.
   * Defaults to `header.tripNumber`.
   */
  resetKey?: string | null;
}

export function TripHeaderAccordion({
  header,
  themeColors,
  onPressAirportCode,
  onPressCredit,
  onPressLocation,
  resetKey,
}: Props) {
  const [expanded, setExpanded] = useState(false);
  const collapseKey = resetKey ?? header.tripNumber;

  useEffect(() => {
    setExpanded(false);
  }, [collapseKey]);

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={() => setExpanded((open) => !open)}
      accessibilityRole="button"
      accessibilityState={{ expanded }}
      accessibilityLabel={
        expanded ? "Collapse trip details" : "Expand trip details"
      }
    >
      <TripHeaderSummary
        header={header}
        themeColors={themeColors}
        options={{
          showTotalFlyingHours: expanded,
          showStationTzOffset: expanded,
          onPressAirportCode,
        }}
        showCreditAction={expanded && typeof onPressCredit === "function"}
        onPressCredit={onPressCredit}
        showLocationAction={
          expanded && typeof onPressLocation === "function"
        }
        onPressLocation={onPressLocation}
        trailing={
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: "transparent",
            }}
          >
            {header.durationDays != null ? (
              <Text
                style={{
                  fontFamily: "GoogleSansBold",
                  fontSize: 13,
                  color: themeColors.subTextColor,
                  marginRight: 10,
                }}
              >
                {formatTripDurationLabel(header.durationDays)}
              </Text>
            ) : null}
            <FontAwesome6
              name={expanded ? "chevron-up" : "chevron-down"}
              size={14}
              color={themeColors.subTextColor}
            />
          </View>
        }
      />
    </TouchableOpacity>
  );
}

export default TripHeaderAccordion;
