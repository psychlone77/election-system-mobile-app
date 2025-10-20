import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

export interface BiometricData {
  pinHash: string;
  pinSalt: string;
  biometricEnabled: boolean;
  createdAt: number;
}

/**
 * Simple hash function for PIN (using base64 for web/native compatibility)
 */
const simpleHash = (input: string): string => {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(16);
};

/**
 * Hash a PIN with salt
 */
export const hashPIN = (pin: string, salt: string): string => {
  return simpleHash(pin + salt);
};

/**
 * Generate a random salt for PIN hashing
 */
export const generateSalt = (): string => {
  return Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
};

/**
 * Store PIN for user
 */
export const storePIN = async (userNIC: string, pin: string): Promise<void> => {
  const salt = generateSalt();
  const pinHash = hashPIN(pin, salt);

  const biometricData: BiometricData = {
    pinHash,
    pinSalt: salt,
    biometricEnabled: false,
    createdAt: Date.now(),
  };

  const keyName = `biometric_${userNIC}`;
  const dataStr = JSON.stringify(biometricData);

  if (Platform.OS === "web") {
    localStorage.setItem(keyName, dataStr);
  } else {
    await SecureStore.setItemAsync(keyName, dataStr, {
      keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    });
  }
};

/**
 * Verify PIN for user
 */
export const verifyPIN = async (userNIC: string, pin: string): Promise<boolean> => {
  const keyName = `biometric_${userNIC}`;

  try {
    let dataStr: string | null = null;

    if (Platform.OS === "web") {
      dataStr = localStorage.getItem(keyName);
    } else {
      dataStr = await SecureStore.getItemAsync(keyName);
    }

    if (!dataStr) {
      return false;
    }

    const biometricData: BiometricData = JSON.parse(dataStr);
    const pinHash = hashPIN(pin, biometricData.pinSalt);

    return pinHash === biometricData.pinHash;
  } catch (error) {
    console.error("Error verifying PIN:", error);
    return false;
  }
};

/**
 * Check if biometric is available
 */
export const isBiometricAvailable = async (): Promise<boolean> => {
  if (Platform.OS === "web") {
    return false;
  }

  try {
    // Dynamic import to avoid import errors if package not available
    const { hasHardwareAsync, isEnrolledAsync } = await import("expo-local-authentication");
    const compatible = await hasHardwareAsync();
    const enrolled = await isEnrolledAsync();
    return compatible && enrolled;
  } catch (error) {
    console.error("Error checking biometric availability:", error);
    return false;
  }
};

/**
 * Enable biometric for user
 */
export const enableBiometric = async (userNIC: string): Promise<void> => {
  if (Platform.OS === "web") {
    throw new Error("Biometric not available on web");
  }

  const keyName = `biometric_${userNIC}`;

  try {
    let dataStr = await SecureStore.getItemAsync(keyName);
    if (!dataStr) {
      throw new Error("Biometric data not found");
    }

    const biometricData: BiometricData = JSON.parse(dataStr);
    biometricData.biometricEnabled = true;

    await SecureStore.setItemAsync(keyName, JSON.stringify(biometricData), {
      keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    });
  } catch (error) {
    console.error("Error enabling biometric:", error);
    throw error;
  }
};

/**
 * Authenticate using biometric
 */
export const authenticateWithBiometric = async (userNIC: string): Promise<boolean> => {
  if (Platform.OS === "web") {
    return false;
  }

  try {
    // Dynamic import to avoid import errors if package not available
    const { authenticateAsync } = await import("expo-local-authentication");
    const result = await authenticateAsync({
      disableDeviceFallback: false,
    });

    return result.success;
  } catch (error) {
    console.error("Error authenticating with biometric:", error);
    return false;
  }
};

/**
 * Get biometric status for user
 */
export const getBiometricStatus = async (userNIC: string): Promise<BiometricData | null> => {
  const keyName = `biometric_${userNIC}`;

  try {
    let dataStr: string | null = null;

    if (Platform.OS === "web") {
      dataStr = localStorage.getItem(keyName);
    } else {
      dataStr = await SecureStore.getItemAsync(keyName);
    }

    if (!dataStr) {
      return null;
    }

    return JSON.parse(dataStr);
  } catch (error) {
    console.error("Error getting biometric status:", error);
    return null;
  }
};
