/**
 * Centered-title notice dialog for roster import outcomes
 * (success, duplicate, older feed). Native Alert cannot control title alignment.
 */

import { FontAwesome6 } from "@expo/vector-icons";
import React from "react";
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from "react-native";

export type RosterImportNoticeTone = "warning" | "success";

type Props = {
  visible: boolean;
  title: string;
  message: string;
  tone?: RosterImportNoticeTone;
  onClose: () => void;
};

export function RosterImportNoticeModal({
  visible,
  title,
  message,
  tone = "warning",
  onClose,
}: Props) {
  const isDark = useColorScheme() === "dark";
  const colors = {
    card: isDark ? "#2C2C2E" : "#FFFFFF",
    text: isDark ? "#FFFFFF" : "#1A1A1A",
    body: isDark ? "#C7C7CC" : "#3A3A3C",
    border: isDark ? "rgba(72, 72, 74, 0.75)" : "#E5E5EA",
    accent: "#007AFF",
    warning: "#FF9500",
    success: "#34C759",
  };

  const isSuccess = tone === "success";

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View
          style={[
            styles.card,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          {isSuccess ? (
            <View
              style={[styles.successBadge, { backgroundColor: colors.success }]}
            >
              <FontAwesome6 name="check" size={14} color="#FFFFFF" />
            </View>
          ) : (
            <FontAwesome6
              name="circle-exclamation"
              size={22}
              color={colors.warning}
              style={styles.icon}
            />
          )}
          <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.message, { color: colors.body }]}>
            {message}
          </Text>
          <Pressable
            onPress={onClose}
            style={({ pressed }) => [
              styles.okButton,
              {
                borderTopColor: colors.border,
                opacity: pressed ? 0.65 : 1,
              },
            ]}
            accessibilityRole="button"
            accessibilityLabel="OK"
          >
            <Text style={[styles.okText, { color: colors.accent }]}>OK</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 36,
    backgroundColor: "rgba(0, 0, 0, 0.45)",
  },
  card: {
    width: "100%",
    maxWidth: 320,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
    paddingTop: 20,
  },
  icon: {
    alignSelf: "center",
    marginBottom: 10,
  },
  successBadge: {
    alignSelf: "center",
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  title: {
    fontFamily: "GoogleSansBold",
    fontSize: 17,
    textAlign: "center",
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  message: {
    fontFamily: "GoogleSans",
    fontSize: 14,
    lineHeight: 20,
    textAlign: "left",
    paddingHorizontal: 20,
    marginBottom: 18,
  },
  okButton: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingVertical: 14,
    alignItems: "center",
  },
  okText: {
    fontFamily: "GoogleSansBold",
    fontSize: 17,
  },
});
