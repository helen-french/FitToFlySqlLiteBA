/**
 * Tools hub — profile + grouped menu (Pilot Dashboard / Lookup / System).
 */

import TabScreenLayout from "@/components/TabScreenLayout";
import { Text, View } from "@/components/Themed";
import { HubMenuRow, HubMenuRowSeparator } from "@/components/ui/HubMenuRow";
import { ProfileHubCard } from "@/components/ui/ProfileHubCard";
import { db } from "@/db/db";
import { clearRosterData } from "@/db/db-drop";
import { User, users } from "@/db/schema";
import { useFocusEffect, useRouter, type Href } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  Alert,
  StyleSheet,
  useColorScheme,
} from "react-native";

type HubTheme = {
  cardBg: string;
  text: string;
  subText: string;
  border: string;
  rowBorder: string;
  sectionLabel: string;
};

function MenuSection({
  title,
  theme,
  children,
}: {
  title: string;
  theme: HubTheme;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: theme.sectionLabel }]}>
        {title}
      </Text>
      <View
        style={[
          styles.card,
          { backgroundColor: theme.cardBg, borderColor: theme.border },
        ]}
      >
        {children}
      </View>
    </View>
  );
}

export default function ToolsScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const [user, setUser] = useState<User | null>(null);

  useFocusEffect(
    useCallback(() => {
      async function fetchUserData() {
        try {
          const userResult = await db.select().from(users).limit(1);
          if (userResult.length > 0) {
            setUser(userResult[0] as User);
          }
        } catch (err) {
          console.error("Failed to fetch tools user data:", err);
        }
      }

      fetchUserData();
    }, []),
  );

  const theme: HubTheme = {
    cardBg: isDark ? "#1c1c1e" : "#f2f2f7",
    text: isDark ? "#FFFFFF" : "#1A1A1A",
    subText: isDark ? "#8E8E93" : "#6D6D72",
    border: isDark ? "rgba(56, 56, 58, 0.55)" : "#E5E5EA",
    rowBorder: isDark ? "rgba(56, 56, 58, 0.7)" : "#D8D8DC",
    sectionLabel: isDark ? "#F2F2F7" : "#1C1C1E",
  };

  const rowTheme = {
    text: theme.text,
    subText: theme.subText,
    iconColor: "#007AFF",
  };

  const handleClearRosterData = useCallback(() => {
    Alert.alert(
      "Clear roster data?",
      "This removes all loaded trips, ground duties, roster history, and amendments for every month. Hotels, airports, and profile data are kept.\n\nYou can then re-import a roster feed.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear",
          style: "destructive",
          onPress: async () => {
            try {
              await clearRosterData();
              Alert.alert(
                "Roster data cleared",
                "You can load a roster feed again.",
              );
            } catch (err: any) {
              Alert.alert(
                "Clear failed",
                err?.message ?? "Could not clear roster data.",
              );
            }
          },
        },
      ],
    );
  }, []);

  return (
    <TabScreenLayout
      showLoadRosterAction={false}
      showLoadHotelsAction={false}
      // Align with Trip CalendarCard top (marginTop: 150 → canvas 125 + 25).
      contentContainerStyle={styles.canvasAlignWithTripCalendar}
    >
      <View style={styles.content}>
        <ProfileHubCard
          user={user}
          theme={theme}
          onPress={() =>
            router.push("/(tabs)/(tools)/profile" as Href)
          }
        />

        <MenuSection title="PILOT DASHBOARD" theme={theme}>
          <HubMenuRow
            title="Hours"
            icon="time-outline"
            onPress={() => {
              Alert.alert("Hours", "Flying and duty hours stats coming soon.");
            }}
            theme={rowTheme}
          />
          <HubMenuRowSeparator color={theme.rowBorder} />
          <HubMenuRow
            title="Seniority"
            icon="stats-chart-outline"
            onPress={() => router.push("/(tabs)/(tools)/seniority")}
            theme={rowTheme}
          />
        </MenuSection>

        <MenuSection title="LOOKUP" theme={theme}>
          <HubMenuRow
            title="Airport"
            icon="airplane-outline"
            onPress={() => router.push("/(tabs)/(tools)/airports")}
            theme={rowTheme}
          />
          <HubMenuRowSeparator color={theme.rowBorder} />
          <HubMenuRow
            title="Hotel"
            icon="bed-outline"
            onPress={() => router.push("/(tabs)/(tools)/hotels")}
            theme={rowTheme}
          />
          <HubMenuRowSeparator color={theme.rowBorder} />
          <HubMenuRow
            title="Location Notes"
            icon="location-outline"
            onPress={() => router.push("/(tabs)/(tools)/notes")}
            theme={rowTheme}
          />
          <HubMenuRowSeparator color={theme.rowBorder} />
          <HubMenuRow
            title="Credit Rates"
            icon="cash-outline"
            onPress={() => router.push("/(tabs)/(tools)/credit-rates")}
            theme={rowTheme}
          />
        </MenuSection>

        <MenuSection title="SYSTEM" theme={theme}>
          <HubMenuRow
            title="Roster Load History"
            icon="refresh-outline"
            onPress={() =>
              router.push("/(tabs)/(tools)/roster-load-history")
            }
            theme={rowTheme}
          />
          <HubMenuRowSeparator color={theme.rowBorder} />
          <HubMenuRow
            title="Clear Roster Data"
            icon="trash-outline"
            onPress={handleClearRosterData}
            theme={rowTheme}
            destructive
          />
        </MenuSection>
      </View>
    </TabScreenLayout>
  );
}

const styles = StyleSheet.create({
  canvasAlignWithTripCalendar: {
    paddingTop: 25,
  },
  content: {
    paddingTop: 0,
    paddingBottom: 28,
  },
  section: {
    marginBottom: 22,
  },
  sectionTitle: {
    fontFamily: "GoogleSansBold",
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.9,
    marginBottom: 8,
    marginLeft: 4,
  },
  card: {
    borderRadius: 14,
    overflow: "hidden",
    borderWidth: StyleSheet.hairlineWidth,
  },
});
