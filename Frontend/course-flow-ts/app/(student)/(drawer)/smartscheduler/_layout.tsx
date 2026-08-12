import { Stack } from "expo-router";
import { DrawerToggleButton } from "@react-navigation/drawer";
import { useTheme } from "../../../../components/ThemeContext";

export default function SmartSchedulerLayout() {
  const { theme } = useTheme();

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: theme.primary },
        headerTintColor: theme.background,
        headerTitleStyle: { fontWeight: "bold", color: theme.background },
        headerLeft: () => <DrawerToggleButton tintColor={theme.background} />,
      }}
    >
      <Stack.Screen name="smartscheduler" options={{ title: "Smart Scheduler" }} />
    </Stack>
  );
}
