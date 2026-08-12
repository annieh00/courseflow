import React from "react";
import { Drawer } from "expo-router/drawer";
import Ionicons from "@expo/vector-icons/Ionicons";
import CustomDrawerContent from "../../../components/CustomDrawer";
import { ThemeProvider, useTheme } from "../../../components/ThemeContext";

function AdvisorDrawerContent() {
  const { theme } = useTheme();

  return (
    <Drawer
      screenOptions={{
        drawerLabelStyle: { marginLeft: -20 },
        drawerActiveBackgroundColor: theme.primary,
        drawerInactiveTintColor: theme.textSecondary,
        drawerActiveTintColor: theme.background,

        headerStyle: {
          backgroundColor: theme.primary,
        },
        headerTintColor: theme.background,
        headerTitleStyle: {
          fontWeight: "bold",
          color: theme.background,
        },
      }}
      drawerContent={(props) => <CustomDrawerContent {...props} />}
    >
      {/* Dashboard */}
      <Drawer.Screen
        name="index"
        options={{
          drawerLabel: "Dashboard",
          title: "Dashboard",
          drawerIcon: ({ size, color }) => (
            <Ionicons
              name="home"
              size={size}
              color={color}
              style={{ marginRight: 18 }}
            />
          ),
        }}
      />

      {/* Advisees list */}
<Drawer.Screen
  name="advisees"
  options={{
    headerShown: false,
    drawerLabel: "Advisees",
    title: "Advisees",
    drawerIcon: ({ size, color }) => (
      <Ionicons
        name="people-outline"
        size={size}
        color={color}
        style={{ marginRight: 18 }}
      />
    ),
  }}
  listeners={({ navigation }) => ({
    drawerItemPress: (e) => {
      // ❌ don't let the default behavior run
      e.preventDefault();

      // ✅ always go to the list screen of the nested Advisees stack
      navigation.navigate("advisees", {
        screen: "index", // this is your advisees list screen
      });
    },
  })}
/>



      {/* Plan review */}
      <Drawer.Screen
        name="plans"
        options={{
          drawerLabel: "Plan Review",
          title: "Plan Review",
          drawerIcon: ({ size, color }) => (
            <Ionicons
              name="document-text-outline"
              size={size}
              color={color}
              style={{ marginRight: 18 }}
            />
          ),
        }}
      />

      {/* Schedule */}
      <Drawer.Screen
        name="schedule"
        options={{
          drawerLabel: "Schedule",
          title: "Advising Schedule",
          drawerIcon: ({ size, color }) => (
            <Ionicons
              name="calendar-outline"
              size={size}
              color={color}
              style={{ marginRight: 18 }}
            />
          ),
        }}
      />

      {/* Settings – reuse your existing advisor settings.tsx */}
      <Drawer.Screen
        name="settings"
        options={{
          drawerLabel: "Settings",
          title: "Settings",
          drawerIcon: ({ size, color }) => (
            <Ionicons
              name="settings-outline"
              size={size}
              color={color}
              style={{ marginRight: 18 }}
            />
          ),
        }}
      />

      {/* Optional: keep RMP here too */}
      <Drawer.Screen
        name="professors"
        options={{
          headerShown: false,
          drawerLabel: "Rate my Professor",
          title: "Rate my Professor",
          drawerIcon: ({ size, color }) => (
            <Ionicons
              name="stats-chart"
              size={size}
              color={color}
              style={{ marginRight: 18 }}
            />
          ),
        }}
      />

      {/* Detail screen – hidden from drawer, but navigable from Advisees/Plans */}
      {/* <Drawer.Screen
        name="advisee-details"
        options={{
          headerShown: true,
          drawerItemStyle: { display: "none" },
          drawerLabel: () => null,
          title: "Advisee Plan",
        }}
      /> */}
    </Drawer>
  );
}

export default function AdvisorAppLayout() {
  return (
    <ThemeProvider>
      <AdvisorDrawerContent />
    </ThemeProvider>
  );
}
