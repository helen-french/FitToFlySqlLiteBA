import { useMemo } from "react";
import { useColorScheme } from "react-native";

const ACTIVE_BLUE = "#007AFF";

export type FeatureScreenTheme = {
  textColor: string;
  subTextColor: string;
  cardBg: string;
  nestedBoxBg: string;
  border: string;
  accent: string;
  inputBg: string;
  emptyBg: string;
  sliderBg: string;
  modalOverlay: string;
  muted: string;
  toggleBg: string;
  toggleIcon: string;
  pillLive: string;
  pillMock: string;
  pillLiveText: string;
  pillMockText: string;
};

export function useFeatureScreenTheme(): FeatureScreenTheme {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  return useMemo(
    () => ({
      textColor: isDark ? "#FFFFFF" : "#1A1A1A",
      subTextColor: isDark ? "#A0A0A0" : "#666666",
      cardBg: isDark ? "#1C1C1E" : "#FFFFFF",
      nestedBoxBg: isDark ? "#3A3A3C" : "#FFFFFF",
      border: isDark ? "rgba(56, 56, 58, 0.45)" : "rgba(229, 229, 234, 0.9)",
      accent: "#005A9C",
      inputBg: isDark ? "#151517" : "#FFFFFF",
      emptyBg: isDark ? "#151517" : "#FFFFFF",
      sliderBg: isDark ? "rgba(28, 28, 30, 0.85)" : "rgba(242, 242, 247, 0.85)",
      modalOverlay: isDark ? "rgba(0, 0, 0, 0.6)" : "rgba(0, 0, 0, 0.4)",
      muted: isDark ? "#636366" : "#8E8E93",
      toggleBg: isDark ? "#2C2C2E" : "#F2F2F7",
      toggleIcon: isDark ? "#AEAEB2" : "#6D6D72",
      pillLive: isDark ? "rgba(52, 199, 89, 0.16)" : "rgba(52, 199, 89, 0.12)",
      pillMock: isDark ? "rgba(100, 181, 255, 0.14)" : "rgba(0, 122, 255, 0.1)",
      pillLiveText: isDark ? "#5CD67A" : "#248A3D",
      pillMockText: isDark ? "#64B5FF" : ACTIVE_BLUE,
    }),
    [isDark],
  );
}
