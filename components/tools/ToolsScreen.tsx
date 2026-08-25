/**
 * Tools hub menu (stats + lookups).
 */

import TabScreenLayout from "@/components/TabScreenLayout";
import { Text, View } from "@/components/Themed";
import { HubMenuRow, HubMenuRowSeparator } from "@/components/ui/HubMenuRow";
import { useRouter } from "expo-router";
import React from "react";
import {
  Alert,
  StyleSheet,
  useColorScheme,
} from "react-native";

export default function ToolsScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const theme = {
    cardBg: isDark ? "#1c1c1e" : "#f2f2f7",
    text: isDark ? "#fff" : "#000",
    subText: isDark ? "#a0a0a0" : "#8e8e93",
    border: isDark ? "rgba(56, 56, 58, 0.4)" : "#d1d1d6",
    rowBorder: isDark ? "rgba(56, 56, 58, 0.4)" : "#e5e5ea",
    iconBubble: isDark
      ? "rgba(10, 132, 255, 0.16)"
      : "rgba(0, 122, 255, 0.12)",
  };

  return (
    <TabScreenLayout showLoadRosterAction={false} showLoadHotelsAction={false}>
      <View style={styles.content}>
        <Text style={[styles.pageTitle, { color: theme.text }]}>Tools</Text>

        <View
          style={[
            styles.card,
            { backgroundColor: theme.cardBg, borderColor: theme.border },
          ]}
        >
          <HubMenuRow
            title="Hours"
            icon="clock"
            onPress={() => {
              Alert.alert(
                "Hours",
                "Flying and duty hours stats coming soon.",
              );
            }}
            theme={theme}
          />
          <HubMenuRowSeparator color={theme.rowBorder} />
          <HubMenuRow
            title="Seniority"
            icon="ranking-star"
            onPress={() => router.push("/(tabs)/(tools)/seniority")}
            theme={theme}
          />
          <HubMenuRowSeparator color={theme.rowBorder} />
          <HubMenuRow
            title="Airport"
            icon="plane-arrival"
            onPress={() => router.push("/(tabs)/(tools)/airports")}
            theme={theme}
          />
          <HubMenuRowSeparator color={theme.rowBorder} />
          <HubMenuRow
            title="Hotel"
            icon="hotel"
            onPress={() => router.push("/(tabs)/(tools)/hotels")}
            theme={theme}
          />
          <HubMenuRowSeparator color={theme.rowBorder} />
          <HubMenuRow
            title="Location Notes"
            icon="note-sticky"
            onPress={() => router.push("/(tabs)/(tools)/notes")}
            theme={theme}
          />
          <HubMenuRowSeparator color={theme.rowBorder} />
          <HubMenuRow
            title="Roster Load History"
            icon="clock-rotate-left"
            onPress={() =>
              router.push("/(tabs)/(tools)/roster-load-history")
            }
            theme={theme}
          />
        </View>
      </View>
    </TabScreenLayout>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingTop: 4,
  },
  pageTitle: {
    fontFamily: "GoogleSans",
    fontSize: 26,
    fontWeight: "700",
    marginBottom: 12,
    textAlign: "left",
  },
  card: {
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 20,
    borderWidth: StyleSheet.hairlineWidth,
  },
});
