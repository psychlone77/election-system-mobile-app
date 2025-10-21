import theme from "@/constants/theme";
import "@/utils/crypto-polyfill";
import { DefaultTheme, ThemeProvider } from "@react-navigation/native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { View } from "react-native";
import "react-native-reanimated";
import Toast from "react-native-toast-message";
import PolyfillCrypto from "react-native-webview-crypto";

export const unstable_settings = {
  anchor: "(tabs)",
};

export default function RootLayout() {
  const { colors } = theme;

  return (
    <ThemeProvider value={DefaultTheme}>
      <Stack>
        <Stack.Screen
          name="(tabs)"
          options={{
            headerTitle: "Election System",
            headerBackground: () => <View style={{ backgroundColor: colors.background }} />,
          }}
        />
      </Stack>
      <StatusBar style="auto" />
      <PolyfillCrypto />
      <Toast />
    </ThemeProvider>
  );
}
