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

/**
 * Ballot Server axios instance (separate from Election Server)
 * Uses EXPO_PUBLIC_BBS_URL for baseURL
 */
const ballotServerInstance: AxiosInstance = axios.create({
  baseURL: process.env.EXPO_PUBLIC_BBS_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Response interceptor for ballot server (same error handling)
ballotServerInstance.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (!error.response) {
      Toast.show({
        type: "error",
        text1: "Network Error",
        text2: "Unable to connect to ballot server. Please check your internet connection.",
      });
      return Promise.reject(error);
    }

    console.error("Ballot Server Error:", error.response.data);
    const status = error.response.status;
    const data = error.response.data as any;

    let errorMessage = data?.message || "An error occurred";

    switch (status) {
      case 400:
        errorMessage = data?.message || "Invalid ballot. Please check your input.";
        break;
      case 401:
        errorMessage = data?.message || "Unauthorized. Please authenticate again.";
        break;
      case 403:
        errorMessage = data?.message || "Ballot submission not allowed.";
        break;
      case 404:
        errorMessage = data?.message || "Ballot server not found.";
        break;
      case 500:
        errorMessage = "Ballot server error. Please try again later.";
        break;
      case 503:
        errorMessage = "Ballot server temporarily unavailable. Please try again later.";
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

const tallyingServerInstance: AxiosInstance = axios.create({
  baseURL: process.env.EXPO_PUBLIC_TS_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

tallyingServerInstance.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (!error.response) {
      Toast.show({
        type: "error",
        text1: "Network Error",
        text2: "Unable to connect to tallying server. Please check your internet connection.",
      });
      return Promise.reject(error);
    }

    console.error("Tallying Server Error:", error.response.data);
    const status = error.response.status;
    const data = error.response.data as any;

    let errorMessage = data?.message || "An error occurred";

    switch (status) {
      case 400:
        errorMessage = data?.message || "Invalid request. Please check your input.";
        break;
      case 401:
        errorMessage = data?.message || "Unauthorized. Please authenticate again.";
        break;
      case 403:
        errorMessage = data?.message || "Access denied to tallying server.";
        break;
      case 404:
        errorMessage = data?.message || "Tallying server not found.";
        break;
      case 500:
        errorMessage = "Tallying server error. Please try again later.";
        break;
      case 503:
        errorMessage = "Tallying server temporarily unavailable. Please try again later.";
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
export { ballotServerInstance, tallyingServerInstance };
