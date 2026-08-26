/**
 * Profile preview card used on Tools / Settings hubs.
 * Taps through to the full Profile screen (caller owns the route).
 */

import { Text, View } from "@/components/Themed";
import { User } from "@/db/schema";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Image, StyleSheet, TouchableOpacity } from "react-native";

export type ProfileHubCardTheme = {
  cardBg: string;
  text: string;
  subText: string;
  border: string;
};

type Props = {
  user: User | null;
  theme: ProfileHubCardTheme;
  onPress: () => void;
};

export function ProfileHubCard({ user, theme, onPress }: Props) {
  return (
    <TouchableOpacity
      style={[
        styles.profileCard,
        { backgroundColor: theme.cardBg, borderColor: theme.border },
      ]}
      activeOpacity={0.7}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel="Open profile"
    >
      <View style={styles.profileCardHeader}>
        <View style={styles.avatarContainer}>
          {user?.avatarUri ? (
            <Image source={{ uri: user.avatarUri }} style={styles.avatarFrame} />
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
              <Ionicons name="person-outline" size={28} color={theme.subText} />
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

        <Ionicons
          name="chevron-forward"
          size={16}
          color={theme.subText}
          style={styles.disclosureArrow}
        />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  profileCard: {
    borderRadius: 14,
    overflow: "hidden",
    marginBottom: 22,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 18,
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
    fontFamily: "GoogleSansBold",
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: -0.3,
    marginBottom: 4,
  },
  profileEmail: {
    fontFamily: "GoogleSans",
    fontSize: 13,
  },
  disclosureArrow: {
    marginLeft: 8,
  },
});
