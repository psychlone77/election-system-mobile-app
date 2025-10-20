import { useRouter } from "expo-router";
import React, { useRef, useState } from "react";
import {
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function LoginScreen() {
  const router = useRouter();
  const [NIC, setNIC] = useState("");
  const [code, setCode] = useState(Array(8).fill("")); // 8 boxes
  const inputs = useRef([]);

  const handleChange = (text, index) => {
    if (/^\d*$/.test(text)) {
      const newCode = [...code];
      newCode[index] = text.slice(-1); // only 1 digit
      setCode(newCode);

      if (text && index < 7) {
        inputs.current[index + 1].focus();
      }
    }
  };

  const handleLogin = async () => {
  const registration_code = code.join(""); // combine 8-digit code array into a string
  const public_key = "12234556";

  if (!NIC || registration_code.length !== 8) {
    Alert.alert("Error", "Please enter both ID and 8-digit Initialization Code.");
    return;
  }

  try {
    const response = await fetch("https://crypto-es-server.loca.lt/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        NIC,
        registration_code,
        public_key,
      }),
    });

    if (!response.ok) {
      throw new Error(`Server responded with ${response.status}`);
    }

    const data = await response.json();
    // Example: data = { success: true, message: "Welcome admin" }

    if (data.success) {
      Alert.alert("Login Successful", data.message || `Welcome ${NIC}!`);
      router.push("/vote"); // ✅ navigate only if login is successful
    } else {
      Alert.alert("Login Failed", data.message || "Invalid credentials. Try again.");
    }
  } catch (error) {
    console.error(error);
    Alert.alert("Error", "Unable to connect to the server. Please try again later.");
  }
};


  return (
    <View style={styles.container}>
      <View style={styles.box}>
        <Text style={styles.title}>Login</Text>
        <Text style={styles.label}>National ID Number</Text>
        <TextInput
          placeholder="Enter your National ID"
          style={styles.input}
          value={NIC}
          onChangeText={setNIC}
        />

        <Text style={styles.label}>Initialization Code</Text>
        <View style={styles.codeContainer}>
          {code.map((digit, index) => (
            <TextInput
              key={index}
              ref={(el) => (inputs.current[index] = el)}
              style={styles.codeBox}
              keyboardType="number-pad"
              maxLength={1}
              value={digit}
              onChangeText={(text) => handleChange(text, index)}
              onKeyPress={({ nativeEvent }) => {
                if (
                  nativeEvent.key === "Backspace" &&
                  !code[index] &&
                  index > 0
                ) {
                  inputs.current[index - 1].focus();
                }
              }}
            />
          ))}
        </View>

        <TouchableOpacity style={styles.button} onPress={handleLogin}>
          <Text style={styles.buttonText}>Login</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#93d1b2ff",
  },
  box: {
    width: "85%",
    padding: 25,
    borderWidth: 2,
    borderColor: "#333",
    borderRadius: 5,
    backgroundColor: "#efdadaff",
    alignItems: "center",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 25,
    color: "#222",
  },
  input: {
    width: "100%",
    height: 45,
    borderWidth: 1,
    borderColor: "#888",
    borderRadius: 8,
    paddingHorizontal: 10,
    marginBottom: 15,
    fontSize: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    alignSelf: "flex-start",
    marginBottom: 10,
  },
  codeContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginBottom: 20,
  },
  codeBox: {
    width: 30,
    height: 30,
    borderWidth: 1.5,
    borderColor: "#333",
    borderRadius: 8,
    textAlign: "center",
    fontSize: 20,
    fontWeight: "bold",
    color: "#000",
  },
  button: {
    width: "100%",
    height: 45,
    backgroundColor: "#e81c33ff",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
  },
  buttonText: {
    color: "#FFF",
    fontSize: 18,
    fontWeight: "600",
  },
});
