import { Text, View } from "@/components/Themed";
import { FontAwesome6 } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, TouchableOpacity, useColorScheme } from "react-native";
import Animated, {
  FadeInUp,
  FadeOutUp,
  LinearTransition,
} from "react-native-reanimated";

interface FormDropdownProps {
  label: string;
  value: string;
  icon: string;
  options: string[];
  isEditing: boolean;
  isOpen: boolean;
  onToggle: () => void;
  onSelect: (option: any) => void;
}

export default function FormDropdown({
  label,
  value,
  icon,
  options,
  isEditing,
  isOpen,
  onToggle,
  onSelect,
}: FormDropdownProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const themeTextColor = isDark ? "#FFFFFF" : "#1A1A1A";
  const themeSubTextColor = isDark ? "#A0A0A0" : "#666666";
  const themeBorder = isDark ? "#2C2C2E" : "#E5E5EA";
  const themeNestedBg = isDark ? "#2C2C2E" : "#E5E5EA";

  return (
    <View style={styles.rowContainer}>
      <TouchableOpacity
        disabled={!isEditing}
        style={[styles.detailRow, { borderBottomColor: themeBorder }]}
        onPress={onToggle}
      >
        <View style={styles.rowLabelGroup}>
          <FontAwesome6
            name={icon}
            size={14}
            color="#007AFF"
            style={styles.iconWidth}
          />
          <Text style={[styles.rowLabel, { color: themeSubTextColor }]}>
            {label}
          </Text>
        </View>

        <View style={styles.valueWithChevron}>
          <Text style={[styles.rowValue, { color: themeTextColor }]}>
            {value || "Not Set"}
          </Text>
          {isEditing && (
            <FontAwesome6
              name={isOpen ? "chevron-up" : "chevron-down"}
              size={11}
              color="#8E8E93"
              style={{ marginLeft: 8 }}
            />
          )}
        </View>
      </TouchableOpacity>

      {isEditing && isOpen && (
        <Animated.View
          entering={FadeInUp.duration(500)}
          exiting={FadeOutUp.duration(400)}
          layout={LinearTransition.duration(500)}
          style={[styles.expandedMenu, { backgroundColor: themeNestedBg }]}
        >
          {options.map((opt) => (
            <TouchableOpacity
              key={opt}
              style={styles.menuItemRow}
              onPress={() => onSelect(opt)}
            >
              <Text
                style={[
                  styles.menuItemText,
                  {
                    color: themeTextColor,
                    fontWeight: value === opt ? "600" : "400",
                  },
                ]}
              >
                {opt}
              </Text>
              {value === opt && (
                <FontAwesome6 name="check" size={12} color="#007AFF" />
              )}
            </TouchableOpacity>
          ))}
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  rowContainer: {
    backgroundColor: "transparent",
    width: "100%",
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
    borderBottomWidth: 1,
    paddingBottom: 14,
    backgroundColor: "transparent",
  },
  rowLabelGroup: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "transparent",
  },
  iconWidth: {
    width: 24,
  },
  rowLabel: {
    fontSize: 14,
  },
  rowValue: {
    fontSize: 15,
    fontWeight: "600",
  },
  valueWithChevron: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "transparent",
  },
  expandedMenu: {
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginTop: -6,
    marginBottom: 14,
  },
  menuItemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
  },
  menuItemText: {
    fontSize: 14,
  },
});
