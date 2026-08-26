/**
 * Settings hub (menu tab). Profile card shows a light DB read for preview;
 * full profile editing is on the pushed Profile screen.
 *
 * Pattern: screen bodies under `components/settings/`; `app/(tabs)/(settings)/`
 * keeps thin route files only.
 */

import TabScreenLayout from "@/components/TabScreenLayout";
import { Text, View } from "@/components/Themed";
import { ProfileHubCard } from "@/components/ui/ProfileHubCard";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import { StyleSheet, useColorScheme } from "react-native";

import { db } from "@/db/db";
import { User, users } from "@/db/schema";

export default function SettingsScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const [user, setUser] = useState<User | null>(null);

  // Re-fetch when the tab regains focus so profile edits show on the card.
  useFocusEffect(
    useCallback(() => {
      async function fetchUserData() {
        try {
          const userResult = await db.select().from(users).limit(1);
          if (userResult.length > 0) {
            setUser(userResult[0] as User);
          }
        } catch (err) {
          console.error("Failed to fetch settings user data:", err);
        }
      }

      fetchUserData();
    }, []),
  );

  const theme = {
    cardBg: isDark ? "#1c1c1e" : "#f2f2f7",
    text: isDark ? "#fff" : "#000",
    subText: isDark ? "#a0a0a0" : "#6d6d72",
    border: isDark ? "rgba(56, 56, 58, 0.4)" : "#d1d1d6",
  };

  return (
    <TabScreenLayout showLoadRosterAction={false} showLoadHotelsAction={false}>
      <View style={styles.contentLift}>
        <Text style={[styles.pageTitle, { color: theme.text }]}>Settings</Text>

        <ProfileHubCard
          user={user}
          theme={theme}
          onPress={() => router.push("/(tabs)/(settings)/profile")}
        />
      </View>
    </TabScreenLayout>
  );
}

const styles = StyleSheet.create({
  contentLift: {
    marginTop: -40,
  },
  pageTitle: {
    fontFamily: "GoogleSans",
    fontSize: 26,
    fontWeight: "700",
    marginBottom: 4,
    textAlign: "left",
  },
});
