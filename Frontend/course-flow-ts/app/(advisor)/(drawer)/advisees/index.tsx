// app/(advisor)/(drawer)/advisees/index.tsx
import React, { useMemo, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  TextInput,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useTheme } from "../../../../components/ThemeContext";
import ProgressBar from "../../../../components/ProgressBar";
import { useAuth } from "../../../../auth/AuthContext";

const API_BASE = (process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:8080/api").replace(/\/api\/?$/, "");

type Advisee = {
  id: string;
  name: string;
  netid: string;
  major: string;
  minor?: string;
  classStanding: string;
  creditsCompleted: number;
  creditsRequired: number;
  photoUrl?: string | null;
  graduationYear?: string | number | null;
};

function pickFirstStringField(
  obj: any,
  candidates: string[],
  fallback = ""
): { value: string; chosenField: string; rawValue: any } {
  for (const key of candidates) {
    const raw = obj?.[key];

    if (raw === undefined || raw === null) continue;

    if (Array.isArray(raw)) {
      const joined = raw
        .map((v) => String(v).trim())
        .filter(Boolean)
        .join(", ");

      if (joined) {
        return {
          value: joined,
          chosenField: key,
          rawValue: raw,
        };
      }
    }

    const str = String(raw).trim();
    if (str) {
      return {
        value: str,
        chosenField: key,
        rawValue: raw,
      };
    }
  }

  return {
    value: fallback,
    chosenField: "fallback",
    rawValue: fallback,
  };
}

function pickOptionalNumberField(
  obj: any,
  candidates: string[]
): { value: number | undefined; chosenField: string; rawValue: any } {
  for (const key of candidates) {
    const raw = obj?.[key];
    if (raw !== undefined && raw !== null && raw !== "") {
      const parsed = Number(raw);
      if (!Number.isNaN(parsed)) {
        return {
          value: parsed,
          chosenField: key,
          rawValue: raw,
        };
      }
    }
  }

  return {
    value: undefined,
    chosenField: "not_found",
    rawValue: undefined,
  };
}

const MOCK_ADVISEES: Advisee[] = [
  {
    id: "1",
    name: "Sarah Johnson",
    netid: "sjohnson",
    major: "Software Engineering",
    minor: "Data Science",
    classStanding: "Junior",
    creditsCompleted: 84,
    creditsRequired: 128,
    graduationYear: 2026,
  },
  {
    id: "2",
    name: "Kevin Lee",
    netid: "klee",
    major: "Computer Science",
    minor: "Cybersecurity",
    classStanding: "Sophomore",
    creditsCompleted: 46,
    creditsRequired: 128,
    graduationYear: 2027,
  },
  {
    id: "3",
    name: "Maria Garcia",
    netid: "mgarcia",
    major: "Cybersecurity Engineering",
    classStanding: "Senior",
    creditsCompleted: 115,
    creditsRequired: 128,
    graduationYear: 2025,
  },
];

function getStudentStatus(
  a: Advisee
): "Priority Review" | "Needs Attention" | "On Track" {
  const progress =
    a.creditsRequired > 0 ? a.creditsCompleted / a.creditsRequired : 0;

  const standing = (a.classStanding ?? "").toLowerCase();

  if (standing.includes("senior") && progress < 0.75) {
    return "Priority Review";
  }

  if (standing.includes("junior") && progress < 0.5) {
    return "Needs Attention";
  }

  if (progress < 0.3) {
    return "Needs Attention";
  }

  return "On Track";
}

type StudentProfile = {
  bio?: string | null;
  photoUrl?: string | null;
  displayName?: string | null;
  name?: string | null;
  email?: string | null;
  majors?: string[] | null;
  minors?: string[] | null;
  graduationYear?: string | null;
};

function getStatusColors(status: string) {
  if (status === "Priority Review") {
    return {
      text: "#DC2626",
      bg: "rgba(220, 38, 38, 0.12)",
      border: "rgba(220, 38, 38, 0.4)",
    };
  }

  if (status === "Needs Attention") {
    return {
      text: "#F59E0B",
      bg: "rgba(245, 158, 11, 0.12)",
      border: "rgba(245, 158, 11, 0.4)",
    };
  }

  return {
    text: "#22C55E",
    bg: "rgba(34, 197, 94, 0.12)",
    border: "rgba(34, 197, 94, 0.4)",
  };
}

function getStatusPriority(status: string): number {
  if (status === "Priority Review") return 0;
  if (status === "Needs Attention") return 1;
  return 2; // On Track
}

function getProgress(a: Advisee): number {
  if (a.creditsRequired <= 0) return 0;
  const value = a.creditsCompleted / a.creditsRequired;
  return Math.max(0, Math.min(1, value));
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase() ?? "")
    .join("");
}

