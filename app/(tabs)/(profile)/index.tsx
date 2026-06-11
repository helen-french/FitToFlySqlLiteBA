import { FontAwesome6 } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  useColorScheme,
} from "react-native";
import Animated, { LinearTransition } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

import FormDropdown from "@/components/FormDropdown";
import Header from "@/components/Header";
import SeniorityGraph from "@/components/SeniorityGraph";
import { Text, View } from "@/components/Themed";

import { db } from "@/db/db";
import { desc, eq } from "drizzle-orm";
import {
  AllowedCarrier,
  AllowedPosition, // ──✅ FIX: Import the master registry table
  CrewMember,
  crewMembers,
  personDetails,
  PersonDetails, // ──✅ FIX: Use the updated master types shape
  User,
  users,
} from "../../../db/schema";

export default function ProfileScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  // Unified Layout Theme Configuration
  const themeTextColor = isDark ? "#FFFFFF" : "#1A1A1A";
  const themeSubTextColor = isDark ? "#A0A0A0" : "#666666";
  const themeCardBg = isDark ? "#1C1C1E" : "#F2F2F7";
  const themeBorder = isDark ? "#2C2C2E" : "#E5E5EA";
  const themeInputText = isDark ? "#FFFFFF" : "#000000";
  const themePersonColor = "#32ADE6";

  // System Engine State Status
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [avatarUri, setAvatarUri] = useState<string | null>(null);

  // User Ingestion Field Core Parameters
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [carrier, setCarrier] = useState<AllowedCarrier>("British Airways");
  const [position, setPosition] = useState<AllowedPosition | "">("");
  const [contract, setContract] = useState("");
  const [staffNumber, setStaffNumber] = useState("");

  // Menu Dropdown Open Milestones
  const [showCarrierMenu, setShowCarrierMenu] = useState(false);
  const [showPositionMenu, setShowPositionMenu] = useState(false);
  const [showTrajectoryTimeline, setShowTrajectoryTimeline] = useState(false);

  // Relational Logs Arrays Data Maps
  const [latestPersonDetails, setLatestPersonDetails] =
    useState<PersonDetails | null>(null);
  const [historicalPersonalDetails, setHistoricalPersonalDetails] = useState<
    PersonDetails[]
  >([]);

  // ──✅ FIX: Re-key state to track your master crew account parameters correctly
  const [latestCrewMemberInfo, setLatestCrewMemberInfo] =
    useState<CrewMember | null>(null);

  const carrierOptions: AllowedCarrier[] = [
    "British Airways",
    "EasyJet",
    "Virgin",
  ];
  const positionOptions: AllowedPosition[] = [
    "Captain",
    "First Officer",
    "Training Captain",
  ];

  // Isolated relational lookup engine execution logic
  const fetchCrewDataRecord = useCallback(async (targetStaffNumber: string) => {
    if (!targetStaffNumber) {
      setLatestPersonDetails(null);
      setHistoricalPersonalDetails([]);
      setLatestCrewMemberInfo(null);
      return;
    }
    try {
      const personResult = await db
        .select()
        .from(personDetails)
        .where(eq(personDetails.staffNumber, targetStaffNumber))
        .orderBy(desc(personDetails.updatedAt));

      if (personResult.length > 0) {
        setLatestPersonDetails(personResult[0] as PersonDetails);
        setHistoricalPersonalDetails(personResult as PersonDetails[]);
      } else {
        setLatestPersonDetails(null);
        setHistoricalPersonalDetails([]);
      }

      // ──✅ FIX: Read your personal master row directly from the crewMembers registry table
      const crewRegistryResult = await db
        .select()
        .from(crewMembers)
        .where(eq(crewMembers.staffNumber, targetStaffNumber))
        .orderBy(desc(crewMembers.updatedAt))
        .limit(1);

      setLatestCrewMemberInfo(
        crewRegistryResult.length > 0
          ? (crewRegistryResult[0] as CrewMember)
          : null,
      );
    } catch (err) {
      console.error("Relational historical lookups failure:", err);
    }
  }, []);

  // Sync profile initialization variables
  useEffect(() => {
    async function fetchProfile() {
      try {
        const result = await db.select().from(users).where(eq(users.id, 1));
        if (result.length > 0) {
          const u = result[0] as User;
          setName(u.name);
          setEmail(u.email);
          setCarrier(u.carrier);
          setPosition(u.position || "");
          setContract(u.contract || "");
          setStaffNumber(u.staffNumber || "");
          setAvatarUri(u.avatarUri || null);

          if (u.staffNumber) {
            await fetchCrewDataRecord(u.staffNumber);
          }
        }
      } catch (err) {
        console.error("Database initialization read error:", err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchProfile();
  }, [fetchCrewDataRecord]);

  const pickImage = async () => {
    const permissionResult =
      await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      alert(
        "Permission to access the camera roll is required to update your profile picture!",
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!result.canceled) {
      setAvatarUri(result.assets[0].uri);
    }
  };

  const handleSave = async () => {
    if (!name.trim() || !email.trim() || !staffNumber.trim()) {
      alert("Name, Email, and Staff Number fields are required.");
      return;
    }

    try {
      const updatedData = {
        id: 1,
        name: name.trim(),
        email: email.trim(),
        carrier,
        fleet: null,
        position: position || null,
        contract: contract.trim() || null,
        staffNumber: staffNumber.trim(),
        avatarUri,
      };

      await db
        .insert(users)
        .values(updatedData as any)
        .onConflictDoUpdate({ target: users.id, set: updatedData });

      await fetchCrewDataRecord(staffNumber.trim());
      setIsEditing(false);
    } catch (err) {
      console.error("Database upsert process error:", err);
    }
  };

  // Comprehensive Form Reversion Link Handler
  const handleDiscardChanges = useCallback(async () => {
    setIsEditing(false);
    setShowCarrierMenu(false);
    setShowPositionMenu(false);
    try {
      const result = await db.select().from(users).where(eq(users.id, 1));
      if (result.length > 0) {
        const u = result[0] as User;
        setName(u.name);
        setEmail(u.email);
        setCarrier(u.carrier);
        setPosition(u.position || "");
        setContract(u.contract || "");
        setStaffNumber(u.staffNumber || "");
        setAvatarUri(u.avatarUri || null);

        if (u.staffNumber) {
          await fetchCrewDataRecord(u.staffNumber);
        }
      }
    } catch (err) {
      console.error("Form state discard rollbacks fault:", err);
    }
  }, [fetchCrewDataRecord]);

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <SafeAreaView
      style={[
        styles.safeArea,
        { backgroundColor: isDark ? "#000000" : "#FFFFFF" },
      ]}
    >
      <Header onImportSuccess={() => fetchCrewDataRecord(staffNumber)} />

      <ScrollView
        style={[
          styles.container,
          { backgroundColor: isDark ? "#000000" : "#FFFFFF" },
        ]}
      >
        <Animated.View
          layout={LinearTransition.duration(600)}
          style={styles.contentWrapper}
        >
          {/* PROFILE IMAGE FRAMING */}
          <View style={styles.avatarContainer}>
            <TouchableOpacity
              disabled={!isEditing}
              onPress={pickImage}
              style={styles.avatarFrame}
            >
              {avatarUri ? (
                <Animated.Image
                  source={{ uri: avatarUri }}
                  style={styles.avatarImage}
                />
              ) : (
                <View
                  style={[
                    styles.avatarFallback,
                    { backgroundColor: themeCardBg },
                  ]}
                >
                  <FontAwesome6
                    name="user"
                    size={32}
                    color={themeSubTextColor}
                  />
                </View>
              )}
              {isEditing && (
                <View style={styles.cameraBadge}>
                  <FontAwesome6 name="camera" size={10} color="white" />
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* CONTROL STATE TRIGGER SWITCH ROW BUTTON */}
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={[
                styles.actionButton,
                isEditing ? styles.saveBtn : styles.editBtn,
              ]}
              onPress={isEditing ? handleSave : () => setIsEditing(true)}
            >
              <FontAwesome6
                name={isEditing ? "check" : "pen-to-square"}
                size={13}
                color="white"
              />
              <Text style={styles.actionBtnText}>
                {isEditing ? "Save" : "Edit"}
              </Text>
            </TouchableOpacity>
          </View>

          {/* STABLE KEYED IDENTITY TOGGLE FIELDS */}
          {isEditing ? (
            <View key="identity-edit" style={styles.identityEditBlock}>
              <TextInput
                style={[
                  styles.identityInput,
                  {
                    color: themeInputText,
                    borderColor: "#007AFF",
                    fontWeight: "bold",
                  },
                ]}
                value={name}
                onChangeText={setName}
                placeholder="Full Name"
                placeholderTextColor="#8E8E93"
              />
              <TextInput
                style={[
                  styles.identityInput,
                  { color: themeInputText, borderColor: themeBorder },
                ]}
                value={email}
                onChangeText={setEmail}
                placeholder="Email Address"
                placeholderTextColor="#8E8E93"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
          ) : (
            <View key="identity-view" style={styles.identityDisplayBlock}>
              <Text style={[styles.displayName, { color: themeTextColor }]}>
                {name || "Add Your Name"}
              </Text>
              <Text style={[styles.displayEmail, { color: themeSubTextColor }]}>
                {email || "Add your email address"}
              </Text>
            </View>
          )}

          {/* SECTION 1: MASTER USER CARD DETAILS */}
          <Animated.View
            layout={LinearTransition.duration(600)}
            style={[styles.modernCard, { backgroundColor: themeCardBg }]}
          >
            <FormDropdown
              label="Carrier"
              value={carrier}
              icon="plane-departure"
              options={carrierOptions}
              isEditing={isEditing}
              isOpen={showCarrierMenu}
              onToggle={() => {
                setShowCarrierMenu(!showCarrierMenu);
                setShowPositionMenu(false);
              }}
              onSelect={(opt) => {
                setCarrier(opt);
                setShowCarrierMenu(false);
              }}
            />

            <View
              style={[styles.detailRow, { borderBottomColor: themeBorder }]}
            >
              <View style={styles.rowLabelGroup}>
                <FontAwesome6
                  name="id-card"
                  size={14}
                  color="#007AFF"
                  style={styles.iconWidth}
                />
                <Text style={[styles.rowLabel, { color: themeSubTextColor }]}>
                  Staff ID
                </Text>
              </View>
              {isEditing ? (
                <TextInput
                  style={[styles.rowInput, { color: themeInputText }]}
                  value={staffNumber}
                  onChangeText={setStaffNumber}
                  placeholder="Required"
                  placeholderTextColor="#FF3B30"
                  keyboardType="numeric"
                />
              ) : (
                <Text style={[styles.rowValue, { color: themeTextColor }]}>
                  {staffNumber || "Missing ID"}
                </Text>
              )}
            </View>

            <FormDropdown
              label="Position"
              value={position}
              icon="user-tie"
              options={positionOptions}
              isEditing={isEditing}
              isOpen={showPositionMenu}
              onToggle={() => {
                setShowPositionMenu(!showPositionMenu);
                setShowCarrierMenu(false);
              }}
              onSelect={(opt) => {
                setPosition(opt);
                setShowPositionMenu(false);
              }}
            />

            <View
              style={[
                styles.detailRow,
                { borderBottomWidth: 0, marginBottom: 0, paddingBottom: 0 },
              ]}
            >
              <View style={styles.rowLabelGroup}>
                <FontAwesome6
                  name="file-contract"
                  size={14}
                  color="#007AFF"
                  style={styles.iconWidth}
                />
                <Text style={[styles.rowLabel, { color: themeSubTextColor }]}>
                  Contract
                </Text>
              </View>
              {isEditing ? (
                <TextInput
                  style={[styles.rowInput, { color: themeInputText }]}
                  value={contract}
                  onChangeText={setContract}
                  placeholder="e.g. Full Time"
                  placeholderTextColor="#8E8E93"
                />
              ) : (
                <Text style={[styles.rowValue, { color: themeTextColor }]}>
                  {contract || "Not Set"}
                </Text>
              )}
            </View>
          </Animated.View>

          {/* SECTION 2: PERSONAL HISTORICAL REGISTRY METRICS CARD */}
          <Text style={[styles.sectionTitle, { color: themeSubTextColor }]}>
            Personal Details
          </Text>
          <Animated.View
            layout={LinearTransition.duration(600)}
            style={[
              styles.modernCard,
              { backgroundColor: themeCardBg, marginTop: 10, marginBottom: 10 },
            ]}
          >
            <TouchableOpacity
              activeOpacity={0.7}
              disabled={historicalPersonalDetails.length <= 1}
              onPress={() => setShowTrajectoryTimeline(!showTrajectoryTimeline)}
              style={[styles.detailRow, { borderBottomColor: themeBorder }]}
            >
              <View style={styles.rowLabelGroup}>
                <FontAwesome6
                  name="arrow-up-1-9"
                  size={14}
                  color={themePersonColor}
                  style={styles.iconWidth}
                />
                <Text style={[styles.rowLabel, { color: themeSubTextColor }]}>
                  Seniority Number
                </Text>
              </View>
              <View style={styles.valueWithChevron}>
                <Text style={[styles.rowValue, { color: themeTextColor }]}>
                  {latestPersonDetails?.seniorityNumber !== null &&
                  latestPersonDetails?.seniorityNumber !== undefined
                    ? String(latestPersonDetails.seniorityNumber)
                    : "Not Set"}
                </Text>
                {historicalPersonalDetails.length > 1 && (
                  <FontAwesome6
                    name={showTrajectoryTimeline ? "chevron-up" : "chart-line"}
                    size={11}
                    color={themePersonColor}
                    style={{ marginLeft: 8 }}
                  />
                )}
              </View>
            </TouchableOpacity>

            {showTrajectoryTimeline && (
              <SeniorityGraph historicalData={historicalPersonalDetails} />
            )}

            <View
              style={[styles.detailRow, { borderBottomColor: themeBorder }]}
            >
              <View style={styles.rowLabelGroup}>
                <FontAwesome6
                  name="barcode"
                  size={14}
                  color={themePersonColor}
                  style={styles.iconWidth}
                />
                <Text style={[styles.rowLabel, { color: themeSubTextColor }]}>
                  Name Code
                </Text>
              </View>
              <Text style={[styles.rowValue, { color: themeTextColor }]}>
                {latestPersonDetails?.nameCode || "Not Set"}
              </Text>
            </View>

            <View
              style={[styles.detailRow, { borderBottomColor: themeBorder }]}
            >
              <View style={styles.rowLabelGroup}>
                <FontAwesome6
                  name="signature"
                  size={14}
                  color={themePersonColor}
                  style={styles.iconWidth}
                />
                <Text style={[styles.rowLabel, { color: themeSubTextColor }]}>
                  Initials
                </Text>
              </View>
              <Text style={[styles.rowValue, { color: themeTextColor }]}>
                {latestPersonDetails?.initials || "Not Set"}
              </Text>
            </View>

            <View
              style={[
                styles.detailRow,
                { borderBottomWidth: 0, marginBottom: 0, paddingBottom: 0 },
              ]}
            >
              <View style={styles.rowLabelGroup}>
                <FontAwesome6
                  name="gauge-high"
                  size={14}
                  color={themePersonColor}
                  style={styles.iconWidth}
                />
                <Text style={[styles.rowLabel, { color: themeSubTextColor }]}>
                  Individual CAP
                </Text>
              </View>
              <Text style={[styles.rowValue, { color: themeTextColor }]}>
                {latestPersonDetails?.individualCap || "Not Set"}
              </Text>
            </View>
          </Animated.View>

          {/* SECTION 3: OPERATIONAL TIMELINE CREW CARD */}
          <Text style={[styles.sectionTitle, { color: themeSubTextColor }]}>
            Crew Details
          </Text>
          <View
            style={[
              styles.modernCard,
              { backgroundColor: themeCardBg, marginTop: 10, marginBottom: 20 },
            ]}
          >
            <View
              style={[styles.detailRow, { borderBottomColor: themeBorder }]}
            >
              <View style={styles.rowLabelGroup}>
                <FontAwesome6
                  name="signature"
                  size={14}
                  color="#5856D6"
                  style={styles.iconWidth}
                />
                <Text style={[styles.rowLabel, { color: themeSubTextColor }]}>
                  Initials
                </Text>
              </View>
              <Text style={[styles.rowValue, { color: themeTextColor }]}>
                {latestCrewMemberInfo?.initials || "Not Set"}
              </Text>
            </View>

            <View
              style={[styles.detailRow, { borderBottomColor: themeBorder }]}
            >
              <View style={styles.rowLabelGroup}>
                <FontAwesome6
                  name="barcode"
                  size={14}
                  color="#5856D6"
                  style={styles.iconWidth}
                />
                <Text style={[styles.rowLabel, { color: themeSubTextColor }]}>
                  Name Code
                </Text>
              </View>
              <Text style={[styles.rowValue, { color: themeTextColor }]}>
                {latestCrewMemberInfo?.nameCode || "Not Set"}
              </Text>
            </View>

            <View
              style={[styles.detailRow, { borderBottomColor: themeBorder }]}
            >
              <View style={styles.rowLabelGroup}>
                <FontAwesome6
                  name="jet-fighter"
                  size={14}
                  color="#5856D6"
                  style={styles.iconWidth}
                />
                <Text style={[styles.rowLabel, { color: themeSubTextColor }]}>
                  Fleet
                </Text>
              </View>
              <Text style={[styles.rowValue, { color: themeTextColor }]}>
                {latestCrewMemberInfo?.aircraftType || "Not Set"}
              </Text>
            </View>

            <View
              style={[styles.detailRow, { borderBottomColor: themeBorder }]}
            >
              <View style={styles.rowLabelGroup}>
                <FontAwesome6
                  name="building"
                  size={14}
                  color="#5856D6"
                  style={styles.iconWidth}
                />
                <Text style={[styles.rowLabel, { color: themeSubTextColor }]}>
                  Home Base
                </Text>
              </View>
              <Text style={[styles.rowValue, { color: themeTextColor }]}>
                {latestCrewMemberInfo?.crewBase || "Not Set"}
              </Text>
            </View>

            <View
              style={[styles.detailRow, { borderBottomColor: themeBorder }]}
            >
              <View style={styles.rowLabelGroup}>
                <FontAwesome6
                  name="user-gear"
                  size={14}
                  color="#5856D6"
                  style={styles.iconWidth}
                />
                <Text style={[styles.rowLabel, { color: themeSubTextColor }]}>
                  Crew Function
                </Text>
              </View>
              <Text style={[styles.rowValue, { color: themeTextColor }]}>
                {latestCrewMemberInfo?.crewFunction !== null &&
                latestCrewMemberInfo?.crewFunction !== undefined
                  ? String(latestCrewMemberInfo.crewFunction)
                  : "Not Set"}
              </Text>
            </View>

            <View
              style={[
                styles.detailRow,
                { borderBottomWidth: 0, marginBottom: 0, paddingBottom: 0 },
              ]}
            >
              <View style={styles.rowLabelGroup}>
                <FontAwesome6
                  name="calendar-days"
                  size={14}
                  color="#5856D6"
                  style={styles.iconWidth}
                />
                <Text style={[styles.rowLabel, { color: themeSubTextColor }]}>
                  Roster Month
                </Text>
              </View>
              <Text style={[styles.rowValue, { color: themeTextColor }]}>
                {latestCrewMemberInfo?.rosterMonth || "Not Set"}
              </Text>
            </View>
          </View>

          {/* ACTION CANCELLATION OVERRIDE ROW LINK */}
          {isEditing && (
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={handleDiscardChanges}
            >
              <Text style={styles.cancelBtnText}>Discard Changes</Text>
            </TouchableOpacity>
          )}
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  contentWrapper: {
    paddingHorizontal: 20,
    paddingTop: 15,
    width: "100%",
  },
  actionRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    marginBottom: 15,
    backgroundColor: "transparent",
    width: "100%",
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 18,
  },
  editBtn: { backgroundColor: "#007AFF" },
  saveBtn: { backgroundColor: "#34C759" },
  actionBtnText: {
    color: "white",
    fontWeight: "600",
    fontSize: 14,
    marginLeft: 6,
  },
  identityDisplayBlock: {
    backgroundColor: "transparent",
    marginBottom: 25,
  },
  displayName: {
    fontSize: 22,
    fontWeight: "600",
  },
  displayEmail: {
    fontSize: 14,
    marginTop: 2,
  },
  identityEditBlock: {
    backgroundColor: "transparent",
    marginBottom: 25,
    width: "100%",
  },
  identityInput: {
    fontSize: 16,
    borderBottomWidth: 1,
    paddingVertical: 6,
    marginBottom: 14,
  },
  modernCard: {
    width: "100%",
    padding: 18,
    borderRadius: 12,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
    borderBottomWidth: 1,
    paddingBottom: 14,
    backgroundColor: "transparent",
  },
  rowLabelGroup: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "transparent",
  },
  iconWidth: {
    width: 24,
  },
  rowLabel: {
    fontSize: 14,
  },
  rowValue: {
    fontSize: 15,
    fontWeight: "600",
  },
  rowInput: {
    fontSize: 15,
    fontWeight: "600",
    textAlign: "right",
    minWidth: "60%",
    paddingVertical: 2,
  },
  cancelButton: {
    marginTop: 20,
    padding: 10,
    alignItems: "center",
  },
  cancelBtnText: {
    color: "#FF3B30",
    fontWeight: "600",
    fontSize: 14,
  },
  rowContainer: {
    backgroundColor: "transparent",
    width: "100%",
  },
  valueWithChevron: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "transparent",
  },
  avatarContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 15,
    backgroundColor: "transparent",
  },
  avatarFrame: {
    position: "relative",
    width: 90,
    height: 90,
  },
  avatarImage: {
    width: 90,
    height: 90,
    borderRadius: 45,
  },
  avatarFallback: {
    width: 90,
    height: 90,
    borderRadius: 45,
    alignItems: "center",
    justifyContent: "center",
  },
  cameraBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: "#007AFF",
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "white",
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginTop: 25,
    marginLeft: 4,
  },
});
