// app/(advisor)/(drawer)/plans.tsx
import React, { useEffect, useMemo, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useTheme } from "../../../components/ThemeContext";
import { useAuth } from "../../../auth/AuthContext";

const API_BASE = (process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:8080/api").replace(/\/api\/?$/, "");

type BackendScheduleItem = {
  id: number | string;
  advisorId?: number;
  advisorNetid?: string;
  advisor_id?: number;
  advisor_netid?: string;

  studentId?: number;
  studentNetid?: string | null;
  studentName?: string | null;
  student_id?: number;
  student_netid?: string | null;
  student_name?: string | null;

  slotDate?: string;
  startTime?: string;
  endTime?: string;
  slot_date?: string;
  start_time?: string;
  end_time?: string;

  status?: string;
};

type BackendCourse = {
  year?: number;
  semester?: string;
  code?: string;
  name?: string;
  credits?: number;
  taken?: boolean;
};

type BackendPlan = {
  plan_id: number;
  plan_name: string;
  total_credits: number;
  list_of_courses?: BackendCourse[];
};

type PlanWarningSeverity = "high" | "medium" | "low";

type PlanWarning = {
  id: string;
  label: string;
  severity: PlanWarningSeverity;
};

type StudentPlanCard = {
  id: string;
  studentName: string;
  studentNetid: string;
  upcomingMeetingLabel: string;
  rawMeetingDate?: string;
  rawMeetingStart?: string;
  planId: number;
  planName: string;
  totalCredits: number;
  courseCount: number;
  completedCount: number;
  previewCourses: string[];
  warnings: PlanWarning[];
};

type StudentSection = {
  studentName: string;
  studentNetid: string;
  upcomingMeetingLabel: string;
  rawMeetingDate?: string;
  rawMeetingStart?: string;
  plans: StudentPlanCard[];
};

function formatMeetingLabel(
  rawDate?: string,
  startTime?: string,
  endTime?: string
) {
  if (!rawDate) return "Upcoming meeting";

  const date = new Date(`${rawDate}T00:00:00`);

  const prettyDate = date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

  if (!startTime || !endTime) return prettyDate;

  const formatTime = (time: string) => {
    const [hourStr, minuteStr] = time.split(":");
    let hour = Number(hourStr);
    const minute = minuteStr;
    const suffix = hour >= 12 ? "PM" : "AM";
    hour = hour % 12 || 12;
    return `${hour}:${minute} ${suffix}`;
  };

  return `${prettyDate} • ${formatTime(startTime)}–${formatTime(endTime)}`;
}

function toDateTimeValue(rawDate?: string, rawTime?: string) {
  if (!rawDate) return Number.MAX_SAFE_INTEGER;
  const time = rawTime ?? "00:00:00";
  return new Date(`${rawDate}T${time}`).getTime();
}

function isUpcoming(rawDate?: string, rawTime?: string) {
  if (!rawDate) return false;
  const now = new Date();
  const start = new Date(`${rawDate}T${rawTime ?? "00:00:00"}`);
  return start.getTime() >= now.getTime();
}

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function getCourseCredits(course: BackendCourse) {
  return Number(course.credits) || 0;
}

function analyzePlan(courses: BackendCourse[], totalCredits: number): PlanWarning[] {
  const warnings: PlanWarning[] = [];
  const normalizedCodes = courses
    .map((course) => course.code?.trim().toUpperCase())
    .filter((code): code is string => Boolean(code));

  const duplicateCodes = normalizedCodes.filter(
    (code, index) => normalizedCodes.indexOf(code) !== index
  );

  const termCredits = new Map<string, number>();
  courses.forEach((course) => {
    const year = course.year ?? "unknown";
    const semester = (course.semester ?? "unknown").trim().toLowerCase();
    const key = `${year}-${semester}`;
    termCredits.set(key, (termCredits.get(key) ?? 0) + getCourseCredits(course));
  });

  const overloadedTermCount = Array.from(termCredits.values()).filter(
    (credits) => credits > 18
  ).length;

  const hasYearOneFall = courses.some(
    (course) =>
      course.year === 1 && (course.semester ?? "").toLowerCase().includes("fall")
  );
  const hasYearOneSpring = courses.some(
    (course) =>
      course.year === 1 &&
      (course.semester ?? "").toLowerCase().includes("spring")
  );

  if (courses.length === 0) {
    warnings.push({
      id: "empty-plan",
      label: "No courses added",
      severity: "high",
    });
  }

  if (totalCredits < 128) {
    warnings.push({
      id: "low-credits",
      label: `${128 - totalCredits} credits short`,
      severity: "high",
    });
  }

  if (overloadedTermCount > 0) {
    warnings.push({
      id: "overloaded-terms",
      label: `${overloadedTermCount} overloaded term${
        overloadedTermCount === 1 ? "" : "s"
      }`,
      severity: "medium",
    });
  }

  if (duplicateCodes.length > 0) {
    warnings.push({
      id: "duplicate-courses",
      label: `${new Set(duplicateCodes).size} duplicate course${
        new Set(duplicateCodes).size === 1 ? "" : "s"
      }`,
      severity: "medium",
    });
  }

  if (courses.length > 0 && !courses.some((course) => course.taken)) {
    warnings.push({
      id: "no-completed-courses",
      label: "No completed courses marked",
      severity: "low",
    });
  }

  if (courses.length > 0 && (!hasYearOneFall || !hasYearOneSpring)) {
    warnings.push({
      id: "missing-first-year-term",
      label: "First year has an empty term",
      severity: "low",
    });
  }

  return warnings;
}

function getWarningColors(severity: PlanWarningSeverity) {
  if (severity === "high") {
    return {
      bg: "rgba(220,38,38,0.10)",
      border: "rgba(220,38,38,0.35)",
      text: "#DC2626",
    };
  }

  if (severity === "medium") {
    return {
      bg: "rgba(245,158,11,0.12)",
      border: "rgba(245,158,11,0.35)",
      text: "#D97706",
    };
  }

  return {
    bg: "rgba(14,165,233,0.10)",
    border: "rgba(14,165,233,0.30)",
    text: "#0EA5E9",
  };
}

export default function PlansScreen() {
  const { user } = useAuth();
  const advisorNetid = user?.userId;
  const { theme } = useTheme();
  const router = useRouter();

  const [sections, setSections] = useState<StudentSection[]>([]);
  const [selectedPlans, setSelectedPlans] = useState<Record<string, number>>({});
  const [expandedStudent, setExpandedStudent] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchPlansForUpcomingMeetings = async (showLoader = true) => {
    if (!advisorNetid) return;

    try {
      if (showLoader) setLoading(true);
      setRefreshing(true);

      const scheduleRes = await fetch(`${API_BASE}/api/schedule/${advisorNetid}`);
      if (!scheduleRes.ok) {
        throw new Error(`Failed to fetch schedule: ${scheduleRes.status}`);
      }

      const scheduleData: BackendScheduleItem[] = await scheduleRes.json();

      const upcomingStudentsMap = new Map<
        string,
        {
          studentName: string;
          studentNetid: string;
          upcomingMeetingLabel: string;
          rawMeetingDate?: string;
          rawMeetingStart?: string;
        }
      >();

      for (const item of scheduleData) {
        const studentNetid =
          item.studentNetid?.trim() || item.student_netid?.trim() || "";
        const studentName =
          item.studentName?.trim() ||
          item.student_name?.trim() ||
          "Unknown Student";

        const slotDate = item.slotDate ?? item.slot_date;
        const startTime = item.startTime ?? item.start_time;
        const endTime = item.endTime ?? item.end_time;
        const status = (item.status ?? "").toUpperCase();

        if (!studentNetid) continue;
        if (status !== "BOOKED") continue;
        if (!isUpcoming(slotDate, startTime)) continue;

        const existing = upcomingStudentsMap.get(studentNetid);
        const candidateTime = toDateTimeValue(slotDate, startTime);
        const existingTime = toDateTimeValue(
          existing?.rawMeetingDate,
          existing?.rawMeetingStart
        );

        // Keep only the soonest upcoming appointment per student
        if (!existing || candidateTime < existingTime) {
          upcomingStudentsMap.set(studentNetid, {
            studentName,
            studentNetid,
            rawMeetingDate: slotDate,
            rawMeetingStart: startTime,
            upcomingMeetingLabel: formatMeetingLabel(slotDate, startTime, endTime),
          });
        }
      }

      const uniqueStudents = Array.from(upcomingStudentsMap.values());

      const studentPlanResults = await Promise.all(
        uniqueStudents.map(async (student) => {
          try {
            const res = await fetch(
              `${API_BASE}/coursePlan/${student.studentNetid}/plans`
            );

            if (!res.ok) {
              return {
                ...student,
                plans: [] as BackendPlan[],
              };
            }

            const plans: BackendPlan[] = await res.json();

            return {
              ...student,
              plans,
            };
          } catch (error) {
            console.error(
              `Error fetching plans for ${student.studentNetid}:`,
              error
            );
            return {
              ...student,
              plans: [] as BackendPlan[],
            };
          }
        })
      );

      const mappedSections: StudentSection[] = studentPlanResults
        .map((student) => {
          const plans: StudentPlanCard[] = student.plans.map((plan) => {
            const courses = Array.isArray(plan.list_of_courses)
              ? plan.list_of_courses
              : [];
            const totalCredits =
              plan.total_credits ??
              courses.reduce((sum, course) => sum + getCourseCredits(course), 0);

            return {
              id: `${student.studentNetid}-${plan.plan_id}`,
              studentName: student.studentName,
              studentNetid: student.studentNetid,
              upcomingMeetingLabel: student.upcomingMeetingLabel,
              rawMeetingDate: student.rawMeetingDate,
              rawMeetingStart: student.rawMeetingStart,
              planId: plan.plan_id,
              planName: plan.plan_name?.trim() || `Plan ${plan.plan_id}`,
              totalCredits,
              courseCount: courses.length,
              completedCount: courses.filter((c) => c.taken).length,
              previewCourses: courses
                .slice(0, 4)
                .map((c) => c.code?.trim())
                .filter((code): code is string => Boolean(code)),
              warnings: analyzePlan(courses, totalCredits),
            };
          });

          return {
            studentName: student.studentName,
            studentNetid: student.studentNetid,
            upcomingMeetingLabel: student.upcomingMeetingLabel,
            rawMeetingDate: student.rawMeetingDate,
            rawMeetingStart: student.rawMeetingStart,
            plans,
          };
        })
        .filter((section) => section.plans.length > 0);

      mappedSections.sort((a, b) => {
        const aTime = toDateTimeValue(a.rawMeetingDate, a.rawMeetingStart);
        const bTime = toDateTimeValue(b.rawMeetingDate, b.rawMeetingStart);
        return aTime - bTime;
      });

      const initialSelections: Record<string, number> = {};
      mappedSections.forEach((section) => {
        if (section.plans.length > 0) {
          initialSelections[section.studentNetid] = section.plans[0].planId;
        }
      });

      setSections(mappedSections);
      setSelectedPlans(initialSelections);
    } catch (err) {
      console.error("Error loading student plans from meetings:", err);
      Alert.alert("Error", "Could not load plans for upcoming advisees.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchPlansForUpcomingMeetings(true);
  }, [advisorNetid]);

  useFocusEffect(
    useCallback(() => {
      fetchPlansForUpcomingMeetings(false);
    }, [advisorNetid])
  );

  const summary = useMemo(() => {
    const studentCount = sections.length;
    const totalPlans = sections.reduce((sum, s) => sum + s.plans.length, 0);
    const flaggedPlans = sections.reduce(
      (sum, section) =>
        sum + section.plans.filter((plan) => plan.warnings.length > 0).length,
      0
    );
    return { studentCount, totalPlans, flaggedPlans };
  }, [sections]);

  const openPlan = (item: StudentPlanCard) => {
    router.push({
      pathname: "/advisees/advisee-details",
      params: {
        netid: item.studentNetid,
        name: item.studentName,
        mode: "plan",
        from: "plans",
        planId: String(item.planId),
      },
    });
  };

  if (loading) {
    return (
      <View
        style={[
          styles.container,
          {
            backgroundColor: theme.background,
            justifyContent: "center",
            alignItems: "center",
          },
        ]}
      >
        <ActivityIndicator size="large" color={theme.primary} />
        <Text style={{ color: theme.muted, marginTop: 10 }}>
          Loading plans for upcoming meetings...
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Text style={[styles.header, { color: theme.text }]}>
        Upcoming Advisee Plans
      </Text>
      <Text style={{ color: theme.muted, marginBottom: 12 }}>
        Plans for students with upcoming advisee meetings.
      </Text>

      <View style={styles.summaryRow}>
        <View
          style={[
            styles.summaryBadge,
            { backgroundColor: theme.card, borderColor: theme.border },
          ]}
        >
          <Text style={[styles.summaryValue, { color: theme.text }]}>
            {summary.studentCount}
          </Text>
          <Text style={[styles.summaryLabel, { color: theme.muted }]}>
            Students
          </Text>
        </View>

        <View
          style={[
            styles.summaryBadge,
            { backgroundColor: theme.card, borderColor: theme.border },
          ]}
        >
          <Text style={[styles.summaryValue, { color: theme.text }]}>
            {summary.totalPlans}
          </Text>
          <Text style={[styles.summaryLabel, { color: theme.muted }]}>
            Plans
          </Text>
        </View>

        <View
          style={[
            styles.summaryBadge,
            { backgroundColor: theme.card, borderColor: theme.border },
          ]}
        >
          <Text style={[styles.summaryValue, { color: theme.text }]}>
            {summary.flaggedPlans}
          </Text>
          <Text style={[styles.summaryLabel, { color: theme.muted }]}>
            Flags
          </Text>
        </View>
      </View>

      {sections.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={[styles.emptyTitle, { color: theme.text }]}>
            No upcoming advisee plans found
          </Text>
          <Text style={{ color: theme.muted, marginTop: 4, textAlign: "center" }}>
            Either there are no upcoming meetings, or those students do not have
            plans yet.
          </Text>
        </View>
      ) : (
        <FlatList
          data={sections}
          keyExtractor={(item) => item.studentNetid}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => fetchPlansForUpcomingMeetings(false)}
              tintColor={theme.primary}
            />
          }
          contentContainerStyle={{ paddingBottom: 18 }}
          renderItem={({ item }) => {
            const selectedPlanId = selectedPlans[item.studentNetid];
            const selectedPlan =
              item.plans.find((p) => p.planId === selectedPlanId) ?? item.plans[0];

            const isExpanded = expandedStudent === item.studentNetid;
            const completionPercent =
              selectedPlan.courseCount > 0
                ? Math.round(
                    (selectedPlan.completedCount / selectedPlan.courseCount) * 100
                  )
                : 0;
            const highPriorityWarnings = selectedPlan.warnings.filter(
              (warning) => warning.severity === "high"
            ).length;

            return (
              <View
                style={[
                  styles.studentCard,
                  {
                    backgroundColor: theme.card,
                    borderColor: theme.border,
                  },
                ]}
              >
                <View
                  style={[
                    styles.cardAccent,
                    { backgroundColor: theme.primary },
                  ]}
                />
                <View style={styles.studentHeader}>
                  <View
                    style={[
                      styles.avatar,
                      { backgroundColor: `${theme.primary}18` },
                    ]}
                  >
                    <Text style={[styles.avatarText, { color: theme.primary }]}>
                      {getInitials(item.studentName || item.studentNetid)}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.sectionTitle, { color: theme.text }]}>
                      {item.studentName}
                    </Text>
                    <Text style={{ color: theme.muted, marginTop: 2 }}>
                      {item.studentNetid} • {item.upcomingMeetingLabel}
                    </Text>
                  </View>
                </View>

                {item.plans.length > 1 ? (
                  <View
                    style={[
                      styles.planPreviewPanel,
                      {
                        backgroundColor: theme.background,
                        borderColor: theme.border,
                      },
                    ]}
                  >
                    <Text style={[styles.previewLabel, { color: theme.muted }]}>
                      Selected Plan
                    </Text>

                    <TouchableOpacity
                      activeOpacity={0.9}
                      onPress={() =>
                        setExpandedStudent((prev) =>
                          prev === item.studentNetid ? null : item.studentNetid
                        )
                      }
                      style={[
                        styles.dropdownButton,
                        {
                          backgroundColor: theme.background,
                          borderColor: theme.border,
                        },
                      ]}
                    >
                      <Text
                        style={[styles.dropdownButtonText, { color: theme.text }]}
                        numberOfLines={1}
                      >
                        {selectedPlan.planName}
                      </Text>

                      <Ionicons
                        name={isExpanded ? "chevron-up" : "chevron-down"}
                        size={18}
                        color={theme.muted}
                      />
                    </TouchableOpacity>

                    {isExpanded && (
                      <View
                        style={[
                          styles.dropdownMenu,
                          {
                            backgroundColor: theme.background,
                            borderColor: theme.border,
                          },
                        ]}
                      >
                        {item.plans.map((plan, index) => {
                          const isSelected = plan.planId === selectedPlan.planId;

                          return (
                            <TouchableOpacity
                              key={plan.planId}
                              activeOpacity={0.9}
                              onPress={() => {
                                setSelectedPlans((prev) => ({
                                  ...prev,
                                  [item.studentNetid]: plan.planId,
                                }));
                                setExpandedStudent(null);
                              }}
                              style={[
                                styles.dropdownOption,
                                index !== item.plans.length - 1 &&
                                  styles.dropdownOptionBorder,
                                {
                                  borderBottomColor: theme.border,
                                  backgroundColor: isSelected
                                    ? "rgba(14,165,233,0.08)"
                                    : "transparent",
                                },
                              ]}
                            >
                              <View style={{ flex: 1 }}>
                                <Text
                                  style={[
                                    styles.dropdownOptionText,
                                    {
                                      color: isSelected
                                        ? theme.primary
                                        : theme.text,
                                    },
                                  ]}
                                >
                                  {plan.planName}
                                </Text>
                                <Text
                                  style={{
                                    color: theme.muted,
                                    fontSize: 12,
                                    marginTop: 2,
                                  }}
                                >
                                  Plan ID: {plan.planId}
                                </Text>
                              </View>

                              {isSelected && (
                                <Ionicons
                                  name="checkmark"
                                  size={18}
                                  color={theme.primary}
                                />
                              )}
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    )}
                  </View>
                ) : (
                  <View
                    style={[
                      styles.planPreviewPanel,
                      {
                        backgroundColor: theme.background,
                        borderColor: theme.border,
                      },
                    ]}
                  >
                    <Text style={[styles.previewLabel, { color: theme.muted }]}>
                      Plan
                    </Text>
                    <Text style={[styles.planName, { color: theme.text }]}>
                      {selectedPlan.planName}
                    </Text>
                    <Text style={{ color: theme.muted, marginTop: 2 }}>
                      Plan ID: {selectedPlan.planId}
                    </Text>
                  </View>
                )}

                <View style={styles.cardTopRow}>
                  <View
                    style={[
                      styles.creditsPill,
                      {
                        backgroundColor: theme.background,
                        borderColor: theme.border,
                      },
                    ]}
                  >
                    <Text style={[styles.creditsText, { color: theme.text }]}>
                      {selectedPlan.totalCredits} credits
                    </Text>
                  </View>

                  {selectedPlan.warnings.length > 0 && (
                    <View
                      style={[
                        styles.reviewStatusPill,
                        {
                          backgroundColor:
                            highPriorityWarnings > 0
                              ? "rgba(220,38,38,0.10)"
                              : "rgba(245,158,11,0.12)",
                          borderColor:
                            highPriorityWarnings > 0
                              ? "rgba(220,38,38,0.35)"
                              : "rgba(245,158,11,0.35)",
                        },
                      ]}
                    >
                      <Ionicons
                        name={
                          highPriorityWarnings > 0
                            ? "alert-circle-outline"
                            : "warning-outline"
                        }
                        size={13}
                        color={highPriorityWarnings > 0 ? "#DC2626" : "#D97706"}
                      />
                      <Text
                        style={[
                          styles.reviewStatusText,
                          {
                            color:
                              highPriorityWarnings > 0 ? "#DC2626" : "#D97706",
                          },
                        ]}
                      >
                        Needs review
                      </Text>
                    </View>
                  )}
                </View>

                <View style={styles.badgeRow}>
                  <View
                    style={[
                      styles.badge,
                      {
                        backgroundColor: "rgba(14,165,233,0.08)",
                        borderColor: "rgba(14,165,233,0.25)",
                      },
                    ]}
                  >
                    <Text style={[styles.badgeText, { color: "#0EA5E9" }]}>
                      {selectedPlan.courseCount} courses
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.badge,
                      {
                        backgroundColor: "rgba(16,185,129,0.08)",
                        borderColor: "rgba(16,185,129,0.25)",
                      },
                    ]}
                  >
                    <Text style={[styles.badgeText, { color: "#059669" }]}>
                      {selectedPlan.completedCount} completed
                    </Text>
                  </View>
                </View>

                <View
                  style={[styles.progressTrack, { backgroundColor: theme.border }]}
                >
                  <View
                    style={[
                      styles.progressFill,
                      {
                        backgroundColor: theme.primary,
                        width: `${completionPercent}%`,
                      },
                    ]}
                  />
                </View>

                {selectedPlan.warnings.length > 0 && (
                  <View
                    style={[
                      styles.warningPanel,
                      {
                        backgroundColor: theme.background,
                        borderColor: theme.border,
                      },
                    ]}
                  >
                    <View style={styles.warningHeaderRow}>
                      <Ionicons
                        name="flag-outline"
                        size={15}
                        color={theme.primary}
                      />
                      <Text style={[styles.warningHeader, { color: theme.text }]}>
                        Review flags
                      </Text>
                    </View>
                    <View style={styles.warningList}>
                      {selectedPlan.warnings.slice(0, 4).map((warning) => {
                        const colors = getWarningColors(warning.severity);
                        return (
                          <View
                            key={warning.id}
                            style={[
                              styles.warningChip,
                              {
                                backgroundColor: colors.bg,
                                borderColor: colors.border,
                              },
                            ]}
                          >
                            <Text
                              style={[
                                styles.warningChipText,
                                { color: colors.text },
                              ]}
                            >
                              {warning.label}
                            </Text>
                          </View>
                        );
                      })}
                    </View>
                  </View>
                )}

                <View style={{ marginTop: 12 }}>
                  <Text style={[styles.previewLabel, { color: theme.muted }]}>
                    Course Preview
                  </Text>
                  <Text
                    style={[
                      styles.previewText,
                      {
                        color: selectedPlan.previewCourses.length
                          ? theme.text
                          : theme.muted,
                      },
                    ]}
                  >
                    {selectedPlan.previewCourses.length
                      ? "First courses in this plan"
                      : "No courses added yet"}
                  </Text>
                  {selectedPlan.previewCourses.length > 0 && (
                    <View style={styles.coursePreviewGrid}>
                      {selectedPlan.previewCourses.map((courseCode) => (
                        <View
                          key={`${selectedPlan.id}-${courseCode}`}
                          style={[
                            styles.courseChip,
                            {
                              backgroundColor: theme.card,
                              borderColor: theme.border,
                            },
                          ]}
                        >
                          <Text
                            style={[styles.courseChipText, { color: theme.text }]}
                          >
                            {courseCode}
                          </Text>
                        </View>
                      ))}
                    </View>
                  )}
                </View>

                <TouchableOpacity
                  activeOpacity={0.9}
                  onPress={() => openPlan(selectedPlan)}
                  style={[styles.openRow, { backgroundColor: theme.primary }]}
                >
                  <Text style={[styles.openText, { color: theme.background }]}>
                    Review Plan
                  </Text>
                  <Ionicons
                    name="arrow-forward"
                    size={16}
                    color={theme.background}
                  />
                </TouchableOpacity>
              </View>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },

  header: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 4,
  },

  summaryRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 12,
  },

  summaryBadge: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    minWidth: 88,
  },

  summaryValue: {
    fontSize: 16,
    fontWeight: "700",
  },

  summaryLabel: {
    fontSize: 12,
    marginTop: 2,
  },

  studentCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    marginBottom: 14,
    overflow: "hidden",
  },

  cardAccent: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
  },

  studentHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 10,
  },

  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
  },

  avatarText: {
    fontSize: 14,
    fontWeight: "800",
  },

  sectionTitle: {
    fontSize: 17,
    fontWeight: "700",
  },

  cardTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 14,
    gap: 8,
  },

  planName: {
    fontSize: 16,
    fontWeight: "600",
  },

  planPreviewPanel: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    marginTop: 14,
  },

  creditsPill: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignSelf: "flex-start",
  },

  creditsText: {
    fontSize: 12,
    fontWeight: "600",
  },

  reviewStatusPill: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 4,
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },

  reviewStatusText: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },

  badgeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 12,
  },

  badge: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },

  badgeText: {
    fontSize: 12,
    fontWeight: "600",
  },

  progressTrack: {
    height: 6,
    borderRadius: 999,
    overflow: "hidden",
    marginTop: 12,
  },

  progressFill: {
    height: "100%",
    borderRadius: 999,
  },

  warningPanel: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 10,
    marginTop: 12,
  },

  warningHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginBottom: 8,
  },

  warningHeader: {
    fontSize: 13,
    fontWeight: "700",
  },

  warningList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },

  warningChip: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },

  warningChipText: {
    fontSize: 12,
    fontWeight: "700",
  },

  previewLabel: {
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.4,
    marginBottom: 4,
  },

  previewText: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "500",
  },

  coursePreviewGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 8,
  },

  courseChip: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },

  courseChipText: {
    fontSize: 12,
    fontWeight: "700",
  },

  openRow: {
    marginTop: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderRadius: 12,
    paddingVertical: 11,
  },

  openText: {
    fontSize: 13,
    fontWeight: "700",
  },

  dropdownButton: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },

  dropdownButtonText: {
    flex: 1,
    fontSize: 14,
    fontWeight: "600",
  },

  dropdownMenu: {
    borderWidth: 1,
    borderRadius: 12,
    marginTop: 8,
    overflow: "hidden",
  },

  dropdownOption: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  dropdownOptionBorder: {
    borderBottomWidth: 1,
  },

  dropdownOptionText: {
    fontSize: 14,
    fontWeight: "600",
  },

  emptyState: {
    marginTop: 32,
    alignItems: "center",
    paddingHorizontal: 20,
  },

  emptyTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
});
