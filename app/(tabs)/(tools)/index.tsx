import TabScreenLayout from "@/components/TabScreenLayout";
import { Text, View } from "@/components/Themed";
import { FontAwesome6 } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import {
  Alert,
  StyleSheet,
  TouchableOpacity,
  useColorScheme,
  View as RNView,
} from "react-native";

const ToolsRow = ({
  title,
  icon,
  onPress,
  theme,
}: {
  title: string;
  icon: React.ComponentProps<typeof FontAwesome6>["name"];
  onPress: () => void;
  theme: {
    text: string;
    iconBubble: string;
    subText: string;
  };
}) => (
  <TouchableOpacity
    style={styles.row}
    onPress={onPress}
    activeOpacity={0.7}
  >
    <RNView style={styles.rowIconLabel}>
      <RNView style={[styles.iconBubble, { backgroundColor: theme.iconBubble }]}>
        <FontAwesome6 name={icon} size={14} color="#007AFF" />
      </RNView>
      <Text style={[styles.rowText, { color: theme.text }]}>{title}</Text>
    </RNView>
    <FontAwesome6 name="chevron-right" size={16} color={theme.subText} />
  </TouchableOpacity>
);

export default function ToolsScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const theme = {
    cardBg: isDark ? "#1c1c1e" : "#f2f2f7",
    text: isDark ? "#fff" : "#000",
    subText: isDark ? "#a0a0a0" : "#8e8e93",
    border: isDark ? "rgba(56, 56, 58, 0.4)" : "#d1d1d6",
    rowBorder: isDark ? "rgba(56, 56, 58, 0.4)" : "#e5e5ea",
    iconBubble: isDark ? "rgba(10, 132, 255, 0.16)" : "rgba(0, 122, 255, 0.12)",
  };

  return (
    <TabScreenLayout>
      <Text style={[styles.pageTitle, { color: theme.text }]}>Tools</Text>

      <View
        style={[
          styles.card,
          { backgroundColor: theme.cardBg, borderColor: theme.border },
        ]}
      >
        <ToolsRow
          title="Airport"
          icon="plane-arrival"
          onPress={() => {
            Alert.alert("Airport", "Airport tools coming soon.");
          }}
          theme={theme}
        />
        <View style={[styles.separator, { backgroundColor: theme.rowBorder }]} />
        <ToolsRow
          title="Hotel"
          icon="hotel"
          onPress={() => router.push("/(tabs)/(location)")}
          theme={theme}
        />
        <View style={[styles.separator, { backgroundColor: theme.rowBorder }]} />
        <ToolsRow
          title="Notes"
          icon="note-sticky"
          onPress={() => router.push("/(tabs)/(notes)")}
          theme={theme}
        />
      </View>
    </TabScreenLayout>
  );
}

const styles = StyleSheet.create({
  pageTitle: {
    fontFamily: "GoogleSans",
    fontSize: 26,
    fontWeight: "700",
    marginBottom: 8,
    textAlign: "left",
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
  },
  separator: {
    height: 1,
    marginLeft: 20,
    marginRight: 20,
  },
  rowText: {
    fontFamily: "GoogleSans",
    fontSize: 16,
  },
});
