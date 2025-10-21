import theme from "@/constants/theme";
import { showSuccessToast } from "@/utils/toast";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

interface UserData {
  nic: string;
  registeredAt: number;
  biometricEnabled: boolean;
  lastLogin?: number;
}

export default function DashboardScreen() {
  const router = useRouter();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      let nic: string | null = null;

      if (Platform.OS === "web") {
        nic = localStorage.getItem("userNIC");
      } else {
        nic = await SecureStore.getItemAsync("userNIC");
      }

      if (nic) {
        // Load biometric data to get registration date
        const keyName = `biometric_${nic}`;
        let biometricData: any = null;

        if (Platform.OS === "web") {
          const dataStr = localStorage.getItem(keyName);
          biometricData = dataStr ? JSON.parse(dataStr) : null;
        } else {
          const dataStr = await SecureStore.getItemAsync(keyName);
          biometricData = dataStr ? JSON.parse(dataStr) : null;
        }

        setUserData({
          nic,
          registeredAt: biometricData?.createdAt || Date.now(),
          biometricEnabled: biometricData?.biometricEnabled || false,
          lastLogin: Date.now(),
        });
      }
    } catch (error) {
      console.error("Error loading user data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      // Clear all session data
      if (Platform.OS === "web") {
        localStorage.removeItem("userNIC");
      }
      // Keep the stored keys for next login, just log out

      showSuccessToast("Logged Out", "You have been successfully logged out");
      setTimeout(() => {
        router.replace("/login");
      }, 500);
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {userData && (
        <>
          {/* Profile Card */}
          <View style={styles.profileCard}>
            <View style={styles.profileHeader}>
              <MaterialIcons name="person-pin-circle" size={50} color={theme.colors.primary} />
              <View style={styles.profileInfo}>
                <Text style={styles.profileName}>Welcome</Text>
                <Text style={styles.profileNIC}>{userData.nic}</Text>
              </View>
            </View>

            <View style={styles.profileDetail}>
              <MaterialIcons name="verified" size={16} color="#4CAF50" />
              <Text style={styles.profileDetailText}>Registered and verified</Text>
            </View>

            <TouchableOpacity
              style={styles.seeMoreButton}
              onPress={() => router.push("/edit-profile")}
            >
              <Text style={styles.seeMoreButtonText}>See More Details</Text>
              <MaterialIcons name="arrow-forward" size={18} color={theme.colors.primary} />
            </TouchableOpacity>
          </View>

          {/* Start Voting Button */}
          <TouchableOpacity style={styles.startVotingButton} onPress={() => router.push("/vote")}>
            <MaterialIcons name="how-to-vote" size={28} color="#FFF" />
            <Text style={styles.startVotingText}>Start Voting</Text>
            <MaterialIcons name="arrow-forward" size={20} color="#FFF" />
          </TouchableOpacity>

          {/* Additional Info Section */}
          <View style={styles.infoSection}>
            <View style={styles.infoRow}>
              <View style={styles.infoBadge}>
                <MaterialIcons name="calendar-today" size={18} color={theme.colors.primary} />
                <View>
                  <Text style={styles.infoBadgeLabel}>Registered</Text>
                  <Text style={styles.infoBadgeValue}>
                    {new Date(userData.registeredAt).toLocaleDateString()}
                  </Text>
                </View>
              </View>
              <View style={styles.infoBadge}>
                <MaterialIcons name="login" size={18} color={theme.colors.primary} />
                <View>
                  <Text style={styles.infoBadgeLabel}>Last Login</Text>
                  <Text style={styles.infoBadgeValue}>Today</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Logout Button */}
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <MaterialIcons name="logout" size={20} color="#FFF" />
            <Text style={styles.logoutButtonText}>Logout</Text>
          </TouchableOpacity>
        </>
      )}

      {isLoading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      )}
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
  profileCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    padding: spacing.lg,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: spacing.lg,
  },
  profileHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.md,
    gap: spacing.md,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: typography.label,
    fontWeight: "600",
    color: colors.purple900,
  },
  profileNIC: {
    fontSize: typography.h2,
    fontWeight: "700",
    color: colors.primary,
    marginTop: spacing.xs,
  },
  profileDetail: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutralMuted,
    marginBottom: spacing.md,
  },
  profileDetailText: {
    fontSize: typography.body,
    color: "#4CAF50",
    fontWeight: "600",
  },
  seeMoreButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  seeMoreButtonText: {
    fontSize: typography.body,
    fontWeight: "600",
    color: colors.primary,
  },
  startVotingButton: {
    width: "100%",
    height: 56,
    backgroundColor: colors.primary,
    borderRadius: radius.button,
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.md,
    marginBottom: spacing.lg,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  startVotingText: {
    color: "#FFF",
    fontSize: typography.h2,
    fontWeight: "700",
  },
  infoSection: {
    marginBottom: spacing.lg,
  },
  infoRow: {
    flexDirection: "row",
    gap: spacing.md,
  },
  infoBadge: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    padding: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  infoBadgeLabel: {
    fontSize: typography.label,
    fontWeight: "600",
    color: colors.purple900,
  },
  infoBadgeValue: {
    fontSize: typography.body,
    color: "#666",
    fontWeight: "500",
    marginTop: spacing.xs,
  },
  logoutButton: {
    width: "100%",
    height: 44,
    backgroundColor: "#FF6B6B",
    borderRadius: radius.button,
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  logoutButtonText: {
    color: "#FFF",
    fontSize: typography.body,
    fontWeight: "700",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
