import { useFeatureScreenTheme } from "@/components/layout/useFeatureScreenTheme";
import { calculateFuelReserve } from "@/components/fuelReserve/calculateFuelReserve";
import {
  emptyFuelReserveInput,
  type FuelReserveInput,
} from "@/components/fuelReserve/types";
import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

const DESTINATION_DIVERSION = "-------";

type AltDestDraft = {
  destination: string;
  fuelToAlt: string;
};

type FuelReserveDraft = {
  destination: string;
  holdingPoint: string;
  holdingPointFuel: string;
  finalReserveFuel: string;
  finalApproachFuel: string;
  altDestData: AltDestDraft[];
};

export type FuelReserveCalculatorProps = {
  /** When set together with showInputs={false}, replaces the typed draft. */
  value?: FuelReserveInput;
  /** Fired as the pilot edits. A later feed can ignore this and pass value instead. */
  onChange?: (next: FuelReserveInput) => void;
  /** Hide the entry fields when a feed supplies value. */
  showInputs?: boolean;
};

function emptyDraft(): FuelReserveDraft {
  const input = emptyFuelReserveInput();
  return {
    destination: input.destination,
    holdingPoint: input.holdingPoint,
    holdingPointFuel: "",
    finalReserveFuel: "",
    finalApproachFuel: "",
    altDestData: input.altDestData.map((alt) => ({
      destination: alt.destination,
      fuelToAlt: "",
    })),
  };
}

function parseTonnes(text: string): number | null {
  const trimmed = text.trim();
  if (trimmed === "" || trimmed === ".") return null;
  const value = Number(trimmed);
  return Number.isFinite(value) ? value : null;
}

function sanitizeTonnes(text: string): string {
  const cleaned = text.replace(/[^0-9.]/g, "");
  const [whole, ...rest] = cleaned.split(".");
  if (rest.length === 0) return whole;
  return `${whole}.${rest.join("")}`;
}

function draftToInput(draft: FuelReserveDraft): FuelReserveInput {
  return {
    destination: draft.destination.trim(),
    holdingPoint: draft.holdingPoint.trim(),
    holdingPointFuel: parseTonnes(draft.holdingPointFuel),
    finalReserveFuel: parseTonnes(draft.finalReserveFuel),
    finalApproachFuel: parseTonnes(draft.finalApproachFuel),
    altDestData: draft.altDestData.map((alt) => ({
      destination: alt.destination.trim(),
      fuelToAlt: parseTonnes(alt.fuelToAlt),
    })),
  };
}

function formatFuelReserveNumber(value: number): string {
  const snapped = Math.round(value * 100) / 100;
  return snapped
    .toFixed(2)
    .replace(/\.00$/, "")
    .replace(/(\.\d)0$/, "$1");
}

/** "1 hr 25 mins", "2 hrs", "33 mins". 1 is singular. */
function formatHoldingTimeLabel(totalMinutes: number): string {
  const sign = totalMinutes < 0 ? "-" : "";
  const absMinutes = Math.floor(Math.abs(totalMinutes));
  const hours = Math.floor(absMinutes / 60);
  const minutes = absMinutes % 60;
  const parts: string[] = [];
  if (hours > 0) parts.push(`${hours} ${hours === 1 ? "hr" : "hrs"}`);
  if (minutes > 0) parts.push(`${minutes} ${minutes === 1 ? "min" : "mins"}`);
  if (parts.length === 0) return "0 mins";
  return sign + parts.join(" ");
}

