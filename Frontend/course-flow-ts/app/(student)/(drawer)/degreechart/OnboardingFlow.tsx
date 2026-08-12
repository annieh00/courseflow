import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import {
  GraduationCap,
  BookOpen,
  MousePointerClick,
  Layers,
  TrendingUp,
  CloudUpload,
  CheckCircle2,
} from "lucide-react-native";
import { useFlowchart } from "./FlowchartContext";
import { useAuth } from "../../../../auth/AuthContext";
import { degreePrograms } from "./degree-programs";

const THEME_COLOR = "#F59E0B"; // Warm Golden Yellow

const _isLocal = typeof window === 'undefined' || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const _API_BASE = `${_isLocal ? 'http://localhost:8080' : 'https://sdmay26-48.ece.iastate.edu'}/api`;
const THEME_LIGHT = "#FFFBEB"; // Very light yellow for backgrounds

const TOUR_STEPS = [
  {
    icon: <GraduationCap size={40} color={THEME_COLOR} strokeWidth={1.5} />,
    title: "Your 4-Year Degree Flowchart",
    description:
      "This is your official semester-by-semester course layout. Courses are organized into 8 semesters across 4 years.",
  },
  {
    icon: <MousePointerClick size={40} color={THEME_COLOR} strokeWidth={1.5} />,
    title: "Track Your Completion",
    description:
      "Tap a course once to mark it as In Progress. Tap it a second time to mark it as Completed.",
  },
  {
    icon: <Layers size={40} color={THEME_COLOR} strokeWidth={1.5} />,
    title: "Choose One Groups",
    description:
      "Some requirements let you pick one course from a group. Tap a course in a dashed card to select and complete it.",
  },
  {
    icon: <TrendingUp size={40} color={THEME_COLOR} strokeWidth={1.5} />,
    title: "Monitor Your Progress",
    description:
      "Tap the Progress button at any time to see your remaining credits. It updates live as you check off courses.",
  },
  {
    icon: <CloudUpload size={40} color={THEME_COLOR} strokeWidth={1.5} />,
    title: "Save Your Progress",
    description:
      "Make sure to click the save button to save your progress. You can pick up exactly where you left off on any device.",
  },
];

