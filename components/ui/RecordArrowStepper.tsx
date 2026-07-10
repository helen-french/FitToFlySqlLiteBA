import { FontAwesome6 } from "@expo/vector-icons";
import React from "react";
import { Pressable, StyleSheet, View } from "react-native";

import type { StepperTheme } from "@/components/ui/stepperTheme";

type RecordArrowStepperProps = {
  canGoPrev: boolean;
  canGoNext: boolean;
  onPrev: () => void;
  onNext: () => void;
  theme: StepperTheme;
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
      <Pressable
        disabled={!canGoPrev}
        onPress={onPrev}
        style={({ pressed }) => [
          styles.stepButton,
          { borderRightWidth: 1, borderRightColor: theme.border },
          pressed && canGoPrev && styles.stepButtonPressed,
        ]}
      >
        <FontAwesome6
          name="chevron-left"
          size={12}
          color={canGoPrev ? theme.accent : "#8E8E93"}
        />
      </Pressable>

      <Pressable
        disabled={!canGoNext}
        onPress={onNext}
        style={({ pressed }) => [
          styles.stepButton,
          pressed && canGoNext && styles.stepButtonPressed,
        ]}
      >
        <FontAwesome6
          name="chevron-right"
          size={12}
          color={canGoNext ? theme.accent : "#8E8E93"}
        />
      </Pressable>
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
    backgroundColor: "transparent",
  },
  stepButtonPressed: {
    opacity: 0.65,
  },
});
