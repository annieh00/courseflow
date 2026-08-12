//_layout.tsx
import { Stack } from "expo-router";
import { DrawerToggleButton } from "@react-navigation/drawer";
import { useTheme } from "../../../../components/ThemeContext";

export default function UsersLayout() {
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
      {/* Root list: opened when you tap Users in the drawer */}
      <Stack.Screen
        name="index"
        options={{
          title: "Manage Users",
          headerLeft: () => (
            <DrawerToggleButton tintColor={theme.background} />
          ),
        }}
      />

      {/* Detail: Edit user – back arrow only */}
      <Stack.Screen
        name="user-edit"
        options={{
          title: "Edit User",
        }}
      />
    </Stack>
  );
}
