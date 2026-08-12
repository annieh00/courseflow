import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Modal,
  SafeAreaView,
  StyleSheet,
  StatusBar,
  ActivityIndicator,
  Alert,
  Pressable,
} from "react-native";
import { Menu, CloudUpload, GitBranch, TrendingUp } from "lucide-react-native";
import { useAuth } from "../../../../auth/AuthContext";
import { useTheme } from "../../../../components/ThemeContext";
import { useFlowchart } from "./FlowchartContext";
import { FlowchartGrid } from "./SemesterGrid";
import { ProgressSidebar } from "./ProgressSidebar";
import { OnboardingFlow } from "./OnboardingFlow";
import { PrerequisiteGraphModal } from "./PrerequisiteGraphModal";
import { degreePrograms, Course } from "./degree-programs";
import { useNavigation, DrawerActions } from "@react-navigation/native";

const THEME_COLOR = "#F59E0B"; // Matches your onboarding yellow

const _isLocal = typeof window === 'undefined' || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const _API_BASE = `${_isLocal ? 'http://localhost:8080' : 'https://sdmay26-48.ece.iastate.edu'}/api`;

export function FlowchartScreen() {
  const {
    selectedProgram,
    completedCourses,
    inProgressCourses,
    semesterOverrides,
    moveCourseToSemester,
    setCompletedCourses,
    setInProgressCourses,
    saveProgress,
  } = useFlowchart();

  const { accessToken } = useAuth();
  const navigation = useNavigation();
  const { theme } = useTheme();

  const [showProgress, setShowProgress] = useState(false);
  const [showGraph, setShowGraph] = useState(false);
  const [fetchedSEElectives, setFetchedSEElectives] = useState<Course[]>([]);
  const [fetchedSPPLMElectives, setFetchedSPPLMElectives] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [movingCourse, setMovingCourse] = useState<Course | null>(null);

  const fetchUserTranscript = async () => {
    if (!accessToken) return;
    try {
      const response = await fetch(`${_API_BASE}/user/courses`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      });

      const result = await response.json();

      if (response.ok && result.success) {
        if (result.data.completedCourses) {
          setCompletedCourses(new Set(result.data.completedCourses));
        }
        if (result.data.inProgressCourses) {
          setInProgressCourses(new Set(result.data.inProgressCourses));
        }
      }
    } catch (error) {
      console.error("🌐 Network Error fetching transcript:", error);
    }
  };

  useEffect(() => {
    const initializeData = async () => {
      try {
        setIsLoading(true);
        if (accessToken) {
          await fetchUserTranscript();
        }

        const seRes = await fetch(`${_API_BASE}/degree/SE/electives?type=SOFTWARE_ENGINEERING_ELECTIVE`);
        const seData = await seRes.json();
        const formattedSE: Course[] = seData.map((item: any) => ({
          code: item.courseNumber,
          title: item.courseTitle,
          credits: item.credits,
          type: "SE Elective",
        }));

        const spplmRes = await fetch(`${_API_BASE}/degree/SE/electives?type=SUPPLEMENTAL_ELECTIVE`);
        const spplmData = await spplmRes.json();
        const formattedSPPLM: Course[] = spplmData.map((item: any) => ({
          code: item.courseNumber,
          title: item.courseTitle,
          credits: item.credits,
          type: "SPPLM Elective",
        }));

        setFetchedSEElectives(formattedSE);
        setFetchedSPPLMElectives(formattedSPPLM);
      } catch (error) {
        console.error("Error during initialization:", error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeData();
  }, [accessToken]);

  const program = useMemo(() => {
    if (!selectedProgram || !degreePrograms[selectedProgram]) return null;
    const programData = JSON.parse(JSON.stringify(degreePrograms[selectedProgram]));

    // Apply fetched electives
    programData.semesters.forEach((sem: any) => {
      sem.items.forEach((item: any) => {
        if (item.kind === "chooseOne") {
          if (item.chooseOne.id.startsWith("se-electives") && fetchedSEElectives.length > 0) {
            item.chooseOne.courses = fetchedSEElectives;
          }
          if (item.chooseOne.id.startsWith("spplm-electives") && fetchedSPPLMElectives.length > 0) {
            item.chooseOne.courses = fetchedSPPLMElectives;
          }
        }
      });
    });

    // Apply student's semester customizations
    if (Object.keys(semesterOverrides).length > 0) {
      Object.entries(semesterOverrides).forEach(([courseCode, targetSemNum]) => {
        let foundItem: any = null;
        // Remove course from whichever semester currently has it
        for (const sem of programData.semesters) {
          const idx = sem.items.findIndex(
            (item: any) => item.kind === "course" && item.course.code === courseCode
          );
          if (idx !== -1) {
            foundItem = sem.items[idx];
            sem.items.splice(idx, 1);
            break;
          }
        }
        // Add it to the target semester
        if (foundItem) {
          const targetSem = programData.semesters.find((s: any) => s.number === targetSemNum);
          if (targetSem) targetSem.items.push(foundItem);
        }
      });
    }

    return programData;
  }, [selectedProgram, fetchedSEElectives, fetchedSPPLMElectives, semesterOverrides]);

  const handleSaveProgress = async () => {
    if (!accessToken) {
      Alert.alert("Error", "You must be logged in to save progress.");
      return;
    }

    const payload = {
      courseNumbers: Array.from(completedCourses || []),
      inProgressCourseNumbers: Array.from(inProgressCourses || []),
    };
    console.log(" Sending Payload to Backend:", JSON.stringify(payload, null, 2));
    try {
      const response = await fetch(`${_API_BASE}/user/courses`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${accessToken}`,
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        Alert.alert("Success", "Your academic progress has been saved!");
      } else {
        const errorData = await response.json();
        Alert.alert("Save Failed", errorData.message || "Something went wrong.");
      }
    } catch (error) {
      Alert.alert("Error", "Could not connect to the server.");
    }
  };

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={theme.primary} />
      <OnboardingFlow />

      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.dispatch(DrawerActions.toggleDrawer())}
          style={styles.hamburger}
        >
          <Menu size={24} color="#FFFFFF" strokeWidth={2} />
        </TouchableOpacity>
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>{program ? program.program : "Degree Flowchart"}</Text>
          {program && <Text style={styles.headerSub}>{program.institution}</Text>}
        </View>

        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.saveBtn} onPress={handleSaveProgress}>
            <CloudUpload size={16} color="#FFFFFF" strokeWidth={2.5} />
            <Text style={styles.saveBtnText}>Save</Text>
          </TouchableOpacity>

          {program && (
            <TouchableOpacity style={styles.graphBtn} onPress={() => setShowGraph(true)}>

              <GitBranch size={16} color="#FFFFFF" strokeWidth={2.5} />
              <Text style={styles.graphBtnText}>Graph</Text>
            </TouchableOpacity>
          )}

          {program && (
            <TouchableOpacity style={styles.progressBtn} onPress={() => setShowProgress(true)}>
              <TrendingUp size={16} color={THEME_COLOR} strokeWidth={2.5} />
              <Text style={styles.progressBtnText}>Progress</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {program ? (
        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
          <FlowchartGrid semesters={program.semesters} onMoveCourse={setMovingCourse} />
        </ScrollView>
      ) : (
        <View style={styles.emptyState}>
          {isLoading ? (
            <ActivityIndicator size="large" color={THEME_COLOR} />
          ) : (
            <>
              <Text style={styles.emptyTitle}>No program selected</Text>
              <Text style={styles.emptySubtitle}>Complete onboarding to view your degree plan.</Text>
            </>
          )}
        </View>
      )}

      {program && (
        <PrerequisiteGraphModal
          visible={showGraph}
          onClose={() => setShowGraph(false)}
          program={program}
        />
      )}

      <Modal visible={showProgress} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.progressModal}>
          {program && <ProgressSidebar program={program} onClose={() => setShowProgress(false)} />}
        </SafeAreaView>
      </Modal>

      {program && (
        <PrerequisiteGraphModal
          visible={showGraph}
          onClose={() => setShowGraph(false)}
          program={program}
        />
      )}

      {/* Move course modal */}
      <Modal visible={!!movingCourse} transparent animationType="fade" onRequestClose={() => setMovingCourse(null)}>
        <Pressable style={styles.moveOverlay} onPress={() => setMovingCourse(null)}>
          <Pressable style={styles.moveSheet} onPress={() => {}}>
            <View style={styles.moveHandle} />
            <Text style={styles.moveTitle}>Move "{movingCourse?.title}"</Text>
            <Text style={styles.moveSub}>Select a semester to move this course to</Text>
            <ScrollView style={{ maxHeight: 320 }} showsVerticalScrollIndicator={false}>
              {program?.semesters.map((sem: any) => {
                const isCurrent = semesterOverrides[movingCourse?.code ?? ""] === sem.number
                  || (!semesterOverrides[movingCourse?.code ?? ""] && sem.items.some(
                    (i: any) => i.kind === "course" && i.course.code === movingCourse?.code
                  ));
                return (
                  <TouchableOpacity
                    key={sem.number}
                    style={[styles.moveSemRow, isCurrent && styles.moveSemRowActive]}
                    onPress={() => {
                      if (movingCourse) {
                        moveCourseToSemester(movingCourse.code, sem.number);
                        saveProgress();
                      }
                      setMovingCourse(null);
                    }}
                  >
                    <Text style={[styles.moveSemLabel, isCurrent && styles.moveSemLabelActive]}>
                      {sem.label ?? `Semester ${sem.number}`}
                    </Text>
                    {isCurrent && <Text style={styles.moveSemCurrent}>Current</Text>}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
            <TouchableOpacity style={styles.moveCancelBtn} onPress={() => setMovingCourse(null)}>
              <Text style={styles.moveCancelText}>Cancel</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#F8FAFC" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: "#C8102E",
  },
  hamburger: { padding: 4, marginRight: 12 },
  headerLeft: { flex: 1 },
  headerActions: { flexDirection: "row", gap: 10 },
  headerTitle: { fontSize: 18, fontWeight: "800", color: "#FFFFFF" },
  headerSub: { fontSize: 12, color: "rgba(255,255,255,0.75)", marginTop: 2 },
  saveBtn: {
    backgroundColor: THEME_COLOR, // Updated to yellow theme
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  saveBtnText: { fontSize: 14, fontWeight: "700", color: "#FFFFFF" },
  graphBtn: {

    backgroundColor: "rgba(255,255,255,0.18)",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,

    borderColor: "rgba(255,255,255,0.35)",
  },
  graphBtnText: { fontSize: 14, fontWeight: "700", color: "#FFFFFF" },
  progressBtn: {
    backgroundColor: "#FFFBEB",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderColor: "#FEF3C7",
  },
  progressBtnText: { fontSize: 14, fontWeight: "700", color: THEME_COLOR },
  scroll: { flex: 1 },
  scrollContent: { padding: 16 },
  emptyState: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32 },
  emptyTitle: { fontSize: 17, fontWeight: "600", color: "#1E293B", marginBottom: 8 },
  emptySubtitle: { fontSize: 14, color: "#64748B", textAlign: "center" },
  progressModal: { flex: 1, backgroundColor: "#FFFFFF" },
  moveOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "flex-end" },
  moveSheet: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 36,
  },
  moveHandle: { width: 44, height: 5, borderRadius: 3, backgroundColor: "#E2E8F0", alignSelf: "center", marginBottom: 20 },
  moveTitle: { fontSize: 16, fontWeight: "800", color: "#1E293B", marginBottom: 4 },
  moveSub: { fontSize: 13, color: "#64748B", marginBottom: 16 },
  moveSemRow: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 6,
    backgroundColor: "#F8FAFC",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  moveSemRowActive: { backgroundColor: "#FEF3C7", borderWidth: 1.5, borderColor: THEME_COLOR },
  moveSemLabel: { fontSize: 14, fontWeight: "600", color: "#475569" },
  moveSemLabelActive: { color: "#92400E", fontWeight: "700" },
  moveSemCurrent: { fontSize: 11, fontWeight: "700", color: THEME_COLOR, textTransform: "uppercase", letterSpacing: 0.5 },
  moveCancelBtn: { marginTop: 12, paddingVertical: 14, alignItems: "center", borderRadius: 12, backgroundColor: "#F1F5F9" },
  moveCancelText: { fontSize: 15, fontWeight: "700", color: "#64748B" },
});