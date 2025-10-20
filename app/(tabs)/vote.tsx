import React, { useState } from "react";
import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function VoteScreen() {
    const [selected, setSelected] = useState<string | null>(null);

  const handleVote = (choice: string) => {
    setSelected(choice);
  };

  const submitVote = () => {
    if (!selected) {
      Alert.alert("Error", "Please select a candidate before submitting your vote.");
      return;
    }
    Alert.alert("Vote Submitted", `You voted for: ${selected}`);
    // You can call your backend API here, e.g.:
    // await axios.post("http://yourapi/vote", { choice: selected })
  };

  return (
    <View style={styles.container}>
      <View style={styles.box}>
        <Text style={styles.title}>Vote for Your Candidate</Text>

        <TouchableOpacity
          style={[
            styles.option,
            selected === "Candidate A" && styles.selectedOption,
          ]}
          onPress={() => handleVote("Candidate A")}
        >
          <Text
            style={[
              styles.optionText,
              selected === "Candidate A" && styles.selectedOptionText,
            ]}
          >
            Candidate A
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.option,
            selected === "Candidate B" && styles.selectedOption,
          ]}
          onPress={() => handleVote("Candidate B")}
        >
          <Text
            style={[
              styles.optionText,
              selected === "Candidate B" && styles.selectedOptionText,
            ]}
          >
            Candidate B
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={submitVote}>
          <Text style={styles.buttonText}>Submit Vote</Text>
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
    width: "80%",
    padding: 25,
    borderWidth: 2,
    borderColor: "#333",
    borderRadius: 5,
    backgroundColor: "#efdadaff",
    alignItems: "center",
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 25,
    color: "#222",
  },
  option: {
    width: "100%",
    paddingVertical: 12,
    borderWidth: 1.5,
    borderColor: "#666",
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 12,
  },
  selectedOption: {
    backgroundColor: "#333",
    borderColor: "#333",
  },
  optionText: {
    fontSize: 18,
    color: "#333",
  },
  selectedOptionText: {
    color: "#FFF",
    fontWeight: "600",
  },
  button: {
    marginTop: 15,
    backgroundColor: "#3ce61eff",
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 25,
  },
  buttonText: {
    color: "#0d0909ff",
    fontSize: 18,
    fontWeight: "600",
  },
});