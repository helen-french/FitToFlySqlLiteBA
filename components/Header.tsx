import { useNavigation, useRouter } from "expo-router";
import { SymbolView } from "expo-symbols";
import React, { useCallback, useLayoutEffect } from "react";
import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from "react-native";
import { useAirportLoader } from "./useAirportLoader";
import { useHotelLoader } from "./useHotelLoader";
import { useRosterLoader } from "./useRosterLoader";

function HeaderBackButton({
  onPress,
  isDark,
}: {
  onPress: () => void;
  isDark: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
      style={({ pressed }) => [
        styles.backButton,
        pressed && styles.backButtonPressed,
      ]}
      accessibilityRole="button"
      accessibilityLabel="Go back"
    >
      <Text
        style={[
          styles.backButtonText,
          { color: isDark ? "#FFFFFF" : "#1C1C1E" },
        ]}
      >
        ‹
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  symbol: {
    width: 25,
    height: 25,
    margin: 5,
  },
  backButton: {
    minWidth: 44,
    minHeight: 44,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 4,
    backgroundColor: "transparent",
  },
  backButtonPressed: {
    opacity: 0.6,
  },
  backButtonText: {
    fontSize: 28,
    lineHeight: 28,
    fontWeight: "400",
  },
  rightActions: {
    flexDirection: "row",
    alignItems: "center",
  },
});

interface HeaderProps {
  onImportSuccess?: () => void;
  showLoadRosterAction?: boolean;
  showLoadHotelsAction?: boolean;
  showBackAction?: boolean;
  onBackPress?: () => void;
}

export default function Header({
  onImportSuccess,
  showLoadRosterAction = true,
  showLoadHotelsAction = true,
  showBackAction = false,
  onBackPress,
}: HeaderProps) {
  const navigation = useNavigation();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const { importRosterFile } = useRosterLoader(onImportSuccess);
  const { importHotelFile } = useHotelLoader(onImportSuccess);
  const { importAirportData } = useAirportLoader();

  const handleBackPress = useCallback(() => {
    if (onBackPress) {
      onBackPress();
      return;
    }
    if (router.canGoBack()) {
      router.back();
    }
  }, [onBackPress, router]);

  const handleRightButtonPress = useCallback(() => {
    importHotelFile();
  }, [importHotelFile]);

  const activeIcon = "building.2.fill";
  // --- SETTING B: AIRPORT MODALITY ---
  // const activeIcon = "airplane.arrival";
  // use importAirportData() in handleRightButtonPress instead of importHotelFile()

  useLayoutEffect(() => {
    navigation.setOptions({
      headerTransparent: true,
      headerLeftContainerStyle: { paddingLeft: 4 },
      headerTitle: () => (
        <Image
          source={require("@/assets/images/logos/fittofly-ultra-dark-3.png")}
          style={{ width: 130, height: 30 }}
          resizeMode="contain"
        />
      ),
      headerLeft: showBackAction
        ? () => (
            <HeaderBackButton onPress={handleBackPress} isDark={isDark} />
          )
        : showLoadRosterAction
          ? () => (
              <SymbolView
                onTouchEnd={importRosterFile}
                name="square.and.arrow.down.on.square.fill"
                style={styles.symbol}
                type="monochrome"
                weight="medium"
              />
            )
          : () => null,
      headerRight: showLoadHotelsAction
        ? () => (
            <View style={styles.rightActions}>
              <SymbolView
                onTouchEnd={handleRightButtonPress}
                name={activeIcon}
                style={styles.symbol}
                type="monochrome"
                weight="medium"
              />
            </View>
          )
        : () => null,
    });
  }, [
    navigation,
    showBackAction,
    showLoadRosterAction,
    showLoadHotelsAction,
    handleBackPress,
    isDark,
    importRosterFile,
    handleRightButtonPress,
    activeIcon,
  ]);

  return null;
}
