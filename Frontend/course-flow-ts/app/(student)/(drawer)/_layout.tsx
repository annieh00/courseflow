import React from "react";
import { Drawer } from "expo-router/drawer";
import Ionicons from "@expo/vector-icons/Ionicons";
import CustomDrawerContent from "../../../components/CustomDrawer";
import { ThemeProvider, useTheme } from "../../../components/ThemeContext";

function StudentDrawerContent() {
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

      {/* Degree Chart */}
      <Drawer.Screen
        name="degreechart"
        options={{
          headerShown: false,
          drawerLabel: "Degree Chart",
          title: "Degree Chart",
          drawerIcon: ({ size, color }) => (
            <Ionicons name="school-outline" size={size} color={color} style={{ marginRight: 18 }} />
          ),
        }}
      />

      {/* Schedule */}
      <Drawer.Screen
        name="schedule"
        options={{
          drawerLabel: "Schedule",
          title: "Schedule",
          drawerIcon: ({ size, color }) => (
            <Ionicons name="calendar-outline" size={size} color={color} style={{ marginRight: 18 }} />
          ),
        }}
      />

      {/* Course Planner */}
      <Drawer.Screen
        name="courseplanner"
        options={{
          headerShown: false,
          drawerLabel: "Course Planner",
          title: "Course Planner",
          drawerIcon: ({ size, color }) => (
            <Ionicons name="list-outline" size={size} color={color} style={{ marginRight: 18 }} />
          ),
        }}
      />

      {/* Smart Scheduler */}
      <Drawer.Screen
        name="smartscheduler"
        options={{
          headerShown: false,
          drawerLabel: "Smart Scheduler",
          title: "Smart Scheduler",
          drawerIcon: ({ size, color }) => (
            <Ionicons name="calendar-number-outline" size={size} color={color} style={{ marginRight: 18 }} />
          ),
        }}
      />

      {/* Friends */}
      <Drawer.Screen
        name="friends"
        options={{
          drawerLabel: "Friends",
          title: "Friends",
          drawerIcon: ({ size, color }) => (
            <Ionicons name="people-outline" size={size} color={color} style={{ marginRight: 18 }} />
          ),
        }}
      />

      {/* Hidden Friend Profile */}
      <Drawer.Screen
        name="friend-profile"
        options={{
          drawerItemStyle: { display: "none" },
          drawerLabel: () => null,
          title: "Friend Profile",
        }}
      />

      {/* Professors */}
      <Drawer.Screen
        name="professors"
        options={{
          headerShown: false,
          drawerLabel: "Rate My Professor",
          title: "Rate My Professor",
          drawerIcon: ({ size, color }) => (
            <Ionicons name="stats-chart" size={size} color={color} style={{ marginRight: 18 }} />
          ),
        }}
      />




      {/* Trophy Room */}
      <Drawer.Screen
        name="trophyroom"
        options={{
          drawerLabel: "Trophy Room",
          title: "Trophy Room",
          drawerIcon: ({ size, color }) => (
            <Ionicons name="trophy-outline" size={size} color={color} style={{ marginRight: 18 }} />
          ),
        }}
      />

      {/* Profile */}
      <Drawer.Screen
        name="profile"
        options={{
          drawerLabel: "Profile",
          title: "Profile",
          headerStyle: {
            backgroundColor: "#A71930",
          },
          headerTintColor: "#fff",
          headerTitleStyle: {
            fontWeight: "bold",
            color: "#fff",
          },
          headerShadowVisible: false,
          drawerIcon: ({ size, color }) => (
            <Ionicons name="person-outline" size={size} color={color} style={{ marginRight: 18 }} />
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
                    <Ionicons name="settings-outline" size={size} color={color} style={{ marginRight: 18 }} />
                ),
            }}
        />

    </Drawer>
  );
}

export default function StudentAppLayout() {
  return (
    <ThemeProvider>
      <StudentDrawerContent />
    </ThemeProvider>
  );
}
