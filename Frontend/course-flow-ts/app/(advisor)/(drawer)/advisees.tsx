import React from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
} from "react-native";
import { useRouter } from "expo-router";
import { useTheme } from "../../../components/ThemeContext";
import ProgressBar from "../../../components/ProgressBar";

type Advisee = {
  id: string;
  name: string;
  netid: string;
  major: string;
  minor?: string;
  classStanding: string;
  gpa?: number;
  creditsCompleted: number;
  creditsRequired: number;
  photoUrl?: string | null;        // 👈 NEW
  graduationYear?: number | null;  // optional, from profiles.graduation_year
};


const MOCK_ADVISEES: Advisee[] = [
  {
    id: "1",
    name: "Sarah Johnson",
    netid: "sjohnson",
    major: "Software Engineering",
    minor: "Data Science",
    classStanding: "Junior",
    gpa: 3.72,
    creditsCompleted: 84,
    creditsRequired: 128,
  },
  {
    id: "2",
    name: "Kevin Lee",
    netid: "klee",
    major: "Computer Science",
    minor: "Cybersecurity",
    classStanding: "Sophomore",
    gpa: 3.15,
    creditsCompleted: 46,
    creditsRequired: 128,
  },
  {
    id: "3",
    name: "Maria Garcia",
    netid: "mgarcia",
    major: "Cybersecurity Engineering",
    classStanding: "Senior",
    gpa: 3.94,
    creditsCompleted: 115,
    creditsRequired: 128,
  },
];

export default function AdviseesScreen() {
  const { theme } = useTheme();
  const router = useRouter();

const handleAction = (
  advisee: Advisee,
  mode: "profile" | "plan" | "message"
) => {
  router.push({
    pathname: "advisee-details",
    params: {
      netid: advisee.netid,
      name: advisee.name,
      mode,
      photoUrl: advisee.photoUrl ?? "",       // 👈 pass through
      graduationYear: advisee.graduationYear
        ? String(advisee.graduationYear)
        : "",
    },
  });
};

  

  const renderItem = ({ item }: { item: Advisee }) => {
    const progress =
      item.creditsRequired > 0
        ? item.creditsCompleted / item.creditsRequired
        : 0;

    return (
      <View
        style={[
          styles.card,
          { backgroundColor: theme.card, borderColor: theme.border },
        ]}
      >
        {/* Top: Name + basic info */}
        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.name, { color: theme.text }]}>
              {item.name}
            </Text>
            <Text style={{ color: theme.muted, marginTop: 2 }}>
              {item.netid} • {item.classStanding}
            </Text>
            <Text style={{ color: theme.muted, marginTop: 2 }}>
              {item.major}
              {item.minor ? ` • Minor: ${item.minor}` : ""}
            </Text>
          </View>
          {typeof item.gpa === "number" && (
            <View style={styles.gpaPill}>
              <Text style={[styles.gpaLabel, { color: theme.muted }]}>GPA</Text>
              <Text style={[styles.gpaValueSmall, { color: theme.text }]}>
                {item.gpa.toFixed(2)}
              </Text>
            </View>
          )}
        </View>

        {/* Progress toward degree */}
        <View style={{ marginTop: 10 }}>
          <Text style={{ color: theme.muted, fontSize: 12, marginBottom: 4 }}>
            Degree progress · {item.creditsCompleted}/{item.creditsRequired}{" "}
            credits
          </Text>
          <ProgressBar
            progress={progress}
            width={undefined}
            height={18}
            completedColor={theme.primary}
            remainingColor="#FFC72C"
          />
          <Text
            style={{
              color: theme.muted,
              fontSize: 12,
              marginTop: 4,
            }}
          >
            {Math.round(progress * 100)}% complete
          </Text>
        </View>

        {/* Actions */}
        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={[styles.actionButton, { borderColor: theme.primary }]}
            onPress={() => handleAction(item, "profile")}
          >
            <Text style={[styles.actionText, { color: theme.primary }]}>
              View Profile
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, { borderColor: theme.primary }]}
            onPress={() => handleAction(item, "plan")}
          >
            <Text style={[styles.actionText, { color: theme.primary }]}>
              View Plan
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.actionButton,
              { borderColor: theme.primary, backgroundColor: theme.primary },
            ]}
            onPress={() => handleAction(item, "message")}
          >
            <Text
              style={[
                styles.actionText,
                { color: theme.background, fontWeight: "700" },
              ]}
            >
              Send Message
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Text style={[styles.header, { color: theme.text }]}>My Advisees</Text>
      <Text style={{ color: theme.muted, marginBottom: 12 }}>
        Tap an action to review a student’s plan, profile, or send a quick
        message.
      </Text>
      <FlatList
        data={MOCK_ADVISEES}
        keyExtractor={(a) => a.id}
        renderItem={renderItem}
        contentContainerStyle={{ paddingVertical: 8 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  header: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 4,
  },
  card: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
  },
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  name: { fontSize: 16, fontWeight: "600" },
  gpaPill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: StyleSheet.hairlineWidth,
  },
  gpaLabel: { fontSize: 10, textTransform: "uppercase" },
  gpaValue: { fontSize: 16, fontWeight: "700" },
  actionsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 12,
    gap: 8,
  },
  gpaValueSmall: {
  fontSize: 13,       // smaller than before
  fontWeight: "700",
},

  actionButton: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 999,
    paddingVertical: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  actionText: {
    fontSize: 13,
    fontWeight: "600",
  },
});
