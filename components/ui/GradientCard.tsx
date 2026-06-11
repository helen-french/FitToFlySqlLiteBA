import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { StyleSheet, ViewStyle } from "react-native";
import gradients from "../../constants/gradients";
import { getSkyByTime } from "../../lib/utils";

interface GradientCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

const GradientCard: React.FC<GradientCardProps> = ({ children, style }) => {
  const selectedSky = getSkyByTime();
  const activeGradient = (gradients[selectedSky] || gradients.sunrise) as [
    string,
    string,
    ...string[],
  ];

  return (
    <LinearGradient
      colors={activeGradient}
      // We combine a default 'header' style with any custom overrides
      style={[styles.defaultHeader, style]}
    >
      {children}
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  defaultHeader: {
    width: "100%",
    // We don't set a hard height here so the Screen can decide
  },
});

export default GradientCard;
