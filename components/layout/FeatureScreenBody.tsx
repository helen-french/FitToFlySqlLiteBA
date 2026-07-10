import React from "react";
import { ScrollView, StyleSheet, type ScrollViewProps } from "react-native";

type FeatureScreenBodyProps = {
  children: React.ReactNode;
  keyboardShouldPersistTaps?: ScrollViewProps["keyboardShouldPersistTaps"];
};

export default function FeatureScreenBody({
  children,
  keyboardShouldPersistTaps = "handled",
}: FeatureScreenBodyProps) {
  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps={keyboardShouldPersistTaps}
      showsVerticalScrollIndicator={false}
    >
      {children}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 40,
  },
});
