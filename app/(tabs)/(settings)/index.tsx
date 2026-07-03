import Header from "@/components/Header";
import { Text, View } from "@/components/Themed";
import SkyHeader from "@/components/ui/SkyHeader";
import { FontAwesome6 } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import {
  View as RNView,
  StyleSheet,
  TouchableOpacity,
  useColorScheme,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

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

  // Theme object for the Settings screen.
  // Keeps the screen consistent in light/dark mode and makes it easy to update colors in one place.
  const theme = {
    background: isDark ? "#000" : "#f2f2f7",
    cardBg: isDark ? "#1c1c1e" : "#ffffff",
    text: isDark ? "#fff" : "#000",
    subText: isDark ? "#a0a0a0" : "#6d6d72",
    border: isDark ? "rgba(56, 56, 58, 0.4)" : "#d1d1d6",
    rowBorder: isDark ? "rgba(56, 56, 58, 0.4)" : "#e5e5ea",
    iconBubble: isDark ? "rgba(10, 132, 255, 0.16)" : "rgba(0, 122, 255, 0.12)",
  };
  // The `theme` object is local to this screen. If more screens share the same palette,
  // consider moving this to a central theme utility or hook.

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: theme.background }]}
    >
      <SkyHeader
        height={190}
        showClouds={false}
        style={styles.absoluteSkyPosition}
      />
      <Header />
      {/* Page layout: sky header at the top, then the settings body starts below. */}
      <View style={[styles.container, { backgroundColor: "transparent" }]}>
        <View
          style={[styles.contentWrapper, { backgroundColor: theme.background }]}
        >
          <View
            style={[styles.screenSurface, { backgroundColor: "transparent" }]}
          >
            {/* Screen title - this is the main visual anchor for the section. */}
            <Text style={[styles.pageTitle, { color: theme.subText }]}>
              Settings
            </Text>

            {/* Primary static card: user data preview.
                Candidate extraction: convert this to a reusable InfoCard component
                if the same layout is needed elsewhere. */}
            <View
              style={[
                styles.card,
                { backgroundColor: theme.cardBg, borderColor: theme.border },
              ]}
            >
              <Text style={[styles.cardLabel, { color: theme.subText }]}>
                Staff ID
              </Text>
              <Text style={[styles.cardValue, { color: theme.text }]}>
                12345
              </Text>
            </View>

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
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { flex: 1 },
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
  absoluteSkyPosition: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 0,
  },
  contentWrapper: {
    paddingHorizontal: 20,
    marginTop: 50,
    width: "100%",
  },
  screenSurface: {
    borderRadius: 28,
    overflow: "hidden",
    paddingVertical: 20,
    paddingHorizontal: 0,
  },
});