function pickFirstNumberField(
  obj: any,
  candidates: string[],
  fallback: number
): { value: number; chosenField: string; rawValue: any } {
  for (const key of candidates) {
    const raw = obj?.[key];
    if (raw !== undefined && raw !== null && raw !== "") {
      const parsed = Number(raw);
      if (!Number.isNaN(parsed)) {
        return {
          value: parsed,
          chosenField: key,
          rawValue: raw,
        };
      }
    }
  }

  return {
    value: fallback,
    chosenField: "fallback",
    rawValue: fallback,
  };
}


        function getClassStandingFromGradYear(
  graduationYear?: string | null
): string {
  if (!graduationYear) return "N/A";

  const grad = Number(graduationYear);
  if (Number.isNaN(grad)) return "N/A";

  const currentYear = new Date().getFullYear();
  const yearsLeft = grad - currentYear;

  if (yearsLeft <= 1) return "Senior";
  if (yearsLeft === 2) return "Junior";
  if (yearsLeft === 3) return "Sophomore";
  if (yearsLeft >= 4) return "Freshman";

  return "N/A";
}

export default function AdviseesScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const { user } = useAuth();

  const advisorNetid =
    (user as any)?.netid ?? (user as any)?.userId ?? (user as any)?.id ?? "";

  const [searchQuery, setSearchQuery] = useState("");
  const [advisees, setAdvisees] = useState<Advisee[]>([]);
  const [loading, setLoading] = useState(false);

  const enrichWithProfiles = async (students: Advisee[]): Promise<Advisee[]> => {
  const token =
    (user as any)?.accessToken ??
    (user as any)?.token ??
    (user as any)?.jwt ??
    "";

  const enriched = await Promise.all(
    students.map(async (student) => {
      try {
        if (!student.netid) return student;

        const res = await fetch(
          `${API_BASE}/api/profile/${encodeURIComponent(student.netid)}`,
          {
            headers: token
              ? { Authorization: `Bearer ${token}` }
              : {},
          }
        );

        const text = await res.text();

        if (!res.ok) {
          console.warn(
            `[ADVISEES] Profile fetch failed for ${student.netid}:`,
            text
          );
          return student;
        }

        const profile: StudentProfile | null = text ? JSON.parse(text) : null;

        const resolvedMajor =
          profile?.majors?.join(", ")?.trim() ||
          student.major ||
          "N/A";

        const resolvedMinor =
          profile?.minors?.join(", ")?.trim() ||
          student.minor ||
          "N/A";

        const resolvedGraduationYear =
          profile?.graduationYear?.trim() ||
          (student.graduationYear != null ? String(student.graduationYear) : "") ||
          "N/A";

        const resolvedPhotoUrl =
          profile?.photoUrl?.trim() ||
          student.photoUrl ||
          null;

        const resolvedName =
          profile?.displayName?.trim() ||
          profile?.name?.trim() ||
          student.name ||
          "Unknown Student";

        return {
          ...student,
          name: resolvedName,
          major: resolvedMajor,
          minor: resolvedMinor,
          graduationYear: resolvedGraduationYear,
          photoUrl: resolvedPhotoUrl,
          classStanding: getClassStandingFromGradYear(resolvedGraduationYear),
        };
      } catch (err) {
        console.error(
          `[ADVISEES] Error enriching profile for ${student.netid}:`,
          err
        );
        return student;
      }
    })
  );

  return enriched;
};

  const loadAdvisees = useCallback(async () => {
    try {
      if (!advisorNetid) {
        console.log("[ADVISEES] No advisorNetid found on current user:", user);
        setAdvisees([]);
        return;
      }

      setLoading(true);

      const url = `${API_BASE}/api/advisor/${encodeURIComponent(
        advisorNetid
      )}/advisees`;

      console.log("[ADVISEES] Fetching advisees from:", url);
      console.log("[ADVISEES] advisorNetid:", advisorNetid);

      const res = await fetch(url);

      console.log("[ADVISEES] Response status:", res.status);

      if (!res.ok) {
        console.warn(
          "[ADVISEES] Backend response not OK. Falling back to MOCK_ADVISEES."
        );
        setAdvisees(MOCK_ADVISEES);
        return;
      }

      const raw = await res.json();

      console.log("[ADVISEES] RAW BACKEND RESPONSE:", raw);

      if (!Array.isArray(raw)) {
        console.warn(
          "[ADVISEES] Backend response is not an array. Falling back to MOCK_ADVISEES.",
          raw
        );
        setAdvisees(MOCK_ADVISEES);
        return;
      }

      const mapped: Advisee[] = raw.map((u: any, index: number) => {
        const completedInfo = pickFirstNumberField(
          u,
          [
            "completedCredits",
            "completed_credits",
            "creditsCompleted",
            "credits_completed",
            "earnedCredits",
            "earned_credits",
            "totalCompletedCredits",
            "total_completed_credits",
          ],
          0
        );

        const requiredInfo = pickFirstNumberField(
          u,
          [
            "requiredCredits",
            "required_credits",
            "creditsRequired",
            "credits_required",
            "totalRequiredCredits",
            "total_required_credits",
            "degreeCreditsRequired",
            "degree_credits_required",
          ],
          128
        );




        const majorInfo = pickFirstStringField(
  u,
  [
    "major",
    "majors",
    "studentMajor",
    "student_major",
  ],
  ""
);

const minorInfo = pickFirstStringField(
  u,
  [
    "minor",
    "minors",
    "studentMinor",
    "student_minor",
  ],
  ""
);

const classStandingInfo = pickFirstStringField(
  u,
  [
    "classStanding",
    "class_standing",
    "standing",
    "studentStanding",
    "student_standing",
  ],
  ""
);

const graduationYearInfo = pickFirstStringField(
  u,
  [
    "graduationYear",
    "graduation_year",
    "expectedGraduationYear",
    "expected_graduation_year",
    "gradYear",
    "grad_year",
  ],
  ""
);

const photoUrlInfo = pickFirstStringField(
  u,
  [
    "photoUrl",
    "photo_url",
    "avatarUrl",
    "avatar_url",
  ],
  ""
);


const mappedAdvisee: Advisee = {
  id: String(u.id ?? u.netid ?? Math.random()),
  netid: String(u.netid ?? ""),
  name:
    u.fullName ||
    u.full_name ||
    u.displayName ||
    u.display_name ||
    u.name ||
    u.netid ||
    "Unknown Student",
  major: majorInfo.value,
  minor: minorInfo.value,
classStanding: getClassStandingFromGradYear(
  graduationYearInfo.value
),
  creditsCompleted: completedInfo.value,
  creditsRequired: requiredInfo.value,
  photoUrl: photoUrlInfo.value || null,
  graduationYear: graduationYearInfo.value || null,
};

        console.log(`[ADVISEES] --- Student ${index + 1} debug ---`);
        console.log("[ADVISEES] Raw student object:", u);
        console.log("[ADVISEES] Student netid:", u.netid);
        console.log("[ADVISEES] Available keys:", Object.keys(u));

        console.log("[ADVISEES] Candidate credit fields:", {
          completedCredits: u.completedCredits,
          completed_credits: u.completed_credits,
          creditsCompleted: u.creditsCompleted,
          credits_completed: u.credits_completed,
          earnedCredits: u.earnedCredits,
          earned_credits: u.earned_credits,
          totalCompletedCredits: u.totalCompletedCredits,
          total_completed_credits: u.total_completed_credits,
          requiredCredits: u.requiredCredits,
          required_credits: u.required_credits,
          creditsRequired: u.creditsRequired,
          credits_required: u.credits_required,
          totalRequiredCredits: u.totalRequiredCredits,
          total_required_credits: u.total_required_credits,
          degreeCreditsRequired: u.degreeCreditsRequired,
          degree_credits_required: u.degree_credits_required,
        });

        console.log("[ADVISEES] Selected major field:", {
  chosenField: majorInfo.chosenField,
  rawValue: majorInfo.rawValue,
  parsedValue: majorInfo.value,
});

console.log("[ADVISEES] Selected minor field:", {
  chosenField: minorInfo.chosenField,
  rawValue: minorInfo.rawValue,
  parsedValue: minorInfo.value,
});

console.log("[ADVISEES] Selected class standing field:", {
  chosenField: classStandingInfo.chosenField,
  rawValue: classStandingInfo.rawValue,
  parsedValue: classStandingInfo.value,
});

console.log("[ADVISEES] Selected graduation year field:", {
  chosenField: graduationYearInfo.chosenField,
  rawValue: graduationYearInfo.rawValue,
  parsedValue: graduationYearInfo.value,
});



        console.log("[ADVISEES] Selected completed credits field:", {
          chosenField: completedInfo.chosenField,
          rawValue: completedInfo.rawValue,
          parsedValue: completedInfo.value,
        });

        console.log("[ADVISEES] Selected required credits field:", {
          chosenField: requiredInfo.chosenField,
          rawValue: requiredInfo.rawValue,
          parsedValue: requiredInfo.value,
        });

        console.log("[ADVISEES] Final mapped advisee:", mappedAdvisee);

        return mappedAdvisee;
      });

      console.log("[ADVISEES] FINAL MAPPED ADVISEES:", mapped);
      const enriched = await enrichWithProfiles(mapped);
console.log("[ADVISEES] FINAL ENRICHED ADVISEES:", enriched);
setAdvisees(enriched);
    } catch (err) {
      console.error("[ADVISEES] Error loading advisees:", err);
      setAdvisees(MOCK_ADVISEES);
    } finally {
      setLoading(false);
    }
  }, [advisorNetid, user]);

  useFocusEffect(
    useCallback(() => {
      loadAdvisees();
    }, [loadAdvisees])
  );

  const stats = useMemo(() => {
    const total = advisees.length;

    let progressSum = 0;
    let progressCount = 0;
    let highGpaCount = 0;
    let lowGpaCount = 0;
    let nearGradCount = 0;

    for (const a of advisees) {
      

      const p = getProgress(a);
      if (!Number.isNaN(p)) {
        progressSum += p;
        progressCount++;
        if (p >= 0.8) nearGradCount++;
      }
    }

    const avgProgress = progressCount ? progressSum / progressCount : 0;

    return {
      total,
      avgProgress,
      highGpaCount,
      lowGpaCount,
      nearGradCount,
    };
  }, [advisees]);

