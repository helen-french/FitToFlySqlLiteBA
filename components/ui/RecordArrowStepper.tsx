import { FontAwesome6 } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";

type RecordArrowStepperTheme = {
  border: string;
  nestedBoxBg: string;
  accent: string;
  disabledBtn: string;
};

type RecordArrowStepperProps = {
  canGoPrev: boolean;
  canGoNext: boolean;
  onPrev: () => void;
  onNext: () => void;
  theme: RecordArrowStepperTheme;
};

/** Sectors-style ‹ › control — prev/next only, no centre label. */
export function RecordArrowStepper({
  canGoPrev,
  canGoNext,
  onPrev,
  onNext,
  theme,
}: RecordArrowStepperProps) {
  return (
    <View
      style={[
        styles.container,
        {
          borderColor: theme.border,
          backgroundColor: theme.nestedBoxBg,
        },
      ]}
    >
      <TouchableOpacity
        disabled={!canGoPrev}
        onPress={onPrev}
        style={[
          styles.stepButton,
          !canGoPrev && { backgroundColor: theme.disabledBtn },
          { borderRightWidth: 1, borderRightColor: theme.border },
        ]}
        activeOpacity={0.7}
      >
        <FontAwesome6
          name="chevron-left"
          size={12}
          color={canGoPrev ? theme.accent : "#8E8E93"}
        />
      </TouchableOpacity>

      <TouchableOpacity
        disabled={!canGoNext}
        onPress={onNext}
        style={[
          styles.stepButton,
          !canGoNext && { backgroundColor: theme.disabledBtn },
        ]}
        activeOpacity={0.7}
      >
        <FontAwesome6
          name="chevron-right"
          size={12}
          color={canGoNext ? theme.accent : "#8E8E93"}
        />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    borderRadius: 8,
    borderWidth: 1,
    overflow: "hidden",
    height: 32,
  },
  stepButton: {
    width: 38,
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
});
