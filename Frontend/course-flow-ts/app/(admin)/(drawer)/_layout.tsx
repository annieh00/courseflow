// app/(admin)/(drawer)/_layout.tsx
import React from "react";
import { Drawer } from "expo-router/drawer";
import Ionicons from "@expo/vector-icons/Ionicons";
import CustomDrawerContent from "../../../components/CustomDrawer";
import { ThemeProvider, useTheme } from "../../../components/ThemeContext";

function AdminDrawerContent() {
  const { theme } = useTheme();

  return (
    <Drawer
      screenOptions={{
        drawerLabelStyle: { marginLeft: -20 },
        drawerActiveBackgroundColor: theme.primary,
        drawerInactiveTintColor: theme.textSecondary,
        drawerActiveTintColor: theme.background,
        headerStyle: { backgroundColor: theme.primary },
        headerTintColor: theme.background,
        headerTitleStyle: { fontWeight: "bold", color: theme.background },
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
            <Ionicons name="home" size={size} color={color} style={{ marginRight: 18 }} />
          ),
        }}
      />

      {/* Users = nested stack, so hide drawer header */}
<Drawer.Screen
  name="users"
  options={{
    headerShown: false,          // important so only the stack header shows
    drawerLabel: "Users",
    title: "Manage Users",
    drawerIcon: ({ size, color }) => (
      <Ionicons
        name="people-outline"
        size={size}
        color={color}
        style={{ marginRight: 18 }}
      />
    ),
  }}
/>

      {/* Courses (CRUD) */}
      <Drawer.Screen
        name="courses"
        options={{
          headerShown: false,
          drawerLabel: "Courses",
          title: "Manage Courses",
          drawerIcon: ({ size, color }) => (
            <Ionicons
              name="book-outline"
              size={size}
              color={color}
              style={{ marginRight: 18 }}
            />
          ),
        }}
      />

      {/* Students */}
      <Drawer.Screen
        name="students"
        options={{
          drawerLabel: "Students",
          title: "Students",
          drawerIcon: ({ size, color }) => (
            <Ionicons name="person-circle-outline" size={size} color={color} style={{ marginRight: 18 }} />
          ),
        }}
      />

      {/* Admin approval */}
      <Drawer.Screen
        name="admin-approval"
        options={{
          drawerLabel: "Admin Approvals",
          title: "Admin Approvals",
          drawerIcon: ({ size, color }) => (
            <Ionicons
              name="shield-checkmark-outline"
              size={size}
              color={color}
              style={{ marginRight: 18 }}
            />
          ),
        }}
      />

      {/* Advisor approval */}
      <Drawer.Screen
        name="advisor-approval"
        options={{
          drawerLabel: "Advisor Approvals",
          title: "Advisor Approvals",
          drawerIcon: ({ size, color }) => (
            <Ionicons
              name="school-outline"
              size={size}
              color={color}
              style={{ marginRight: 18 }}
            />
          ),
        }}
      />

      {/* Settings */}
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
