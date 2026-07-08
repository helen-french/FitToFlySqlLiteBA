import TabScreenLayout from "@/components/TabScreenLayout";
import { Text, View } from "@/components/Themed";
import { FontAwesome6 } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  Image,
  View as RNView,
  StyleSheet,
  TouchableOpacity,
  useColorScheme,
} from "react-native";

import { db } from "@/db/db";
import { User, users } from "@/db/schema";

/*
  TODO: Settings screen extraction candidates

  1) SettingsRow
     - current props: title, onPress, theme
     - should become a reusable `ListItemButton` or `SettingsOptionRow`
     - could be used for additional settings rows on this screen and elsewhere

  2) SettingsCard / InfoCard
     - current user info block is a good candidate for a reusable card component
     - props could include `label`, `value`, and optional `children`
     - makes it easier to keep card styling consistent across screens

  3) Settings screen layout shell
     - the `SafeAreaView` + `SkyHeader` + `Header` + content wrapper pattern
       could be moved into a shared `ScreenWithSkyHeader` layout component if
       more screens adopt the same visual structure.
*/

// Reusable row component used by the Settings screen.
// Candidate for extraction: this can become a shared SettingsListItem or ListButton component
// if you want to use the same row pattern in other screens.
const SettingsRow = ({
  title,
  onPress,
  theme,
}: {
  title: string;
  onPress: () => void;
  theme: {
    text: string;
    rowBorder: string;
    iconBubble: string;
  };
}) => (
  <TouchableOpacity
    style={[styles.row, { borderBottomColor: theme.rowBorder }]}
    onPress={onPress}
    activeOpacity={0.7}
  >
    <RNView style={styles.rowIconLabel}>
      <RNView
        style={[styles.iconBubble, { backgroundColor: theme.iconBubble }]}
      >
        <FontAwesome6 name="dollar-sign" size={16} color="#007AFF" />
      </RNView>
      <Text style={[styles.rowText, { color: theme.text }]}>{title}</Text>
    </RNView>
    <FontAwesome6 name="chevron-right" size={18} color="#8e8e93" />
  </TouchableOpacity>
);

export default function SettingsScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const [user, setUser] = useState<User | null>(null);

  // Re-fetch each time the tab regains focus so edits made on the Profile tab
  // are reflected here (tab screens stay mounted, so a mount-only effect would
  // keep showing stale data after the user is updated elsewhere).
  useFocusEffect(
    useCallback(() => {
      async function fetchUserData() {
        try {
          // There is only ever one user record, so just read the single row
          // (don't assume a specific id).
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

  // Theme object for the Settings screen.
  // Keeps the screen consistent in light/dark mode and makes it easy to update colors in one place.
  const theme = {
    background: isDark ? "#000" : "#ffffff",
    cardBg: isDark ? "#1c1c1e" : "#f2f2f7",
    text: isDark ? "#fff" : "#000",
    subText: isDark ? "#a0a0a0" : "#6d6d72",
    border: isDark ? "rgba(56, 56, 58, 0.4)" : "#d1d1d6",
    rowBorder: isDark ? "rgba(56, 56, 58, 0.4)" : "#e5e5ea",
    iconBubble: isDark ? "rgba(10, 132, 255, 0.16)" : "rgba(0, 122, 255, 0.12)",
  };
  // The `theme` object is local to this screen. If more screens share the same palette,
  // consider moving this to a central theme utility or hook.

  return (
    <TabScreenLayout>
      <Text style={[styles.pageTitle, { color: theme.text }]}>Settings</Text>

      {/* Profile Card: Avatar + Name + Staff ID + Email */}
      <TouchableOpacity
        style={[
          styles.profileCard,
          { backgroundColor: theme.cardBg, borderColor: theme.border },
        ]}
        activeOpacity={0.7}
        onPress={() => router.push("/(tabs)/(settings)/profile")}
      >
        {/* Avatar Section */}
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

          {/* Name + Email Section */}
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

          {/* Disclosure Arrow */}
          <FontAwesome6
            name="chevron-right"
            size={16}
            color={theme.subText}
            style={styles.disclosureArrow}
          />
        </View>
      </TouchableOpacity>

      {/* Credit Rates Card */}
      <View
        style={[
          styles.card,
          { backgroundColor: theme.cardBg, borderColor: theme.border },
        ]}
      >
        {/* Tappable settings row. Use the reusable SettingsRow component for each menu item.
            If more rows are added, extract the card + row list into a dedicated component. */}
        <SettingsRow
          title="Credit Rates"
          onPress={() => router.push("/(tabs)/(settings)/credit-rates")}
          theme={theme}
        />
      </View>
    </TabScreenLayout>
  );
}

const styles = StyleSheet.create({
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
    color: "#000",
    marginBottom: 4,
    textAlign: "left",
  },
  sectionHeader: {
    fontSize: 13,
    fontWeight: "600",
    color: "#6d6d72",
    marginTop: 24,
    marginBottom: 10,
    letterSpacing: 0.3,
    textTransform: "uppercase",
  },
  card: {
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 20,
    borderWidth: StyleSheet.hairlineWidth,
  },
  rowIconLabel: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconBubble: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: "rgba(0, 122, 255, 0.12)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  rowText: {
    fontFamily: "GoogleSans",
    fontSize: 16,
    color: "#000",
  },
  cardLabel: {
    fontSize: 12,
    color: "#8e8e93",
    paddingHorizontal: 20,
    paddingTop: 18,
  },
  cardValue: {
    fontSize: 18,
    color: "#000",
    paddingHorizontal: 20,
    paddingBottom: 18,
    paddingTop: 4,
  },
});
