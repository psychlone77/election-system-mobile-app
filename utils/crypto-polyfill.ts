import "react-native-get-random-values";

if (!(global as any).crypto) {
  // react-native-get-random-values installs getRandomValues on global; ensure container object exists
  (global as any).crypto = {
    getRandomValues:
      (global as any).crypto?.getRandomValues ??
      ((arr: Uint8Array) => {
        throw new Error(
          "crypto.getRandomValues is not available. Ensure 'react-native-get-random-values' is installed and imported before any crypto usage."
        );
      }),
  };
}
export {};
