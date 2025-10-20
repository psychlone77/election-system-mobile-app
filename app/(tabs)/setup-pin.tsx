import theme from "@/constants/theme";
import { enableBiometric, isBiometricAvailable, storePIN } from "@/utils/biometric";
import { showErrorToast, showSuccessToast } from "@/utils/toast";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function SetupPinScreen() {
  const router = useRouter();
  const [pin, setPin] = useState<string>("");
  const [confirmPin, setConfirmPin] = useState<string>("");
  const [step, setStep] = useState<"setup" | "confirm" | "biometric">("setup");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isBiometricAvailableValue, setIsBiometricAvailableValue] = useState<boolean>(false);
  const [userNIC, setUserNIC] = useState<string>("");

  const loadUserNIC = useCallback(async () => {
    try {
      let nic: string | null = null;

      if (Platform.OS === "web") {
        nic = localStorage.getItem("userNIC");
      } else {
        nic = await SecureStore.getItemAsync("userNIC");
      }

      if (!nic) {
        showErrorToast("Error", "User NIC not found. Please register again.");
        router.push("/register");
      } else {
        setUserNIC(nic);
      }
    } catch (error) {
      console.error("Error loading NIC:", error);
      router.push("/register");
    }
  }, [router]);

  useEffect(() => {
    loadUserNIC();
    checkBiometricAvailability();
  }, [loadUserNIC]);

  const checkBiometricAvailability = async () => {
    const available = await isBiometricAvailable();
    setIsBiometricAvailableValue(available);
  };

  const handleSetupPIN = () => {
    if (!pin || pin.length < 4) {
      showErrorToast("Invalid PIN", "PIN must be at least 4 digits");
      return;
    }

    if (pin.length > 6) {
      showErrorToast("Invalid PIN", "PIN must be at most 6 digits");
      return;
    }

    setStep("confirm");
    setPin(pin);
  };

  const handleConfirmPIN = () => {
    if (confirmPin !== pin) {
      showErrorToast("PIN Mismatch", "PINs do not match. Please try again.");
      setConfirmPin("");
      setStep("setup");
      return;
    }

    if (isBiometricAvailableValue) {
      setStep("biometric");
    } else {
      savePINAndProceed(false);
    }
  };

  const savePINAndProceed = async (enableBio: boolean) => {
    setIsLoading(true);

    try {
      await storePIN(userNIC, pin);

      if (enableBio && isBiometricAvailableValue) {
        await enableBiometric(userNIC);
        showSuccessToast("Success", "PIN and biometric enabled!");
      } else {
        showSuccessToast("Success", "PIN setup complete!");
      }

      setTimeout(() => {
        router.replace("/dashboard");
      }, 500);
    } catch (error) {
      console.error("Error saving PIN:", error);
      showErrorToast("Error", "Failed to save PIN. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        {step === "setup" && (
          <>
            <Text style={styles.title}>Create Your PIN</Text>
            <Text style={styles.subtitle}>Enter a 4-6 digit PIN to secure your account</Text>

            <Text style={styles.label}>PIN</Text>
            <TextInput
              placeholder="Enter PIN"
              style={styles.input}
              value={pin}
              onChangeText={setPin}
              secureTextEntry
              keyboardType="numeric"
              maxLength={6}
              editable={!isLoading}
            />

            <Text style={styles.hint}>Use numbers only. Must be 4-6 digits.</Text>

            <TouchableOpacity
              style={[styles.button, !pin && styles.buttonDisabled]}
              onPress={handleSetupPIN}
              disabled={!pin || isLoading}
            >
              <Text style={styles.buttonText}>Next</Text>
            </TouchableOpacity>
          </>
        )}

        {step === "confirm" && (
          <>
            <Text style={styles.title}>Confirm Your PIN</Text>
            <Text style={styles.subtitle}>Re-enter your PIN to confirm</Text>

            <Text style={styles.label}>Confirm PIN</Text>
            <TextInput
              placeholder="Confirm PIN"
              style={styles.input}
              value={confirmPin}
              onChangeText={setConfirmPin}
              secureTextEntry
              keyboardType="numeric"
              maxLength={6}
              editable={!isLoading}
            />

            <TouchableOpacity
              style={[styles.button, !confirmPin && styles.buttonDisabled]}
              onPress={handleConfirmPIN}
              disabled={!confirmPin || isLoading}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <Text style={styles.buttonText}>Confirm</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.backButton}
              onPress={() => {
                setStep("setup");
                setConfirmPin("");
              }}
              disabled={isLoading}
            >
              <Text style={styles.backButtonText}>Back</Text>
            </TouchableOpacity>
          </>
        )}

        {step === "biometric" && (
          <>
            <View style={styles.centerContent}>
              <MaterialIcons name="fingerprint" size={60} color={theme.colors.primary} />
            </View>

            <Text style={styles.title}>Enable Biometric?</Text>
            <Text style={styles.subtitle}>Use your fingerprint for faster and easier login</Text>

            <TouchableOpacity
              style={styles.button}
              onPress={() => savePINAndProceed(true)}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <Text style={styles.buttonText}>Enable Biometric</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => savePINAndProceed(false)}
              disabled={isLoading}
            >
              <Text style={styles.secondaryButtonText}>Skip for Now</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );
}

