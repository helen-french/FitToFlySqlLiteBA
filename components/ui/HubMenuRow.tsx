import { Text } from "@/components/Themed";
import { FontAwesome6 } from "@expo/vector-icons";
import React from "react";
import {
  StyleSheet,
  TouchableOpacity,
  View as RNView,
} from "react-native";

export type HubMenuRowTheme = {
  text: string;
  subText: string;
  iconBubble: string;
};

type HubMenuRowProps = {
  title: string;
  icon: React.ComponentProps<typeof FontAwesome6>["name"];
  onPress: () => void;
  theme: HubMenuRowTheme;
};

export function HubMenuRow({ title, icon, onPress, theme }: HubMenuRowProps) {
  return (
    <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.7}>
      <RNView style={styles.rowIconLabel}>
        <RNView style={[styles.iconBubble, { backgroundColor: theme.iconBubble }]}>
          <FontAwesome6 name={icon} size={14} color="#007AFF" />
        </RNView>
        <Text style={[styles.rowText, { color: theme.text }]}>{title}</Text>
      </RNView>
      <FontAwesome6 name="chevron-right" size={16} color={theme.subText} />
    </TouchableOpacity>
  );
}

export function HubMenuRowSeparator({ color }: { color: string }) {
  return <RNView style={[styles.separator, { backgroundColor: color }]} />;
}

const styles = StyleSheet.create({
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