const filteredAdvisees = useMemo(() => {
  // 1. sort first
  const sorted = [...advisees].sort((a, b) => {
    const statusA = getStudentStatus(a);
    const statusB = getStudentStatus(b);

    const priorityDiff =
      getStatusPriority(statusA) - getStatusPriority(statusB);

    if (priorityDiff !== 0) return priorityDiff;

    // optional tie-breaker: lower progress first
    const progressA =
      a.creditsRequired > 0
        ? a.creditsCompleted / a.creditsRequired
        : 0;

    const progressB =
      b.creditsRequired > 0
        ? b.creditsCompleted / b.creditsRequired
        : 0;

    return progressA - progressB;
  });

  // 2. then filter
  const q = searchQuery.trim().toLowerCase();
  if (!q) return sorted;

  return sorted.filter((a) => {
    const haystack = [
      a.name,
      a.netid,
      a.major,
      a.minor ?? "",
      a.classStanding,
    ]
      .join(" ")
      .toLowerCase();

    return haystack.includes(q);
  });
}, [searchQuery, advisees]);

  // const handleAction = (
  //   advisee: Advisee,
  //   mode: "profile" | "plan" | "message"
  // ) => {
  //   router.push({
  //     pathname: "/(advisor)/advisees/advisee-details",
  //     params: {
  //       netid: advisee.netid,
  //       name: advisee.name,
  //       mode,
  //       from: "advisees",
  //       photoUrl: advisee.photoUrl ?? "",
  //       graduationYear: advisee.graduationYear
  //         ? String(advisee.graduationYear)
  //         : "",
  //       major: advisee.major ?? "",
  //       minor: advisee.minor ?? "",
  //       classStanding: advisee.classStanding ?? "",
  //       gpa: typeof advisee.gpa === "number" ? advisee.gpa.toString() : "",
  //       creditsCompleted: String(advisee.creditsCompleted ?? 0),
  //       creditsRequired: String(advisee.creditsRequired ?? 128),
  //     },
  //   });
  // };

  const handleAction = (
  advisee: Advisee,
  mode: "profile" | "plan" | "message"
) => {
  router.push({
    pathname: "/(advisor)/advisees/advisee-details",
    params: {
      netid: advisee.netid,
      name: advisee.name,
      mode,
      from: "advisees",
      photoUrl: advisee.photoUrl ?? "",
      graduationYear: advisee.graduationYear ?? "",
      major: advisee.major ?? "",
      minor: advisee.minor ?? "",
      classStanding: advisee.classStanding ?? "",
      // gpa: typeof advisee.gpa === "number" ? advisee.gpa.toString() : "",
      creditsCompleted: String(advisee.creditsCompleted ?? 0),
      creditsRequired: String(advisee.creditsRequired ?? 128),
    },
  });
};

  const handleAddPress = () => {
    const existingNetids = advisees
      .map((a) => a.netid)
      .filter((n) => typeof n === "string" && n.length > 0);

    router.push({
      pathname: "/(advisor)/advisees/add-advisee",
      params: {
        existingNetids: JSON.stringify(existingNetids),
      },
    });
  };

  const renderItem = ({ item }: { item: Advisee }) => {
    const progress = getProgress(item);
    const status = getStudentStatus(item);
const statusColors = getStatusColors(status);
    const progressPercent = Math.round(progress * 100);

    return (
      <View
        style={[
          styles.card,
          { backgroundColor: theme.card, borderColor: theme.border },
        ]}
      >
        <View
          style={[
            styles.riskBar,
            { backgroundColor: theme.primary, opacity: 0.9 },
          ]}
        />

        <View style={styles.row}>
          {item.photoUrl ? (
            <Image
              source={{ uri: item.photoUrl }}
              style={styles.avatar}
              resizeMode="cover"
            />
          ) : (
            <View
              style={[
                styles.avatar,
                { backgroundColor: theme.primary ?? "#C8102E" },
              ]}
            >
              <Text style={styles.avatarText}>
                {getInitials(item.name || item.netid)}
              </Text>
            </View>
          )}

<View style={{ flex: 1, marginLeft: 10 }}>
  <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
    <Text style={[styles.name, { color: theme.text }]}>
      {item.name}
    </Text>

    <View
      style={[
        styles.statusPill,
        {
          backgroundColor: statusColors.bg,
          borderColor: statusColors.border,
        },
      ]}
    >
      <Text
        style={[
          styles.statusText,
          { color: statusColors.text },
        ]}
      >
        {status}
      </Text>
    </View>
  </View>
            {/* <Text style={{ color: theme.muted, marginTop: 2 }}>{item.netid}</Text>
            <Text style={{ color: theme.muted, marginTop: 2 }}>
              {item.classStanding}
            </Text>
            <Text style={{ color: theme.muted, marginTop: 2 }}>{item.major}</Text>
            {item.minor ? (
              <Text style={{ color: theme.muted, marginTop: 2 }}>
                Minor: {item.minor}
              </Text>
            ) : null} */}
            <Text style={{ color: theme.muted, marginTop: 2 }}>{item.netid}</Text>

{/* <Text style={{ color: theme.muted, marginTop: 2 }}>
  Standing: {item.classStanding || "N/A"}
</Text>

<Text style={{ color: theme.muted, marginTop: 2 }}>
  Major: {item.major || "N/A"}
</Text>

<Text style={{ color: theme.muted, marginTop: 2 }}>
  Graduation: {item.graduationYear || "N/A"}
</Text>

<Text style={{ color: theme.muted, marginTop: 2 }}>
  Minor: {item.minor || "N/A"}
</Text>*/}
<Text style={{ color: theme.muted, marginTop: 2 }}>
  Class Standing: {item.classStanding || "N/A"}
</Text>

{/* <Text style={{ color: theme.muted, marginTop: 2 }}>
  GPA: {typeof item.gpa === "number" ? item.gpa.toFixed(2) : "N/A"}
</Text> */}

<Text style={{ color: theme.muted, marginTop: 2 }}>
  Graduation Year: {item.graduationYear || "N/A"}
</Text>

<Text style={{ color: theme.muted, marginTop: 2 }}>
  Major: {item.major || "N/A"}
</Text>

<Text style={{ color: theme.muted, marginTop: 2 }}>
  Minor: {item.minor || "N/A"}
</Text>

          </View>

          {/* <View style={{ alignItems: "flex-end" }}> */}

<View style={{ alignItems: "flex-end", justifyContent: "center" }}>            {/* {typeof item.gpa === "number" && (
              <View
                style={[
                  styles.gpaPill,
                  {
                    backgroundColor: theme.background,
                    borderColor: theme.border,
                  },
                ]}
              >
                <Text style={[styles.gpaLabel, { color: theme.muted }]}>GPA</Text>
                <Text style={[styles.gpaValueSmall, { color: theme.text }]}>
                  {item.gpa.toFixed(2)}
                </Text>
              </View>
            )} */}
          
          </View>
        </View>

        <View style={{ marginTop: 12 }}>
          <View style={styles.progressHeaderRow}>
            <Text style={[styles.progressTitle, { color: theme.text }]}>
              Degree Progress
            </Text>
          </View>

          <Text style={{ color: theme.muted, fontSize: 12, marginBottom: 6 }}>
            {item.creditsCompleted} completed / {item.creditsRequired} required
            credits
          </Text>

          <ProgressBar
            progress={progress}
            width={undefined}
            height={14}
            completedColor={theme.primary}
            remainingColor={theme.border}
          />
        </View>

        <View style={styles.actionRow}>
          <ActionButton
            label="Profile"
            icon="person-outline"
            onPress={() => handleAction(item, "profile")}
            theme={theme}
          />
          <ActionButton
            label="Plan"
            icon="school-outline"
            onPress={() => handleAction(item, "plan")}
            theme={theme}
          />
          <ActionButton
            label="Message"
            icon="chatbubble-ellipses-outline"
            onPress={() => handleAction(item, "message")}
            theme={theme}
          />
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.headerRow}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.headerTitle, { color: theme.text }]}>
            Advisees
          </Text>
          <Text style={{ color: theme.muted, marginTop: 2 }}>
            Overview of your assigned students
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: theme.primary }]}
          onPress={handleAddPress}
          activeOpacity={0.9}
        >
          <Ionicons name="add" size={18} color={theme.background} />
          <Text style={[styles.addButtonText, { color: theme.background }]}>
            Add
          </Text>
        </TouchableOpacity>
      </View>

      <View
        style={[
          styles.summaryCard,
          { backgroundColor: theme.card, borderColor: theme.border },
        ]}
      >
        <View style={styles.summaryGrid}>
          <SummaryPill
            label="Advisees"
            value={String(stats.total)}
            theme={theme}
          />
          {/* <SummaryPill
            label="Avg GPA"
            value={stats.avgGpa !== null ? stats.avgGpa.toFixed(2) : "—"}
            theme={theme}
          /> */}
          <SummaryPill
            label="Avg Progress"
            value={`${Math.round(stats.avgProgress * 100)}%`}
            theme={theme}
          />
        </View>
      </View>

      <View
        style={[
          styles.searchWrap,
          { backgroundColor: theme.card, borderColor: theme.border },
        ]}
      >
        <Ionicons name="search" size={18} color={theme.muted} />
        <TextInput
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search advisees"
          placeholderTextColor={theme.muted}
          style={[styles.searchInput, { color: theme.text }]}
        />
      </View>

      {loading ? (
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={{ color: theme.muted, marginTop: 10 }}>
            Loading advisees...
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredAdvisees}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 20 }}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={[styles.emptyTitle, { color: theme.text }]}>
                No advisees found
              </Text>
              <Text style={{ color: theme.muted, marginTop: 4 }}>
                Try a different search or add a student.
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}

