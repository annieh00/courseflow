import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { jwtDecode } from "jwt-decode";
import { authAPI } from "../services/api";
import { User } from "./types";
import type { Role } from "./types";

// Shape of a row from your `users` table
interface BackendUser {
  id: number;
  email: string;
  first_name: string | null;
  last_name: string | null;
  full_name: string;
  google_id: string;
  netid: string;
  role: "STUDENT" | "ADVISOR" | "ADMIN";
  is_onboarded: boolean;
  is_verified?: boolean | null;
  verification_code?: string | null;
}

// Auth response from backend / mock server
interface AuthResponse {
  success: boolean;
  message?: string;
  accessToken?: string;
  refreshToken?: string;
  user?: BackendUser;
}

interface AuthContextType {
    accessToken: string | null;
  isAuthenticated: boolean;
  user: User | null;
  isLoading: boolean;
  isOnboarded: boolean;
  googleLogin: (
    code: string,
    platform: "web" | "mobile"
  ) => Promise<{ success: boolean; message: string; role?: Role }>;
  completeOnboarding: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// 🔹 Map backend role string -> frontend Role once
const normalizeRole = (rawRole: string | null | undefined): Role => {
  if (!rawRole) return "student";
  const lower = rawRole.toLowerCase();
  if (lower === "advisor") return "advisor";
  if (lower === "admin") return "admin";
  return "student";
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isOnboarded, setIsOnboarded] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null); // Added for Option 1
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkExistingAuth();
  }, []);

  const validateToken = (token: string): boolean => {
    try {
      const decoded: any = jwtDecode(token);
      if (!decoded.exp) return true;
      return decoded.exp * 1000 > Date.now();
    } catch {
      return true;
    }
  };

  const checkExistingAuth = async () => {
    try {
      const token = await AsyncStorage.getItem("accessToken");
      const userDataRaw = await AsyncStorage.getItem("userData");
      const onboardStatus = await AsyncStorage.getItem("isOnboarded");

      if (token && userDataRaw) {
        if (validateToken(token)) {
          const parsed: User = JSON.parse(userDataRaw);
          const normalizedUser: User = {
            ...parsed,
            role: parsed.role ?? "student",
          };

          setIsAuthenticated(true);
          setUser(normalizedUser);
          setAccessToken(token); // Sync the token to state
          setIsOnboarded(onboardStatus === "true");
        } else {
          await logout();
        }
      }
    } catch (err) {
      console.error("Auth check error", err);
    } finally {
      setIsLoading(false);
    }
  };

  const googleLogin = async (
    code: string,
    platform: "web" | "mobile"
  ): Promise<{ success: boolean; message: string; role?: Role }> => {
    try {
      const deviceId =
        platform === "mobile"
          ? "device_" + Math.random().toString(36).substring(7)
          : undefined;

      const response = (await authAPI.loginWithGoogle({
        code,
        platform,
        deviceId,
      })) as any;

      const userData = response.data;
      const token = response.token ?? userData?.accessToken;


      if (!response.success || !userData || !token) {
        console.error("Missing required fields");
        throw new Error(response.message || "Google Login Failed");
      }

      const role = normalizeRole(userData.role);
      const onboarded = userData.onboarded ?? false;

      // Persist to Storage
      await AsyncStorage.setItem("accessToken", token);
      await AsyncStorage.setItem("isOnboarded", String(onboarded));

      // Build frontend User object
      const newUser: User = {
        userId: userData.netId || userData.netid,
        email: userData.email,
        name: userData.name || userData.firstName,
        attributes: {
          backendId: userData.id,
        },
        bio: "",
        major: "",
        photoURL: "",
        role,
      };

      await AsyncStorage.setItem("userData", JSON.stringify(newUser));

      // Update State
      setUser(newUser);
      setAccessToken(token); // Update the token state!
      setIsOnboarded(onboarded);
      setIsAuthenticated(true);

      console.log("Access token set in state:", token);

      return { success: true, message: "Login Successful", role };
    } catch (error: any) {
      console.error("Login error:", error);
      let errorMessage = error.message || "Login Failed";
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      return { success: false, message: errorMessage };
    }
  };

  const completeOnboarding = async () => {
    await AsyncStorage.setItem("isOnboarded", "true");
    setIsOnboarded(true);
  };

  const logout = async () => {
    try {
      await AsyncStorage.clear();
      setUser(null);
      setAccessToken(null); // Clear the token on logout
      setIsAuthenticated(false);
      setIsOnboarded(false);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <AuthContext.Provider
      value={{
          accessToken,
        isAuthenticated,
        user,
        isLoading,
        isOnboarded,
        googleLogin,
        completeOnboarding,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
