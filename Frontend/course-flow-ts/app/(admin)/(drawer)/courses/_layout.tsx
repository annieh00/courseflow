// app/(admin)/courses/_layout.tsx
import { Stack } from "expo-router";
import { DrawerToggleButton } from "@react-navigation/drawer";
import { useTheme } from "../../../../components/ThemeContext";

export default function CoursesLayout() {
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
      {/* Root list: opened when you tap Courses in the drawer */}
      <Stack.Screen
        name="index"
        options={{
          title: "Manage Courses",
          headerLeft: () => (
            <DrawerToggleButton tintColor={theme.background} />
          ),
        }}
      />

      {/* Detail: Edit course – back arrow only */}
      <Stack.Screen
        name="course-edit"
        options={{
          title: "Edit Course",
        }}
      />
    </Stack>
  );
}
