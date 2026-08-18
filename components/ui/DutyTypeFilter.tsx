import React from "react";
import { StyleSheet, TouchableOpacity, type ViewStyle } from "react-native";

import { Text, View } from "@/components/Themed";

export type DutyTypeFilterType = "ALL" | "TRIPS" | "GROUND";

type DutyTypeFilterTheme = {
  calendarCardBg: string;
  border: string;
  nestedBoxBg: string;
  textColor: string;
  subTextColor: string;
};

type DutyTypeFilterProps = {
  value: DutyTypeFilterType;
  onChange: (value: DutyTypeFilterType) => void;
  themeColors: DutyTypeFilterTheme;
  style?: ViewStyle;
};

const OPTIONS: DutyTypeFilterType[] = ["ALL", "TRIPS", "GROUND"];

function labelFor(type: DutyTypeFilterType) {
  if (type === "ALL") return "All";
  if (type === "TRIPS") return "Trips";
  return "Ground";
}

export function DutyTypeFilter({
  value,
  onChange,
  themeColors,
  style,
}: DutyTypeFilterProps) {
  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: themeColors.calendarCardBg,
          borderColor: themeColors.border,
        },
        style,
      ]}
    >
      {OPTIONS.map((type) => (
        <TouchableOpacity
          key={type}
          activeOpacity={0.8}
          onPress={() => onChange(type)}
          style={[
            styles.button,
            value === type && [
              styles.activePill,
              { backgroundColor: themeColors.nestedBoxBg },
            ],
          ]}
        >
          <Text
            style={[
              styles.label,
              {
                color:
                  value === type
                    ? themeColors.textColor
                    : themeColors.subTextColor,
              },
            ]}
          >
            {labelFor(type)}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    height: 34,
    borderRadius: 9,
    borderWidth: 1,
    padding: 2,
    alignSelf: "stretch",
  },
  button: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 7,
  },
  activePill: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 1.5,
    elevation: 2,
  },
  label: {
    fontFamily: "GoogleSansBold",
    fontSize: 13,
  },
});
