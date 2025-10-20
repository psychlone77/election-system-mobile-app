import theme from "@/constants/theme";
import axiosInstance from "@/services/api";
import { showErrorToast, showSuccessToast } from "@/utils/toast";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import nacl from "tweetnacl";
import { encodeBase64 } from "tweetnacl-util";

export default function LoginScreen() {
  const router = useRouter();
  const [NIC, setNIC] = useState<string>("");
  // registration code stored as single formatted string: "XXXX-XXXX-XXXX"
  const [code, setCode] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const formatCode = (raw: string) => {
    const clean = raw
      .replace(/[^A-Za-z0-9]/g, "")
      .toUpperCase()
      .slice(0, 12);
    const parts: string[] = [];
    for (let i = 0; i < clean.length; i += 4) parts.push(clean.slice(i, i + 4));
    return parts.join("-");
  };

  const handleCodeChange = (text: string) => {
    setCode(formatCode(text));
  };

  const handleLogin = async () => {
    console.log("Attempting login with NIC:", NIC);
    // registration_code is already formatted by handleCodeChange to XXXX-XXXX-XXXX
    const registration_code = code;

    // NIC regex provided by user (fixed minor [0,9] -> [0-9])
    const nicRegex =
      /^(([5,6,7,8,9]{1})([0-9]{1})([0,1,2,3,5,6,7,8]{1})([0-9]{6})([vVxX]))|(([1,2]{1})([0-9]{1})([0-9]{2})([0,1,2,3,5,6,7,8]{1})([0-9]{7}))$/;
    const nicValid = nicRegex.test(NIC);
    // allow uppercase letters and digits in each group
    const regCodeValid = /^[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(registration_code);

    if (!nicValid) {
      showErrorToast("Invalid NIC", "Please enter a valid National ID Number");
      return;
    }

    if (!regCodeValid) {
      showErrorToast(
        "Invalid Registration Code",
        "Registration code must be in the form XXXX-XXXX-XXXX (12 digits with dashes)."
      );
      return;
    }

    setIsLoading(true);

    try {
      // Generate ed25519 keypair
      const keyPair = nacl.sign.keyPair(); // ed25519
      const publicKeyBase64 = encodeBase64(keyPair.publicKey);
      const privateKeyBase64 = encodeBase64(keyPair.secretKey);

      // Prepare payload
      const payload = {
        NIC,
        registration_code,
        public_key: publicKeyBase64,
      };
      console.log("Login payload:", payload);
      console.log("ES_URL:", process.env.EXPO_PUBLIC_ES_URL);

      // Use axios for the request
      const response = await axiosInstance.post("/register", payload);

      if (response.data.success) {
        // Store private key securely. Use expo-secure-store on native; on web fallback to localStorage (with warning).
        const keyName = `privateKey_${NIC}`;
        if (Platform.OS === "web") {
          // Not secure: only fallback. Warn the user.
          localStorage.setItem(keyName, privateKeyBase64);
        } else {
          await SecureStore.setItemAsync(keyName, privateKeyBase64, {
            keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
          });
        }

        showSuccessToast("Login Successful", response.data.message || `Welcome ${NIC}!`);
        // Navigate after a short delay to allow toast to display
        setTimeout(() => {
          router.push("/vote");
        }, 500);
      } else {
        console.error("Login failed:", response.data);
        showErrorToast("Login Failed", response.data.message || "Invalid credentials. Try again.");
      }
    } catch (err) {
      console.error("Login error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Login</Text>
        <Text style={styles.label}>National ID Number</Text>
        <TextInput
          placeholder="Enter your National ID"
          style={styles.input}
          value={NIC}
          onChangeText={setNIC}
        />

        <Text style={styles.label}>Initialization Code</Text>
        <TextInput
          placeholder="XXXX-XXXX-XXXX"
          style={[styles.input, styles.singleCodeInput]}
          value={code}
          onChangeText={handleCodeChange}
          maxLength={14}
          autoCapitalize="characters"
          autoCorrect={false}
          keyboardType={Platform.OS === "web" ? "default" : "default"}
        />

        <TouchableOpacity
          style={[styles.button, isLoading && styles.buttonDisabled]}
          onPress={handleLogin}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.buttonText}>Login</Text>
          )}
        </TouchableOpacity>
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
    backgroundColor: colors.background, // #F7F5FF
  },
  card: {
    width: "90%",
    padding: spacing.lg, // 24
    borderRadius: radius.card, // 16
    backgroundColor: colors.surface, // #FFFFFF
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
    alignItems: "center",
  },
  title: {
    fontSize: typography.h2, // 22
    fontWeight: "700",
    marginBottom: spacing.lg, // 24
    color: colors.purple900, // #2B0638
    alignSelf: "flex-start",
  },
  label: {
    fontSize: typography.label, // 14
    fontWeight: "600",
    color: colors.purple900,
    alignSelf: "flex-start",
    marginBottom: spacing.sm, // 8
  },
  input: {
    width: "100%",
    height: 44,
    backgroundColor: colors.inputBg, // #FBFAFF
    borderWidth: 1,
    borderColor: colors.neutralMuted, // #E9E6F7
    borderRadius: radius.input, // 12
    paddingHorizontal: spacing.md, // 12
    marginBottom: spacing.md, // 12
    fontSize: typography.body, // 16
    color: colors.purple900,
  },
  singleCodeInput: {
    textAlign: "center",
    letterSpacing: 3,
    fontWeight: "600",
  },
  button: {
    width: "100%",
    height: 44,
    backgroundColor: colors.primary, // #6E49FF
    borderRadius: radius.button, // 12
    justifyContent: "center",
    alignItems: "center",
    marginTop: spacing.md, // 12
  },
  buttonDisabled: {
    backgroundColor: colors.primary + "99", // Add transparency when disabled
    opacity: 0.6,
  },
  buttonText: {
    color: "#FFF",
    fontSize: typography.body, // 16
    fontWeight: "700",
  },
});
