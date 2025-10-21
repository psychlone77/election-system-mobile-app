import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import React, { useEffect, useState } from "react";
import { Platform, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import "react-native-get-random-values";

export default function HomeScreen() {
  const router = useRouter();
  const [isRegistered, setIsRegistered] = useState<boolean | null>(null);

  useEffect(() => {
    checkRegistrationStatus();
  }, []);

  const checkRegistrationStatus = async () => {
    try {
      let nic: string | null = null;

      if (Platform.OS === "web") {
        nic = localStorage.getItem("userNIC");
      } else {
        nic = await SecureStore.getItemAsync("userNIC");
      }

      setIsRegistered(!!nic);
    } catch (error) {
      console.error("Error checking registration:", error);
      setIsRegistered(false);
    }
  };

  const handleStartVoting = () => {
    if (isRegistered) {
      router.replace("/login");
    } else {
      router.replace("/register");
    }
  };

  return (
    <View style={styles.screen}>
      <View style={styles.container}>
        <Text style={styles.heading}>Welcome to eVoting</Text>
        <Text style={styles.subheading}>Secure, simple and modern voting</Text>

        <View style={styles.cardRow}>
          <TouchableOpacity style={styles.card} onPress={handleStartVoting}>
            <MaterialIcons name="how-to-vote" size={36} color="#6E49FF" />
            <Text style={styles.cardTitle}>{isRegistered ? "Vote" : "Register"}</Text>
            <Text style={styles.cardBody}>
              {isRegistered
                ? "Cast your vote quickly and securely."
                : "Create your account to start voting."}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#F6F5FF", alignItems: "center", justifyContent: "center" },
  container: { width: "90%", maxWidth: 800, alignItems: "center" },
  heading: { fontSize: 34, fontWeight: "700", color: "#2B0638", marginBottom: 6 },
  subheading: { color: "#5B3E8A", marginBottom: 20 },
  cardRow: { flexDirection: "row", justifyContent: "space-between", width: "100%" },
  card: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    marginHorizontal: 8,
    padding: 18,
    borderRadius: 14,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 20,
    elevation: 6,
    alignItems: "center",
  },
  cardTitle: { marginTop: 8, fontSize: 18, fontWeight: "700", color: "#2B0638" },
  cardBody: { marginTop: 6, textAlign: "center", color: "#6B5B8A" },
});
