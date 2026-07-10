import { useMemo } from "react";
import { useColorScheme } from "react-native";

/** Shared ‹ › stepper palette (matches Sectors trip navigator). */
export type StepperTheme = {
  border: string;
  nestedBoxBg: string;
  accent: string;
};

export function useStepperTheme(): StepperTheme {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  return useMemo(
    () => ({
      accent: "#007AFF",
      border: isDark ? "rgba(56, 56, 58, 0.4)" : "rgba(229, 229, 234, 0.6)",
      nestedBoxBg: isDark ? "#2C2C2E" : "#FFFFFF",
    }),
    [isDark],
  );
}
