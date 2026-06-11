import React from "react";
import {
  StyleProp,
  StyleSheet,
  useColorScheme,
  View,
  ViewStyle,
} from "react-native";
import CloudsImage from "../creatives/clouds";
import GradientCard from "./GradientCard";

interface SkyHeaderProps {
  children?: React.ReactNode;
  showClouds?: boolean;
  height?: number;
  style?: StyleProp<ViewStyle>;
  skyType?: string;
  // We can pass the plane component as a prop to keep it decoupled
  renderPlane?: () => React.ReactNode;
}

const SkyHeader = ({
  children,
  showClouds = true,
  height = 380,
  style,
  skyType, // ──✅ Destructure the type prop cleanly
  renderPlane,
}: SkyHeaderProps) => {
  // ──✅ Get the active native device system theme
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  // ──✅ THE HYBRID THEME LOGIC:
  // If the device is in dark mode, force it to 'midnight'.
  // Otherwise, use the manually passed skyType, or fall back to your time-of-day logic!
  const activeSkyGradient = isDark ? "midnight" : skyType || undefined;

  return (
    <GradientCard
      type={activeSkyGradient} // ──✅ Pass the color token down to drive the gradient sheet
      style={StyleSheet.flatten([styles.skyHeader, { height }, style])}
    >
      <View style={styles.headerContent}>
        {/* Main Content (Titles etc) */}
        <View style={styles.textColumn}>{children}</View>

        {/* Optional Plane */}
        {renderPlane && <View style={styles.planeColumn}>{renderPlane()}</View>}
      </View>

      {/* Optional Clouds */}
      {showClouds && (
        <View style={styles.cloudsWrapper}>
          <CloudsImage />
        </View>
      )}
    </GradientCard>
  );
};

const styles = StyleSheet.create({
  skyHeader: {
    paddingTop: 60,
    justifyContent: "flex-start",
    width: "100%",
  },
  headerContent: {
    flexDirection: "row",
    paddingHorizontal: 20,
    marginTop: 0,
    zIndex: 5,
  },
  textColumn: {
    flex: 1.5,
    justifyContent: "center",
  },
  planeColumn: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  cloudsWrapper: {
    position: "absolute",
    bottom: -5,
    left: 0,
    right: 0,
    height: 120,
  },
});

export default SkyHeader;
