//TimeZone toggle between local and zulu. green on local, grey on zulu, pill design

import React from "react";
import { StyleSheet, TouchableOpacity } from "react-native";
import Animated, {
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";

interface Props {
  isZulu: boolean;
  onToggle: () => void;
  activeBg: string;
  inactiveBg: string;
}

export const AnimatedTimeZoneToggle = ({
  isZulu,
  onToggle,
  activeBg,
  inactiveBg,
}: Props) => {
  const animatedThumbStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: withTiming(isZulu ? 22 : 2, { duration: 200 }) },
      ],
    };
  }, [isZulu]);

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={onToggle}
      style={[
        styles.container,
        { backgroundColor: isZulu ? inactiveBg : activeBg },
      ]}
    >
      <Animated.View style={[styles.thumb, animatedThumbStyle]} />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 48,
    height: 26,
    borderRadius: 13,
    justifyContent: "center",
    padding: 2,
  },
  thumb: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#FFFFFF",
  },
});
