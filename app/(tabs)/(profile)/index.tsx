import { FontAwesome6 } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  useColorScheme,
} from "react-native";
import Animated, { LinearTransition } from "react-native-reanimated";

import FormDropdown from "@/components/FormDropdown";
import SeniorityGraph from "@/components/SeniorityGraph";
import TabScreenLayout from "@/components/TabScreenLayout";
import { Text, View } from "@/components/Themed";

import { db } from "@/db/db";
import { desc, eq } from "drizzle-orm";
import {
  AllowedCarrier,
  AllowedPosition,
  CrewMember,
  crewMembers,
  personDetails,
  PersonDetails,
  User,
  users,
} from "../../../db/schema";

export default function ProfileScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  // Unified Layout Theme Configuration
  const themeTextColor = isDark ? "#FFFFFF" : "#1A1A1A";
  const themeSubTextColor = isDark ? "#A0A0A0" : "#666666";
  const themeCardBg = isDark
    ? "rgba(28, 28, 30, 0.85)"
    : "rgba(242, 242, 247, 0.85)";
  const themeBorder = isDark
    ? "rgba(56, 56, 58, 0.4)"
    : "rgba(229, 229, 234, 0.6)";
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
    <TabScreenLayout onRefresh={() => fetchCrewDataRecord(staffNumber)}>
      <Animated.View
        layout={LinearTransition.duration(600)}
        style={styles.contentWrapper}
      >
        {/* ──✅ FIXED: Horizontal Avatar + Identity Card Layout */}
        <View style={styles.profileHeaderCard}>
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
                    {
                      backgroundColor: themeCardBg,
                      borderColor: themeBorder,
                      borderWidth: 1,
                    },
                  ]}
                >
                  <FontAwesome6
                    name="user"
                    size={26}
                    color={themeSubTextColor}
                  />
                </View>
              )}
              {isEditing && (
                <View style={styles.cameraBadge}>
                  <FontAwesome6 name="camera" size={8} color="white" />
                </View>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.identityTextContainer}>
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
                    {
                      color: themeInputText,
                      borderColor: themeBorder,
                      marginBottom: 0,
                    },
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
                <Text
                  style={[styles.displayName, { color: themeTextColor }]}
                  numberOfLines={1}
                >
                  {name || "Add Your Name"}
                </Text>
                <Text
                  style={[styles.displayEmail, { color: themeSubTextColor }]}
                  numberOfLines={1}
                >
                  {email || "Add your email address"}
                </Text>
              </View>
            )}
          </View>
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

        {/* SECTION 1: MASTER USER CARD DETAILS */}
        <Animated.View
          layout={LinearTransition.duration(600)}
          style={[
            styles.modernCard,
            {
              backgroundColor: themeCardBg,
              borderColor: themeBorder,
              borderWidth: 1,
            },
          ]}
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
          <View style={[styles.detailRow, { borderBottomColor: themeBorder }]}>
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
            {
              backgroundColor: themeCardBg,
              borderColor: themeBorder,
              borderWidth: 1,
              marginTop: 10,
              marginBottom: 10,
            },
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

          <View style={[styles.detailRow, { borderBottomColor: themeBorder }]}>
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
          <View style={[styles.detailRow, { borderBottomColor: themeBorder }]}>
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
            {
              backgroundColor: themeCardBg,
              borderColor: themeBorder,
              borderWidth: 1,
              marginTop: 10,
              marginBottom: 20,
            },
          ]}
        >
          <View style={[styles.detailRow, { borderBottomColor: themeBorder }]}>
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
          <View style={[styles.detailRow, { borderBottomColor: themeBorder }]}>
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
          <View style={[styles.detailRow, { borderBottomColor: themeBorder }]}>
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
          <View style={[styles.detailRow, { borderBottomColor: themeBorder }]}>
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
          <View style={[styles.detailRow, { borderBottomColor: themeBorder }]}>
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
    </TabScreenLayout>
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },

  contentWrapper: {
    width: "100%",
  },

  profileHeaderCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "transparent",
    width: "100%",
    marginBottom: 5,
  },
  avatarContainer: {
    backgroundColor: "transparent",
    marginRight: 16,
  },
  avatarFrame: {
    position: "relative",
    width: 76,
    height: 76,
  },
  avatarImage: {
    width: 76,
    height: 76,
    borderRadius: 38,
  },
  avatarFallback: {
    width: 76,
    height: 76,
    borderRadius: 38,
    alignItems: "center",
    justifyContent: "center",
  },
  cameraBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: "#007AFF",
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "white",
  },
  identityTextContainer: {
    flex: 1,
    backgroundColor: "transparent",
    justifyContent: "center",
  },
  identityDisplayBlock: {
    backgroundColor: "transparent",
  },
  displayName: {
    fontSize: 22,
    fontWeight: "700",
    letterSpacing: -0.3,
  },
  displayEmail: {
    fontSize: 14,
    marginTop: 1,
  },
  identityEditBlock: {
    backgroundColor: "transparent",
    width: "100%",
  },
  identityInput: {
    fontSize: 15,
    borderBottomWidth: 1,
    paddingVertical: 4,
    marginBottom: 8,
  },
  actionRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    marginBottom: 15,
    backgroundColor: "transparent",
    width: "100%",
    marginTop: -25, // Pulls edit button up cleanly parallel to text layout
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 18,
  },
  editBtn: { backgroundColor: "#007AFF" },
  saveBtn: { backgroundColor: "#34C759" },
  actionBtnText: {
    color: "white",
    fontWeight: "600",
    fontSize: 13,
    marginLeft: 4,
  },
  modernCard: { width: "100%", padding: 18, borderRadius: 24 },
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
  iconWidth: { width: 24 },
  rowLabel: { fontSize: 14 },
  rowValue: { fontSize: 15, fontWeight: "600" },
  rowInput: {
    fontSize: 15,
    fontWeight: "600",
    textAlign: "right",
    minWidth: "60%",
    paddingVertical: 2,
  },
  cancelButton: { marginTop: 15, padding: 10, alignItems: "center" },
  cancelBtnText: { color: "#FF3B30", fontWeight: "600", fontSize: 14 },
  valueWithChevron: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "transparent",
  },
  sectionTitle: {
    fontFamily: "GoogleSansBold",
    fontSize: 13,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginTop: 25,
    marginLeft: 4,
  },
});
