import { Text, View } from "@/components/Themed";
import { FontAwesome6 } from "@expo/vector-icons";
import React from "react";
import { Dimensions, StyleSheet, TouchableOpacity } from "react-native";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

interface CalendarCardProps {
  activeCalendarDays: Date[];
  selectedDate: Date;
  currentViewMonth: Date;
  isMonthExpanded: boolean;
  dutyMarkerMap: { [dateKey: string]: "flight" | "layover" | "ground" };
  themeColors: {
    cardBg: string;
    border: string;
    textColor: string;
    subTextColor: string;
    accent: string;
    nestedBoxBg: string;
  };
  getLocalDateString: (date: Date) => string;
  onDaySelect: (date: Date) => void;
  onNavigate: (direction: "prev" | "next") => void;
  onResetToday: () => void;
  onToggleExpand: () => void;
}

export default function CalendarCard({
  activeCalendarDays,
  selectedDate,
  currentViewMonth,
  isMonthExpanded,
  dutyMarkerMap,
  themeColors,
  getLocalDateString,
  onDaySelect,
  onNavigate,
  onResetToday,
  onToggleExpand,
}: CalendarCardProps) {
  return (
    <View
      style={[
        styles.calendarMasterShell,
        {
          backgroundColor: themeColors.cardBg,
          borderColor: themeColors.border,
        },
      ]}
    >
      <View style={styles.weekdayRowHeader}>
        {["M", "T", "W", "T", "F", "S", "S"].map((w, idx) => (
          <Text
            key={idx}
            style={[
              styles.calendarWeekdayText,
              { color: themeColors.subTextColor },
            ]}
          >
            {w}
          </Text>
        ))}
      </View>

      <View
        style={[
          styles.calendarGridContainer,
          isMonthExpanded && styles.expandedGridGap,
        ]}
      >
        {activeCalendarDays.map((dateItem, idx) => {
          const dateKey = getLocalDateString(dateItem);
          const isSelected = getLocalDateString(selectedDate) === dateKey;
          const hasDuty = dutyMarkerMap[dateKey];
          const displayDayNum = dateItem.getDate();

          return (
            <TouchableOpacity
              key={idx}
              activeOpacity={0.7}
              onPress={() => onDaySelect(dateItem)}
              style={[
                styles.dayClickBox,
                isSelected && { backgroundColor: themeColors.accent },
              ]}
            >
              <Text
                style={[
                  styles.dayNumText,
                  { color: isSelected ? "#FFFFFF" : themeColors.textColor },
                  dateItem.getMonth() !== currentViewMonth.getMonth() &&
                    isMonthExpanded && { opacity: 0.25 },
                ]}
              >
                {displayDayNum}
              </Text>

              <View style={styles.indicatorContainerSlot}>
                {hasDuty && (
                  <FontAwesome6
                    name={
                      hasDuty === "layover"
                        ? "hotel"
                        : hasDuty === "ground"
                          ? "plane-slash"
                          : "plane"
                    }
                    size={7}
                    // ──✅ FIXED: Custom condition applies orange color exclusively to plane-slash indicators
                    color={
                      isSelected
                        ? "#FFFFFF"
                        : hasDuty === "ground"
                          ? "#FF9500"
                          : themeColors.accent
                    }
                    style={hasDuty === "flight" && styles.calendarMiniPlane}
                  />
                )}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      <View
        style={[
          styles.calendarMetaFooterRow,
          { borderTopColor: themeColors.border },
        ]}
      >
        <View style={styles.monthLabelGroup}>
          <Text
            style={[styles.monthHeaderText, { color: themeColors.textColor }]}
          >
            {currentViewMonth.toLocaleDateString("en-GB", {
              month: "long",
              year: "numeric",
            })}
          </Text>

          <View style={styles.chevronControlStack}>
            <TouchableOpacity
              onPress={() => onNavigate("prev")}
              style={styles.chevronButton}
            >
              <FontAwesome6
                name="chevron-left"
                size={12}
                color={themeColors.subTextColor}
              />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => onNavigate("next")}
              style={styles.chevronButton}
            >
              <FontAwesome6
                name="chevron-right"
                size={12}
                color={themeColors.subTextColor}
              />
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity
          activeOpacity={0.7}
          onPress={onResetToday}
          style={[
            styles.todayResetBtn,
            {
              borderColor: themeColors.border,
              backgroundColor: themeColors.nestedBoxBg,
            },
          ]}
        >
          <FontAwesome6
            name="calendar"
            size={11}
            color={themeColors.accent}
            style={{ marginRight: 5 }}
          />
          <Text style={[styles.todayBtnText, { color: themeColors.textColor }]}>
            Today
          </Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        activeOpacity={0.9}
        onPress={onToggleExpand}
        style={styles.expansionPullBar}
      >
        <View
          style={[styles.pullBarNotch, { backgroundColor: themeColors.border }]}
        />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  calendarMasterShell: {
    borderWidth: 1,
    paddingTop: 16,
    paddingBottom: 4,
    paddingHorizontal: 16,
    width: SCREEN_WIDTH - 36,
    alignSelf: "center",
    borderRadius: 24,
    marginBottom: 12,
    marginTop: 150,
  },
  weekdayRowHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "transparent",
    paddingHorizontal: 12,
    marginBottom: 6,
  },
  calendarWeekdayText: {
    fontFamily: "GoogleSansBold",
    fontSize: 11,
    width: 32,
    textAlign: "center",
  },
  calendarGridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    backgroundColor: "transparent",
    paddingHorizontal: 12,
    width: "100%",
  },
  expandedGridGap: {
    gap: 4,
  },
  dayClickBox: {
    width: 34,
    height: 38,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 2,
  },
  dayNumText: {
    fontFamily: "GoogleSansBold",
    fontSize: 13,
  },
  indicatorContainerSlot: {
    height: 8,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "transparent",
    marginTop: 1,
  },
  calendarMiniPlane: {
    transform: [{ rotate: "-45deg" }],
  },
  calendarMetaFooterRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    marginTop: 12,
    paddingVertical: 10,
    paddingHorizontal: 4,
    backgroundColor: "transparent",
  },
  monthLabelGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "transparent",
  },
  monthHeaderText: {
    fontFamily: "GoogleSansBold",
    fontSize: 14,
  },
  chevronControlStack: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "transparent",
    gap: 4,
  },
  chevronButton: {
    padding: 6,
  },
  todayResetBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
  },
  todayBtnText: {
    fontFamily: "GoogleSansBold",
    fontSize: 12,
  },
  expansionPullBar: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    width: "100%",
    backgroundColor: "transparent",
  },
  pullBarNotch: {
    width: 36,
    height: 4,
    borderRadius: 2,
  },
});
