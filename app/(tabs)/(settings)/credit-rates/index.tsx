import Header from "@/components/Header";
import { Text, View } from "@/components/Themed";
import { saveCreditRates } from "@/services/creditRateService";
import { FontAwesome6 } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  useColorScheme,
} from "react-native";

export default function CreditRatesScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const [rate1, setRate1] = useState("");
  const [rate2, setRate2] = useState("");
  const [rate3, setRate3] = useState("");
  const [effectiveTo, setEffectiveTo] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const theme = {
    background: isDark ? "#000" : "#f2f2f7",
    cardBg: isDark ? "#1c1c1e" : "#fff",
    text: isDark ? "#fff" : "#000",
    subText: isDark ? "#a0a0a0" : "#6d6d72",
    border: isDark ? "rgba(56, 56, 58, 0.4)" : "#d1d1d6",
    inputBg: isDark ? "#2c2c2e" : "#f7f7f7",
    placeholder: isDark ? "#8e8e93" : "#8e8e93",
  };

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
    <>
      <Header />
      <ScrollView
        style={[styles.container, { backgroundColor: theme.background }]}
        contentContainerStyle={styles.content}
      >
        <View
          style={[
            styles.headerCard,
            { backgroundColor: theme.cardBg, borderColor: theme.border },
          ]}
        >
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <FontAwesome6 name="chevron-left" size={20} color="#007AFF" />
            <Text style={[styles.backButtonText, { color: theme.text }]}>Back</Text>
          </TouchableOpacity>
          <Text style={[styles.screenTitle, { color: theme.text }]}>Manage Credit Rates</Text>
          <Text style={[styles.screenSubtitle, { color: theme.subText }]}> 
            Update the staff credit rates and optional effective end date.
          </Text>
        </View>

        <View
          style={[
            styles.formCard,
            { backgroundColor: theme.cardBg, borderColor: theme.border },
          ]}
        >
          <Text style={[styles.inputLabel, { color: theme.subText }]}>Flying Rate</Text>
          <TextInput
            value={rate1}
            onChangeText={setRate1}
            placeholder="e.g. 19.43"
            keyboardType="numeric"
            placeholderTextColor={theme.placeholder}
            style={[
              styles.input,
              {
                backgroundColor: theme.inputBg,
                color: theme.text,
                borderColor: theme.border,
              },
            ]}
          />

          <Text style={[styles.inputLabel, { color: theme.subText }]}>Overseas Rate</Text>
          <TextInput
            value={rate2}
            onChangeText={setRate2}
            placeholder="e.g. 25.00"
            keyboardType="numeric"
            placeholderTextColor={theme.placeholder}
            style={[
              styles.input,
              {
                backgroundColor: theme.inputBg,
                color: theme.text,
                borderColor: theme.border,
              },
            ]}
          />

          <Text style={[styles.inputLabel, { color: theme.subText }]}>Time Away Rate</Text>
          <TextInput
            value={rate3}
            onChangeText={setRate3}
            placeholder="e.g. 13.60"
            keyboardType="numeric"
            placeholderTextColor={theme.placeholder}
            style={[
              styles.input,
              {
                backgroundColor: theme.inputBg,
                color: theme.text,
                borderColor: theme.border,
              },
            ]}
          />

          <Text style={[styles.inputLabel, { color: theme.subText }]}>Effective To</Text>
          <TextInput
            value={effectiveTo}
            onChangeText={setEffectiveTo}
            placeholder="DD/MM/YYYY or DD/MM/YY"
            placeholderTextColor={theme.placeholder}
            style={[
              styles.input,
              {
                backgroundColor: theme.inputBg,
                color: theme.text,
                borderColor: theme.border,
              },
            ]}
          />
        </View>

        <TouchableOpacity
          style={[styles.button, styles.saveButton]}
          onPress={handleSave}
          disabled={isSaving}
          activeOpacity={0.8}
        >
          <Text style={styles.buttonText}>
            {isSaving ? "Saving..." : "Save Rates"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.button,
            styles.cancelButton,
            { backgroundColor: theme.cardBg, borderColor: theme.border },
          ]}
          onPress={() => router.back()}
          activeOpacity={0.8}
        >
          <Text style={[styles.cancelButtonText, { color: theme.text }]}>Cancel</Text>
        </TouchableOpacity>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 110,
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 32,
    paddingTop: 20,
  },
  screenTitle: {
    fontFamily: "GoogleSansBold",
    fontSize: 24,
    marginBottom: 6,
    color: "#000",
  },
  screenSubtitle: {
    fontFamily: "GoogleSans",
    fontSize: 14,
    color: "#6d6d72",
    marginTop: 8,
    lineHeight: 20,
  },
  headerCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#d1d1d6",
    padding: 18,
    marginBottom: 20,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  backButtonText: {
    fontFamily: "GoogleSans",
    color: "#007AFF",
    fontSize: 17,
    marginLeft: 6,
  },
  formCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#d1d1d6",
    padding: 20,
    marginBottom: 20,
  },
  inputLabel: {
    fontFamily: "GoogleSansBold",
    fontSize: 13,
    color: "#6d6d72",
    marginBottom: 8,
  },
  input: {
    fontFamily: "GoogleSans",
    fontSize: 17,
    backgroundColor: "#f7f7f7",
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 18,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#d1d1d6",
  },
  button: {
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    marginBottom: 12,
  },
  saveButton: {
    backgroundColor: "#007AFF",
  },
  cancelButton: {
    backgroundColor: "#fff",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#d1d1d6",
  },
  buttonText: {
    fontFamily: "GoogleSansBold",
    fontSize: 16,
    color: "#fff",
  },
  cancelButtonText: {
    fontFamily: "GoogleSansBold",
    fontSize: 16,
    color: "#007AFF",
  },
});
