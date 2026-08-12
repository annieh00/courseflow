// app/(drawer)/professors/professors.tsx
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Keyboard,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { useTheme } from "../../../../components/ThemeContext";
import PieChart from "../../../../components/PieChart";
import ProgressBar from "../../../../components/ProgressBar";
import { useAuth } from "../../../../auth/AuthContext";

// ---------- types ----------
type School = { id: string; name: string };
type Teacher = {
  id: string;
  legacyId?: number | null;
  firstName: string;
  lastName: string;
  department?: string | null;
  avgRating?: number | null;   // 0..5
  avgDifficulty?: number | null;
  numRatings?: number | null;
  wouldTakeAgainPercent?: number | null; // 0..100
  school?: School | null;
};
type LandingMeta = {
  school?: School | null;
  departmentsCount: number;       // from filters.length
  totalProfessors: number;        // from resultCount
  sampleAvgRating: number | null; // avg across the current page
  sampleAvgDifficulty: number | null;
};

// ---------- config ----------
const BASE_URL = "http://localhost:8080"; // emulator: use 10.0.2.2

export default function Professors() {
  const { theme } = useTheme();
  const navigation = useNavigation();
  const router = useRouter();

  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [results, setResults] = useState<Teacher[]>([]);

  // landing state
  const [landingLoading, setLandingLoading] = useState(false);
  const [landingMeta, setLandingMeta] = useState<LandingMeta | null>(null);
  const [featured, setFeatured] = useState<Teacher[]>([]); // top rated subset

  // ---------- utils ----------
  function isFiniteNumber(v: any): number | null {
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  }

  function mapTeachers(json: any): {
    teachers: Teacher[];
    departmentsCount: number;
    totalProfessors: number;
    school: School | null;
  } {
    const teachersEdges = json?.data?.search?.teachers?.edges ?? [];
    const schoolObj = json?.data?.school?.id
      ? { id: String(json.data.school.id), name: String(json.data.school.name ?? "") }
      : null;
    const teachers: Teacher[] = (Array.isArray(teachersEdges) ? teachersEdges : [])
      .map((e: any) => e?.node)
      .filter(Boolean)
      .map((n: any): Teacher => ({
        id: String(n?.id ?? ""),
        legacyId: n?.legacyId ?? null,
        firstName: String(n?.firstName ?? ""),
        lastName: String(n?.lastName ?? ""),
        department: n?.department ?? null,
        avgRating: isFiniteNumber(n?.avgRating),
        avgDifficulty: isFiniteNumber(n?.avgDifficulty),
        numRatings: isFiniteNumber(n?.numRatings),
        wouldTakeAgainPercent: isFiniteNumber(n?.wouldTakeAgainPercent),
        school: n?.school && n.school.id
          ? { id: String(n.school.id), name: String(n.school.name ?? "") }
          : null,
      }));

    const departmentsCount =
      Array.isArray(json?.data?.search?.teachers?.filters?.[0]?.options)
        ? json.data.search.teachers.filters[0].options.length
        : 0;

    const totalProfessors = Number(json?.data?.search?.teachers?.resultCount ?? 0);

    return { teachers, departmentsCount, totalProfessors, school: schoolObj };
  }

  function avgOf(arr: Array<number | null | undefined>): number | null {
    const nums = arr.filter((x): x is number => typeof x === "number" && Number.isFinite(x));
    if (!nums.length) return null;
    const s = nums.reduce((a, b) => a + b, 0);
    return s / nums.length;
  }

  // ---------- search ----------
  const search = useCallback(
    async (query: string) => {
      const trimmed = query.trim();
      if (!trimmed) {
        setResults([]);
        setErr(null);
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        setErr(null);

        const url = `${BASE_URL}/api/ratemyprofessor/professors/search?name=${encodeURIComponent(
          trimmed
        )}`;

        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();

        const mapped = mapTeachers(json);
        setResults(mapped.teachers);
      } catch (e: any) {
        setErr(e?.message || "Failed to fetch");
        setResults([]);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  

  useEffect(() => {
    search(q);
  }, [q, search]);

  // ---------- landing fetch (shown when q === "") ----------
  const fetchLanding = useCallback(async () => {
    try {
      setLandingLoading(true);
      setErr(null);
      // Use a broad query that returns many teachers (e.g., letter "a")
      const url = `${BASE_URL}/api/ratemyprofessor/professors/search?name=a`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();

      const { teachers, departmentsCount, totalProfessors, school } = mapTeachers(json);

      // compute “sample” averages from this page (fast + cheap)
      const sampleAvgRating = avgOf(teachers.map((t) => t.avgRating));
      const sampleAvgDifficulty = avgOf(teachers.map((t) => t.avgDifficulty));

      // pick featured: top by rating, tie-break by #ratings desc
      const top = [...teachers]
        .sort((a, b) => {
          const ar = a.avgRating ?? -1;
          const br = b.avgRating ?? -1;
          if (br !== ar) return br - ar;
          const an = a.numRatings ?? 0;
          const bn = b.numRatings ?? 0;
          return bn - an;
        })
        .slice(0, 6);

      setLandingMeta({
        school: school ?? undefined,
        departmentsCount,
        totalProfessors,
        sampleAvgRating,
        sampleAvgDifficulty,
      });
      setFeatured(top);
    } catch (e: any) {
      setErr(e?.message || "Failed to load snapshot");
      setLandingMeta(null);
      setFeatured([]);
    } finally {
      setLandingLoading(false);
    }
  }, []);

  // load landing on first mount, and whenever we return with empty q
  useEffect(() => {
    if (!q.trim()) fetchLanding();
  }, [q, fetchLanding]);

  // Clear search when leaving this screen
  useEffect(() => {
    const unsub = navigation.addListener("blur", () => {
      setQ("");
      setResults([]);
      setErr(null);
    });
    return unsub;
  }, [navigation]);

  // ---------- small UI bits ----------
  function Stars({ v = 0 }: { v?: number | null }) {
    const val = typeof v === "number" ? v : 0;
    const full = Math.max(0, Math.min(5, Math.round(val)));
    return (
      <Text style={{ color: theme.primary ?? "#3b82f6" }}>
        {"★".repeat(full)}
        {"☆".repeat(5 - full)}
      </Text>
    );
  }

  const StatTile = ({
    label,
    value,
    sub,
  }: {
    label: string;
    value: string;
    sub?: string;
  }) => (
    <View
      style={[
        styles.statTile,
        { borderColor: theme.border, backgroundColor: theme.card },
      ]}
    >
      <Text style={[styles.statLabel, { color: theme.muted }]}>{label}</Text>
      <Text style={[styles.statValue, { color: theme.text }]}>{value}</Text>
      {sub ? (
        <Text style={[styles.statSub, { color: theme.muted }]}>{sub}</Text>
      ) : null}
    </View>
  );

  const Landing = () => {
    if (landingLoading) {
      return (
        <ActivityIndicator
          size="large"
          color={theme.primary ?? "#3b82f6"}
          style={{ marginTop: 24 }}
        />
      );
    }

    if (!landingMeta) {
      return (
        <Text style={{ textAlign: "center", color: "red", marginTop: 16 }}>
          Couldn’t load university snapshot.
        </Text>
      );
    }

    const schoolName = landingMeta.school?.name ?? "Your University";
    const avgRatingStr =
      typeof landingMeta.sampleAvgRating === "number"
        ? landingMeta.sampleAvgRating.toFixed(2)
        : "—";
    const avgDiffStr =
      typeof landingMeta.sampleAvgDifficulty === "number"
        ? landingMeta.sampleAvgDifficulty.toFixed(2)
        : "—";

          const { user } = useAuth();

  const roleLabel =
    user?.role === "advisor"
      ? "Advisor"
      : user?.role === "admin"
      ? "Admin"
      : "Student";

    return (
      <View style={{ padding: 16, paddingBottom: 32 }}>
        {/* Section: University Snapshot */}
        <View
          style={[
            styles.card,
            { borderColor: theme.border, backgroundColor: theme.card },
          ]}
        >
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            {schoolName}
          </Text>

          {/* 2-column responsive grid */}
          <View style={styles.grid}>
            <StatTile
              label="Average Professor Rating"
              value={`${avgRatingStr} / 5.00`}
            />
            <StatTile
              label="Average Difficulty"
              value={`${avgDiffStr} / 5.00`}
            />
            <StatTile
              label="Departments"
              value={`${landingMeta.departmentsCount}`}
            />
            <StatTile
              label="Professors on RMP"
              value={`${landingMeta.totalProfessors}`}
            />
          </View>
        </View>

        {/* Section: Featured Professors (Top Rated) */}
        <Text style={[styles.sectionTitle, { color: theme.text, marginTop: 14 }]}>
          {`Featured Professors`}
        </Text>
        {featured.length === 0 ? (
          <Text style={{ color: theme.muted, marginTop: 6 }}>
            No featured professors available.
          </Text>
        ) : (
          <View>
            {featured.map((t) => (
              <Row key={t.id} t={t} />
            ))}
          </View>
        )}
      </View>
    );
  };

  

  function Row({ t }: { t: Teacher }) {
    const rating = t.avgRating ?? undefined;
    return (
      <TouchableOpacity
        onPress={() =>
          router.push({
            pathname: "/professors/professor-details",
            params: { teacher: encodeURIComponent(JSON.stringify(t)) },
          })
        }
        style={[
          styles.row,
          { borderColor: theme.border, backgroundColor: theme.card },
        ]}
      >
        <View style={{ flex: 1 }}>
          <Text style={[styles.name, { color: theme.text }]}>
            {t.firstName} {t.lastName}
          </Text>
          <Text style={{ color: theme.muted, fontSize: 12 }}>
            {t.department ?? "—"} • {t.school?.name ?? "—"}
          </Text>
        </View>
        <View style={{ alignItems: "flex-end" }}>
          <Text style={[styles.score, { color: theme.text }]}>
            {typeof rating === "number" ? rating.toFixed(1) : "—"}
          </Text>
          <Stars v={rating ?? null} />
        </View>
      </TouchableOpacity>
    );
  }

  // ---------- render ----------
  const showLanding = !q.trim();

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* search box */}
      <View
        style={[
          styles.searchWrap,
          { backgroundColor: theme.card, borderColor: theme.border },
        ]}
      >
        <TextInput
          placeholder="Search professors (e.g., 'Smith' or 'John')…"
          placeholderTextColor={theme.muted ?? "#9aa0a6"}
          value={q}
          onChangeText={setQ}
          onSubmitEditing={Keyboard.dismiss}
          returnKeyType="search"
          style={[styles.input, { color: theme.text }]}
        />
        {!!q && (
          <TouchableOpacity onPress={() => setQ("")} style={styles.clearBtn}>
            <Text
              style={{ color: theme.primary ?? "#3b82f6", fontWeight: "700" }}
            >
              Clear
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {showLanding ? (
        <FlatList
          data={[]} // just to enable scrolling padding, content is headerComponent
          renderItem={null as any}
          keyExtractor={() => "x"}
          ListHeaderComponent={<Landing />}
        />
      ) : (
        <>
          {loading && (
            <ActivityIndicator
              size="large"
              color={theme.primary ?? "#3b82f6"}
              style={{ marginTop: 24 }}
            />
          )}
          {err && (
            <Text style={{ color: "red", padding: 16, textAlign: "center" }}>
              {err}
            </Text>
          )}
          <FlatList
            contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
            data={results}
            keyExtractor={(t) => t.id}
            renderItem={({ item }) => <Row t={item} />}
            ListEmptyComponent={
              !loading && (
                <Text
                  style={{
                    color: theme.muted,
                    textAlign: "center",
                    marginTop: 16,
                  }}
                >
                  {q.trim() ? "No matches." : "Type a name to begin searching."}
                </Text>
              )
            }
          />
        </>
      )}
    </View>
  );
}

// ---------- styles ----------
const styles = StyleSheet.create({
  container: { flex: 1 },
  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  input: { flex: 1, fontSize: 16, paddingVertical: 6 },
  clearBtn: { paddingLeft: 10, paddingVertical: 6 },

  // rows
  row: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    gap: 10,
  },
  name: { fontSize: 16, fontWeight: "700" },
  score: { fontSize: 16, fontWeight: "800" },

  // cards + headings
  card: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 12,
  },

  // 2-column grid
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  statTile: {
    width: "48%",                // two columns with a nice gutter
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
  },
  statLabel: {
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  statValue: { fontSize: 20, fontWeight: "900", marginTop: 6 },
  statSub: { fontSize: 12, marginTop: 4 },
});
