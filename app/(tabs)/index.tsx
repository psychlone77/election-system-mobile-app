import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from "expo-router";
import { Alert, ImageBackground, StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function HomeScreen() {
  const router = useRouter();

  const handleRate = () => {
    Alert.alert("Action", "You chose: I want vote");
    router.push("/login");
  };

  const handleVerify = () => {
    Alert.alert("Action", "You chose: I want verify");
    router.push("/check");
  };

  return (
    <ImageBackground
      source={require("@/assets/images/vote.jpg")} // 👈 Place your image in assets/images/bg.jpg
      style={styles.background}
      resizeMode="cover"
    >
      <View style={styles.overlay}>
        <View style={styles.box}>
          <TouchableOpacity style={styles.button} onPress={handleRate}>
            <Text style={styles.buttonText}>
              <MaterialIcons name="how-to-vote" size={30} color="#0c0808ff" />  I want vote
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.button} onPress={handleVerify}>
            <Text style={styles.buttonText}>
              <MaterialIcons name="safety-check" size={30} color="#0c0808ff" />  I want verify
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.4)", // dark overlay for better contrast
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
  },
  box: {
    width: "80%",
    padding: 25,
    borderRadius: 10,
    backgroundColor: "rgba(100, 152, 174, 0.8)",
    alignItems: "center",
  },
  button: {
    width: "100%",
    paddingVertical: 15,
    backgroundColor: "rgba(107, 99, 133, 0.9)",
    borderRadius: 8,
    marginVertical: 10,
    alignItems: "center",
  },
  buttonText: {
    color: "#0c0808ff",
    fontSize: 22,
    fontWeight: "600",
    textAlign: "center",
  },
});
