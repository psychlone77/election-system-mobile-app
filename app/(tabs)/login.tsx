import theme from "@/constants/theme";
import { authenticateWithBiometric, getBiometricStatus, verifyPIN } from "@/utils/biometric";
import { showErrorToast, showSuccessToast } from "@/utils/toast";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function LoginScreen() {
  const router = useRouter();
  const [userNIC, setUserNIC] = useState<string>("");
  const [pin, setPin] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [biometricEnabled, setBiometricEnabled] = useState<boolean>(false);

  // Load user NIC and biometric status on mount
  useEffect(() => {
    const loadUserData = async () => {
      try {
        let nic: string | null = null;

        if (Platform.OS === "web") {
          nic = localStorage.getItem("userNIC");
        } else {
          nic = await SecureStore.getItemAsync("userNIC");
        }

        if (nic) {
          setUserNIC(nic);

          // Check if biometric is enabled
          const bioStatus = await getBiometricStatus(nic);
          if (bioStatus?.biometricEnabled) {
            setBiometricEnabled(true);
          }
        }
      } catch (error) {
        console.error("Error loading user data:", error);
      }
    };

    loadUserData();
  }, []);

  const handleLogin = async () => {
    if (!pin) {
      showErrorToast("PIN Required", "Please enter your PIN");
      return;
    }

    if (!userNIC) {
      showErrorToast("No User Found", "Please register first");
      return;
    }

    setIsLoading(true);

    try {
      const isValid = await verifyPIN(userNIC, pin);

      if (isValid) {
        showSuccessToast("Login Successful", `Welcome back ${userNIC}!`);
        setTimeout(() => {
          router.push("/dashboard");
        }, 500);
      } else {
        showErrorToast("Invalid PIN", "Please enter the correct PIN");
      }
    } catch (error) {
      console.error("Login error:", error);
      showErrorToast("Login Error", "An error occurred during login");
    } finally {
      setIsLoading(false);
    }
  };

  const handleBiometricLogin = async () => {
    if (!userNIC) {
      showErrorToast("No User Found", "Please register first");
      return;
    }

    setIsLoading(true);

    try {
      const success = await authenticateWithBiometric(userNIC);

      if (success) {
        showSuccessToast("Login Successful", `Welcome back ${userNIC}!`);
        setTimeout(() => {
          router.replace("/dashboard");
        }, 500);
      } else {
        showErrorToast("Authentication Failed", "Biometric authentication failed");
      }
    } catch (error) {
      console.error("Biometric error:", error);
      showErrorToast("Biometric Error", "An error occurred during authentication");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Login</Text>

        {userNIC && (
          <View style={styles.userInfo}>
            <Text style={styles.userLabel}>User: {userNIC}</Text>
          </View>
        )}

        <Text style={styles.label}>PIN</Text>
        <TextInput
          placeholder="Enter your PIN"
          style={styles.input}
          value={pin}
          onChangeText={setPin}
          secureTextEntry
          keyboardType="numeric"
          maxLength={6}
          editable={!isLoading}
        />

        <TouchableOpacity
          style={[styles.button, isLoading && styles.buttonDisabled]}
          onPress={handleLogin}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.buttonText}>Login with PIN</Text>
          )}
        </TouchableOpacity>

        {biometricEnabled && (
          <>
            <View style={styles.divider} />
            <TouchableOpacity
              style={[styles.biometricButton, isLoading && styles.buttonDisabled]}
              onPress={handleBiometricLogin}
              disabled={isLoading}
            >
              <MaterialIcons name="fingerprint" size={24} color="#6E49FF" />
              <Text style={styles.biometricButtonText}>Login with Biometric</Text>
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
    marginBottom: spacing.lg,
    color: colors.purple900,
    alignSelf: "flex-start",
  },
  userInfo: {
    width: "100%",
    backgroundColor: colors.inputBg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.input,
    marginBottom: spacing.md,
  },
  userLabel: {
    fontSize: typography.body,
    fontWeight: "600",
    color: colors.purple900,
  },
  label: {
    fontSize: typography.label,
    fontWeight: "600",
    color: colors.purple900,
    alignSelf: "flex-start",
    marginBottom: spacing.sm,
  },
  input: {
    width: "100%",
    height: 44,
    backgroundColor: colors.inputBg,
    borderWidth: 1,
    borderColor: colors.neutralMuted,
    borderRadius: radius.input,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
    fontSize: typography.body,
    color: colors.purple900,
    textAlign: "center",
    letterSpacing: 2,
    fontWeight: "600",
  },
  button: {
    width: "100%",
    height: 44,
    backgroundColor: colors.primary,
    borderRadius: radius.button,
    justifyContent: "center",
    alignItems: "center",
    marginTop: spacing.md,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: "#FFF",
    fontSize: typography.body,
    fontWeight: "700",
  },
  divider: {
    height: 1,
    backgroundColor: colors.neutralMuted,
    width: "100%",
    marginVertical: spacing.md,
  },
  biometricButton: {
    width: "100%",
    height: 44,
    backgroundColor: colors.inputBg,
    borderWidth: 2,
    borderColor: colors.primary,
    borderRadius: radius.button,
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
  },
  biometricButtonText: {
    color: colors.primary,
    fontSize: typography.body,
    fontWeight: "700",
  },
});
