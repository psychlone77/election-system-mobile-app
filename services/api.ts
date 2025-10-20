import axios, { AxiosError, AxiosInstance } from "axios";
import Toast from "react-native-toast-message";

// Create axios instance with default config
const axiosInstance: AxiosInstance = axios.create({
  baseURL: process.env.EXPO_PUBLIC_ES_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Response interceptor for error handling
axiosInstance.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    // Handle network errors
    if (!error.response) {
      Toast.show({
        type: "error",
        text1: "Network Error",
        text2: "Unable to connect to the server. Please check your internet connection.",
      });
      return Promise.reject(error);
    }

    // Handle server errors
    console.error("API Error:", error.response.data);
    const status = error.response.status;
    const data = error.response.data as any;

    let errorMessage = data?.message || "An error occurred";

    switch (status) {
      case 400:
        errorMessage = data?.message || "Invalid request. Please check your input.";
        break;
      case 401:
        errorMessage = data?.message || "Invalid credentials. Please try again.";
        break;
      case 403:
        errorMessage = data?.message || "Access denied.";
        break;
      case 404:
        errorMessage = data?.message || "Server not found.";
        break;
      case 500:
        errorMessage = "Server error. Please try again later.";
        break;
      case 503:
        errorMessage = "Service temporarily unavailable. Please try again later.";
        break;
    }

    Toast.show({
      type: "error",
      text1: errorMessage,
      text2: `Error (${status})`,
    });

    return Promise.reject(error);
  }
);

export default axiosInstance;
