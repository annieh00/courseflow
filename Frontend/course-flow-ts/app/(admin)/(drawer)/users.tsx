// app/(admin)/(drawer)/users.tsx
import React, { useCallback, useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useTheme } from "../../../components/ThemeContext";

const API_BASE =
  process.env.EXPO_PUBLIC_API_BASE_URL ?? "http://localhost:8080";

type Role = "STUDENT" | "ADVISOR" | "ADMIN";

type AdminUser = {
  id: number;
  netid: string;
  email: string;
  role: Role;
  display_name?: string | null;
  graduation_year?: number | null;
};

const MOCK_USERS: AdminUser[] = [
  {
    id: 1,
    netid: "sjohnson",
    email: "sjohnson@iastate.edu",
    role: "STUDENT",
    display_name: "Sarah Johnson",
    graduation_year: 2026,
  },
  {
    id: 2,
    netid: "klee",
    email: "klee@iastate.edu",
    role: "ADVISOR",
    display_name: "Kevin Lee",
  },
];

export default function AdminUsersScreen() {
  const { theme } = useTheme();

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  // create form
  const [newNetid, setNewNetid] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newRole, setNewRole] = useState<Role>("STUDENT");
  const [saving, setSaving] = useState(false);

  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/api/admin/users`, {
        credentials: "include",
      });

      if (!res.ok) {
        console.warn("Failed to load users, using mock data");
        setUsers(MOCK_USERS);
        return;
      }

      const data: AdminUser[] = await res.json();
      setUsers(data);
    } catch (err) {
      console.error("Error loading users:", err);
      setUsers(MOCK_USERS);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadUsers();
    }, [loadUsers])
  );

  const filteredUsers = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return users;
    return users.filter((u) => {
      const haystack = [
        u.display_name ?? "",
        u.netid,
        u.email,
        u.role,
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [users, search]);

  const handleCreate = async () => {
    if (!newNetid || !newEmail) return;
    try {
      setSaving(true);
      const res = await fetch(`${API_BASE}/api/admin/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          netid: newNetid.trim(),
          email: newEmail.trim(),
          role: newRole,
        }),
      });

      if (!res.ok) {
        console.error("Failed to create user:", await res.text());
        return;
      }

      // reload
      await loadUsers();
      setNewNetid("");
      setNewEmail("");
      setNewRole("STUDENT");
    } catch (err) {
      console.error("Error creating user:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/users/${id}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!res.ok) {
        console.error("Failed to delete user:", await res.text());
        return;
      }

      setUsers((prev) => prev.filter((u) => u.id !== id));
    } catch (err) {
      console.error("Error deleting user:", err);
    }
  };

  const renderItem = ({ item }: { item: AdminUser }) => (
    <View
      style={[
        styles.card,
        { backgroundColor: theme.card, borderColor: theme.border },
      ]}
    >
      <View style={{ flex: 1 }}>
        <Text style={[styles.userName, { color: theme.text }]}>
          {item.display_name || item.netid}
        </Text>
        <Text style={{ color: theme.muted, marginTop: 2 }}>
          {item.netid} · {item.role}
        </Text>
        <Text style={{ color: theme.muted, marginTop: 2 }}>{item.email}</Text>
        {item.graduation_year && (
          <Text style={{ color: theme.muted, marginTop: 2 }}>
            Grad year: {item.graduation_year}
          </Text>
        )}
      </View>

      <TouchableOpacity
        style={styles.iconBtn}
        onPress={() => handleDelete(item.id)}
        activeOpacity={0.8}
      >
        <Ionicons name="trash-outline" size={18} color="#dc2626" />
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Text style={[styles.title, { color: theme.text }]}>Users</Text>
      <Text style={{ color: theme.muted, marginBottom: 10 }}>
        View and manage all users in CourseFlow.
      </Text>

      {/* Search */}
      <View
        style={[
          styles.searchContainer,
          { backgroundColor: theme.card, borderColor: theme.border },
        ]}
      >
        <Ionicons
          name="search-outline"
          size={18}
          color={theme.muted}
          style={{ marginRight: 6 }}
        />
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search by name, Net-ID, email..."
          placeholderTextColor={theme.muted}
          style={[styles.searchInput, { color: theme.text }]}
          autoCorrect={false}
        />
      </View>

      {/* Create user inline form */}
      <View
        style={[
          styles.createCard,
          { backgroundColor: theme.card, borderColor: theme.border },
        ]}
      >
        <Text style={[styles.sectionLabel, { color: theme.text }]}>
          Add new user
        </Text>
        <View style={styles.row}>
          <View style={{ flex: 1, marginRight: 6 }}>
            <TextInput
              value={newNetid}
              onChangeText={setNewNetid}
              placeholder="Net-ID"
              placeholderTextColor={theme.muted}
              style={[
                styles.input,
                { borderColor: theme.border, color: theme.text },
              ]}
              autoCapitalize="none"
            />
          </View>
          <View style={{ flex: 1, marginLeft: 6 }}>
            <TextInput
              value={newEmail}
              onChangeText={setNewEmail}
              placeholder="Email"
              placeholderTextColor={theme.muted}
              style={[
                styles.input,
                { borderColor: theme.border, color: theme.text },
              ]}
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </View>
        </View>

        {/* simple role toggle */}
        <View style={[styles.roleRow]}>
          {(["STUDENT", "ADVISOR", "ADMIN"] as Role[]).map((r) => (
            <TouchableOpacity
              key={r}
              style={[
                styles.roleChip,
                {
                  borderColor: theme.border,
                  backgroundColor:
                    newRole === r ? theme.primary : theme.card,
                },
              ]}
              onPress={() => setNewRole(r)}
              activeOpacity={0.85}
            >
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: "600",
                  color: newRole === r ? theme.background : theme.text,
                }}
              >
                {r}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={[
            styles.primaryButton,
            { backgroundColor: theme.primary, opacity: saving ? 0.8 : 1 },
          ]}
          onPress={handleCreate}
          disabled={saving}
          activeOpacity={0.9}
        >
          <Text
            style={{
              color: theme.background,
              fontWeight: "700",
              textAlign: "center",
            }}
          >
            {saving ? "Saving..." : "Create user"}
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={filteredUsers}
        keyExtractor={(u) => String(u.id)}
        renderItem={renderItem}
        contentContainerStyle={{ paddingVertical: 8 }}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={[styles.emptyTitle, { color: theme.text }]}>
              {loading ? "Loading users..." : "No users found"}
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { fontSize: 22, fontWeight: "700", marginBottom: 4 },

  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginBottom: 10,
  },
  searchInput: { flex: 1, fontSize: 14 },

  createCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 6,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 13,
  },
  roleRow: {
    flexDirection: "row",
    gap: 6,
    marginBottom: 8,
  },
  roleChip: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  primaryButton: {
    borderRadius: 999,
    paddingVertical: 8,
    marginTop: 4,
  },

  card: {
    flexDirection: "row",
    alignItems: "flex-start",
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 10,
  },
  userName: {
    fontSize: 16,
    fontWeight: "600",
  },
  iconBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginLeft: 8,
  },

  emptyState: {
    marginTop: 24,
    alignItems: "center",
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
});
