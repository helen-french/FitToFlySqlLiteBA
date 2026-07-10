/**
 * Credit rates form (Settings → Credit Rates).
 */

import FeatureBannerLayout from "@/components/layout/FeatureBannerLayout";
import FeatureScreenBody from "@/components/layout/FeatureScreenBody";
import { useFeatureScreenTheme } from "@/components/layout/useFeatureScreenTheme";
import { Text, View } from "@/components/Themed";
import { saveCreditRates } from "@/services/creditRateService";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  Alert,
  StyleSheet,
  TextInput,
  TouchableOpacity,
} from "react-native";

export default function CreditRatesScreen() {
  const router = useRouter();
  const theme = useFeatureScreenTheme();
  const [rate1, setRate1] = useState("");
  const [rate2, setRate2] = useState("");
  const [rate3, setRate3] = useState("");
  const [effectiveTo, setEffectiveTo] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    const result = await saveCreditRates(
      "12345",
      Number(rate1),
      Number(rate2),
      Number(rate3),
      effectiveTo,
    );
    setIsSaving(false);

    if (result.success) {
      Alert.alert("Saved", "Credit rates updated successfully.");
      router.back();
      return;
    }

    Alert.alert("Unable to save", String(result.error));
  };

  return (
    <FeatureBannerLayout title="Credit Rates">
      <FeatureScreenBody>
        <Text style={[styles.screenSubtitle, { color: theme.subTextColor }]}>
          Update the staff credit rates and optional effective end date.
        </Text>

        <View
          style={[
            styles.formCard,
            { backgroundColor: theme.cardBg, borderColor: theme.border },
          ]}
        >
          <Text style={[styles.inputLabel, { color: theme.subTextColor }]}>
            Flying Rate
          </Text>
          <TextInput
            value={rate1}
            onChangeText={setRate1}
            placeholder="e.g. 19.43 per hour"
            keyboardType="numeric"
            placeholderTextColor={theme.muted}
            style={[
              styles.input,
              {
                backgroundColor: theme.nestedBoxBg,
                color: theme.textColor,
                borderColor: theme.border,
              },
            ]}
          />

          <Text style={[styles.inputLabel, { color: theme.subTextColor }]}>
            Overseas Rate
          </Text>
          <TextInput
            value={rate2}
            onChangeText={setRate2}
            placeholder="e.g. £10.00 per day overseas allowance"
            keyboardType="numeric"
            placeholderTextColor={theme.muted}
            style={[
              styles.input,
              {
                backgroundColor: theme.nestedBoxBg,
                color: theme.textColor,
                borderColor: theme.border,
              },
            ]}
          />

          <Text style={[styles.inputLabel, { color: theme.subTextColor }]}>
            Time Away Rate
          </Text>
          <TextInput
            value={rate3}
            onChangeText={setRate3}
            placeholder="e.g. £5.09 for TAFB"
            keyboardType="numeric"
            placeholderTextColor={theme.muted}
            style={[
              styles.input,
              {
                backgroundColor: theme.nestedBoxBg,
                color: theme.textColor,
                borderColor: theme.border,
              },
            ]}
          />

          <Text style={[styles.inputLabel, { color: theme.subTextColor }]}>
            Effective To
          </Text>
          <TextInput
            value={effectiveTo}
            onChangeText={setEffectiveTo}
            placeholder="DD/MM/YYYY or DD/MM/YY"
            placeholderTextColor={theme.muted}
            style={[
              styles.input,
              styles.inputLast,
              {
                backgroundColor: theme.nestedBoxBg,
                color: theme.textColor,
                borderColor: theme.border,
              },
            ]}
          />
        </View>

        <TouchableOpacity
          style={[styles.button, { backgroundColor: theme.accent }]}
          onPress={handleSave}
          disabled={isSaving}
          activeOpacity={0.8}
        >
          <Text style={styles.buttonText}>
            {isSaving ? "Saving..." : "Save Rates"}
          </Text>
        </TouchableOpacity>
      </FeatureScreenBody>
    </FeatureBannerLayout>
  );
}

const styles = StyleSheet.create({
  screenSubtitle: {
    fontFamily: "GoogleSans",
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 18,
  },
  formCard: {
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 20,
    marginBottom: 20,
  },
  inputLabel: {
    fontFamily: "GoogleSansBold",
    fontSize: 13,
    marginBottom: 8,
  },
  input: {
    fontFamily: "GoogleSans",
    fontSize: 17,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 18,
    borderWidth: StyleSheet.hairlineWidth,
  },
  inputLast: {
    marginBottom: 0,
  },
  button: {
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
  },
  buttonText: {
    fontFamily: "GoogleSansBold",
    fontSize: 16,
    color: "#fff",
  },
});
