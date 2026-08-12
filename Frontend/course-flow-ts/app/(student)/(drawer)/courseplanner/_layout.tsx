import { Stack } from "expo-router";
import { DrawerToggleButton } from "@react-navigation/drawer";
import { useTheme } from "../../../../components/ThemeContext";

export default function CoursePlannerLayout() {
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
      <Stack.Screen name="courseplanner" options={{ title: "Course Planner" }} />
    </Stack>
  );
}
