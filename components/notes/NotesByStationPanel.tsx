import { SymbolView } from "expo-symbols";
import React from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  type ViewStyle,
} from "react-native";
import Animated, { FadeInUp, FadeOutDown } from "react-native-reanimated";

import type { AirportComment } from "@/db/schema";

import {
  NOTE_CATEGORY_META,
  type NoteCategoryFilter,
} from "./noteCategory";

export type NotesPanelTheme = {
  textColor: string;
  subTextColor: string;
  cardBg: string;
  nestedBoxBg: string;
  border: string;
  accent: string;
  sliderBg: string;
};

type Props = {
  searchCode: string;
  airportName: string | null;
  filteredComments: AirportComment[];
  loading: boolean;
  hasSearched: boolean;
  selectedCategory: NoteCategoryFilter;
  onCategoryChange: (category: NoteCategoryFilter) => void;
  themeColors: NotesPanelTheme;
  onPressAddNote?: () => void;
  contentStyle?: ViewStyle;
  /** Off in Sectors modal for now; Tools notes screen keeps the bar. */
  showCategoryFilter?: boolean;
};

export function NotesByStationPanel({
  searchCode,
  airportName,
  filteredComments,
  loading,
  hasSearched,
  selectedCategory,
  onCategoryChange,
  themeColors,
  onPressAddNote,
  contentStyle,
  showCategoryFilter = true,
}: Props) {
  if (loading) {
    return (
      <ActivityIndicator
        size="small"
        color={themeColors.accent}
        style={[styles.loader, contentStyle]}
      />
    );
  }

  if (!hasSearched) {
    return null;
  }

  const stationLabel = airportName
    ? airportName
    : `${searchCode.toUpperCase()} Station`;

  return (
    <View style={[styles.panel, contentStyle]}>
      <View style={styles.airportMetaCard}>
        <View style={styles.airportHeaderLeft}>
          <Text style={[styles.metaAirportTitle, { color: themeColors.textColor }]}>
            ✈️ {stationLabel}
          </Text>
        </View>

        {onPressAddNote ? (
          <TouchableOpacity
            style={[styles.composeButton, { backgroundColor: themeColors.accent }]}
            onPress={onPressAddNote}
          >
            <SymbolView
              name="square.and.pencil"
              style={{ width: 14, height: 14, marginRight: 6 }}
              type="monochrome"
              color="#ffffff"
            />
            <Text style={styles.composeButtonText}>Add Note</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      {showCategoryFilter ? (
        <View
          style={[
            styles.segmentSliderBar,
            {
              backgroundColor: themeColors.sliderBg,
              borderColor: themeColors.border,
            },
          ]}
        >
          {(["ALL", "A", "E", "D"] as const).map((cat) => (
            <TouchableOpacity
              key={cat}
              onPress={() => onCategoryChange(cat)}
              style={[
                styles.segmentSliderPill,
                selectedCategory === cat && [
                  styles.activeSliderPillShadow,
                  { backgroundColor: themeColors.nestedBoxBg },
                ],
              ]}
            >
              <Text
                style={[
                  styles.sliderLabel,
                  {
                    color:
                      selectedCategory === cat
                        ? themeColors.textColor
                        : themeColors.subTextColor,
                  },
                ]}
              >
                {cat === "ALL" ? "All" : NOTE_CATEGORY_META[cat].label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      ) : null}

      {filteredComments.map((item, index) => {
        const meta = NOTE_CATEGORY_META[
          item.category as keyof typeof NOTE_CATEGORY_META
        ] ?? { label: "General", icon: "doc.plaintext", color: "#8E8E93" };
        const formattedDate = new Date(item.createdAt).toLocaleDateString(
          "en-GB",
          {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          },
        );

        return (
          <Animated.View
            key={item.id?.toString() || index.toString()}
            entering={FadeInUp}
            exiting={FadeOutDown}
            style={[
              styles.commentCardRow,
              {
                backgroundColor: themeColors.cardBg,
                borderColor: themeColors.border,
              },
            ]}
          >
            <View style={styles.cardRowTopHeader}>
              <View
                style={[
                  styles.categoryBadgeTag,
                  { backgroundColor: `${meta.color}15` },
                ]}
              >
                <SymbolView
                  name={meta.icon}
                  style={{ width: 11, height: 11, marginRight: 6 }}
                  type="monochrome"
                  color={meta.color}
                />
                <Text style={[styles.categoryBadgeLabel, { color: meta.color }]}>
                  {meta.label}
                </Text>
              </View>
              <Text
                style={[styles.timestampLabel, { color: themeColors.subTextColor }]}
              >
                {formattedDate}
              </Text>
            </View>
            <Text
              style={[
                styles.commentContentBodyText,
                { color: themeColors.textColor },
              ]}
            >
              {item.content}
            </Text>
            <View style={styles.cardAuthorRowFooter}>
              <SymbolView
                name="person.circle"
                style={{ width: 11, height: 11, marginRight: 5 }}
                type="monochrome"
                color={themeColors.subTextColor}
              />
              <Text
                style={[styles.cardAuthorTextText, { color: themeColors.subTextColor }]}
              >
                Filed by: {item.authorName || "Anonymous"}
              </Text>
            </View>
          </Animated.View>
        );
      })}

      {filteredComments.length === 0 ? (
        <View style={styles.fallbackEmptyStateFrame}>
          <SymbolView
            name="bubble.left.and.bubble.right"
            style={{ width: 28, height: 28, marginBottom: 12 }}
            type="monochrome"
            color={themeColors.subTextColor}
          />
          <Text style={[styles.fallbackEmptyText, { color: themeColors.subTextColor }]}>
            No Notes found for "{searchCode.toUpperCase()}".
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    backgroundColor: "transparent",
  },
  loader: { marginVertical: 10 },
  airportMetaCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
    paddingHorizontal: 4,
    marginTop: 2,
    width: "100%",
  },
  airportHeaderLeft: {
    flex: 1,
    marginRight: 12,
  },
  metaAirportTitle: {
    fontSize: 18,
    fontWeight: "bold",
    letterSpacing: -0.2,
  },
  composeButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  composeButtonText: {
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: 12,
  },
  segmentSliderBar: {
    flexDirection: "row",
    height: 38,
    borderRadius: 12,
    padding: 3,
    borderWidth: 1,
    marginBottom: 14,
    width: "100%",
  },
  segmentSliderPill: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 9,
  },
  activeSliderPillShadow: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 1.5,
    elevation: 2,
  },
  sliderLabel: {
    fontWeight: "bold",
    fontSize: 12,
  },
  commentCardRow: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    marginBottom: 10,
    width: "100%",
  },
  cardRowTopHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "transparent",
    marginBottom: 8,
  },
  categoryBadgeTag: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  categoryBadgeLabel: {
    fontWeight: "bold",
    fontSize: 10,
  },
  timestampLabel: {
    fontSize: 11,
  },
  commentContentBodyText: {
    fontSize: 14,
    lineHeight: 19,
  },
  cardAuthorRowFooter: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "transparent",
    marginTop: 8,
    borderTopWidth: 0.5,
    borderTopColor: "rgba(134,142,150,0.2)",
    paddingTop: 6,
  },
  cardAuthorTextText: {
    fontSize: 11,
    fontWeight: "500",
  },
  fallbackEmptyStateFrame: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 24,
    paddingHorizontal: 20,
  },
  fallbackEmptyText: {
    fontSize: 13,
    textAlign: "center",
    lineHeight: 18,
  },
});
