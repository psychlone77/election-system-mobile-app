import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import "react-native-get-random-values";

export default function HomeScreen() {
  const router = useRouter();

  return (
    <View style={styles.screen}>
      <View style={styles.container}>
        <Text style={styles.heading}>Welcome</Text>
        <Text style={styles.subheading}>Secure, simple and modern voting</Text>

        <View style={styles.cardRow}>
          <TouchableOpacity style={styles.card} onPress={() => router.push("/login")}>
            <MaterialIcons name="how-to-vote" size={36} color="#6E49FF" />
            <Text style={styles.cardTitle}>Vote</Text>
            <Text style={styles.cardBody}>Cast your vote quickly and securely.</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.card} onPress={() => router.push("/check")}>
            <MaterialIcons name="search" size={36} color="#6E49FF" />
            <Text style={styles.cardTitle}>Verify</Text>
            <Text style={styles.cardBody}>Check your registration and eligibility.</Text>
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
