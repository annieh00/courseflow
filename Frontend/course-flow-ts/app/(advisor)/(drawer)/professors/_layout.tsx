// app/(drawer)/professors/_layout.tsx
import { Stack } from "expo-router";
import { DrawerToggleButton } from "@react-navigation/drawer";
import { useTheme } from "../../../../components/ThemeContext";
import PieChart from "../../../../components/PieChart";
import ProgressBar from "../../../../components/ProgressBar";
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
      {/* Root list screen: show hamburger */}
      <Stack.Screen
        name="index"
        options={{
          title: "Rate my Professor",
          headerLeft: () => (
            <DrawerToggleButton tintColor={theme.background} />
          ),
        }}
      />

      {/* Detail screen: keep the default back arrow */}
      <Stack.Screen
        name="professor-details"
        options={{ title: "Professor Details" }}
      />
    </Stack>
  );
}
