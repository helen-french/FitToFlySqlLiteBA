import { Text } from "@/components/Themed";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  StyleSheet,
  TouchableOpacity,
  View as RNView,
} from "react-native";

export type HubMenuRowTheme = {
  text: string;
  subText: string;
  /** Optional: when set, draws a soft icon plate behind the glyph. */
  iconBubble?: string;
  iconColor?: string;
};

type HubMenuRowProps = {
  title: string;
  /** Prefer Ionicons outline names (e.g. `time-outline`). */
  icon: React.ComponentProps<typeof Ionicons>["name"];
  onPress: () => void;
  theme: HubMenuRowTheme;
  /** Destructive / caution rows (e.g. clear data). */
  destructive?: boolean;
  subtitle?: string;
};

export function HubMenuRow({
  title,
  icon,
  onPress,
  theme,
  destructive = false,
  subtitle,
}: HubMenuRowProps) {
  const iconColor = destructive
    ? "#FF3B30"
    : (theme.iconColor ?? theme.subText);
  const titleColor = destructive ? "#FF3B30" : theme.text;

  return (
    <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.7}>
      <RNView style={styles.rowIconLabel}>
        {theme.iconBubble ? (
          <RNView
            style={[styles.iconBubble, { backgroundColor: theme.iconBubble }]}
          >
            <Ionicons name={icon} size={18} color={iconColor} />
          </RNView>
        ) : (
          <RNView style={styles.iconPlain}>
            <Ionicons name={icon} size={22} color={iconColor} />
          </RNView>
        )}
        <RNView style={styles.labelBlock}>
          <Text style={[styles.rowText, { color: titleColor }]}>{title}</Text>
          {subtitle ? (
            <Text style={[styles.subtitle, { color: theme.subText }]}>
              {subtitle}
            </Text>
          ) : null}
        </RNView>
      </RNView>
      <Ionicons name="chevron-forward" size={16} color={theme.subText} />
    </TouchableOpacity>
  );
}

export function HubMenuRowSeparator({ color }: { color: string }) {
  return <RNView style={[styles.separator, { backgroundColor: color }]} />;
}

export default HubMenuRow;

const styles = StyleSheet.create({
  rowIconLabel: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: 12,
  },
  iconBubble: {
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  iconPlain: {
    width: 28,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  labelBlock: {
    flex: 1,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 15,
    paddingHorizontal: 18,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 60,
    marginRight: 18,
  },
  rowText: {
    fontFamily: "GoogleSans",
    fontSize: 16,
    fontWeight: "600",
    letterSpacing: -0.2,
  },
  subtitle: {
    fontFamily: "GoogleSans",
    fontSize: 13,
    marginTop: 2,
  },
});
