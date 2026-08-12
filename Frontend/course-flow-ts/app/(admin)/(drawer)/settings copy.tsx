import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
} from "react-native";
import React, { useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../../components/ThemeContext";
import { useAuth } from "../../../auth/AuthContext";

export default function SettingsScreen() {
  // 👇 take both theme + isDarkMode from context
  const { theme, isDarkMode, toggleDarkMode } = useTheme();

  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [courseReminders, setCourseReminders] = useState(true);
  const [friendActivity, setFriendActivity] = useState(true);
  const [profileVisibility, setProfileVisibility] = useState(true);

  const SettingSection = ({
    title,
    children,
  }: {
    title: string;
    children: React.ReactNode;
  }) => (
    <View style={styles.section}>
      <Text
        style={[styles.sectionTitle, { color: theme.textSecondary }]}
      >
        {title}
      </Text>
      {children}
    </View>
  );

  const SettingRow = ({
    icon,
    label,
    value,
    onPress,
    showToggle,
    toggleValue,
    onToggle,
  }: {
    icon: string;
    label: string;
    value?: string;
    onPress?: () => void;
    showToggle?: boolean;
    toggleValue?: boolean;
    onToggle?: (value: boolean) => void;
  }) => (
    <TouchableOpacity
      style={[
        styles.settingRow,
        { backgroundColor: theme.card },
      ]}
      onPress={onPress}
      disabled={showToggle}
    >
      <View style={styles.settingLeft}>
        <Ionicons
          name={icon as any}
          size={22}
          color={theme.primary}
        />
        <Text style={[styles.settingLabel, { color: theme.text }]}>
          {label}
        </Text>
      </View>
      {showToggle ? (
        <Switch
          value={toggleValue}
          onValueChange={onToggle}
          trackColor={{ false: theme.border, true: theme.primary }}
          thumbColor={toggleValue ? "#fff" : "#f4f3f4"}
        />
      ) : (
        <View style={styles.settingRight}>
          {value && (
            <Text
              style={[
                styles.settingValue,
                { color: theme.textSecondary },
              ]}
            >
              {value}
            </Text>
          )}
          <Ionicons
            name="chevron-forward"
            size={20}
            color={theme.textSecondary}
          />
        </View>
      )}
    </TouchableOpacity>
  );

  const { user } = useAuth();

  const roleLabel =
    user?.role === "advisor"
      ? "Advisor"
      : user?.role === "admin"
      ? "Admin"
      : "Student";

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background }]}
    >
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: theme.text }]}>
          Settings
        </Text>
        <Text
          style={[styles.headerSubtitle, { color: theme.textSecondary }]}
        >
          Manage your CourseFlow preferences ({roleLabel})
        </Text>
      </View>

      <SettingSection title="APPEARANCE">
        <SettingRow
          icon="moon-outline"
          label="Dark Mode"
          showToggle
          toggleValue={isDarkMode}
          onToggle={toggleDarkMode}
        />
      </SettingSection>

      <SettingSection title="ACCOUNT">
        <SettingRow
          icon="person-outline"
          label="Profile Information"
          value="John Doe"
          onPress={() => {}}
        />
        <SettingRow
          icon="mail-outline"
          label="Email"
          value="jdoe@iastate.edu"
          onPress={() => {}}
        />
        <SettingRow
          icon="lock-closed-outline"
          label="Change Password"
          onPress={() => {}}
        />
      </SettingSection>

      <SettingSection title="NOTIFICATIONS">
        <SettingRow
          icon="notifications-outline"
          label="Push Notifications"
          showToggle
          toggleValue={notificationsEnabled}
          onToggle={setNotificationsEnabled}
        />
        <SettingRow
          icon="alarm-outline"
          label="Course Reminders"
          showToggle
          toggleValue={courseReminders}
          onToggle={setCourseReminders}
        />
        <SettingRow
          icon="people-outline"
          label="Friend Activity"
          showToggle
          toggleValue={friendActivity}
          onToggle={setFriendActivity}
        />
      </SettingSection>

      <SettingSection title="PRIVACY">
        <SettingRow
          icon="eye-outline"
          label="Profile Visibility"
          showToggle
          toggleValue={profileVisibility}
          onToggle={setProfileVisibility}
        />
        <SettingRow
          icon="shield-checkmark-outline"
          label="Data & Privacy"
          onPress={() => {}}
        />
      </SettingSection>

      <SettingSection title="SUPPORT">
        <SettingRow
          icon="help-circle-outline"
          label="Help Center"
          onPress={() => {}}
        />
        <SettingRow
          icon="chatbubble-outline"
          label="Contact Advisor"
          onPress={() => {}}
        />
        <SettingRow
          icon="document-text-outline"
          label="Terms of Service"
          onPress={() => {}}
        />
      </SettingSection>

      <SettingSection title="APP">
        <SettingRow
          icon="information-circle-outline"
          label="App Version"
          value="1.0.0"
        />
      </SettingSection>

      <TouchableOpacity
        style={[
          styles.logoutButton,
          {
            backgroundColor: theme.card,
            borderColor: theme.danger,
          },
        ]}
        onPress={() => {}}
      >
        <Ionicons
          name="log-out-outline"
          size={22}
          color={theme.danger}
        />
        <Text
          style={[styles.logoutText, { color: theme.danger }]}
        >
          Log Out
        </Text>
      </TouchableOpacity>

      <View style={styles.footer} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 20 },
  headerTitle: { fontSize: 34, fontWeight: "bold", marginBottom: 4 },
  headerSubtitle: { fontSize: 15 },
  section: { marginBottom: 32 },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "600",
    letterSpacing: 0.5,
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginHorizontal: 16,
    marginBottom: 1,
    borderRadius: 10,
  },
  settingLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  settingLabel: { fontSize: 16, marginLeft: 12 },
  settingRight: { flexDirection: "row", alignItems: "center" },
  settingValue: { fontSize: 15, marginRight: 8 },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 10,
    borderWidth: 1,
    marginTop: 8,
  },
  logoutText: { fontSize: 16, fontWeight: "600", marginLeft: 8 },
  footer: { height: 40 },
});
