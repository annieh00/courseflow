import React from "react";
import { Stack } from "expo-router";
import { useTheme } from "../../../components/ThemeContext";

export default function ProfessorsStackLayout() {
  const { theme } = useTheme();

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: theme.primary },
        headerTintColor: theme.background,
        headerTitleStyle: { fontWeight: "bold", color: theme.background },
        headerBackTitleVisible: false,
      }}
    >
      {/* index.tsx will render the list; title applies to that */}
      <Stack.Screen name="index" options={{ title: "Rate my Professor" }} />
      <Stack.Screen name="professor-details" options={{ title: "Professor Details" }} />
    </Stack>
  );
}
