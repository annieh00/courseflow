import React, { useEffect, useState } from "react";
import {
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  View,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import * as Google from "expo-auth-session/providers/google";
import * as AuthSession from "expo-auth-session"; // 🚨 Added AuthSession import
import { ResponseType } from "expo-auth-session";
import { useAuth } from "../auth/AuthContext";
import type { Role } from "../auth/types";

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  const router = useRouter();
  const { googleLogin, isAuthenticated, user, accessToken } = useAuth();

  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [error, setError] = useState("");

  // 🚨 Force the Web redirect to go directly to the login page
  const redirectUri = Platform.OS === "web"
      ? `${window.location.origin}/login`
      : AuthSession.makeRedirectUri();

  const [request, response, promptAsync] = Google.useAuthRequest({
    androidClientId: "YOUR_ANDROID_CLIENT_ID.apps.googleusercontent.com",
    iosClientId: "YOUR_IOS_CLIENT_ID.apps.googleusercontent.com",
    webClientId:
        "907276194504-ggddfq06rhkjd5ioago3ojiuuj2gctqu.apps.googleusercontent.com",
    responseType: ResponseType.Code,
    shouldAutoExchangeCode: false,
    usePKCE: false,
    redirectUri: redirectUri, // 🚨 Pass the redirectUri here
  });

  const routeByRole = (role: Role | undefined) => {
    console.log("🚀 routeByRole called with:", role);

    const normalizedRole = role?.toLowerCase();

    switch (normalizedRole) {
      case "advisor":
        console.log("→ Navigating to advisor dashboard");
        router.replace("/(advisor)/(drawer)");
        break;

      case "admin":
        console.log("→ Navigating to admin dashboard");
        router.replace("/(admin)/(drawer)");
        break;

      case "student":
      default:
        console.log("→ Navigating to student dashboard");
        router.replace("/(student)/(drawer)");
        break;
    }
  };

  useEffect(() => {
    if (response?.type === "success") {
      const { code } = response.params;
      console.log("✅ Google auth successful");
      console.log("Auth code received:", code);
      if (code) {
        handleGoogleSignIn(code);
      }
    } else if (response?.type === "error") {
      console.error("❌ Google auth error:", response);
      setError("Google authentication failed. Please try again.");
    }
  }, [response]);

  const handleGoogleSignIn = async (code: string) => {
    setError("");
    setIsLoggingIn(true);

    try {
      const platform = Platform.OS === "web" ? "web" : "mobile";
      console.log("🔐 Sending login request with platform:", platform);

      const result = await googleLogin(code, platform);
      console.log("📦 Login result received:", result);
      console.log("  - Success:", result.success);
      console.log("  - Message:", result.message);
      console.log("  - Role:", result.role);

      if (result.success) {
        console.log("✅ Login successful! Routing to:", result.role);
        routeByRole(result.role);
      } else {
        console.error("❌ Login failed:", result.message);
        setError(result.message);
      }
    } catch (e: any) {
      console.error("❌ Login exception:", e);
      setError(e.message ?? "Login failed. Please try again.");
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
      <SafeAreaView style={styles.container}>
        <View style={styles.main}>
          <Text style={styles.title}>Course Flow</Text>
          <Text style={styles.subtitle}>Iowa State University</Text>

          {error ? (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
          ) : null}

          <TouchableOpacity
              style={[styles.googleButton, isLoggingIn && styles.buttonDisabled]}
              disabled={!request || isLoggingIn}
              onPress={() => promptAsync()}
          >
            {isLoggingIn ? (
                <ActivityIndicator color="white" />
            ) : (
                <Text style={styles.googleButtonText}>Sign in with Google</Text>
            )}
          </TouchableOpacity>

          <Text style={styles.helperText}>
            Use your @iastate.edu email to sign in.
          </Text>
        </View>
      </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5" },
  main: {
    flex: 1,
    padding: 32,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 36,
    marginBottom: 8,
    fontWeight: "bold",
    textAlign: "center",
    color: "#C8102E",
  },
  subtitle: {
    fontSize: 18,
    marginBottom: 48,
    textAlign: "center",
    color: "#666",
  },
  errorContainer: {
    backgroundColor: "#FFE5E5",
    borderColor: "#E03C31",
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
    width: "100%",
    alignItems: "center",
  },
  errorText: {
    color: "#E03C31",
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
  },
  googleButton: {
    backgroundColor: "#E03C31",
    padding: 20,
    borderRadius: 12,
    width: "100%",
    alignItems: "center",
    marginTop: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  buttonDisabled: { opacity: 0.6 },
  googleButtonText: { color: "white", fontSize: 18, fontWeight: "bold" },
  helperText: { marginTop: 20, color: "#888" },
});