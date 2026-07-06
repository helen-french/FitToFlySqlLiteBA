/**
 * TEMPLATE: TabScreenLayout Example
 *
 * This is a reference template showing the recommended pattern for creating new tab screens
 * using TabScreenLayout. It handles:
 * - SkyHeader with clouds (managed by TabScreenLayout)
 * - Proper spacing and margins
 * - Light/dark mode theme support
 * - Card-based content layout
 *
 * Copy this template, customize the colors/content, and you're ready to go!
 */

import TabScreenLayout from "@/components/TabScreenLayout";
import { Text, View } from "@/components/Themed";
import { FontAwesome6 } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import {
  View as RNView,
  StyleSheet,
  TouchableOpacity,
  useColorScheme,
} from "react-native";

// ═════════════════════════════════════════════════════════════════
// STEP 1: Define reusable components (like SettingsRow)
// ═════════════════════════════════════════════════════════════════

const MenuRow = ({
  title,
  onPress,
  theme,
  iconName = "chevron-right",
}: {
  title: string;
  onPress: () => void;
  theme: {
    text: string;
    rowBorder: string;
    iconBubble: string;
  };
  iconName?: string;
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
        <FontAwesome6 name={iconName} size={16} color="#007AFF" />
      </RNView>
      <Text style={[styles.rowText, { color: theme.text }]}>{title}</Text>
    </RNView>
    <FontAwesome6 name="chevron-right" size={18} color="#8e8e93" />
  </TouchableOpacity>
);

// ═════════════════════════════════════════════════════════════════
// STEP 2: Main screen component
// ═════════════════════════════════════════════════════════════════

export default function NewTabScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  // ─────────────────────────────────────────────────────────────
  // STEP 3: Define your theme object
  // ─────────────────────────────────────────────────────────────
  // Customize these colors to match your screen's visual identity.
  // Keep text readable and maintain consistency with the rest of the app.
  const theme = {
    background: isDark ? "#000" : "#ffffff", // Page background
    cardBg: isDark ? "#1c1c1e" : "#f2f2f7", // Card/box background
    text: isDark ? "#fff" : "#000", // Primary text color
    subText: isDark ? "#a0a0a0" : "#6d6d72", // Secondary/label text
    border: isDark ? "rgba(56, 56, 58, 0.4)" : "#d1d1d6", // Card border
    rowBorder: isDark ? "rgba(56, 56, 58, 0.4)" : "#e5e5ea", // Row divider
    iconBubble: isDark ? "rgba(10, 132, 255, 0.16)" : "rgba(0, 122, 255, 0.12)", // Icon bg
  };

  return (
    <TabScreenLayout>
      {/* ─────────────────────────────────────────────────────────────
          SECTION 1: Page Title (optional)
          ───────────────────────────────────────────────────────────── */}
      <Text style={[styles.pageTitle, { color: theme.subText }]}>
        Your Screen Title
      </Text>

      {/* ─────────────────────────────────────────────────────────────
          SECTION 2: Static Info Card
          Example: Staff ID, User Info, etc.
          ───────────────────────────────────────────────────────────── */}
      <View
        style={[
          styles.card,
          { backgroundColor: theme.cardBg, borderColor: theme.border },
        ]}
      >
        <Text style={[styles.cardLabel, { color: theme.subText }]}>
          Label Text
        </Text>
        <Text style={[styles.cardValue, { color: theme.text }]}>
          Display Value Here
        </Text>
      </View>

      {/* ─────────────────────────────────────────────────────────────
          SECTION 3: Interactive Menu Card
          Example: Settings options, navigation items, etc.
          ───────────────────────────────────────────────────────────── */}
      <View
        style={[
          styles.card,
          { backgroundColor: theme.cardBg, borderColor: theme.border },
        ]}
      >
        {/* Row 1 */}
        <MenuRow
          title="First Menu Item"
          onPress={() => router.push("/(tabs)/(your-route)/sub-screen")}
          theme={theme}
          iconName="cog" // Customize icon as needed
        />

        {/* Row 2 */}
        <MenuRow
          title="Second Menu Item"
          onPress={() => {
            // Handle custom action
          }}
          theme={theme}
          iconName="bell"
        />
      </View>

      {/* ─────────────────────────────────────────────────────────────
          SECTION 4: Additional Cards (repeat as needed)
          ───────────────────────────────────────────────────────────── */}
      <View
        style={[
          styles.card,
          { backgroundColor: theme.cardBg, borderColor: theme.border },
        ]}
      >
        <Text style={[styles.cardLabel, { color: theme.subText }]}>
          Another Card
        </Text>
        <Text style={[styles.cardValue, { color: theme.text }]}>
          Your content here
        </Text>
      </View>
    </TabScreenLayout>
  );
}

// ═════════════════════════════════════════════════════════════════
// STYLES: Keep card styling consistent across screens
// ═════════════════════════════════════════════════════════════════
const styles = StyleSheet.create({
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
  cardLabel: {
    fontSize: 12,
    paddingHorizontal: 20,
    paddingTop: 18,
  },
  cardValue: {
    fontSize: 18,
    paddingHorizontal: 20,
    paddingBottom: 18,
    paddingTop: 4,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  rowIconLabel: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconBubble: {
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  rowText: {
    fontFamily: "GoogleSans",
    fontSize: 16,
  },
});
