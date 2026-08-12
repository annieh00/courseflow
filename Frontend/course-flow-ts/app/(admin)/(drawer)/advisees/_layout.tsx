import { Stack } from "expo-router";
import { DrawerToggleButton } from "@react-navigation/drawer";
import { useTheme } from "../../../../components/ThemeContext";

export default function AdviseesLayout() {
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
      {/* Root list: shows hamburger */}
      <Stack.Screen
        name="index"
        options={{
          title: "My Advisees",
          headerLeft: () => (
            <DrawerToggleButton tintColor={theme.background} />
          ),
        }}
      />

      {/* Detail: shows back arrow */}
      <Stack.Screen
        name="advisee-details"
        options={{
          title: "Advisee Details",
        }}
      />
    </Stack>
  );
}