function ActionButton({
  label,
  icon,
  onPress,
  theme,
}: {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  theme: any;
}) {
  return (
    <TouchableOpacity
      style={[
        styles.actionButton,
        { backgroundColor: theme.background, borderColor: theme.border },
      ]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <Ionicons name={icon} size={16} color={theme.primary} />
      <Text style={[styles.actionButtonText, { color: theme.text }]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

function SummaryPill({
  label,
  value,
  theme,
}: {
  label: string;
  value: string;
  theme: any;
}) {
  return (
    <View
      style={[
        styles.summaryPill,
        { backgroundColor: theme.background, borderColor: theme.border },
      ]}
    >
      <Text style={[styles.summaryValue, { color: theme.text }]}>{value}</Text>
      <Text style={[styles.summaryLabel, { color: theme.muted }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  statusPill: {
  borderWidth: 1,
  borderRadius: 999,
  paddingHorizontal: 10,
  paddingVertical: 4,
},

statusText: {
  fontSize: 10,
  fontWeight: "700",
  textTransform: "uppercase",
  letterSpacing: 0.4,
},
  container: {
    flex: 1,
    padding: 20,
  },

  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 12,
  },

  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
  },

  addButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
  },

  addButtonText: {
    fontSize: 14,
    fontWeight: "700",
  },

  summaryCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
  },

  summaryGrid: {
    flexDirection: "row",
    gap: 8,
  },

  summaryPill: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 10,
  },

  summaryValue: {
    fontSize: 16,
    fontWeight: "700",
  },

  summaryLabel: {
    fontSize: 12,
    marginTop: 2,
  },

  searchWrap: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },

  searchInput: {
    flex: 1,
    fontSize: 14,
  },

  card: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    marginBottom: 14,
    overflow: "hidden",
  },

  riskBar: {
    position: "absolute",
    left: 0,
    top: 0,
    right: 0,
    height: 4,
  },

  row: {
    flexDirection: "row",
    alignItems: "flex-start",
  },

  avatar: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: "center",
    justifyContent: "center",
  },

  avatarText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 18,
  },

  name: {
    fontSize: 17,
    fontWeight: "700",
  },

  progressHeaderRow: {
    marginBottom: 2,
  },

  progressTitle: {
    fontSize: 14,
    fontWeight: "700",
  },

  progressPercent: {
    fontSize: 13,
    fontWeight: "700",
  },

  actionRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 14,
  },

  actionButton: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 6,
  },

  actionButtonText: {
    fontSize: 13,
    fontWeight: "600",
  },

  centerState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  emptyState: {
    paddingTop: 40,
    alignItems: "center",
  },

  emptyTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
});