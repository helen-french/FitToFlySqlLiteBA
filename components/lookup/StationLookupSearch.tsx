/**
 * Shared IATA lookup chrome for Tools screens (Airports, Hotels, future).
 *
 * Keeps search + idle prompt consistent so each tool only owns its results.
 */

import type { FeatureScreenTheme } from "@/components/layout/useFeatureScreenTheme";
import { Text, View } from "@/components/Themed";
import { FontAwesome6 } from "@expo/vector-icons";
import React from "react";
import {
  StyleSheet,
  TextInput,
  TouchableOpacity,
} from "react-native";

type Props = {
  value: string;
  onChangeText: (text: string) => void;
  onSearch: () => void;
  theme: FeatureScreenTheme;
  /** Short line under the banner title area, e.g. what this lookup does. */
  prompt: string;
  placeholder?: string;
  searchIcon?: React.ComponentProps<typeof FontAwesome6>["name"];
};

export function StationLookupSearch({
  value,
  onChangeText,
  onSearch,
  theme,
  prompt,
  placeholder = "e.g. LHR",
  searchIcon = "plane",
}: Props) {
  return (
    <View style={styles.wrap}>
      <Text style={[styles.prompt, { color: theme.subTextColor }]}>{prompt}</Text>

      <View
        style={[
          styles.searchCard,
          {
            backgroundColor: theme.sliderBg,
            borderColor: theme.border,
          },
        ]}
      >
        <View style={styles.inputRow}>
          <View
            style={[
              styles.iconBubble,
              {
                backgroundColor: theme.isDark
                  ? "rgba(0, 122, 255, 0.16)"
                  : "rgba(0, 122, 255, 0.1)",
              },
            ]}
          >
            <FontAwesome6 name={searchIcon} size={12} color={theme.accent} />
          </View>
          <TextInput
            style={[styles.input, { color: theme.textColor }]}
            placeholder={placeholder}
            placeholderTextColor={theme.muted}
            value={value}
            onChangeText={onChangeText}
            autoCapitalize="characters"
            autoCorrect={false}
            maxLength={3}
            returnKeyType="search"
            onSubmitEditing={onSearch}
            accessibilityLabel="IATA airport code"
          />
          <TouchableOpacity
            style={[styles.searchButton, { backgroundColor: theme.accent }]}
            onPress={onSearch}
            accessibilityRole="button"
            accessibilityLabel="Search"
            activeOpacity={0.85}
          >
            <FontAwesome6 name="magnifying-glass" size={15} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

export function StationLookupIdle({
  theme,
  icon,
  title,
  body,
}: {
  theme: FeatureScreenTheme;
  icon: React.ComponentProps<typeof FontAwesome6>["name"];
  title: string;
  body: string;
}) {
  return (
    <View
      style={[
        styles.idleCard,
        {
          backgroundColor: theme.sliderBg,
          borderColor: theme.border,
        },
      ]}
    >
      <View
        style={[
          styles.idleIconWrap,
          {
            backgroundColor: theme.isDark
              ? "rgba(0, 122, 255, 0.16)"
              : "rgba(0, 122, 255, 0.1)",
          },
        ]}
      >
        <FontAwesome6 name={icon} size={18} color={theme.accent} />
      </View>
      <Text style={[styles.idleTitle, { color: theme.textColor }]}>{title}</Text>
      <Text style={[styles.idleBody, { color: theme.subTextColor }]}>{body}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: "transparent",
    marginBottom: 18,
  },
  prompt: {
    fontFamily: "GoogleSans",
    fontSize: 15,
    lineHeight: 21,
    marginBottom: 14,
  },
  searchCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 4,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "transparent",
  },
  iconBubble: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 4,
  },
  input: {
    flex: 1,
    height: 36,
    paddingHorizontal: 10,
    fontFamily: "GoogleSansBold",
    fontSize: 15,
    letterSpacing: 1.5,
  },
  searchButton: {
    height: 36,
    width: 40,
    borderRadius: 9,
    justifyContent: "center",
    alignItems: "center",
  },
  idleCard: {
    borderRadius: 18,
    borderWidth: 1,
    paddingVertical: 28,
    paddingHorizontal: 20,
    alignItems: "center",
  },
  idleIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  idleTitle: {
    fontFamily: "GoogleSansBold",
    fontSize: 17,
    letterSpacing: -0.2,
    marginBottom: 6,
    textAlign: "center",
  },
  idleBody: {
    fontFamily: "GoogleSans",
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
  },
});
