import { FontAwesome6 } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, TouchableOpacity } from "react-native";

import { Text, View } from "@/components/Themed";
import { HistoryThemeColors } from "@/db/history-types";

interface Props {
  selectedMonth: Date;
  themeColors: HistoryThemeColors;
  onShift: (direction: "prev" | "next") => void;
}

export function MonthPicker({ selectedMonth, themeColors, onShift }: Props) {
  return (
    <View style={[styles.monthPickerHeader, { borderColor: themeColors.border }]}>
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => onShift("prev")}
        style={styles.navArrowButton}
      >
        <FontAwesome6 name="chevron-left" size={14} color={themeColors.accent} />
      </TouchableOpacity>

      <Text style={[styles.monthLabel, { color: themeColors.textColor }]}>
        {selectedMonth.toLocaleDateString("en-GB", {
          month: "long",
          year: "numeric",
        })}
      </Text>

      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => onShift("next")}
        style={styles.navArrowButton}
      >
        <FontAwesome6 name="chevron-right" size={14} color={themeColors.accent} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  monthPickerHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    height: 48,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 8,
  },
  navArrowButton: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  monthLabel: {
    fontFamily: "GoogleSansBold",
    fontSize: 16,
    letterSpacing: -0.2,
  },
});
