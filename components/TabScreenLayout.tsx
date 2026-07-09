/**
 * @component TabScreenLayout
 * @description A reusable master layout container for top-level tab screens.
 * Enforces absolute visual consistency across tabs by unifying global structural layers.
 * * ### Key Responsibilities:
 * - **Root Safe Area Shell:** Wraps pages in a transparent `SafeAreaView` context.
 * - **Dynamic Time-of-Day Sky Theme:** Renders the absolute-positioned `SkyHeader` backdrop dynamically based on system clock hours.
 * - **Global Action Header:** Embeds the primary manual file ingestion/load trigger menu button in the top left.
 * - **Content Canvas Card:** Establishes the rounded, color-adaptive sheet boundary container (`View`) that frames page content.
 * * @property {React.ReactNode} children - Tab-specific UI layout elements to render inside the canvas card.
 * @property {() => void} [onRefresh] - Optional callback triggered on data synchronization events (e.g., successful load execution).
 * @property {ViewStyle} [contentContainerStyle] - Optional custom styling properties applied directly to the internal canvas card container.
 * * @example
 * return (
 * <TabScreenLayout onRefresh={handleFetchData} contentContainerStyle={{ alignItems: 'center' }}>
 * <Text>Tab Content Goes Here</Text>
 * </TabScreenLayout>
 * );
 */

import Header from "@/components/Header";
import { View } from "@/components/Themed";
import SkyHeader from "@/components/ui/SkyHeader";
import React from "react";
import {
  ScrollView,
  StyleSheet,
  useColorScheme,
  ViewStyle,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface TabScreenLayoutProps {
  children: React.ReactNode;
  onRefresh?: () => void;
  contentContainerStyle?: ViewStyle;
  showLoadRosterAction?: boolean;
  showLoadHotelsAction?: boolean;
  showBackAction?: boolean;
  onBackPress?: () => void;
}

export default function TabScreenLayout({
  children,
  onRefresh,
  contentContainerStyle,
  showLoadRosterAction = true,
  showLoadHotelsAction = true,
  showBackAction = false,
  onBackPress,
}: TabScreenLayoutProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const handleImportSuccess = () => {
    if (onRefresh) {
      onRefresh();
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <SkyHeader
        height={190}
        showClouds={true}
        style={styles.absoluteSkyPosition}
      />

      <Header
        onImportSuccess={handleImportSuccess}
        showLoadRosterAction={showLoadRosterAction}
        showLoadHotelsAction={showLoadHotelsAction}
        showBackAction={showBackAction}
        onBackPress={onBackPress}
      />

      <ScrollView
        style={styles.scrollWrapper}
        // ──✅ Automatically forces content container to fill the screen viewport
        contentContainerStyle={styles.scrollContentPadding}
        showsVerticalScrollIndicator={false}
      >
        <View
          style={[
            styles.canvasCard,
            { backgroundColor: isDark ? "#000000" : "#FFFFFF" },
            contentContainerStyle,
          ]}
        >
          {children}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "transparent",
  },
  absoluteSkyPosition: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 0,
  },
  scrollWrapper: {
    flex: 1,
    backgroundColor: "transparent",
    zIndex: 1, // Sits in the middle layer
  },
  scrollContentPadding: {
    flexGrow: 1, // ──✅ Crucial: Allows items inside to flex and expand down to the base
  },
  canvasCard: {
    flex: 1, // ──✅ Stretches the card down to flush against the tab bar, eliminating the grey area
    marginTop: 125, // ──✅ Pushes the card start line safely down past the base cloud layers
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    paddingHorizontal: 24,
    paddingTop: 44, // ──✅ Adds breathing room inside the container so text clears the top edge gracefully
  },
});
