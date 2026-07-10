import { useNavigation } from "expo-router";
import { useLayoutEffect } from "react";

/** Hides the Expo stack header so FeatureBannerLayout owns the top chrome. */
export function useHideStackHeader() {
  const navigation = useNavigation();

  useLayoutEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);
}
