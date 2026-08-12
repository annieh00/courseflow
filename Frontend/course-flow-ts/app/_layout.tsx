// app/_layout.tsx
import { Stack, useRouter, usePathname, useSegments } from "expo-router";
import { useEffect, useState, useLayoutEffect } from "react";
import { ActivityIndicator, View } from "react-native";
import { AuthProvider, useAuth } from "../auth/AuthContext";
import type { Role } from "../auth/types";

import { ThemeProvider } from "../components/ThemeContext";

import { DegreeProvider } from "../auth/DegreeContext";

function getRoleBaseRoute(role: Role | undefined): string {
  const normalizedRole = role?.toLowerCase();

  switch (normalizedRole) {
    case "advisor":
      return "/(advisor)/(drawer)";

    case "admin":
      return "/(admin)/(drawer)";

    case "student":
    default:
      return "/(student)/(drawer)";
  }
}

const Spinner = () => (
  <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#fff" }}>
    <ActivityIndicator size="large" color="#C8102E" />
  </View>
);

function RouteGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const segments = useSegments();
  const pathname = usePathname();

  const { isAuthenticated, isLoading, isOnboarded, user } = useAuth();

  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const firstSegment = segments[0];
  const inAuthGroup =
    firstSegment === "login" || pathname === "/login";
  const inOnboarding =
    firstSegment === "onboarding" || pathname === "/onboarding";

  // Derive the role group segment ("(student)", "(admin)", "(advisor)") the
  // current user SHOULD be in so we can detect when they land in the wrong one.
  const expectedGroup = user?.role
    ? getRoleBaseRoute(user.role).replace(/^\//, "").split("/")[0]
    : null; // e.g. "(student)", "(admin)", "(advisor)"

  const inWrongRoleGroup =
    isAuthenticated &&
    isOnboarded &&
    expectedGroup !== null &&
    !inAuthGroup &&
    !inOnboarding &&
    firstSegment !== undefined &&
    firstSegment !== expectedGroup &&
    ["(student)", "(admin)", "(advisor)"].includes(firstSegment as string);

  useEffect(() => {
    if (isLoading || !isMounted) return;

    if (isAuthenticated) {
      if (!isOnboarded) {
        if (!inOnboarding) {
          router.replace("/onboarding");
        }
      } else {
        if (inAuthGroup || inOnboarding || inWrongRoleGroup) {
          router.replace(getRoleBaseRoute(user?.role));
        }
      }
    } else {
      if (!inAuthGroup && !inOnboarding) {
        router.replace("/login");
      }
    }
  }, [
    isAuthenticated,
    isLoading,
    isOnboarded,
    inAuthGroup,
    inOnboarding,
    inWrongRoleGroup,
    isMounted,
    user?.role,
    router,
  ]);

  // Show spinner while auth state is still loading
  if (isLoading || !isMounted) return <Spinner />;

  // Block protected routes from rendering before the redirect fires:
  // - unauthenticated users on protected routes
  // - authenticated users in the wrong role group (prevents admin flash for students)
  if (!isAuthenticated && !inAuthGroup && !inOnboarding) return <Spinner />;
  if (inWrongRoleGroup) return <Spinner />;

  return <>{children}</>;
}

export default function RootLayout() {
  // Prevent flashing of protected routes on web by replacing a stored
  // admin/advisor/student path with `/login` synchronously before paint
  // if there is no saved access token in `localStorage`.
  useLayoutEffect(() => {
    try {
      if (typeof window === "undefined") return;
      const path = window.location.pathname || "/";
      const hasToken = Boolean(window.localStorage.getItem("accessToken"));

      // Quick check for the grouped routes used by the app
      const isProtectedPath = path.startsWith("/(admin)") || path.startsWith("/(advisor)") || path.startsWith("/(student)");

      if (isProtectedPath && !hasToken) {
        // Replace history so the browser doesn't briefly render the protected route
        window.history.replaceState({}, "", "/login");
      }
    } catch (e) {
      // ignore errors during early hydration
    }
  }, []);
  return (
      <AuthProvider>
        <DegreeProvider>
          <ThemeProvider>
            <RouteGuard>
              <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name="(student)" options={{ headerShown: false }} />
                <Stack.Screen name="(advisor)" options={{ headerShown: false }} />
                <Stack.Screen name="(admin)" options={{ headerShown: false }} />
                <Stack.Screen name="login" />
                <Stack.Screen
                    name="onboarding"
                    options={{ gestureEnabled: false }}
                />
              </Stack>
            </RouteGuard>
          </ThemeProvider>
        </DegreeProvider>
      </AuthProvider>
  );
}