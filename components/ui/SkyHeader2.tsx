import React from "react";
import { StyleSheet, View, ViewStyle, StyleProp } from "react-native";
import GradientCard from "./GradientCard";
import CloudsImage from "../creatives/clouds";

interface SkyHeaderProps {
  children?: React.ReactNode;
  showClouds?: boolean;
  height?: number;
  style?: StyleProp<ViewStyle>;
  // We can pass the plane component as a prop to keep it decoupled
  renderPlane?: () => React.ReactNode;
}

const SkyHeader = ({
  children,
  showClouds = true,
  height = 380,
  style,
  renderPlane,
}: SkyHeaderProps) => {
  return (
    <GradientCard
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
    paddingTop: 100, // Adjust this via props if you want it higher on Profile
    justifyContent: "flex-start",
    width: "100%",
  },
  headerContent: {
    flexDirection: "row",
    paddingHorizontal: 20,
    marginTop: -30,
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
    bottom: 50,
    left: 0,
    right: 0,
    height: 120,
  },
});

export default SkyHeader;
