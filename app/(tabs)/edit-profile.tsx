import theme from "@/constants/theme";
import {
  enableBiometric,
  getBiometricStatus,
  isBiometricAvailable,
  storePIN,
} from "@/utils/biometric";
import { showErrorToast, showSuccessToast } from "@/utils/toast";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

interface BiometricData {
  pinHash: string;
  pinSalt: string;
  biometricEnabled: boolean;
  createdAt: number;
}

export default function EditProfileScreen() {
  const router = useRouter();
  const [userNIC, setUserNIC] = useState<string>("");
  const [currentPin, setCurrentPin] = useState<string>("");
  const [newPin, setNewPin] = useState<string>("");
  const [confirmPin, setConfirmPin] = useState<string>("");
  const [biometricEnabled, setBiometricEnabled] = useState<boolean>(false);
  const [isBiometricAvailableValue, setIsBiometricAvailableValue] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showPinSection, setShowPinSection] = useState(false);
  const [isVerifying, setIsVerifying] = useState(true);

  const loadUserData = useCallback(async () => {
    try {
      let nic: string | null = null;

      if (Platform.OS === "web") {
        nic = localStorage.getItem("userNIC");
      } else {
        nic = await SecureStore.getItemAsync("userNIC");
      }

      if (!nic) {
        showErrorToast("Error", "User not found");
        router.back();
        return;
      }

      setUserNIC(nic);

      // Load biometric status
      const bioStatus = await getBiometricStatus(nic);
      if (bioStatus) {
        setBiometricEnabled(bioStatus.biometricEnabled);
      }

      // Check if biometric is available
      const available = await isBiometricAvailable();
      setIsBiometricAvailableValue(available);

      setIsVerifying(false);
    } catch (error) {
      console.error("Error loading user data:", error);
      setIsVerifying(false);
    }
  }, [router]);

  useEffect(() => {
    loadUserData();
  }, [loadUserData]);

  const handleChangePIN = async () => {
    if (!currentPin) {
      showErrorToast("Required", "Please enter your current PIN");
      return;
    }

    if (!newPin || newPin.length < 4) {
      showErrorToast("Invalid PIN", "New PIN must be at least 4 digits");
      return;
    }

    if (newPin.length > 6) {
      showErrorToast("Invalid PIN", "New PIN must be at most 6 digits");
      return;
    }

    if (newPin !== confirmPin) {
      showErrorToast("Mismatch", "New PINs do not match");
      return;
    }

    if (newPin === currentPin) {
      showErrorToast("Same PIN", "New PIN must be different from current PIN");
      return;
    }

    setIsLoading(true);

    try {
      // Verify current PIN
      const { verifyPIN } = await import("@/utils/biometric");
      const isValid = await verifyPIN(userNIC, currentPin);

      if (!isValid) {
        showErrorToast("Invalid PIN", "Current PIN is incorrect");
        setIsLoading(false);
        return;
      }

      // Store new PIN
      await storePIN(userNIC, newPin);
      showSuccessToast("Success", "PIN updated successfully!");

      // Reset form
      setCurrentPin("");
      setNewPin("");
      setConfirmPin("");
      setShowPinSection(false);
    } catch (error) {
      console.error("Error changing PIN:", error);
      showErrorToast("Error", "Failed to update PIN");
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleBiometric = async (value: boolean) => {
    if (!isBiometricAvailableValue) {
      showErrorToast("Not Available", "Biometric is not available on this device");
      return;
    }

    setIsLoading(true);

    try {
      if (value) {
        // Enable biometric
        await enableBiometric(userNIC);
        setBiometricEnabled(true);
        showSuccessToast("Success", "Biometric login enabled!");
      } else {
        // Disable biometric
        const keyName = `biometric_${userNIC}`;

        if (Platform.OS === "web") {
          const dataStr = localStorage.getItem(keyName);
          if (dataStr) {
            const bioData: BiometricData = JSON.parse(dataStr);
            bioData.biometricEnabled = false;
            localStorage.setItem(keyName, JSON.stringify(bioData));
          }
        } else {
          const dataStr = await SecureStore.getItemAsync(keyName);
          if (dataStr) {
            const bioData: BiometricData = JSON.parse(dataStr);
            bioData.biometricEnabled = false;
            await SecureStore.setItemAsync(keyName, JSON.stringify(bioData), {
              keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
            });
          }
        }

        setBiometricEnabled(false);
        showSuccessToast("Success", "Biometric login disabled!");
      }
    } catch (error) {
      console.error("Error toggling biometric:", error);
      showErrorToast("Error", "Failed to update biometric settings");
    } finally {
      setIsLoading(false);
    }
  };

  if (isVerifying) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <MaterialIcons name="arrow-back" size={24} color={theme.colors.primary} />
        <Text style={styles.backButtonText}>Back</Text>
      </TouchableOpacity>

      <View style={styles.card}>
        <View style={styles.header}>
          <MaterialIcons name="edit" size={40} color={theme.colors.primary} />
          <Text style={styles.title}>Edit Profile</Text>
        </View>

        {/* Account Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account Information</Text>

          <View style={styles.infoBox}>
            <Text style={styles.infoLabel}>National ID</Text>
            <Text style={styles.infoValue}>{userNIC}</Text>
          </View>
        </View>

        {/* Biometric Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Security Settings</Text>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <MaterialIcons name="fingerprint" size={24} color={theme.colors.primary} />
              <View style={styles.settingText}>
                <Text style={styles.settingLabel}>Biometric Login</Text>
                <Text style={styles.settingDescription}>
                  {isBiometricAvailableValue
                    ? "Use your fingerprint to login"
                    : "Not available on this device"}
                </Text>
              </View>
            </View>

            <Switch
              value={biometricEnabled}
              onValueChange={handleToggleBiometric}
              disabled={isLoading || !isBiometricAvailableValue}
              trackColor={{ false: "#ccc", true: theme.colors.primary }}
              thumbColor={biometricEnabled ? "#fff" : "#f4f3f4"}
            />
          </View>

          {/* PIN Change Section */}
          <View style={styles.pinChangeBox}>
            <TouchableOpacity
              style={styles.pinChangeHeader}
              onPress={() => setShowPinSection(!showPinSection)}
              disabled={isLoading}
            >
              <View style={styles.pinChangeInfo}>
                <MaterialIcons name="lock" size={24} color={theme.colors.primary} />
                <View>
                  <Text style={styles.settingLabel}>Change PIN</Text>
                  <Text style={styles.settingDescription}>Update your login PIN</Text>
                </View>
              </View>
              <MaterialIcons
                name={showPinSection ? "expand-less" : "expand-more"}
                size={24}
                color={theme.colors.primary}
              />
            </TouchableOpacity>

            {showPinSection && (
              <View style={styles.pinChangeForm}>
                <Text style={styles.formLabel}>Current PIN</Text>
                <TextInput
                  placeholder="Enter current PIN"
                  style={styles.input}
                  value={currentPin}
                  onChangeText={setCurrentPin}
                  secureTextEntry
                  keyboardType="numeric"
                  maxLength={6}
                  editable={!isLoading}
                />

                <Text style={styles.formLabel}>New PIN</Text>
                <TextInput
                  placeholder="Enter new PIN (4-6 digits)"
                  style={styles.input}
                  value={newPin}
                  onChangeText={setNewPin}
                  secureTextEntry
                  keyboardType="numeric"
                  maxLength={6}
                  editable={!isLoading}
                />

                <Text style={styles.formLabel}>Confirm New PIN</Text>
                <TextInput
                  placeholder="Confirm new PIN"
                  style={styles.input}
                  value={confirmPin}
                  onChangeText={setConfirmPin}
                  secureTextEntry
                  keyboardType="numeric"
                  maxLength={6}
                  editable={!isLoading}
                />

                <View style={styles.pinButtonGroup}>
                  <TouchableOpacity
                    style={[styles.pinButton, styles.cancelButton]}
                    onPress={() => {
                      setShowPinSection(false);
                      setCurrentPin("");
                      setNewPin("");
                      setConfirmPin("");
                    }}
                    disabled={isLoading}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.pinButton, styles.submitButton]}
                    onPress={handleChangePIN}
                    disabled={isLoading || !currentPin || !newPin || !confirmPin}
                  >
                    {isLoading ? (
                      <ActivityIndicator size="small" color="#FFF" />
                    ) : (
                      <Text style={styles.submitButtonText}>Update PIN</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        </View>

        {/* Info Box */}
        <View style={styles.infoNotification}>
          <MaterialIcons name="info" size={20} color={theme.colors.primary} />
          <Text style={styles.infoNotificationText}>
            Your security settings help protect your account. Keep your PIN and biometric
            information private.
          </Text>
        </View>

        {/* Delink Device */}
        <View style={styles.delinkBox}>
          <Text style={styles.delinkTitle}>Delink this device</Text>
          <Text style={styles.delinkCaution}>
            Caution: Delinking will remove all keys and security settings from this device. You will
            need to re-register to use this device again.
          </Text>

          <TouchableOpacity
            style={styles.delinkButton}
            onPress={async () => {
              // confirm
              const confirmed = await new Promise<boolean>((resolve) => {
                Alert.alert(
                  "Delink device",
                  "This will remove your stored keys and security settings from this device. Are you sure you want to continue?",
                  [
                    { text: "Cancel", style: "cancel", onPress: () => resolve(false) },
                    { text: "Delink", style: "destructive", onPress: () => resolve(true) },
                  ],
                  { cancelable: true }
                );
              });

              if (!confirmed) return;

              setIsLoading(true);
              try {
                const keyNamePK = `privateKey_${userNIC}`;
                const keyNameBio = `biometric_${userNIC}`;
                const keyNamePIN = `pin_${userNIC}`;

                if (Platform.OS === "web") {
                  localStorage.removeItem("userNIC");
                  localStorage.removeItem(keyNamePK);
                  localStorage.removeItem(keyNameBio);
                  localStorage.removeItem(keyNamePIN);
                } else {
                  await SecureStore.deleteItemAsync("userNIC");
                  await SecureStore.deleteItemAsync(keyNamePK);
                  await SecureStore.deleteItemAsync(keyNameBio);
                  await SecureStore.deleteItemAsync(keyNamePIN);
                }

                showSuccessToast(
                  "Device Delinked",
                  "This device has been delinked. You will be redirected to registration."
                );
                // navigate to register page
                router.replace("/register");
              } catch (err) {
                console.error("Failed to delink device:", err);
                showErrorToast("Error", "Failed to delink device. Please try again.");
              } finally {
                setIsLoading(false);
              }
            }}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <Text style={styles.delinkButtonText}>Delink Device</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const { colors, spacing, radius, typography } = theme;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  contentContainer: {
    padding: spacing.lg,
    paddingBottom: spacing.lg * 2,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  backButtonText: {
    fontSize: typography.body,
    fontWeight: "600",
    color: colors.primary,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    padding: spacing.lg,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  header: {
    alignItems: "center",
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: typography.h2,
    fontWeight: "700",
    color: colors.purple900,
    marginTop: spacing.md,
  },
  section: {
    marginBottom: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutralMuted,
    paddingBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: typography.label,
    fontWeight: "700",
    color: colors.purple900,
    marginBottom: spacing.md,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  infoBox: {
    backgroundColor: colors.inputBg,
    borderRadius: radius.input,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  infoLabel: {
    fontSize: typography.label,
    fontWeight: "600",
    color: colors.purple900,
    marginBottom: spacing.sm,
  },
  infoValue: {
    fontSize: typography.body,
    fontWeight: "500",
    color: colors.purple900,
  },
  settingItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: colors.inputBg,
    borderRadius: radius.input,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  settingInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    flex: 1,
  },
  settingText: {
    flex: 1,
  },
  settingLabel: {
    fontSize: typography.body,
    fontWeight: "600",
    color: colors.purple900,
  },
  settingDescription: {
    fontSize: typography.label,
    color: "#999",
    marginTop: spacing.xs,
  },
  pinChangeBox: {
    backgroundColor: colors.inputBg,
    borderRadius: radius.input,
    overflow: "hidden",
    marginBottom: spacing.md,
  },
  pinChangeHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: spacing.md,
  },
  pinChangeInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    flex: 1,
  },
  pinChangeForm: {
    borderTopWidth: 1,
    borderTopColor: colors.neutralMuted,
    padding: spacing.md,
  },
  formLabel: {
    fontSize: typography.label,
    fontWeight: "600",
    color: colors.purple900,
    marginBottom: spacing.sm,
    marginTop: spacing.md,
  },
  input: {
    width: "100%",
    height: 44,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.neutralMuted,
    borderRadius: radius.input,
    paddingHorizontal: spacing.md,
    fontSize: typography.body,
    color: colors.purple900,
    textAlign: "center",
    letterSpacing: 2,
    fontWeight: "600",
  },
  pinButtonGroup: {
    flexDirection: "row",
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  pinButton: {
    flex: 1,
    height: 44,
    borderRadius: radius.button,
    justifyContent: "center",
    alignItems: "center",
  },
  cancelButton: {
    backgroundColor: colors.inputBg,
    borderWidth: 1,
    borderColor: colors.neutralMuted,
  },
  cancelButtonText: {
    color: colors.purple900,
    fontSize: typography.body,
    fontWeight: "700",
  },
  submitButton: {
    backgroundColor: colors.primary,
  },
  submitButtonText: {
    color: "#FFF",
    fontSize: typography.body,
    fontWeight: "700",
  },
  infoNotification: {
    backgroundColor: colors.inputBg,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
    borderRadius: radius.input,
    padding: spacing.md,
    flexDirection: "row",
    gap: spacing.md,
    alignItems: "flex-start",
  },
  infoNotificationText: {
    fontSize: typography.label,
    color: "#666",
    flex: 1,
  },
  delinkBox: {
    marginTop: spacing.lg,
    padding: spacing.lg,
    backgroundColor: "#fff6f6",
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: "#FFDCDC",
  },
  delinkTitle: {
    fontSize: typography.label,
    fontWeight: "700",
    color: colors.danger || "#E53935",
    marginBottom: spacing.sm,
  },
  delinkCaution: {
    fontSize: typography.body,
    color: "#8a1f1f",
    marginBottom: spacing.md,
  },
  delinkButton: {
    backgroundColor: colors.danger || "#E53935",
    borderRadius: radius.button,
    paddingVertical: spacing.md,
    alignItems: "center",
    justifyContent: "center",
  },
  delinkButtonText: {
    color: "#FFF",
    fontWeight: "700",
    fontSize: typography.body,
  },
});
