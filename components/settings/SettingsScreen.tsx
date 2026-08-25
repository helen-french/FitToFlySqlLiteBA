/**
 * Settings hub (menu tab). Profile card shows a light DB read for preview;
 * full profile editing is on the pushed Profile screen.
 *
 * Pattern: screen bodies under `components/settings/`; `app/(tabs)/(settings)/`
 * keeps thin route files only.
 */

import TabScreenLayout from "@/components/TabScreenLayout";
import { HubMenuRow, HubMenuRowSeparator } from "@/components/ui/HubMenuRow";
import { Text, View } from "@/components/Themed";
import { clearRosterData } from "@/db/db-drop";
import { FontAwesome6 } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  Alert,
  Image,
  StyleSheet,
  TouchableOpacity,
  useColorScheme,
} from "react-native";

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
    background: isDark ? "#000" : "#ffffff",
    cardBg: isDark ? "#1c1c1e" : "#f2f2f7",
    text: isDark ? "#fff" : "#000",
    subText: isDark ? "#a0a0a0" : "#6d6d72",
    border: isDark ? "rgba(56, 56, 58, 0.4)" : "#d1d1d6",
    rowBorder: isDark ? "rgba(56, 56, 58, 0.4)" : "#e5e5ea",
    iconBubble: isDark ? "rgba(10, 132, 255, 0.16)" : "rgba(0, 122, 255, 0.12)",
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
              Alert.alert("Roster data cleared", "You can load a roster feed again.");
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
    <TabScreenLayout showLoadRosterAction={false} showLoadHotelsAction={false}>
      <View style={styles.contentLift}>
        <Text style={[styles.pageTitle, { color: theme.text }]}>Settings</Text>

        <TouchableOpacity
          style={[
            styles.profileCard,
            { backgroundColor: theme.cardBg, borderColor: theme.border },
          ]}
          activeOpacity={0.7}
          onPress={() => router.push("/(tabs)/(settings)/profile")}
        >
          <View style={styles.profileCardHeader}>
            <View style={styles.avatarContainer}>
              {user?.avatarUri ? (
                <Image
                  source={{ uri: user.avatarUri }}
                  style={styles.avatarFrame}
                />
              ) : (
                <View
                  style={[
                    styles.avatarFrame,
                    {
                      backgroundColor: theme.cardBg,
                      borderColor: theme.border,
                      borderWidth: 1,
                    },
                  ]}
                >
                  <FontAwesome6 name="user" size={28} color={theme.subText} />
                </View>
              )}
            </View>

            <View style={styles.profileInfoContainer}>
              <Text
                style={[styles.profileName, { color: theme.text }]}
                numberOfLines={1}
              >
                {user?.name || "User Name"}
              </Text>
              <Text
                style={[styles.profileEmail, { color: theme.subText }]}
                numberOfLines={1}
              >
                {user?.email || "No email"}
              </Text>
            </View>

            <FontAwesome6
              name="chevron-right"
              size={16}
              color={theme.subText}
              style={styles.disclosureArrow}
            />
          </View>
        </TouchableOpacity>

        <View
          style={[
            styles.card,
            { backgroundColor: theme.cardBg, borderColor: theme.border },
          ]}
        >
          <HubMenuRow
            title="Credit Rates"
            icon="dollar-sign"
            onPress={() => router.push("/(tabs)/(settings)/credit-rates")}
            theme={theme}
          />
          <HubMenuRowSeparator color={theme.rowBorder} />
          <HubMenuRow
            title="Clear roster data"
            icon="trash-can"
            onPress={handleClearRosterData}
            theme={theme}
          />
        </View>
      </View>
    </TabScreenLayout>
  );
}

const styles = StyleSheet.create({
  contentLift: {
    marginTop: -40,
  },
  profileCard: {
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 20,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  profileCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "transparent",
    width: "100%",
  },
  avatarContainer: {
    backgroundColor: "transparent",
    marginRight: 16,
  },
  avatarFrame: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  profileInfoContainer: {
    flex: 1,
    backgroundColor: "transparent",
    justifyContent: "center",
  },
  profileName: {
    fontSize: 18,
    fontWeight: "600",
    letterSpacing: -0.3,
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 13,
  },
  disclosureArrow: {
    marginLeft: 8,
  },
  pageTitle: {
    fontFamily: "GoogleSans",
    fontSize: 26,
    fontWeight: "700",
    marginBottom: 4,
    textAlign: "left",
  },
  card: {
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 20,
    borderWidth: StyleSheet.hairlineWidth,
  },
});
