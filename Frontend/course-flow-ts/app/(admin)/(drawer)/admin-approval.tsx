// app/(admin)/(drawer)/admin-approval.tsx
import React, { useCallback, useMemo, useState } from "react";
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
import {useAuth} from "../../../auth/AuthContext"


const API_BASE = (process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:8080/api").replace(/\/api\/?$/, "");

type AdminApprovalRequest = {
  id: number;
  netid: string;
  email: string;
  fullName?: string | null;
  reason?: string | null;
};


export default function AdminApprovalScreen() {
  const { theme } = useTheme();
  const {accessToken} = useAuth();

  const [requests, setRequests] = useState<AdminApprovalRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  const loadRequests = useCallback(async () => {
      if(!accessToken) return;
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/api/admin/approvals/admin`, {
        headers: {
            'Authorization': `Bearer ${accessToken}`
        }
      });

      if (!res.ok) {
        throw new Error("Failed to load admin requests");
      }

      const data = await res.json();
      setRequests(data || []);
    } catch (err) {
      console.error("Error loading admin approvals:", err);
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useFocusEffect(
    useCallback(() => {
      loadRequests();
    }, [loadRequests])
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return requests;
    return requests.filter((r) => {
      const haystack = [
        r.display_name ?? "",
        r.netid,
        r.email,
        r.reason ?? "",
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [requests, search]);

  const handleDecision = async (
    id: number,
    decision: "APPROVE" | "REJECT"
  ) => {
      const isApproved = decision === "APPROVE";
    try {
      const res = await fetch(
        `${API_BASE}/api/admin/approvals/${id}/decide?approved=${isApproved}`,
        {
          method: "PATCH",
          headers: {
              "Authorization": `Bearer ${accessToken}`,
              "Content-Type": "application/json"
          }
        }
      );

      if (res.ok) {
          setRequests((prev) => prev.filter((r) => r.id !== id));
      }else{
          console.error("Failed to process decision:", await res.text());
      }


    } catch (err) {
      console.error("Network error:", err);
    }
  };

  const renderItem = ({ item }: { item: AdminApprovalRequest }) => (
    <View
      style={[
        styles.card,
        { backgroundColor: theme.card, borderColor: theme.border },
      ]}
    >
      <View style={{ flex: 1 }}>
        <Text style={[styles.name, { color: theme.text }]}>
          {item.fullName}
        </Text>
        <Text style={{ color: theme.muted, marginTop: 2 }}>
          {item.netid} · {item.email}
        </Text>
      </View>

      <View style={styles.decisionCol}>
        <TouchableOpacity
          style={[
            styles.decisionBtn,
            { borderColor: "#16a34a", padding: 10 },
          ]}
          onPress={() => handleDecision(item.id, "APPROVE")}
          activeOpacity={0.7}
        >
          <Ionicons name="checkmark" size={16} color="#16a34a" />
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.decisionBtn,
            { borderColor: "#dc2626", marginTop: 6 },
          ]}
          onPress={() => handleDecision(item.id, "REJECT")}
        >
          <Ionicons name="close" size={16} color="#dc2626" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Text style={[styles.title, { color: theme.text }]}>
        Admin Approvals
      </Text>
      <Text style={{ color: theme.muted, marginBottom: 10 }}>
        Review and approve requests to become platform administrators.
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
          placeholder="Search requests..."
          placeholderTextColor={theme.muted}
          style={[styles.searchInput, { color: theme.text }]}
        />
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(r) => String(r.id)}
        renderItem={renderItem}
        contentContainerStyle={{ paddingVertical: 8 }}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={[styles.emptyTitle, { color: theme.text }]}>
              {loading ? "Loading requests..." : "No pending admin requests"}
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

  card: {
    flexDirection: "row",
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
  },
  name: { fontSize: 16, fontWeight: "600" },

  decisionCol: {
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 10,
  },
  decisionBtn: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
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
