import { FontAwesome6 } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  useColorScheme,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// FIXED DELTA 1: Added the missing image picker module import!
import * as ImagePicker from "expo-image-picker";

// PREMIUM BUTTER ENGINES: GPU-driven physics and layout interpolation
import Animated, {
  FadeInUp,
  FadeOutUp,
  LinearTransition,
} from "react-native-reanimated";

import Header from "@/components/Header";
import { Text, View } from "@/components/Themed";

// Database Engine & Blueprint
import { eq } from "drizzle-orm";
import {
  AllowedCarrier,
  AllowedPosition,
  User,
  users,
} from "../../../db/schema";
import { db } from "../../_layout";

export default function ProfileScreen() {
  // Check if device is in light or dark mode
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  // System Theme Colors
  const themeTextColor = isDark ? "#FFFFFF" : "#1A1A1A";
  const themeSubTextColor = isDark ? "#A0A0A0" : "#666666";
  const themeCardBg = isDark ? "#1C1C1E" : "#F2F2F7";
  const themeBorder = isDark ? "#2C2C2E" : "#E5E5EA";
  const themeInputText = isDark ? "#FFFFFF" : "#000000";
  const themePillActive = "#007AFF";
  const themePillInactive = isDark ? "#2C2C2E" : "#E5E5EA";
  const themeNestedBg = isDark ? "#2C2C2E" : "#E5E5EA";

  // Local state management for profile data and UI states

  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);

  const [avatarUri, setAvatarUri] = useState<string | null>(null);

  const pickImage = async () => {
    // 1. Request system permissions to open the gallery
    const permissionResult =
      await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (permissionResult.granted === false) {
      alert(
        "Permission to access the camera roll is required to update your profile picture!",
      );
      return;
    }

    // 2. Launch the native photo gallery browser
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"], // Use array style configuration for newer expo versions
      allowsEditing: true, // Gives the user a square cropping box tool!
      aspect: [1, 1], // Forces a perfect 1:1 square aspect ratio
      quality: 0.5, // Compresses the asset to save space in the DB/cache
    });

    // 3. If they didn't hit cancel, update our screen state with the image path
    if (!result.canceled) {
      setAvatarUri(result.assets[0].uri);
    }
  };

  // Core Schema Form States
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [carrier, setCarrier] = useState<AllowedCarrier>("British Airways");
  const [fleet, setFleet] = useState("");
  const [position, setPosition] = useState<AllowedPosition | "">("");
  const [contract, setContract] = useState("");
  const [staffNumber, setStaffNumber] = useState("");

  const [showCarrierMenu, setShowCarrierMenu] = useState(false);
  const [showPositionMenu, setShowPositionMenu] = useState(false);

  // Options lists matching your TypeScript unions
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

  // 1. SELECT DATA ON OPEN
  useEffect(() => {
    async function fetchProfile() {
      try {
        const result = await db
          .select()
          .from(users)
          .where(eq(users.id, 1))
          .execute();
        if (result.length > 0) {
          const u = result[0] as User;
          setName(u.name);
          setEmail(u.email);
          setCarrier(u.carrier);
          setFleet(u.fleet || "");
          setPosition(u.position || "");
          setContract(u.contract || "");
          setStaffNumber(u.staffNumber);
          setAvatarUri(u.avatarUri || null);
        }
      } catch (err) {
        console.error("Database read error:", err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchProfile();
  }, []);

  // 2. UPSERT DATA ON SAVE
  const handleSave = async () => {
    try {
      if (!name || !email || !staffNumber) {
        alert("Name, Email, and Staff Number are required.");
        return;
      }

      const updatedData = {
        id: 1,
        name,
        email,
        carrier,
        fleet: fleet || null,
        position: position || null,
        contract: contract || null,
        staffNumber,
        avatarUri: avatarUri || null,
      };

      await db
        .insert(users)
        .values(updatedData as any)
        .onConflictDoUpdate({
          target: users.id,
          set: updatedData,
        })
        .execute();

      setIsEditing(false);
    } catch (err) {
      console.error("Database update error:", err);
    }
  };

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
      {/* ======================================================== */}
      {/* THE DELTA: DROP YOUR UNIVERSAL HEADER RIGHT HERE!         */}
      <Header />
      {/* ======================================================== */}

      <ScrollView
        style={[
          styles.container,
          { backgroundColor: isDark ? "#000000" : "#FFFFFF" },
        ]}
      >
        {/* FIXED DELTA 2: Cleaned up the extra duplicate opening contentWrapper line right here */}
        <View style={styles.contentWrapper}>
          {/* AVATAR BLUEPRINT SECTION */}
          <View style={styles.avatarContainer}>
            <TouchableOpacity
              disabled={!isEditing} // Can only change picture if in edit mode
              onPress={pickImage}
              style={styles.avatarFrame}
            >
              {avatarUri ? (
                <Animated.Image // Using Reanimated's image element for smooth rendering
                  source={{ uri: avatarUri }}
                  style={styles.avatarImage}
                />
              ) : (
                // Fallback user icon if no image is set yet
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

              {/* Visual edit indicator pill overlayed on the circle */}
              {isEditing && (
                <View style={styles.cameraBadge}>
                  <FontAwesome6 name="camera" size={10} color="white" />
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* ACTION BUTTON ROW */}
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

          {/* IDENTIFIER CONTACT FIELDS */}
          {isEditing ? (
            <View style={styles.identityEditBlock}>
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
            <View style={styles.identityDisplayBlock}>
              <Text style={[styles.displayName, { color: themeTextColor }]}>
                {name || "Add Your Name"}
              </Text>
              <Text style={[styles.displayEmail, { color: themeSubTextColor }]}>
                {email || "Add your email address"}
              </Text>
            </View>
          )}

          {/* MODERN SPECIFICATIONS CARD */}
          <View style={[styles.modernCard, { backgroundColor: themeCardBg }]}>
            {/* Carrier Row */}
            <View style={styles.rowContainer}>
              <TouchableOpacity
                disabled={!isEditing}
                style={[styles.detailRow, { borderBottomColor: themeBorder }]}
                onPress={() => setShowCarrierMenu(!showCarrierMenu)}
              >
                <View style={styles.rowLabelGroup}>
                  <FontAwesome6
                    name="plane-departure"
                    size={14}
                    color="#007AFF"
                    style={styles.iconWidth}
                  />
                  <Text style={[styles.rowLabel, { color: themeSubTextColor }]}>
                    Carrier
                  </Text>
                </View>

                <View style={styles.valueWithChevron}>
                  <Text style={[styles.rowValue, { color: themeTextColor }]}>
                    {carrier}
                  </Text>
                  {isEditing && (
                    <FontAwesome6
                      name={showCarrierMenu ? "chevron-up" : "chevron-down"}
                      size={11}
                      color="#8E8E93"
                      style={{ marginLeft: 8 }}
                    />
                  )}
                </View>
              </TouchableOpacity>

              {/* HIGH-END GPU INTERACTIVE SUBMENU - CARRIER ACCORDION */}
              {isEditing && showCarrierMenu && (
                <Animated.View
                  entering={FadeInUp.duration(200)}
                  exiting={FadeOutUp.duration(150)}
                  layout={LinearTransition.duration(200)}
                  style={[
                    styles.expandedMenu,
                    { backgroundColor: themeNestedBg },
                  ]}
                >
                  {carrierOptions.map((opt) => (
                    <TouchableOpacity
                      key={opt}
                      style={styles.menuItemRow}
                      onPress={() => {
                        setCarrier(opt);
                        setShowCarrierMenu(false);
                      }}
                    >
                      <Text
                        style={[
                          styles.menuItemText,
                          {
                            color: themeTextColor,
                            fontWeight: carrier === opt ? "600" : "400",
                          },
                        ]}
                      >
                        {opt}
                      </Text>
                      {carrier === opt && (
                        <FontAwesome6 name="check" size={12} color="#007AFF" />
                      )}
                    </TouchableOpacity>
                  ))}
                </Animated.View>
              )}
            </View>

            {/* Fleet Row */}
            <View
              style={[styles.detailRow, { borderBottomColor: themeBorder }]}
            >
              <View style={styles.rowLabelGroup}>
                <FontAwesome6
                  name="plane"
                  size={14}
                  color="#007AFF"
                  style={styles.iconWidth}
                />
                <Text style={[styles.rowLabel, { color: themeSubTextColor }]}>
                  Fleet
                </Text>
              </View>
              {isEditing ? (
                <TextInput
                  style={[styles.rowInput, { color: themeInputText }]}
                  value={fleet}
                  onChangeText={setFleet}
                  placeholder="e.g. B777"
                  placeholderTextColor="#8E8E93"
                />
              ) : (
                <Text style={[styles.rowValue, { color: themeTextColor }]}>
                  {fleet || "Not Set"}
                </Text>
              )}
            </View>

            {/* Position Row */}
            <View style={styles.rowContainer}>
              <TouchableOpacity
                disabled={!isEditing}
                style={[styles.detailRow, { borderBottomColor: themeBorder }]}
                onPress={() => setShowPositionMenu(!showPositionMenu)}
              >
                <View style={styles.rowLabelGroup}>
                  <FontAwesome6
                    name="user-tie"
                    size={14}
                    color="#007AFF"
                    style={styles.iconWidth}
                  />
                  <Text style={[styles.rowLabel, { color: themeSubTextColor }]}>
                    Position
                  </Text>
                </View>

                <View style={styles.valueWithChevron}>
                  <Text style={[styles.rowValue, { color: themeTextColor }]}>
                    {position || "Not Set"}
                  </Text>
                  {isEditing && (
                    <FontAwesome6
                      name={showPositionMenu ? "chevron-up" : "chevron-down"}
                      size={11}
                      color="#8E8E93"
                      style={{ marginLeft: 8 }}
                    />
                  )}
                </View>
              </TouchableOpacity>

              {/* HIGH-END GPU INTERACTIVE SUBMENU - POSITION ACCORDION */}
              {isEditing && showPositionMenu && (
                <Animated.View
                  entering={FadeInUp.duration(200)}
                  exiting={FadeOutUp.duration(150)}
                  layout={LinearTransition.duration(200)}
                  style={[
                    styles.expandedMenu,
                    { backgroundColor: themeNestedBg },
                  ]}
                >
                  {positionOptions.map((opt) => (
                    <TouchableOpacity
                      key={opt}
                      style={styles.menuItemRow}
                      onPress={() => {
                        setPosition(opt as AllowedPosition);
                        setShowPositionMenu(false);
                      }}
                    >
                      <Text
                        style={[
                          styles.menuItemText,
                          {
                            color: themeTextColor,
                            fontWeight: position === opt ? "600" : "400",
                          },
                        ]}
                      >
                        {opt}
                      </Text>
                      {position === opt && (
                        <FontAwesome6 name="check" size={12} color="#007AFF" />
                      )}
                    </TouchableOpacity>
                  ))}
                </Animated.View>
              )}
            </View>

            {/* Contract Row */}
            <View
              style={[styles.detailRow, { borderBottomColor: themeBorder }]}
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

            {/* Staff Number Row (No bottom border on final item) */}
            <View
              style={[
                styles.detailRow,
                { borderBottomWidth: 0, marginBottom: 0, paddingBottom: 0 },
              ]}
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
          </View>

          {/* CANCEL OVERRIDE LINK */}
          {isEditing && (
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={async () => {
                setIsEditing(false);
                setShowCarrierMenu(false);
                setShowPositionMenu(false);
                const result = await db
                  .select()
                  .from(users)
                  .where(eq(users.id, 1))
                  .execute();
                if (result.length > 0) {
                  setAvatarUri(result[0].avatarUri || null);
                }
              }}
            >
              <Text style={styles.cancelBtnText}>Discard Changes</Text>
            </TouchableOpacity>
          )}
        </View>
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
  verticalRow: {
    flexDirection: "column",
    alignItems: "flex-start",
    gap: 10,
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
  selectorGroup: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    width: "100%",
    backgroundColor: "transparent",
    marginTop: 2,
  },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  pillText: {
    fontSize: 13,
    fontWeight: "600",
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
  expandedMenu: {
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginTop: -6,
    marginBottom: 14,
  },
  menuItemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
  },
  menuItemText: {
    fontSize: 14,
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
});
