/**
 * Seniority Stats (Tools → Seniority).
 */

import FeatureBannerLayout from "@/components/layout/FeatureBannerLayout";
import FeatureScreenBody from "@/components/layout/FeatureScreenBody";
import { useFeatureScreenTheme } from "@/components/layout/useFeatureScreenTheme";
import { buildSeniorityStatsFromTimeline } from "@/components/seniority/stats/buildSeniorityStatsData";
import { MOCK_SENIORITY_STATS } from "@/components/seniority/stats/mockSeniorityStatsData";
import SeniorityStatsChart, {
  ChartMode,
} from "@/components/seniority/stats/SeniorityStatsChart";
import { useSeniorityHistory } from "@/components/seniority/useSeniorityHistory";
import { FontAwesome6 } from "@expo/vector-icons";
import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

const ACTIVE_BLUE = "#007AFF";

export default function SeniorityStatsScreen() {
  const theme = useFeatureScreenTheme();
  const [chartMode, setChartMode] = useState<ChartMode>("line");
  const [useMockData, setUseMockData] = useState(false);

  const { loading, staffNumber, seniorityTimeline } = useSeniorityHistory();

  const liveData = useMemo(
    () => buildSeniorityStatsFromTimeline(seniorityTimeline),
    [seniorityTimeline],
  );

  const data = useMockData ? MOCK_SENIORITY_STATS : liveData;
  const canShowChart = (data?.feedPoints.length ?? 0) >= 2;

  return (
    <FeatureBannerLayout title="Seniority Stats">
      <FeatureScreenBody keyboardShouldPersistTaps="never">
        <Pressable
          onPress={() => setUseMockData((v) => !v)}
          style={[
            styles.dataPill,
            {
              backgroundColor: useMockData ? theme.pillMock : theme.pillLive,
            },
          ]}
        >
          <Text
            style={[
              styles.dataPillText,
              { color: useMockData ? theme.pillMockText : theme.pillLiveText },
            ]}
          >
            {useMockData ? "Mock data · tap for live" : "Live data · tap for mock"}
          </Text>
        </Pressable>

        {loading && !useMockData ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={ACTIVE_BLUE} />
          </View>
        ) : !useMockData && !staffNumber ? (
          <View style={styles.emptyCard}>
            <Text style={[styles.emptyTitle, { color: theme.textColor }]}>
              No staff number
            </Text>
            <Text style={[styles.emptyBody, { color: theme.subTextColor }]}>
              Add your staff number in Settings → Profile to link roster seniority
              feeds.
            </Text>
          </View>
        ) : !data ? (
          <View style={styles.emptyCard}>
            <Text style={[styles.emptyTitle, { color: theme.textColor }]}>
              No seniority data yet
            </Text>
            <Text style={[styles.emptyBody, { color: theme.subTextColor }]}>
              Load a roster feed to populate seniority from your person details.
            </Text>
          </View>
        ) : (
          <>
            <View style={styles.statHeaderRow}>
              <View style={styles.statCopy}>
                <Text style={[styles.statLabel, { color: theme.subTextColor }]}>
                  Current
                </Text>
                <Text style={[styles.statValue, { color: theme.textColor }]}>
                  {data.currentSeniority}
                </Text>
                <Text style={[styles.statMeta, { color: theme.muted }]}>
                  Last updated {data.lastUpdated}
                </Text>
              </View>

              {canShowChart ? (
                <View
                  style={[styles.toggleGroup, { backgroundColor: theme.toggleBg }]}
                >
                  <Pressable
                    onPress={() => setChartMode("line")}
                    style={[
                      styles.toggleButton,
                      chartMode === "line" && styles.toggleButtonActive,
                    ]}
                  >
                    <FontAwesome6
                      name="chart-line"
                      size={15}
                      color={
                        chartMode === "line" ? "#FFFFFF" : theme.toggleIcon
                      }
                    />
                  </Pressable>
                  <Pressable
                    onPress={() => setChartMode("bar")}
                    style={[
                      styles.toggleButton,
                      chartMode === "bar" && styles.toggleButtonActive,
                    ]}
                  >
                    <FontAwesome6
                      name="chart-column"
                      size={15}
                      color={chartMode === "bar" ? "#FFFFFF" : theme.toggleIcon}
                    />
                  </Pressable>
                </View>
              ) : null}
            </View>

            {canShowChart ? (
              <View style={styles.chartWrap}>
                <SeniorityStatsChart data={data} mode={chartMode} />
              </View>
            ) : (
              <View style={styles.emptyCard}>
                <Text style={[styles.emptyBody, { color: theme.subTextColor }]}>
                  Load more roster feeds with seniority changes to see the
                  trend chart.
                </Text>
              </View>
            )}
          </>
        )}
      </FeatureScreenBody>
    </FeatureBannerLayout>
  );
}

const styles = StyleSheet.create({
  dataPill: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    marginBottom: 18,
  },
  dataPillText: {
    fontFamily: "GoogleSansBold",
    fontSize: 11,
    letterSpacing: 0.2,
  },
  centered: {
    paddingVertical: 48,
    alignItems: "center",
  },
  emptyCard: {
    paddingVertical: 12,
    marginBottom: 8,
  },
  emptyTitle: {
    fontFamily: "GoogleSansBold",
    fontSize: 17,
    marginBottom: 8,
  },
  emptyBody: {
    fontFamily: "GoogleSans",
    fontSize: 15,
    lineHeight: 22,
  },
  statHeaderRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 8,
  },
  statCopy: {
    flex: 1,
  },
  statLabel: {
    fontFamily: "GoogleSans",
    fontSize: 14,
    marginBottom: 4,
  },
  statValue: {
    fontFamily: "GoogleSansBold",
    fontSize: 44,
    letterSpacing: -1.2,
    lineHeight: 48,
    marginBottom: 6,
  },
  statMeta: {
    fontFamily: "GoogleSans",
    fontSize: 13,
  },
  toggleGroup: {
    flexDirection: "row",
    borderRadius: 10,
    padding: 3,
    gap: 6,
    marginTop: 4,
  },
  toggleButton: {
    width: 36,
    height: 34,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  toggleButtonActive: {
    backgroundColor: ACTIVE_BLUE,
  },
  chartWrap: {
    marginTop: 4,
    marginBottom: 12,
    alignItems: "center",
  },
});
