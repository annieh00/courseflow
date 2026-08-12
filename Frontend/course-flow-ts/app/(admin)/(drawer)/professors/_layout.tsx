import React from "react";
import { Drawer } from "expo-router/drawer";
import Ionicons from "@expo/vector-icons/Ionicons";
import CustomDrawerContent from "../../../../components/CustomDrawer";
import { ThemeProvider, useTheme } from "../../../../components/ThemeContext";

function AdminDrawerContent() {
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

      <Drawer.Screen
        name="scheduler"
        options={{
          drawerLabel: "Smart Scheduler",
          title: "Smart Scheduler",
          drawerIcon: ({ size, color }) => (
            <Ionicons
              name="cube-outline"
              size={size}
              color={color}
              style={{ marginRight: 18 }}
            />
          ),
        }}
      />

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

      <Drawer.Screen
        name="profile"
        options={{
          drawerLabel: "Profile",
          title: "Profile",
          drawerIcon: ({ size, color }) => (
            <Ionicons
              name="person-outline"
              size={size}
              color={color}
              style={{ marginRight: 18 }}
            />
          ),
        }}
      />

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

      <Drawer.Screen
        name="professors/professor-details"
        options={{
          headerShown: true,
          drawerItemStyle: { display: "none" },
          drawerLabel: () => null,
          title: "Professor Details",
        }}
      />
    </Drawer>
  );
}

export default function AdminAppLayout() {
  return (
    <ThemeProvider>
      <AdminDrawerContent />
    </ThemeProvider>
  );
}
