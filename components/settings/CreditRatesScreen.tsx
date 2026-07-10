/**
 * Credit rates (Settings → Credit Rates).
 * View historical rates with date stepper; edit/add closes the previous current row.
 */

import FeatureBannerLayout from "@/components/layout/FeatureBannerLayout";
import FeatureScreenBody from "@/components/layout/FeatureScreenBody";
import { useFeatureScreenTheme } from "@/components/layout/useFeatureScreenTheme";
import { useCreditRates } from "@/components/settings/useCreditRates";
import { RecordArrowStepper } from "@/components/ui/RecordArrowStepper";
import { EditSaveButton } from "@/components/ui/EditSaveButton";
import { Text, View } from "@/components/Themed";
import { FontAwesome6 } from "@expo/vector-icons";
import React from "react";
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  TextInput,
  TouchableOpacity,
} from "react-native";

function formatMoney(value: number) {
  return `£${value.toFixed(2)}`;
}

function formatEffectiveDate(iso: string) {
  return new Date(`${iso}T00:00:00`).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

type InfoRowProps = {
  label: string;
  value: string;
  theme: ReturnType<typeof useFeatureScreenTheme>;
  isLast?: boolean;
};

function InfoRow({ label, value, theme, isLast = false }: InfoRowProps) {
  return (
    <View
      style={[
        styles.detailRow,
        { borderBottomColor: theme.border },
        isLast && styles.detailRowLast,
      ]}
    >
      <Text style={[styles.rowLabel, styles.infoLabel, { color: theme.subTextColor }]}>
        {label}
      </Text>
      <Text style={[styles.rowValue, { color: theme.subTextColor }]}>{value}</Text>
    </View>
  );
}

type RateRowProps = {
  icon: React.ComponentProps<typeof FontAwesome6>["name"];
  label: string;
  value: string;
  theme: ReturnType<typeof useFeatureScreenTheme>;
  isEditing?: boolean;
  editValue?: string;
  onChangeText?: (text: string) => void;
  placeholder?: string;
  isLast?: boolean;
};

function RateRow({
  icon,
  label,
  value,
  theme,
  isEditing = false,
  editValue = "",
  onChangeText,
  placeholder,
  isLast = false,
}: RateRowProps) {
  return (
    <View
      style={[
        styles.detailRow,
        { borderBottomColor: theme.border },
        isLast && styles.detailRowLast,
      ]}
    >
      <View style={styles.rowLabelGroup}>
        <FontAwesome6
          name={icon}
          size={14}
          color={theme.accent}
          style={styles.iconWidth}
        />
        <Text style={[styles.rowLabel, { color: theme.textColor }]}>{label}</Text>
      </View>
      {isEditing ? (
        <TextInput
          style={[styles.rowInput, { color: theme.textColor }]}
          value={editValue}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={theme.muted}
          keyboardType="decimal-pad"
        />
      ) : (
        <Text style={[styles.rowValue, { color: theme.textColor }]}>{value}</Text>
      )}
    </View>
  );
}

export default function CreditRatesScreen() {
  const theme = useFeatureScreenTheme();
  const {
    staffNumber,
    selectedRecord,
    setSelectedIndex,
    isLoading,
    isSaving,
    isEditing,
    canEdit,
    canGoPrev,
    canGoNext,
    form,
    setForm,
    beginEdit,
    discardEdit,
    save,
    records,
  } = useCreditRates();

  const handleEditSavePress = async () => {
    if (!isEditing) {
      beginEdit();
      return;
    }

    const result = await save();
    if (result.success) {
      return;
    }

    Alert.alert("Unable to save", result.error ?? "Please check the values and try again.");
  };

  const stepperTheme = {
    border: theme.border,
    nestedBoxBg: theme.nestedBoxBg,
    accent: theme.accent,
    disabledBtn: theme.disabledBtn,
  };

  return (
    <FeatureBannerLayout title="Credit Rates">
      <FeatureScreenBody>
        {!staffNumber && !isLoading ? (
          <View style={[styles.noticeCard, { borderColor: theme.border }]}>
            <Text style={[styles.noticeText, { color: theme.subTextColor }]}>
              Add your staff number in Settings → Profile to manage credit rates.
            </Text>
          </View>
        ) : null}

        {isLoading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={theme.accent} />
          </View>
        ) : (
          <>
            <View style={styles.controlRow}>
              <RecordArrowStepper
                canGoPrev={!isEditing && canGoPrev}
                canGoNext={!isEditing && canGoNext}
                onPrev={() => setSelectedIndex((index) => index + 1)}
                onNext={() => setSelectedIndex((index) => index - 1)}
                theme={stepperTheme}
              />
              {canEdit || isEditing ? (
                <EditSaveButton
                  isEditing={isEditing}
                  isSaving={isSaving}
                  onPress={handleEditSavePress}
                  editLabel={records.length === 0 ? "Add" : "Edit"}
                  saveLabel="Save"
                />
              ) : null}
            </View>

            {selectedRecord || isEditing ? (
              <View
                style={[
                  styles.card,
                  {
                    backgroundColor: theme.cardBg,
                    borderColor: theme.border,
                  },
                ]}
              >
                <RateRow
                  icon="plane-departure"
                  label="Flying Hours"
                  value={
                    selectedRecord
                      ? `${formatMoney(selectedRecord.flyingRate)} / hr`
                      : "—"
                  }
                  theme={theme}
                  isEditing={isEditing}
                  editValue={form.flyingRate}
                  onChangeText={(text) =>
                    setForm((prev) => ({ ...prev, flyingRate: text }))
                  }
                  placeholder="19.43"
                />
                <RateRow
                  icon="globe"
                  label="Overseas Allowance"
                  value={
                    selectedRecord
                      ? `${formatMoney(selectedRecord.overseasRate)} / day`
                      : "—"
                  }
                  theme={theme}
                  isEditing={isEditing}
                  editValue={form.overseasRate}
                  onChangeText={(text) =>
                    setForm((prev) => ({ ...prev, overseasRate: text }))
                  }
                  placeholder="10.00"
                />
                <RateRow
                  icon="suitcase-rolling"
                  label="Time Away From Base (TAFB)"
                  value={
                    selectedRecord
                      ? `${formatMoney(selectedRecord.timeAwayRate)} / day`
                      : "—"
                  }
                  theme={theme}
                  isEditing={isEditing}
                  editValue={form.timeAwayRate}
                  onChangeText={(text) =>
                    setForm((prev) => ({ ...prev, timeAwayRate: text }))
                  }
                  placeholder="5.09"
                  isLast={isEditing || !selectedRecord}
                />

                {!isEditing && selectedRecord ? (
                  <>
                    <View style={styles.sectionSpacer} />
                    <InfoRow
                      label="Effective from"
                      value={formatEffectiveDate(selectedRecord.effectiveFrom)}
                      theme={theme}
                      isLast={!selectedRecord.effectiveTo}
                    />
                    {selectedRecord.effectiveTo ? (
                      <InfoRow
                        label="Effective to"
                        value={formatEffectiveDate(selectedRecord.effectiveTo)}
                        theme={theme}
                        isLast
                      />
                    ) : null}
                  </>
                ) : null}
              </View>
            ) : (
              <View style={[styles.emptyCard, { borderColor: theme.border }]}>
                <FontAwesome6
                  name="coins"
                  size={28}
                  color={theme.muted}
                  style={{ marginBottom: 12 }}
                />
                <Text style={[styles.emptyTitle, { color: theme.textColor }]}>
                  No credit rates yet
                </Text>
                <Text style={[styles.emptyBody, { color: theme.subTextColor }]}>
                  Tap Add to enter your flying, overseas allowance, and time away
                  from base rates.
                </Text>
              </View>
            )}

            {isEditing ? (
              <TouchableOpacity
                style={styles.discardButton}
                onPress={discardEdit}
                activeOpacity={0.7}
              >
                <Text style={styles.discardText}>Discard changes</Text>
              </TouchableOpacity>
            ) : null}
          </>
        )}
      </FeatureScreenBody>
    </FeatureBannerLayout>
  );
}

