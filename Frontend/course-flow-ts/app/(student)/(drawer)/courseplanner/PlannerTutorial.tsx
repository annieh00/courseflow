import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import {
  CalendarDays,
  Search,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  ArrowLeftRight,
  Check,
} from "lucide-react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const THEME_COLOR = "#7C3AED";
const THEME_LIGHT = "#F5F3FF";
const STORAGE_KEY = "planner-tutorial-seen";

const TOUR_STEPS = [
  {
    icon: <CalendarDays size={40} color={THEME_COLOR} strokeWidth={1.5} />,
    title: "Plan Your Course Load",
    description:
      "The Course Planner is your semester-by-semester schedule builder. Lay out exactly which classes you'll take each Fall, Spring, Summer, or Winter across all your years.",
    extra: null,
  },
  {
    icon: <Search size={40} color={THEME_COLOR} strokeWidth={1.5} />,
    title: "Add Classes Three Ways",
    description:
      "Tap + Add on any semester card to open the course picker. You can search any course by name or code, browse your degree requirements by category, or import courses you've already completed from your Degree Flowchart.",
    extra: null,
  },
  {
    icon: <CheckCircle2 size={40} color={THEME_COLOR} strokeWidth={1.5} />,
    title: "Mark Progress Directly Here",
    description:
      "Each course card has a small circle on its left edge. Tap it to cycle through three states:",
    extra: "status-demo",
  },
  {
    icon: <AlertTriangle size={40} color="#F59E0B" strokeWidth={1.5} />,
    title: "Prerequisites Are Flagged",
    description:
      "If a course appears before its prerequisite in your plan, an ⚠ badge will appear on that course. Tap the badge to see exactly what's missing, or override it if you have advisor approval or an exemption.",
    extra: null,
  },
  {
    icon: <RefreshCw size={40} color={THEME_COLOR} strokeWidth={1.5} />,
    title: "Synced with Your Degree Flowchart",
    description:
      "Status changes you make here (In Progress, Completed) update your Degree Flowchart page too — and vice versa. Your dashboard credit count always reflects the latest state.",
    extra: null,
  },
  {
    icon: <ArrowLeftRight size={40} color={THEME_COLOR} strokeWidth={1.5} />,
    title: "Move, Add Years & Organize",
    description:
      "Use the ↔ button on any course to move it to a different semester. You can expand to Summer or Winter terms, add more years beyond 4, and remove empty years as needed.",
    extra: null,
  },
];

export function PlannerTutorial() {
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then(val => {
      if (!val) setVisible(true);
    });
  }, []);

  const dismiss = async () => {
    await AsyncStorage.setItem(STORAGE_KEY, "true");
    setVisible(false);
  };

  const next = () => {
    if (step < TOUR_STEPS.length - 1) {
      setStep(step + 1);
    } else {
      dismiss();
    }
  };

  if (!visible) return null;

  const current = TOUR_STEPS[step];

  return (
    <Modal visible transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={styles.iconContainer}>{current.icon}</View>
          <Text style={styles.title}>{current.title}</Text>
          <Text style={styles.description}>{current.description}</Text>

          {current.extra === "status-demo" && <StatusDemo />}

          {/* Progress dots */}
          <View style={styles.dots}>
            {TOUR_STEPS.map((_, i) => (
              <View key={i} style={[styles.dot, i === step && styles.dotActive]} />
            ))}
          </View>

          <View style={styles.actions}>
            <TouchableOpacity style={styles.skipBtn} onPress={dismiss}>
              <Text style={styles.skipText}>Skip Tour</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.nextBtn} onPress={next}>
              <Text style={styles.nextText}>
                {step < TOUR_STEPS.length - 1 ? "Next →" : "Get Started"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function StatusDemo() {
  return (
    <View style={styles.demoContainer}>
      {/* Planned */}
      <View style={styles.demoItem}>
        <View style={[styles.demoDot, { borderWidth: 1.5, borderColor: "#CBD5E1" }]} />
        <Text style={styles.demoLabel}>Planned</Text>
        <Text style={styles.demoSub}>(default)</Text>
      </View>

      <Text style={styles.demoArrow}>→</Text>

      {/* In Progress */}
      <View style={styles.demoItem}>
        <View style={[styles.demoDot, { borderWidth: 2, borderColor: "#F59E0B" }]} />
        <Text style={[styles.demoLabel, { color: "#F59E0B" }]}>In Progress</Text>
        <Text style={styles.demoSub}>1 tap</Text>
      </View>

      <Text style={styles.demoArrow}>→</Text>

      {/* Completed */}
      <View style={styles.demoItem}>
        <View style={[styles.demoDot, { backgroundColor: "#16A34A" }]}>
          <Check size={9} color="#fff" strokeWidth={3} />
        </View>
        <Text style={[styles.demoLabel, { color: "#16A34A" }]}>Completed</Text>
        <Text style={styles.demoSub}>2 taps</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.8)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 32,
    width: "100%",
    maxWidth: 420,
    alignItems: "center",
    gap: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 6,
  },
  iconContainer: {
    backgroundColor: THEME_LIGHT,
    padding: 20,
    borderRadius: 20,
    marginBottom: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1E293B",
    textAlign: "center",
  },
  description: {
    fontSize: 14,
    color: "#64748B",
    textAlign: "center",
    lineHeight: 21,
  },

  // Status demo
  demoContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#F8FAFC",
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 10,
    width: "100%",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  demoItem: {
    alignItems: "center",
    gap: 4,
    flex: 1,
  },
  demoDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  demoLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#475569",
    textAlign: "center",
  },
  demoSub: {
    fontSize: 10,
    color: "#94A3B8",
    textAlign: "center",
  },
  demoArrow: {
    fontSize: 14,
    color: "#CBD5E1",
    fontWeight: "600",
  },

  // Dots
  dots: { flexDirection: "row", gap: 8, marginTop: 4 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#E2E8F0" },
  dotActive: { width: 24, backgroundColor: THEME_COLOR },

  // Actions
  actions: { flexDirection: "row", gap: 12, width: "100%", marginTop: 4 },
  skipBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    alignItems: "center",
  },
  skipText: { fontSize: 14, color: "#64748B", fontWeight: "500" },
  nextBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: THEME_COLOR,
    alignItems: "center",
  },
  nextText: { fontSize: 14, color: "#FFFFFF", fontWeight: "600" },
});
