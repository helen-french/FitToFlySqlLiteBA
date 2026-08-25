/**
 * Tools → Roster Load History.
 * Lists data_load rows with History-style sort and accordion cards.
 */

import FeatureBannerLayout from "@/components/layout/FeatureBannerLayout";
import { useFeatureScreenTheme } from "@/components/layout/useFeatureScreenTheme";
import { Text, View } from "@/components/Themed";
import { EmptyStatePanel } from "@/components/ui/EmptyStatePanel";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
} from "react-native";

import { RosterLoadHistoryCard } from "./RosterLoadHistoryCard";
import { RosterLoadHistorySortToggle } from "./RosterLoadHistorySortToggle";
import { useRosterLoadHistory } from "./useRosterLoadHistory";

export default function RosterLoadHistoryScreen() {
  const theme = useFeatureScreenTheme();
  const { rows, loading, sort, setSort } = useRosterLoadHistory();
  const [expanded, setExpanded] = useState<Record<number, boolean>>({});

  const toggleRow = useCallback((id: number) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  }, []);

  return (
    <FeatureBannerLayout title="Roster Load History">
      <View style={styles.screen}>
        <View style={styles.sortRow}>
          <Text style={[styles.sortLabel, { color: theme.textColor }]}>
            Sort
          </Text>
          <RosterLoadHistorySortToggle
            value={sort}
            onChange={setSort}
            theme={{
              textColor: theme.textColor,
              subTextColor: theme.subTextColor,
              cardBg: theme.sliderBg,
              border: theme.border,
              accent: theme.accent,
            }}
          />
        </View>

        {loading ? (
          <ActivityIndicator
            size="small"
            color={theme.accent}
            style={styles.loader}
          />
        ) : (
          <FlatList
            data={rows}
            keyExtractor={(item) => String(item.id)}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <EmptyStatePanel
                textColor={theme.textColor}
                subTextColor={theme.subTextColor}
                contentStyle={{ paddingTop: 60 }}
              />
            }
            renderItem={({ item }) => (
              <RosterLoadHistoryCard
                row={item}
                theme={theme}
                isExpanded={!!expanded[item.id]}
                onToggle={() => toggleRow(item.id)}
              />
            )}
          />
        )}
      </View>
    </FeatureBannerLayout>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 18,
  },
  sortRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
    backgroundColor: "transparent",
  },
  sortLabel: {
    fontFamily: "GoogleSansBold",
    fontSize: 14,
    marginRight: 10,
  },
  listContent: {
    paddingBottom: 40,
    flexGrow: 1,
  },
  loader: {
    marginTop: 40,
  },
});
