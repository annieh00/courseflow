//user-edit.tsx
import React, { useState } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator, ScrollView,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useTheme } from "../../../../components/ThemeContext";
import api from "../../../../services/api";

type Role = "STUDENT" | "ADVISOR" | "ADMIN";

const ROLES: Role[] = ["STUDENT", "ADVISOR", "ADMIN"];

const ROLE_COLOR: Record<Role, string> = {
  STUDENT: "#3B82F6",
  ADVISOR: "#8B5CF6",
  ADMIN: "#DC2626",
};

const ROLE_ICON: Record<Role, keyof typeof Ionicons.glyphMap> = {
  STUDENT: "person-outline",
  ADVISOR: "school-outline",
  ADMIN: "shield-checkmark-outline",
};

export default function UserEditScreen() {
  const { id, netid, email, accountLevel, fullName } = useLocalSearchParams<{
    id?: string;
    netid?: string;
    email?: string;
    accountLevel?: string;
    fullName?: string;
  }>();
  const { theme } = useTheme();
  const router = useRouter();

  const [selectedRole, setSelectedRole] = useState<Role>((accountLevel as Role) ?? "STUDENT");
  const [saving, setSaving] = useState(false);

  const displayName = fullName || netid || "Unknown User";
  const initials = displayName.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
  const roleColor = ROLE_COLOR[selectedRole];

  const handleSave = async () => {
    if (!id) return;
    if (selectedRole === accountLevel) {
      router.back();
      return;
    }
    try {
      setSaving(true);
      await api.patch(`/admin/users/${id}/role`, null, { params: { role: selectedRole } });
      Alert.alert("Saved", `${displayName}'s role updated to ${selectedRole}.`, [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (err) {
      Alert.alert("Error", "Failed to update role. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (!id) {
    return (
      <View style={[styles.center, { backgroundColor: theme.background }]}>
        <Text style={{ color: theme.text }}>No user selected.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]} contentContainerStyle={styles.content}>

      {/* User identity card */}
      <View style={[styles.identityCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <View style={[styles.avatar, { backgroundColor: `${roleColor}18` }]}>
          <Text style={[styles.avatarText, { color: roleColor }]}>{initials}</Text>
        </View>
        <View style={styles.identityInfo}>
          <Text style={[styles.identityName, { color: theme.text }]}>{displayName}</Text>
          <Text style={[styles.identityMeta, { color: theme.textSecondary }]}>{netid}</Text>
          <Text style={[styles.identityMeta, { color: theme.textSecondary }]}>{email}</Text>
        </View>
      </View>

      {/* Role section */}
      <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>ACCOUNT ROLE</Text>
      <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
        {ROLES.map((role, i) => {
          const selected = selectedRole === role;
          const color = ROLE_COLOR[role];
          return (
            <TouchableOpacity
              key={role}
              onPress={() => setSelectedRole(role)}
              activeOpacity={0.7}
              style={[
                styles.roleRow,
                i < ROLES.length - 1 && { borderBottomWidth: 1, borderBottomColor: theme.border },
                selected && { backgroundColor: `${color}08` },
              ]}
            >
              <View style={[styles.roleIconWrap, { backgroundColor: `${color}18` }]}>
                <Ionicons name={ROLE_ICON[role]} size={18} color={color} />
              </View>
              <View style={styles.roleInfo}>
                <Text style={[styles.roleLabel, { color: theme.text }]}>{role}</Text>
                <Text style={[styles.roleDesc, { color: theme.textSecondary }]}>
                  {role === "STUDENT" && "Standard student access to CourseFlow features."}
                  {role === "ADVISOR" && "Can view and advise on student degree plans."}
                  {role === "ADMIN" && "Full system access and user management."}
                </Text>
              </View>
              <View style={[styles.radioOuter, { borderColor: selected ? color : theme.border }]}>
                {selected && <View style={[styles.radioInner, { backgroundColor: color }]} />}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Info note */}
      <View style={[styles.noteCard, { backgroundColor: `${theme.primary}0C`, borderColor: `${theme.primary}30` }]}>
        <Ionicons name="information-circle-outline" size={16} color={theme.primary} />
        <Text style={[styles.noteText, { color: theme.text }]}>
          Changing a user's role takes effect immediately. The user will need to log out and back in to see the change.
        </Text>
      </View>

      {/* Save */}
      <TouchableOpacity
        style={[styles.saveBtn, { backgroundColor: theme.primary, opacity: saving ? 0.7 : 1 }]}
        onPress={handleSave}
        disabled={saving}
        activeOpacity={0.85}
      >
        {saving ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <>
            <Ionicons name="checkmark-outline" size={18} color="#fff" />
            <Text style={styles.saveBtnText}>Save Changes</Text>
          </>
        )}
      </TouchableOpacity>

      <TouchableOpacity style={[styles.cancelBtn, { borderColor: theme.border }]} onPress={() => router.back()} activeOpacity={0.7}>
        <Text style={[styles.cancelBtnText, { color: theme.textSecondary }]}>Cancel</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 40 },

  identityCard: {
    flexDirection: "row", alignItems: "center", gap: 14,
    borderWidth: 1, borderRadius: 16, padding: 16, marginBottom: 24,
  },
  avatar: { width: 56, height: 56, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  avatarText: { fontSize: 20, fontWeight: "800" },
  identityInfo: { flex: 1, gap: 3 },
  identityName: { fontSize: 18, fontWeight: "800" },
  identityMeta: { fontSize: 13 },

  sectionLabel: { fontSize: 12, fontWeight: "700", letterSpacing: 0.8, marginBottom: 8, paddingHorizontal: 4 },

  card: { borderWidth: 1, borderRadius: 16, overflow: "hidden", marginBottom: 16 },

  roleRow: { flexDirection: "row", alignItems: "center", padding: 16, gap: 12 },
  roleIconWrap: { width: 38, height: 38, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  roleInfo: { flex: 1, gap: 3 },
  roleLabel: { fontSize: 15, fontWeight: "700" },
  roleDesc: { fontSize: 12, lineHeight: 17 },
  radioOuter: {
    width: 20, height: 20, borderRadius: 10, borderWidth: 2,
    alignItems: "center", justifyContent: "center",
  },
  radioInner: { width: 10, height: 10, borderRadius: 5 },

  noteCard: {
    flexDirection: "row", alignItems: "flex-start", gap: 10,
    borderWidth: 1, borderRadius: 14, padding: 14, marginBottom: 24,
  },
  noteText: { flex: 1, fontSize: 13, lineHeight: 19 },

  saveBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, borderRadius: 14, paddingVertical: 15, marginBottom: 10,
  },
  saveBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },

  cancelBtn: {
    borderWidth: 1, borderRadius: 14, paddingVertical: 14,
    alignItems: "center", justifyContent: "center",
  },
  cancelBtnText: { fontSize: 15, fontWeight: "600" },
});
