// app/screens/ProfessorDetail.tsx
import React, { useMemo } from "react";
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Linking,
} from "react-native";
import { useTheme } from "../../../components/ThemeContext";
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";

type Comment = {
  id: string;
  author: string;
  rating: number; // 1..5
  text: string;
  createdAt: string; // ISO string
};

type Professor = {
  id: string;              // internal id
  tid?: number;            // RMP "tid" if you have it
  name: string;
  department?: string;
  school?: string;
  comments: Comment[];
};

type RootStackParamList = {
  ProfessorDetail: { professor: Professor };
};

type ProfessorDetailRouteProp = RouteProp<RootStackParamList, "ProfessorDetail">;

export default function ProfessorDetail() {
  const { theme } = useTheme();
  const nav = useNavigation();
  const { params } = useRoute<ProfessorDetailRouteProp>();

  const prof: Professor =
    params?.professor ??
    ({
      id: "demo",
      tid: 1234567,
      name: "Demo Professor",
      department: "Computer Science",
      school: "Iowa State University",
      comments: [
        { id: "a", author: "Student 1", rating: 5, text: "Crystal clear lectures.", createdAt: new Date().toISOString() },
        { id: "b", author: "Student 2", rating: 4, text: "Projects heavy but fair.", createdAt: new Date().toISOString() },
        { id: "c", author: "Student 3", rating: 3, text: "Average workload.", createdAt: new Date().toISOString() },
      ],
    } as Professor);

  const avg = useMemo(() => {
    const n = prof.comments.length;
    if (!n) return 0;
    const sum = prof.comments.reduce((s, c) => s + c.rating, 0);
    return Math.round((sum / n) * 10) / 10;
  }, [prof.comments]);

  const breakdown = useMemo(() => {
    const buckets = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 } as Record<1|2|3|4|5, number>;
    for (const c of prof.comments) {
      const r = Math.min(5, Math.max(1, Math.round(c.rating))) as 1|2|3|4|5;
      buckets[r] += 1;
    }
    const total = prof.comments.length || 1;
    const rows = (Object.keys(buckets) as Array<keyof typeof buckets>)
      .sort((a,b) => Number(b) - Number(a))
      .map((k) => ({
        stars: Number(k),
        count: buckets[k as 1|2|3|4|5],
        pct: (buckets[k as 1|2|3|4|5] / total) * 100,
      }));
    return rows;
  }, [prof.comments]);

  function Stars({ value }: { value: number }) {
    // rounded display only
    const full = Math.round(value);
    return (
      <Text style={{ color: theme.primary ?? "#3b82f6", fontSize: 18 }}>
        {"★".repeat(full)}{"☆".repeat(5 - full)}
      </Text>
    );
  }

  function openRmp() {
    if (!prof.tid) return;
    const url = `https://www.ratemyprofessors.com/professor/${prof.tid}`;
    Linking.openURL(url).catch(() => {});
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
      {/* Top bar */}
      <View style={{ paddingHorizontal: 16, paddingVertical: 12 }}>
        <TouchableOpacity onPress={() => nav.goBack()}>
          <Text style={{ color: theme.primary ?? "#3b82f6" }}>← Back</Text>
        </TouchableOpacity>
      </View>

      {/* Header card */}
      <View
        style={[
          styles.card,
          { backgroundColor: theme.card, borderColor: theme.border, marginHorizontal: 16 },
        ]}
      >
        {/* Name as a link */}
        <TouchableOpacity onPress={prof.tid ? openRmp : undefined} disabled={!prof.tid}>
          <Text
            style={[
              styles.name,
              {
                color: theme.text,
                textDecorationLine: prof.tid ? "underline" : "none",
              },
            ]}
            numberOfLines={2}
          >
            {prof.name}
          </Text>
        </TouchableOpacity>

        {!!prof.department && (
          <Text style={{ color: theme.muted }}>{prof.department}</Text>
        )}
        {!!prof.school && <Text style={{ color: theme.muted }}>{prof.school}</Text>}

        <View style={styles.avgRow}>
          <Text style={[styles.avgNum, { color: theme.text }]}>{avg.toFixed(1)}</Text>
          <View style={{ marginLeft: 8 }}>
            <Stars value={avg} />
            <Text style={{ color: theme.muted }}>
              {prof.comments.length} ratings
            </Text>
          </View>
        </View>

        {/* Quick “See on RMP” button */}
        {prof.tid && (
          <TouchableOpacity
            onPress={openRmp}
            style={[
              styles.linkBtn,
              { borderColor: theme.border, backgroundColor: theme.background },
            ]}
          >
            <Text style={{ color: theme.primary ?? "#3b82f6", fontWeight: "700" }}>
              See on RateMyProfessors →
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Ratings breakdown */}
      <View style={{ marginTop: 12, marginHorizontal: 16 }}>
        <Text style={{ color: theme.text, fontWeight: "800", marginBottom: 8 }}>
          Ratings breakdown
        </Text>

        {breakdown.map((row) => (
          <View key={row.stars} style={styles.breakRow}>
            <Text style={{ width: 24, color: theme.text }}>{row.stars}★</Text>
            <View
              style={[
                styles.breakBarBg,
                { backgroundColor: theme.card, borderColor: theme.border },
              ]}
            >
              <View
                style={[
                  styles.breakFill,
                  { width: `${row.pct}%`, backgroundColor: theme.primary ?? "#3b82f6" },
                ]}
              />
            </View>
            <Text style={{ width: 36, textAlign: "right", color: theme.text }}>
              {row.count}
            </Text>
          </View>
        ))}
      </View>

      {/* Comments list */}
      <FlatList
        style={{ flex: 1, marginTop: 12 }}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
        data={prof.comments}
        keyExtractor={(c) => c.id}
        ListHeaderComponent={
          <Text style={{ color: theme.text, fontWeight: "800", marginBottom: 8 }}>
            Recent comments
          </Text>
        }
        renderItem={({ item }) => (
          <View
            style={[
              styles.commentCard,
              { backgroundColor: theme.card, borderColor: theme.border },
            ]}
          >
            <View style={styles.commentHeader}>
              <Text style={{ color: theme.text, fontWeight: "700" }}>
                {item.author}
              </Text>
              <Text style={{ color: theme.muted }}>
                {new Date(item.createdAt).toLocaleDateString()}
              </Text>
            </View>
            <Stars value={item.rating} />
            <Text style={{ color: theme.text, marginTop: 6, lineHeight: 20 }}>
              {item.text}
            </Text>
          </View>
        )}
        ListEmptyComponent={
          <Text style={{ color: theme.muted }}>No comments yet.</Text>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 16,
  },
  name: { fontSize: 22, fontWeight: "800" },
  avgRow: { flexDirection: "row", alignItems: "center", marginTop: 10 },
  avgNum: { fontSize: 36, fontWeight: "900" },
  linkBtn: {
    alignSelf: "flex-start",
    marginTop: 12,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  breakRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  breakBarBg: {
    flex: 1,
    height: 10,
    borderRadius: 6,
    overflow: "hidden",
    borderWidth: 1,
  },
  breakFill: { height: "100%" },
  commentCard: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginTop: 10,
  },
  commentHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
});
