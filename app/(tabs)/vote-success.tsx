import theme from "@/constants/theme";
import { MaterialIcons } from "@expo/vector-icons";
import * as Linking from "expo-linking";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

interface BallotData {
  success: boolean;
  message: string;
  ballotId: string;
  ciphertext: string;
  hash: string;
}

interface SecureStoreData {
  token?: string;
  signature?: string;
  nic?: string;
  [key: string]: string | undefined;
}

export default function VoteSuccessScreen() {
  const router = useRouter();
  const [ballotData, setBallotData] = useState<BallotData | null>(null);
  const [secureStoreData, setSecureStoreData] = useState<SecureStoreData>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        // Load secure store data
        const ballotDataStr = await SecureStore.getItemAsync("ballot");
        if (ballotDataStr) {
          const data = JSON.parse(ballotDataStr);
          console.log("Loaded ballot data:", data);
          setBallotData(data);
        }
        const token = await SecureStore.getItemAsync("token");
        const signature = await SecureStore.getItemAsync("signature");
        const nic = await SecureStore.getItemAsync("nic");

        setSecureStoreData({
          token: token || undefined,
          signature: signature || undefined,
          nic: nic || undefined,
        });
      } catch (error) {
        console.error("Failed to load data:", error);
        Alert.alert("Error", "Failed to load submission details");
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  const handleVerifyBallot = () => {
    if (!ballotData?.ballotId) {
      Alert.alert("Error", "Ballot ID is missing");
      return;
    }

    const bulletinUrl = process.env.EXPO_PUBLIC_BULLETIN_URL;
    if (!bulletinUrl) {
      Alert.alert("Error", "Bulletin URL is not configured");
      return;
    }

    const verificationUrl = `${bulletinUrl}?ballot_id=${ballotData.ballotId}`;
    console.log("Opening verification URL:", verificationUrl);

    // For web, open in browser. For native, use WebView or linking
    if (Platform.OS === "web") {
      window.open(verificationUrl, "_blank");
    } else {
      Linking.openURL(verificationUrl);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      // @ts-ignore - React Native doesn't have native clipboard export by default
      if (typeof window === "undefined" && global.navigator?.clipboard) {
        await (global.navigator.clipboard as any).writeText(text);
        Alert.alert("Success", "Verification link copied to clipboard");
      }
    } catch (error) {
      console.error("Failed to copy:", error);
      Alert.alert("Error", "Failed to copy link");
    }
  };

  const handleBackToDashboard = () => {
    router.replace("/dashboard");
  };

  const DataField = ({ label, value }: { label: string; value?: string }) => (
    <View style={styles.dataField}>
      <Text style={styles.dataLabel}>{label}</Text>
      <Text style={styles.dataValue} selectable numberOfLines={3}>
        {value || "N/A"}
      </Text>
    </View>
  );

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Loading details...</Text>
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Success Header */}
      <View style={styles.successCard}>
        <View style={styles.successIconContainer}>
          <MaterialIcons name="check-circle" size={64} color={theme.colors.primary} />
        </View>
        <Text style={styles.successTitle}>Vote Submitted Successfully!</Text>
        <Text style={styles.successMessage}>
          {ballotData?.message || "Your vote has been securely recorded."}
        </Text>
      </View>

      {/* Ballot Submission Details */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Submission Details</Text>
        <View style={styles.detailsBox}>
          <DataField label="Ballot ID" value={ballotData?.ballotId} />
          <View style={styles.divider} />
          <DataField label="Status" value={ballotData?.success ? "Confirmed" : "Pending"} />
        </View>
      </View>

      {/* Ballot Hash & Ciphertext */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Ballot Encryption</Text>
        <View style={styles.detailsBox}>
          <DataField
            label="Ballot Hash (SHA-256)"
            value={ballotData?.hash ? ballotData.hash.substring(0, 64) : undefined}
          />
          <View style={styles.divider} />
          <DataField
            label="Encrypted Ballot"
            value={
              ballotData?.ciphertext ? ballotData.ciphertext.substring(0, 64) + "..." : undefined
            }
          />
        </View>
      </View>

      {/* Stored Credentials */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Stored Credentials (Local)</Text>
        <View style={styles.detailsBox}>
          <DataField
            label="Token (Prepared Message)"
            value={
              secureStoreData.token ? secureStoreData.token.substring(0, 40) + "..." : "Not stored"
            }
          />
          <View style={styles.divider} />
          <DataField
            label="Signature"
            value={
              secureStoreData.signature
                ? secureStoreData.signature.substring(0, 40) + "..."
                : "Not stored"
            }
          />
          <View style={styles.divider} />
          <DataField label="NIC" value={secureStoreData.nic || "Not stored"} />
        </View>
      </View>

      {/* Verify Ballot Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Verify Your Ballot</Text>
        <Text style={styles.verifyDescription}>
          You can verify your ballot on the public bulletin board using your ballot ID.
        </Text>
        <TouchableOpacity style={styles.verifyButton} onPress={handleVerifyBallot}>
          <MaterialIcons name="open-in-browser" size={20} color="#FFF" />
          <Text style={styles.verifyButtonText}>View on Bulletin Board</Text>
        </TouchableOpacity>

        {process.env.EXPO_PUBLIC_BULLETIN_URL && (
          <Text style={styles.bulletinUrl}>
            URL: {process.env.EXPO_PUBLIC_BULLETIN_URL}?ballot_id={ballotData?.ballotId}
          </Text>
        )}
      </View>

      {/* Back to Dashboard Button */}
      <TouchableOpacity style={styles.backButton} onPress={handleBackToDashboard}>
        <MaterialIcons name="home" size={20} color={theme.colors.primary} />
        <Text style={styles.backButtonText}>Back to Dashboard</Text>
      </TouchableOpacity>

      <View style={styles.spacing} />
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
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: spacing.md,
  },
  loadingText: {
    fontSize: typography.body,
    color: colors.purple900,
  },
  successCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    padding: spacing.lg,
    alignItems: "center",
    marginBottom: spacing.lg,
    borderWidth: 2,
    borderColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  successIconContainer: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: "#F0E6FF",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  successTitle: {
    fontSize: typography.h2,
    fontWeight: "700",
    color: colors.primary,
    marginBottom: spacing.sm,
    textAlign: "center",
  },
  successMessage: {
    fontSize: typography.body,
    color: "#666",
    textAlign: "center",
    lineHeight: 22,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: typography.label,
    fontWeight: "700",
    color: colors.purple900,
    marginBottom: spacing.md,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  detailsBox: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.inputBg,
  },
  dataField: {
    paddingVertical: spacing.md,
  },
  dataLabel: {
    fontSize: typography.label,
    fontWeight: "600",
    color: colors.primary,
    marginBottom: spacing.xs,
    textTransform: "uppercase",
  },
  dataValue: {
    fontSize: typography.body,
    color: colors.purple900,
    lineHeight: 22,
    fontFamily: "monospace",
  },
  divider: {
    height: 1,
    backgroundColor: colors.inputBg,
    marginVertical: spacing.md,
  },
  verifyDescription: {
    fontSize: typography.body,
    color: "#666",
    marginBottom: spacing.md,
    lineHeight: 22,
  },
  verifyButton: {
    backgroundColor: colors.primary,
    borderRadius: radius.button,
    padding: spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.md,
    marginBottom: spacing.md,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  verifyButtonText: {
    color: "#FFF",
    fontSize: typography.body,
    fontWeight: "700",
  },
  bulletinUrl: {
    fontSize: typography.xsmall,
    color: "#999",
    textAlign: "center",
    fontFamily: "monospace",
    lineHeight: 16,
    paddingHorizontal: spacing.md,
  },
  backButton: {
    backgroundColor: colors.inputBg,
    borderRadius: radius.button,
    padding: spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.md,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  backButtonText: {
    color: colors.primary,
    fontSize: typography.body,
    fontWeight: "700",
  },
  spacing: {
    height: spacing.lg,
  },
});