export function FuelReserveCalculator({
  value,
  onChange,
  showInputs = true,
}: FuelReserveCalculatorProps) {
  const theme = useFeatureScreenTheme();
  const [draft, setDraft] = useState<FuelReserveDraft>(emptyDraft);
  const input =
    value !== undefined && !showInputs ? value : draftToInput(draft);
  const result = calculateFuelReserve(input);

  const update = (next: FuelReserveDraft) => {
    setDraft(next);
    onChange?.(draftToInput(next));
  };

  const arrivalText =
    input.holdingPointFuel == null
      ? "—"
      : formatFuelReserveNumber(input.holdingPointFuel);

  const summaryText = [styles.summaryText, { color: theme.textColor }];
  const inlineInputStyle = [
    styles.inlineInput,
    { color: theme.textColor, borderBottomColor: theme.accent },
  ];

  return (
    <View>
      {showInputs ? (
        <View style={styles.block}>
          <Text style={[styles.sectionHeading, { color: theme.textColor }]}>
            Guideline Figures
          </Text>
          <Text style={[styles.caption, { color: theme.subTextColor }]}>
            Enter fuel values in T
          </Text>
          <View
            style={[
              styles.card,
              { backgroundColor: theme.cardBg, borderColor: theme.border },
            ]}
          >
            <Field
              label="Final reserve"
              value={draft.finalReserveFuel}
              onChangeText={(text) =>
                update({ ...draft, finalReserveFuel: sanitizeTonnes(text) })
              }
              numeric
              theme={theme}
            />
            <Field
              label="Final approach"
              hint="(from holding to touchdown)"
              value={draft.finalApproachFuel}
              onChangeText={(text) =>
                update({
                  ...draft,
                  finalApproachFuel: sanitizeTonnes(text),
                })
              }
              numeric
              isLast
              theme={theme}
            />
          </View>
        </View>
      ) : null}

      {showInputs ? (
        <View style={styles.summaryRow}>
          <Text style={summaryText}>Holding at </Text>
          <TextInput
            value={draft.holdingPoint}
            onChangeText={(text) =>
              update({
                ...draft,
                holdingPoint: text.toUpperCase().slice(0, 4),
              })
            }
            autoCapitalize="characters"
            autoCorrect={false}
            maxLength={4}
            style={inlineInputStyle}
          />
          <Text style={summaryText}> (arrive with </Text>
          <TextInput
            value={draft.holdingPointFuel}
            onChangeText={(text) =>
              update({
                ...draft,
                holdingPointFuel: sanitizeTonnes(text).slice(0, 4),
              })
            }
            keyboardType="decimal-pad"
            maxLength={4}
            style={[inlineInputStyle, styles.inlineFuelInput]}
          />
          <Text style={summaryText}> T)</Text>
        </View>
      ) : (
        <Text style={[styles.summaryText, styles.summaryBlock, { color: theme.textColor }]}>
          Holding at {input.holdingPoint || "—"} (arrive with {arrivalText} T)
        </Text>
      )}

      <View
        style={[
          styles.resultsCard,
          {
            backgroundColor: theme.cardBg,
            borderColor: theme.isDark ? "#48484A" : "#B0B0B6",
          },
        ]}
      >
        <View
          style={[
            styles.tableHeader,
            { borderBottomColor: theme.border, backgroundColor: theme.heroBg },
          ]}
        >
          {showInputs ? <View style={styles.gutter} /> : null}
          <Text style={[styles.headerCell, styles.destCol, { color: theme.textColor }]}>
            Destination
          </Text>
          <Text style={[styles.headerCell, styles.timeCol, { color: theme.textColor }]}>
            Holding Time
          </Text>
          <Text style={[styles.headerCell, styles.fuelCol, { color: theme.textColor }]}>
            Min Fuel
          </Text>
          <Text style={[styles.headerCell, styles.fuelCol, { color: theme.textColor }]}>
            Diversion
          </Text>
        </View>

        {result.rows.map((row, index) => {
          const altIndex = index - 1;
          const altDraft = draft.altDestData[altIndex];
          const isLast = index === result.rows.length - 1;

          return (
            <View
              key={row.isDestination ? "destination" : `alt-${altIndex}`}
              style={[
                styles.tableRow,
                !isLast && {
                  borderBottomWidth: StyleSheet.hairlineWidth,
                  borderBottomColor: theme.border,
                },
              ]}
            >
              {showInputs ? (
                row.isDestination ? (
                  <View style={styles.gutter} />
                ) : (
                  <Pressable
                    onPress={() =>
                      update({
                        ...draft,
                        altDestData: draft.altDestData.filter(
                          (_, i) => i !== altIndex,
                        ),
                      })
                    }
                    hitSlop={8}
                    style={styles.gutter}
                    accessibilityRole="button"
                    accessibilityLabel={`Remove alternate ${altDraft?.destination || altIndex + 1}`}
                  >
                    <Ionicons name="close" size={16} color={theme.muted} />
                  </Pressable>
                )
              ) : null}

              <View style={styles.destCol}>
                {showInputs ? (
                  <TextInput
                    value={
                      row.isDestination
                        ? draft.destination
                        : (altDraft?.destination ?? "")
                    }
                    onChangeText={(text) => {
                      const code = text.toUpperCase();
                      if (row.isDestination) {
                        update({ ...draft, destination: code });
                        return;
                      }
                      update({
                        ...draft,
                        altDestData: draft.altDestData.map((alt, i) =>
                          i === altIndex ? { ...alt, destination: code } : alt,
                        ),
                      });
                    }}
                    autoCapitalize="characters"
                    autoCorrect={false}
                    style={[
                      styles.cellInput,
                      styles.destEntry,
                      { color: theme.textColor, borderBottomColor: theme.accent },
                    ]}
                  />
                ) : (
                  <Text style={[styles.cellText, styles.entryValue, { color: theme.textColor }]}>
                    {row.destination}
                  </Text>
                )}
              </View>

              <Text
                style={[styles.resultValue, styles.timeCol, { color: theme.textColor }]}
                numberOfLines={2}
              >
                {row.holdingTime == null
                  ? ""
                  : formatHoldingTimeLabel(row.holdingTime)}
              </Text>
              <Text style={[styles.resultValue, styles.fuelCol, { color: theme.textColor }]}>
                {row.minFuel == null ? "" : formatFuelReserveNumber(row.minFuel)}
              </Text>

              <View style={styles.fuelCol}>
                {row.isDestination ? (
                  <Text style={[styles.cellText, styles.entryValue, styles.dash, { color: theme.muted }]}>
                    {DESTINATION_DIVERSION}
                  </Text>
                ) : showInputs ? (
                  <TextInput
                    value={altDraft?.fuelToAlt ?? ""}
                    onChangeText={(text) =>
                      update({
                        ...draft,
                        altDestData: draft.altDestData.map((alt, i) =>
                          i === altIndex
                            ? { ...alt, fuelToAlt: sanitizeTonnes(text) }
                            : alt,
                        ),
                      })
                    }
                    keyboardType="decimal-pad"
                    style={[
                      styles.cellInput,
                      styles.diversionEntry,
                      { color: theme.textColor, borderBottomColor: theme.accent },
                    ]}
                  />
                ) : (
                  <Text
                    style={[
                      styles.cellText,
                      styles.entryValue,
                      styles.numericInput,
                      { color: theme.textColor },
                    ]}
                  >
                    {row.fuelToAlt == null
                      ? ""
                      : formatFuelReserveNumber(row.fuelToAlt)}
                  </Text>
                )}
              </View>
            </View>
          );
        })}
      </View>

      {showInputs ? (
        <Pressable
          onPress={() =>
            update({
              ...draft,
              altDestData: [
                ...draft.altDestData,
                { destination: "", fuelToAlt: "" },
              ],
            })
          }
          style={styles.addButton}
          accessibilityRole="button"
          accessibilityLabel="Add alternate"
        >
          <Ionicons name="add" size={18} color={theme.accent} />
          <Text style={[styles.addLabel, { color: theme.accent }]}>
            Add alternate
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

function Field({
  label,
  hint,
  value,
  onChangeText,
  placeholder,
  numeric = false,
  autoCapitalize = "none",
  isLast = false,
  theme,
}: {
  label: string;
  hint?: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  numeric?: boolean;
  autoCapitalize?: "none" | "characters";
  isLast?: boolean;
  theme: ReturnType<typeof useFeatureScreenTheme>;
}) {
  return (
    <View
      style={[
        styles.fieldRow,
        !isLast && {
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: theme.border,
        },
      ]}
    >
      <Text style={[styles.fieldLabel, { color: theme.textColor }]}>
        <Text style={styles.fieldLabelName}>{label}</Text>
        {hint ? (
          <Text style={[styles.fieldHint, { color: theme.muted }]}> {hint}</Text>
        ) : null}
      </Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.muted}
        keyboardType={numeric ? "decimal-pad" : "default"}
        autoCapitalize={autoCapitalize}
        autoCorrect={false}
        style={[
          styles.fieldInput,
          { color: theme.textColor, borderBottomColor: theme.accent },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  block: {
    marginBottom: 12,
  },
  sectionHeading: {
    fontWeight: "700",
    fontSize: 16,
    lineHeight: 28,
    marginLeft: 4,
  },
  caption: {
    fontFamily: "GoogleSans",
    fontSize: 13,
    marginBottom: 8,
    marginLeft: 4,
  },
  card: {
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
  },
  resultsCard: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
  },
  fieldRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 8,
    paddingHorizontal: 16,
    gap: 12,
  },
  fieldLabel: {
    fontSize: 16,
    flex: 1,
  },
  fieldLabelName: {
    fontFamily: "GoogleSans",
    fontSize: 16,
  },
  fieldHint: {
    fontStyle: "italic",
    fontSize: 16,
  },
  fieldInput: {
    fontFamily: "GoogleSans",
    fontSize: 16,
    width: 52,
    textAlign: "center",
    paddingVertical: 2,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  summaryRow: {
    flexDirection: "row",
    flexWrap: "nowrap",
    alignItems: "center",
    marginBottom: 16,
    marginLeft: 4,
  },
  summaryText: {
    fontStyle: "italic",
    fontWeight: "700",
    fontSize: 16,
    lineHeight: 28,
  },
  summaryBlock: {
    marginBottom: 12,
    marginLeft: 4,
  },
  inlineInput: {
    fontStyle: "italic",
    fontWeight: "700",
    fontSize: 16,
    lineHeight: 22,
    width: 52,
    textAlign: "center",
    paddingVertical: 2,
    paddingHorizontal: 0,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  inlineFuelInput: {
    width: 44,
  },
  tableHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingRight: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerCell: {
    fontFamily: "GoogleSansBold",
    fontSize: 13,
    lineHeight: 16,
  },
  tableRow: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 58,
    paddingRight: 10,
    paddingVertical: 6,
  },
  gutter: {
    width: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  destCol: {
    flex: 1.2,
  },
  timeCol: {
    width: 116,
    textAlign: "right",
  },
  fuelCol: {
    width: 68,
    textAlign: "right",
  },
  cellText: {
    fontFamily: "GoogleSans",
    fontSize: 15,
    paddingVertical: 8,
  },
  resultValue: {
    fontFamily: "GoogleSansBold",
    fontSize: 16,
    lineHeight: 20,
    paddingVertical: 4,
  },
  cellInput: {
    fontFamily: "GoogleSansBold",
    fontSize: 16,
    paddingVertical: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  entryValue: {
    fontFamily: "GoogleSansBold",
    fontSize: 16,
  },
  destEntry: {
    width: 52,
    alignSelf: "flex-start",
    textAlign: "center",
  },
  diversionEntry: {
    width: 44,
    alignSelf: "flex-end",
    textAlign: "center",
  },
  numericInput: {
    textAlign: "right",
  },
  dash: {
    textAlign: "right",
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 4,
    marginTop: 12,
    marginLeft: 4,
    paddingVertical: 6,
  },
  addLabel: {
    fontFamily: "GoogleSans",
    fontSize: 16,
  },
});
