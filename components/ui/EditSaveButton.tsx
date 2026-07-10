import { FontAwesome6 } from "@expo/vector-icons";
import React from "react";
import { ActivityIndicator, StyleSheet, TouchableOpacity } from "react-native";

import { Text } from "@/components/Themed";

type EditSaveButtonProps = {
  isEditing: boolean;
  onPress: () => void;
  isSaving?: boolean;
  editLabel?: string;
  saveLabel?: string;
};

export function EditSaveButton({
  isEditing,
  onPress,
  isSaving = false,
  editLabel = "Edit",
  saveLabel = "Save",
}: EditSaveButtonProps) {
  return (
    <TouchableOpacity
      style={[
        styles.button,
        isEditing ? styles.saveButton : styles.editButton,
      ]}
      onPress={onPress}
      disabled={isSaving}
      activeOpacity={0.8}
    >
      {isSaving ? (
        <ActivityIndicator size="small" color="#FFFFFF" />
      ) : (
        <>
          <FontAwesome6
            name={isEditing ? "check" : "pen-to-square"}
            size={13}
            color="#FFFFFF"
          />
          <Text style={styles.label}>{isEditing ? saveLabel : editLabel}</Text>
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 18,
    minWidth: 72,
    justifyContent: "center",
  },
  editButton: {
    backgroundColor: "#007AFF",
  },
  saveButton: {
    backgroundColor: "#34C759",
  },
  label: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 13,
    marginLeft: 4,
    fontFamily: "GoogleSansBold",
  },
});
