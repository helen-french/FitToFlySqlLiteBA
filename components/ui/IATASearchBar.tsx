import type { FeatureScreenTheme } from "@/components/layout/useFeatureScreenTheme";
import { SymbolView } from "expo-symbols";
import React from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

type IATASearchBarTheme = Pick<
  FeatureScreenTheme,
  "textColor" | "subTextColor" | "border" | "accent" | "inputBg"
>;

type IATASearchBarProps = {
  value: string;
  onChangeText: (text: string) => void;
  onSearch: () => void;
  theme: IATASearchBarTheme;
  subtitle?: string;
};

export function IATASearchBar({
  value,
  onChangeText,
  onSearch,
  theme,
  subtitle = "Search by IATA code",
}: IATASearchBarProps) {
  return (
    <>
      <Text style={[styles.subtitle, { color: theme.subTextColor }]}>
        {subtitle}
      </Text>

      <View
        style={[
          styles.searchContainer,
          {
            backgroundColor: theme.inputBg,
            borderColor: theme.border,
          },
        ]}
      >
        <TextInput
          style={[styles.input, { color: theme.textColor }]}
          placeholder="IATA code"
          placeholderTextColor={theme.subTextColor}
          value={value}
          onChangeText={onChangeText}
          autoCapitalize="characters"
          maxLength={3}
          returnKeyType="search"
          onSubmitEditing={onSearch}
        />
        <TouchableOpacity
          style={[styles.searchButton, { backgroundColor: theme.accent }]}
          onPress={onSearch}
        >
          <SymbolView
            name="magnifyingglass"
            style={styles.searchIcon}
            type="monochrome"
            color="#FFFFFF"
          />
        </TouchableOpacity>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  subtitle: {
    fontFamily: "GoogleSans",
    fontSize: 15,
    marginBottom: 14,
  },
  searchContainer: {
    flexDirection: "row",
    borderRadius: 12,
    borderWidth: 1,
    overflow: "hidden",
    marginBottom: 8,
    alignItems: "center",
  },
  input: {
    flex: 1,
    height: 46,
    paddingHorizontal: 14,
    fontSize: 15,
  },
  searchButton: {
    height: 46,
    width: 54,
    justifyContent: "center",
    alignItems: "center",
  },
  searchIcon: { width: 18, height: 18 },
});