export function OnboardingFlow() {
  const { 
    hasSeenOnboarding, 
    markOnboardingSeen, 
    setSelectedProgram, 
  } = useFlowchart();
  
  const { accessToken } = useAuth();

  const [step, setStep] = useState<"loading" | "select" | "tour" | "done">(
    hasSeenOnboarding ? "done" : "loading"
  );
  const [tourStep, setTourStep] = useState(0);
  const [tempProgram, setTempProgram] = useState<string>("");
  const [programPickerOpen, setProgramPickerOpen] = useState(false);
  const [isCreatingPlan, setIsCreatingPlan] = useState(false);

  useEffect(() => {
    const checkUserStatus = async () => {
      if (hasSeenOnboarding) {
        setStep("done");
        return;
      }
      if (!accessToken) {
        setStep("select");
        return;
      }
      try {
        const url = `${_API_BASE}/user/plans/SE/audit`;
        const response = await fetch(url, {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        });
        const result = await response.json();
        if (result.success === true) {
          setSelectedProgram("SE"); 
          markOnboardingSeen();
          setStep("done");
        } else {
          setStep("select");
        }
      } catch (error) {
        setStep("select");
      }
    };
    checkUserStatus();
  }, [accessToken, hasSeenOnboarding]);

  const handleContinue = async () => {
    setIsCreatingPlan(true);
    try {
      await fetch(`${_API_BASE}/user/plans/create`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          programId: "SE",
          degreeType: "MAJOR",
        }),
      });
      setSelectedProgram("SE");
      setStep("tour");
    } catch (error) {
      setSelectedProgram("SE");
      setStep("tour");
    } finally {
      setIsCreatingPlan(false);
    }
  };

  const handleNextTour = () => {
    if (tourStep < TOUR_STEPS.length - 1) {
      setTourStep(tourStep + 1);
    } else {
      markOnboardingSeen();
      setStep("done");
    }
  };

  const handleSkip = () => {
    setSelectedProgram("SE");
    markOnboardingSeen();
    setStep("done");
  };

  if (step === "done" || hasSeenOnboarding) return null;

  if (step === "loading") {
    return (
      <Modal visible transparent animationType="fade">
        <View style={styles.overlay}>
          <ActivityIndicator size="large" color={THEME_COLOR} />
          <Text style={{ color: "#FFF", marginTop: 10 }}>Checking for existing plans...</Text>
        </View>
      </Modal>
    );
  }

  if (step === "select") {
    return (
      <Modal visible transparent animationType="fade">
        <View style={styles.overlay}>
          <View style={styles.card}>
            <View style={styles.iconContainer}>
              <GraduationCap size={48} color={THEME_COLOR} strokeWidth={1.5} />
            </View>
            <Text style={styles.title}>Welcome to Your Degree Tracker</Text>
            <Text style={styles.description}>
              Select your degree program to view your official 4-year flowchart.
            </Text>

            <Text style={styles.pickerLabel}>Select Degree Program</Text>
            <TouchableOpacity
              style={styles.pickerTrigger}
              onPress={() => setProgramPickerOpen(true)}
              disabled={isCreatingPlan}
            >
              <Text style={[styles.pickerTriggerText, !tempProgram && { color: "#94A3B8" }]}>
                {tempProgram
                  ? `${degreePrograms[tempProgram]?.program} — ${degreePrograms[tempProgram]?.institution}`
                  : "Choose your program..."}
              </Text>
              <Text style={styles.pickerChevron}>▾</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.continueBtn, 
                (!tempProgram || isCreatingPlan) && styles.continueBtnDisabled
              ]}
              onPress={handleContinue}
              disabled={!tempProgram || isCreatingPlan}
            >
              {isCreatingPlan ? (
                <ActivityIndicator color="#FFF" size="small" />
              ) : (
                <Text style={styles.continueBtnText}>Continue →</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>

        <Modal visible={programPickerOpen} transparent animationType="slide">
          <View style={styles.pickerOverlay}>
            <View style={styles.pickerSheet}>
              <Text style={styles.pickerSheetTitle}>Choose Program</Text>
              {Object.entries(degreePrograms).map(([id, prog]) => (
                <TouchableOpacity
                  key={id}
                  style={[styles.pickerOption, tempProgram === id && styles.pickerOptionSelected]}
                  onPress={() => {
                    setTempProgram(id);
                    setProgramPickerOpen(false);
                  }}
                >
                  <Text style={[styles.pickerOptionText, tempProgram === id && styles.pickerOptionTextSelected]}>
                    {prog.program} — {prog.institution}
                  </Text>
                  {tempProgram === id && <CheckCircle2 size={18} color={THEME_COLOR} />}
                </TouchableOpacity>
              ))}
              <TouchableOpacity style={styles.pickerCancelBtn} onPress={() => setProgramPickerOpen(false)}>
                <Text style={styles.pickerCancelText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </Modal>
    );
  }

  if (step === "tour") {
    const current = TOUR_STEPS[tourStep];
    return (
      <Modal visible transparent animationType="fade">
        <View style={styles.overlay}>
          <View style={styles.card}>
            <View style={styles.iconContainer}>
              {current.icon}
            </View>
            <Text style={styles.title}>{current.title}</Text>
            <Text style={styles.description}>{current.description}</Text>

            <View style={styles.dots}>
              {TOUR_STEPS.map((_, i) => (
                <View key={i} style={[styles.dot, i === tourStep && styles.dotActive]} />
              ))}
            </View>

            <View style={styles.tourActions}>
              <TouchableOpacity style={styles.skipBtn} onPress={handleSkip}>
                <Text style={styles.skipBtnText}>Skip Tour</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.nextBtn} onPress={handleNextTour}>
                <Text style={styles.nextBtnText}>
                  {tourStep < TOUR_STEPS.length - 1 ? "Next →" : "Start Tracking"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  }

  return null;
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
    maxWidth: 400,
    alignItems: "center",
    gap: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 5,
  },
  iconContainer: {
    marginBottom: 8,
    backgroundColor: THEME_LIGHT,
    padding: 20,
    borderRadius: 20,
  },
  title: { fontSize: 20, fontWeight: "700", color: "#1E293B", textAlign: "center" },
  description: { fontSize: 15, color: "#64748B", textAlign: "center", lineHeight: 22 },
  pickerLabel: { alignSelf: "flex-start", fontSize: 13, fontWeight: "600", color: "#1E293B", marginTop: 8 },
  pickerTrigger: { width: "100%", flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderWidth: 1, borderColor: "#E2E8F0", borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, backgroundColor: "#F8FAFC" },
  pickerTriggerText: { flex: 1, fontSize: 14, color: "#1E293B" },
  pickerChevron: { fontSize: 12, color: "#94A3B8" },
  continueBtn: { width: "100%", backgroundColor: THEME_COLOR, borderRadius: 12, paddingVertical: 16, alignItems: "center", marginTop: 8 },
  continueBtnDisabled: { opacity: 0.4 },
  continueBtnText: { color: "#FFFFFF", fontSize: 16, fontWeight: "600" },
  dots: { flexDirection: "row", gap: 8, marginTop: 12 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#E2E8F0" },
  dotActive: { width: 24, backgroundColor: THEME_COLOR },
  tourActions: { flexDirection: "row", gap: 12, width: "100%", marginTop: 12 },
  skipBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, borderWidth: 1, borderColor: "#E2E8F0", alignItems: "center" },
  skipBtnText: { fontSize: 14, color: "#64748B", fontWeight: "500" },
  nextBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, backgroundColor: THEME_COLOR, alignItems: "center" },
  nextBtnText: { fontSize: 14, color: "#FFFFFF", fontWeight: "600" },
  pickerOverlay: { flex: 1, backgroundColor: "rgba(15, 23, 42, 0.4)", justifyContent: "flex-end" },
  pickerSheet: { backgroundColor: "#FFFFFF", borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, gap: 8 },
  pickerSheetTitle: { fontSize: 18, fontWeight: "700", color: "#1E293B", marginBottom: 16, textAlign: "center" },
  pickerOption: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 16, borderRadius: 12 },
  pickerOptionSelected: { backgroundColor: THEME_LIGHT },
  pickerOptionText: { fontSize: 15, color: "#1E293B", flex: 1 },
  pickerOptionTextSelected: { color: THEME_COLOR, fontWeight: "600" },
  pickerCancelBtn: { marginTop: 12, paddingVertical: 16, borderRadius: 12, borderWidth: 1, borderColor: "#E2E8F0", alignItems: "center" },
  pickerCancelText: { fontSize: 15, color: "#64748B", fontWeight: "500" },
});