const styles = StyleSheet.create({
  centered: {
    paddingVertical: 48,
    alignItems: "center",
  },
  controlRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
    backgroundColor: "transparent",
    width: "100%",
  },
  card: {
    borderRadius: 24,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 18,
    marginBottom: 12,
  },
  sectionSpacer: {
    height: 14,
    backgroundColor: "transparent",
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingBottom: 14,
    backgroundColor: "transparent",
  },
  detailRowLast: {
    borderBottomWidth: 0,
    marginBottom: 0,
    paddingBottom: 0,
  },
  rowLabelGroup: {
    flexDirection: "row",
    alignItems: "flex-start",
    flex: 1,
    backgroundColor: "transparent",
  },
  iconWidth: {
    width: 24,
    marginTop: 2,
  },
  rowLabel: {
    fontFamily: "GoogleSansBold",
    fontSize: 15,
    flexShrink: 1,
  },
  infoLabel: {
    flex: 1,
    marginRight: 12,
  },
  rowValue: {
    fontFamily: "GoogleSansBold",
    fontSize: 15,
    textAlign: "right",
    marginLeft: 12,
  },
  rowInput: {
    fontFamily: "GoogleSansBold",
    fontSize: 15,
    textAlign: "right",
    minWidth: 88,
    paddingVertical: 2,
  },
  emptyCard: {
    alignItems: "center",
    borderRadius: 24,
    borderWidth: StyleSheet.hairlineWidth,
    paddingVertical: 36,
    paddingHorizontal: 24,
    marginBottom: 12,
  },
  emptyTitle: {
    fontFamily: "GoogleSansBold",
    fontSize: 17,
    marginBottom: 8,
  },
  emptyBody: {
    fontFamily: "GoogleSans",
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
  },
  noticeCard: {
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 14,
    marginBottom: 16,
  },
  noticeText: {
    fontFamily: "GoogleSans",
    fontSize: 14,
    lineHeight: 20,
  },
  discardButton: {
    marginTop: 8,
    paddingVertical: 10,
    alignItems: "center",
  },
  discardText: {
    fontFamily: "GoogleSansBold",
    fontSize: 14,
    color: "#FF3B30",
  },
});
