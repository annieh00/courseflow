//users.tsx
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
import { useTheme } from "../../../../components/ThemeContext";
import { useRouter } from "expo-router";

const API_BASE =
  "https://db76c494-9707-4db2-8157-3a05a84e613d.mock.pstmn.io";

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
  const router = useRouter();

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  const [newNetid, setNewNetid] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newRole, setNewRole] = useState<Role>("STUDENT");
  const [saving, setSaving] = useState(false);

  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);

      const res = await fetch(`${API_BASE}/users`);
      console.log("users status:", res.status);

      let json: unknown = null;
      try {
        json = await res.json();
        console.log("users json:", json);
      } catch (e) {
        console.warn("Failed to parse users JSON:", e);
      }

      if (!res.ok || !Array.isArray(json)) {
        console.warn("Using mock users because API failed or returned non-array");
        setUsers(MOCK_USERS);
        return;
      }

      setUsers(json as AdminUser[]);
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
      await fetch(`${API_BASE}/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          netid: newNetid.trim(),
          email: newEmail.trim(),
          role: newRole,
        }),
      });
    } catch (err) {
      console.error("Error creating user (mock):", err);
    } finally {
      setUsers((prev) => [
        ...prev,
        {
          id: Date.now(),
          netid: newNetid.trim(),
          email: newEmail.trim(),
          role: newRole,
        },
      ]);
      setNewNetid("");
      setNewEmail("");
      setNewRole("STUDENT");
      setSaving(false);
    }
  };

  const handleEdit = (user: AdminUser) => {
    router.push({
      pathname: "/users/user-edit",
      params: { id: String(user.id) },
    });
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
        onPress={() => handleEdit(item)}
        activeOpacity={0.8}
      >
        <Ionicons name="create-outline" size={18} color={theme.primary} />
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Text style={[styles.title, { color: theme.text }]}>Users</Text>
      <Text style={{ color: theme.muted, marginBottom: 10 }}>
        View and manage all users in CourseFlow.
      </Text>

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

        <View style={styles.roleRow}>
          {(["STUDENT", "ADVISOR", "ADMIN"] as Role[]).map((r) => (
            <TouchableOpacity
              key={r}
              style={[
                styles.roleChip,
                {
                  borderColor: theme.border,
                  backgroundColor: newRole === r ? theme.primary : theme.card,
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
