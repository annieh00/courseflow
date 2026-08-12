//index.tsx
import React, { useCallback, useState, useMemo } from "react";
import {
  View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, ActivityIndicator,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useTheme } from "../../../../components/ThemeContext";
import { useRouter } from "expo-router";
import api from "../../../../services/api";

type Role = "STUDENT" | "ADVISOR" | "ADMIN";

type AdminUser = {
  id: number;
  netid: string;
  email: string;
  accountLevel: Role;
  fullName: string | null;
};

const ROLE_COLOR: Record<Role, string> = {
  STUDENT: "#3B82F6",
  ADVISOR: "#8B5CF6",
  ADMIN: "#DC2626",
};

export default function AdminUsersScreen() {
  const { theme } = useTheme();
  const router = useRouter();

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get<AdminUser[]>("/admin/users");
      setUsers(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Error loading users:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { loadUsers(); }, [loadUsers]));

  const filteredUsers = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return users;
    return users.filter((u) =>
      [u.fullName ?? "", u.netid, u.email, u.accountLevel]
        .join(" ").toLowerCase().includes(q)
    );
  }, [users, search]);

  const handleEdit = (user: AdminUser) => {
    router.push({
      pathname: "/(admin)/(drawer)/users/user-edit",
      params: {
        id: String(user.id),
        netid: user.netid,
        email: user.email,
        accountLevel: user.accountLevel,
        fullName: user.fullName ?? "",
      },
    });
  };

  const renderItem = ({ item }: { item: AdminUser }) => {
    const roleColor = ROLE_COLOR[item.accountLevel] ?? theme.primary;
    const initials = item.fullName
      ? item.fullName.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
      : item.netid.slice(0, 2).toUpperCase();

    return (
      <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <View style={[styles.avatar, { backgroundColor: `${roleColor}18` }]}>
          <Text style={[styles.avatarText, { color: roleColor }]}>{initials}</Text>
        </View>
        <View style={styles.cardBody}>
          <Text style={[styles.userName, { color: theme.text }]} numberOfLines={1}>
            {item.fullName || item.netid}
          </Text>
          <Text style={[styles.userSub, { color: theme.textSecondary }]} numberOfLines={1}>
            {item.netid} · {item.email}
          </Text>
          <View style={[styles.rolePill, { backgroundColor: `${roleColor}18`, borderColor: `${roleColor}40` }]}>
            <Text style={[styles.rolePillText, { color: roleColor }]}>{item.accountLevel}</Text>
          </View>
        </View>
        <TouchableOpacity style={[styles.editBtn, { backgroundColor: `${theme.primary}12` }]} onPress={() => handleEdit(item)} activeOpacity={0.7}>
          <Ionicons name="create-outline" size={18} color={theme.primary} />
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Search */}
      <View style={[styles.searchBar, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <Ionicons name="search-outline" size={18} color={theme.textSecondary} />
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search by name, Net-ID, role…"
          placeholderTextColor={theme.textSecondary}
          style={[styles.searchInput, { color: theme.text }]}
          autoCorrect={false}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch("")}>
            <Ionicons name="close-circle" size={18} color={theme.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Count row */}
      <View style={styles.countRow}>
        <Text style={[styles.countText, { color: theme.textSecondary }]}>
          {filteredUsers.length} {filteredUsers.length === 1 ? "user" : "users"}{search ? " found" : " total"}
        </Text>
        <TouchableOpacity onPress={loadUsers} style={styles.refreshBtn}>
          <Ionicons name="refresh-outline" size={16} color={theme.primary} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={filteredUsers}
        keyExtractor={(u) => String(u.id)}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            {loading ? (
              <ActivityIndicator size="large" color={theme.primary} />
            ) : (
              <>
                <Ionicons name="people-outline" size={40} color={theme.textSecondary} />
                <Text style={[styles.emptyTitle, { color: theme.text }]}>No users found</Text>
              </>
            )}
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },

  searchBar: {
    flexDirection: "row", alignItems: "center", gap: 10,
    borderWidth: 1, borderRadius: 14, paddingHorizontal: 14,
    paddingVertical: 10, marginBottom: 10,
  },
  searchInput: { flex: 1, fontSize: 14 },

  countRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  countText: { fontSize: 13, fontWeight: "600" },
  refreshBtn: { padding: 4 },

  list: { paddingBottom: 24 },

  card: {
    flexDirection: "row", alignItems: "center", gap: 12,
    borderWidth: 1, borderRadius: 16,
    paddingVertical: 14, paddingHorizontal: 14, marginBottom: 10,
  },
  avatar: {
    width: 44, height: 44, borderRadius: 14,
    alignItems: "center", justifyContent: "center",
  },
  avatarText: { fontSize: 15, fontWeight: "800" },
  cardBody: { flex: 1, gap: 3 },
  userName: { fontSize: 15, fontWeight: "700" },
  userSub: { fontSize: 12 },
  rolePill: {
    alignSelf: "flex-start", borderRadius: 999, borderWidth: 1,
    paddingHorizontal: 8, paddingVertical: 2, marginTop: 2,
  },
  rolePillText: { fontSize: 11, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.4 },
  editBtn: {
    width: 36, height: 36, borderRadius: 10,
    alignItems: "center", justifyContent: "center",
  },

  emptyState: { alignItems: "center", paddingVertical: 48, gap: 12 },
  emptyTitle: { fontSize: 16, fontWeight: "600" },
});
