/**
 * Reusable pushed-screen layout: shallow time-of-day sky banner, Fit to Fly logo,
 * screen title, and reliable back navigation.
 *
 * Use for Tools / Settings sub-screens (Hotels, Seniority Stats, etc.).
 */

import gradients from "@/constants/gradients";
import { getSkyByTime } from "@/lib/utils";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useMemo } from "react";
import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import { useHideStackHeader } from "@/components/layout/useHideStackHeader";

type FeatureBannerLayoutProps = {
  title: string;
  children: React.ReactNode;
  showBack?: boolean;
  onBackPress?: () => void;
};

export default function FeatureBannerLayout({
  title,
  children,
  showBack = true,
  onBackPress,
}: FeatureBannerLayoutProps) {
  useHideStackHeader();

  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const bannerColors = useMemo(() => {
    if (isDark) {
      return (gradients.night || ["#000428", "#004e92"]) as [
        string,
        string,
        ...string[],
      ];
    }
    const sky = getSkyByTime();
    return (gradients[sky] || gradients.day) as [string, string, ...string[]];
  }, [isDark]);

  const bannerText = "#FFFFFF";
  const bodyBg = isDark ? "#000000" : "#FFFFFF";
  const gradientTop = bannerColors[0];

  const handleBack = () => {
    if (onBackPress) {
      onBackPress();
      return;
    }
    if (router.canGoBack()) {
      router.back();
    }
  };

  return (
    <View style={[styles.root, { backgroundColor: bodyBg }]}>
      <LinearGradient
        colors={bannerColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[
          styles.banner,
          {
            paddingTop: insets.top + 6,
            backgroundColor: gradientTop,
          },
        ]}
      >
        <View style={styles.bannerRow}>
          {showBack ? (
            <Pressable
              onPress={handleBack}
              hitSlop={16}
              style={({ pressed }) => [
                styles.backButton,
                pressed && styles.backPressed,
              ]}
              accessibilityRole="button"
              accessibilityLabel="Go back"
            >
              <Text style={[styles.backText, { color: bannerText }]}>‹</Text>
            </Pressable>
          ) : (
            <View style={styles.backSpacer} />
          )}

          <View style={styles.brandColumn}>
            <Image
              source={require("@/assets/images/logos/fittofly-ultra-dark-3.png")}
              style={[
                styles.logo,
                isDark ? styles.logoOnDark : styles.logoOnLight,
              ]}
              resizeMode="contain"
            />
            <Text style={[styles.bannerTitle, { color: bannerText }]}>
              {title}
            </Text>
          </View>

          <View style={styles.backSpacer} />
        </View>
      </LinearGradient>

      <SafeAreaView
        style={[styles.body, { backgroundColor: bodyBg }]}
        edges={["bottom", "left", "right"]}
      >
        {children}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  banner: {
    paddingBottom: 14,
    paddingHorizontal: 12,
  },
  bannerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
  },
  backPressed: {
    opacity: 0.65,
  },
  backText: {
    fontSize: 32,
    lineHeight: 34,
    fontWeight: "300",
    marginTop: -2,
  },
  brandColumn: {
    flex: 1,
    alignItems: "center",
    paddingTop: 2,
  },
  logo: {
    width: 128,
    height: 28,
    marginBottom: 12,
  },
  logoOnLight: {
    tintColor: undefined,
  },
  logoOnDark: {
    tintColor: "#FFFFFF",
  },
  bannerTitle: {
    fontFamily: "GoogleSansBold",
    fontSize: 22,
    fontWeight: "700",
    letterSpacing: -0.3,
  },
  backSpacer: {
    width: 44,
  },
  body: {
    flex: 1,
  },
});