const { colors, spacing, radius, typography } = theme;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.background,
  },
  card: {
    width: "90%",
    padding: spacing.lg,
    borderRadius: radius.card,
    backgroundColor: colors.surface,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
    alignItems: "center",
  },
  title: {
    fontSize: typography.h2,
    fontWeight: "700",
    marginBottom: spacing.sm,
    color: colors.purple900,
    textAlign: "center",
  },
  subtitle: {
    fontSize: typography.body,
    color: "#666",
    textAlign: "center",
    marginBottom: spacing.lg,
  },
  label: {
    fontSize: typography.label,
    fontWeight: "600",
    color: colors.purple900,
    alignSelf: "flex-start",
    marginBottom: spacing.sm,
    marginTop: spacing.md,
  },
  input: {
    width: "100%",
    height: 44,
    backgroundColor: colors.inputBg,
    borderWidth: 1,
    borderColor: colors.neutralMuted,
    borderRadius: radius.input,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
    fontSize: typography.body,
    color: colors.purple900,
    textAlign: "center",
    letterSpacing: 4,
    fontWeight: "600",
  },
  hint: {
    fontSize: typography.label,
    color: "#999",
    marginBottom: spacing.md,
    alignSelf: "flex-start",
  },
  button: {
    width: "100%",
    height: 44,
    backgroundColor: colors.primary,
    borderRadius: radius.button,
    justifyContent: "center",
    alignItems: "center",
    marginTop: spacing.lg,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: "#FFF",
    fontSize: typography.body,
    fontWeight: "700",
  },
  backButton: {
    width: "100%",
    height: 44,
    backgroundColor: colors.inputBg,
    borderWidth: 1,
    borderColor: colors.neutralMuted,
    borderRadius: radius.button,
    justifyContent: "center",
    alignItems: "center",
    marginTop: spacing.md,
  },
  backButtonText: {
    color: colors.purple900,
    fontSize: typography.body,
    fontWeight: "700",
  },
  centerContent: {
    alignItems: "center",
    marginBottom: spacing.lg,
  },
  secondaryButton: {
    width: "100%",
    height: 44,
    backgroundColor: colors.inputBg,
    borderWidth: 1,
    borderColor: colors.neutralMuted,
    borderRadius: radius.button,
    justifyContent: "center",
    alignItems: "center",
    marginTop: spacing.md,
  },
  secondaryButtonText: {
    color: colors.purple900,
    fontSize: typography.body,
    fontWeight: "700",
  },
});
