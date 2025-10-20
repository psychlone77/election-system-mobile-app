import React, { useState } from "react";
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

export default function CheckScreen() {
const [code, setCode] = useState("");

  const handleSend = () => {
    if (!code.trim()) {
      Alert.alert("Error", "Please paste your verification code.");
      return;
    }
    Alert.alert("Verification Sent", `Code: ${code}`);
  };

  return (
    <View style={styles.container}>
      <View style={styles.box}>
        <Text style={styles.title}>Paste your verification</Text>

        <TextInput
          style={styles.input}
          placeholder="Enter verification code"
          value={code}
          onChangeText={setCode}
        />

        <TouchableOpacity style={styles.button} onPress={handleSend}>
          <Text style={styles.buttonText}>Send</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#93d1b2ff",
    justifyContent: "center",
    alignItems: "center",
  },
  box: {
    width: "80%",
    padding: 25,
    borderWidth: 2,
    borderColor: "#333",
    borderRadius: 5,
    backgroundColor: "#efdadaff",
    alignItems: "center",
  },
  title: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 20,
    color: "#222",
  },
  input: {
    width: "100%",
    height: 45,
    borderWidth: 1,
    borderColor: "#888",
    borderRadius: 8,
    paddingHorizontal: 10,
    fontSize: 16,
    marginBottom: 20,
  },
  button: {
    backgroundColor: "#e81c33ff",
    paddingVertical: 10,
    paddingHorizontal: 25,
    borderRadius: 8,
  },
  buttonText: {
    color: "#FFF",
    fontSize: 18,
    fontWeight: "600",
  },
});