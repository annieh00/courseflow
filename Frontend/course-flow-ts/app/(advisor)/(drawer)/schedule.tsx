import React, { useMemo, useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Pressable,
  Platform,
  UIManager,
  Alert,
  ActivityIndicator,
  ScrollView,
  Modal,
  TextInput,
  useWindowDimensions,
} from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useTheme } from "../../../components/ThemeContext";
import { useAuth } from "../../../auth/AuthContext";

const API_BASE = (process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:8080/api").replace(/\/api\/?$/, "");

// ─── Types ────────────────────────────────────────────────────────────────────

type BackendSlot = {
  id: number | string;
  advisorId?: number;
  advisorNetid?: string;
  studentId?: number | null;
  studentNetid?: string | null;
  studentName?: string | null;
  slotDate?: string;
  startTime?: string;
  endTime?: string;
  status?: string;
};

type Meeting = {
  id: string;
  rawDate: string;
  startTime: string;
  endTime: string;
  student: string;
  netid: string;
  status: string;
  hasStudent: boolean;
};

type CalendarDay = {
  dateKey: string;
  dayNumber: number;
  isCurrentMonth: boolean;
};

type WeeklySlot = {
  id: number;
  dayOfWeek: number; // 1=Mon … 7=Sun
  startTime: string;
  endTime: string;
};

type Advisee = {
  id: number;
  netid: string;
  fullName: string;
};

// ─── Constants ────────────────────────────────────────────────────────────────

const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toDateKey(date: Date) {
  const y = date.getFullYear();
  const m = `${date.getMonth() + 1}`.padStart(2, "0");
  const d = `${date.getDate()}`.padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function parseDateKeyLocal(dateKey: string) {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function formatMonthYear(date: Date) {
  return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

function formatDateLabel(dateKey: string) {
  return parseDateKeyLocal(dateKey).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function formatTime(time: string) {
  const [h, m] = time.split(":");
  let hour = Number(h);
  const suffix = hour >= 12 ? "PM" : "AM";
  hour = hour % 12 || 12;
  return `${hour}:${m} ${suffix}`;
}

function formatRange(start: string, end: string) {
  return `${formatTime(start)} – ${formatTime(end)}`;
}

function getMonthGrid(monthDate: Date): CalendarDay[] {
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const gridStart = new Date(year, month, 1 - firstDay);
  return Array.from({ length: 35 }, (_, i) => {
    const d = new Date(gridStart);
    d.setDate(gridStart.getDate() + i);
    return {
      dateKey: toDateKey(d),
      dayNumber: d.getDate(),
      isCurrentMonth: d.getMonth() === month,
    };
  });
}

function statusLabel(status?: string) {
  const s = (status ?? "").toUpperCase();
  if (s === "OPEN") return "Open";
  if (s === "BOOKED") return "Meeting";
  return s || "Meeting";
}

function statusColors(status?: string) {
  if ((status ?? "").toUpperCase() === "OPEN") {
    return { text: "#22C55E", bg: "rgba(34,197,94,0.12)", border: "rgba(34,197,94,0.5)" };
  }
  return { text: "#0EA5E9", bg: "rgba(56,189,248,0.12)", border: "rgba(56,189,248,0.5)" };
}

function isValidTime(t: string) {
  return /^([01]\d|2[0-3]):([0-5]\d)$/.test(t);
}

async function getToken() {
  return AsyncStorage.getItem("accessToken");
}

// ─── AdvisorTimePicker ────────────────────────────────────────────────────────

const PICKER_MINUTES = ["00", "15", "30", "45"];

function parseTime24(value: string): { h12: number; min: string; isPM: boolean } {
  const parts = value.split(":");
  const h24 = parseInt(parts[0] ?? "9", 10);
  const rawMin = parseInt(parts[1] ?? "0", 10);
  const isPM = h24 >= 12;
  const h12 = h24 % 12 || 12;
  const snappedMin = PICKER_MINUTES.reduce((best, m) =>
    Math.abs(parseInt(m) - rawMin) < Math.abs(parseInt(best) - rawMin) ? m : best
  );
  return { h12, min: snappedMin, isPM };
}

function buildTime24(h12: number, min: string, isPM: boolean): string {
  let h24 = h12 % 12;
  if (isPM) h24 += 12;
  return `${String(h24).padStart(2, "0")}:${min}`;
}

type AdvisorTimePickerProps = {
  label: string;
  value: string;
  onChange: (v: string) => void;
  theme: any;
};

function AdvisorTimePicker({ label, value, onChange, theme }: AdvisorTimePickerProps) {
  const { h12, min, isPM } = parseTime24(value);
  const minIndex = PICKER_MINUTES.indexOf(min);

  const stepHour = (dir: 1 | -1) => {
    const next = dir === 1 ? (h12 % 12) + 1 : h12 === 1 ? 12 : h12 - 1;
    onChange(buildTime24(next, min, isPM));
  };

  const stepMinute = (dir: 1 | -1) => {
    const next = (minIndex + dir + PICKER_MINUTES.length) % PICKER_MINUTES.length;
    onChange(buildTime24(h12, PICKER_MINUTES[next], isPM));
  };

  const spinnerBg = { backgroundColor: theme.background, borderColor: theme.border };
  const chevronColor = theme.text;

  return (
    <View style={{ gap: 6 }}>
      {/* Label */}
      <Text style={{ fontSize: 11, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.5, color: theme.textSecondary }}>
        {label}
      </Text>

      <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>

        {/* Hour spinner */}
        <View style={[tpStyles.spinner, spinnerBg]}>
          <TouchableOpacity onPress={() => stepHour(1)} style={tpStyles.chevronBtn} hitSlop={{ top: 4, bottom: 4, left: 8, right: 8 }}>
            <Ionicons name="chevron-up" size={18} color={chevronColor} />
          </TouchableOpacity>
          <Text style={[tpStyles.spinnerValue, { color: theme.text }]}>{h12}</Text>
          <TouchableOpacity onPress={() => stepHour(-1)} style={tpStyles.chevronBtn} hitSlop={{ top: 4, bottom: 4, left: 8, right: 8 }}>
            <Ionicons name="chevron-down" size={18} color={chevronColor} />
          </TouchableOpacity>
        </View>

        <Text style={{ fontSize: 24, fontWeight: "300", color: theme.textSecondary }}>:</Text>

        {/* Minute spinner */}
        <View style={[tpStyles.spinner, spinnerBg]}>
          <TouchableOpacity onPress={() => stepMinute(1)} style={tpStyles.chevronBtn} hitSlop={{ top: 4, bottom: 4, left: 8, right: 8 }}>
            <Ionicons name="chevron-up" size={18} color={chevronColor} />
          </TouchableOpacity>
          <Text style={[tpStyles.spinnerValue, { color: theme.text }]}>{min}</Text>
          <TouchableOpacity onPress={() => stepMinute(-1)} style={tpStyles.chevronBtn} hitSlop={{ top: 4, bottom: 4, left: 8, right: 8 }}>
            <Ionicons name="chevron-down" size={18} color={chevronColor} />
          </TouchableOpacity>
        </View>

        {/* AM / PM segmented control */}
        <View style={[tpStyles.ampmTrack, { borderColor: theme.border }]}>
          {(["AM", "PM"] as const).map((period) => {
            const active = (period === "PM") === isPM;
            return (
              <TouchableOpacity
                key={period}
                onPress={() => onChange(buildTime24(h12, min, period === "PM"))}
                style={[tpStyles.ampmBtn, active && { backgroundColor: theme.primary }]}
              >
                <Text style={{ fontSize: 13, fontWeight: "700", color: active ? theme.background : theme.textSecondary }}>
                  {period}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

      </View>
    </View>
  );
}

const tpStyles = StyleSheet.create({
  spinner: {
    width: 64,
    borderWidth: 1,
    borderRadius: 12,
    alignItems: "center",
    paddingVertical: 4,
    gap: 2,
  },
  chevronBtn: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    alignItems: "center",
  },
  spinnerValue: {
    fontSize: 26,
    fontWeight: "700",
    lineHeight: 32,
    minWidth: 36,
    textAlign: "center",
  },
  ampmTrack: {
    flexDirection: "row",
    borderWidth: 1,
    borderRadius: 10,
    overflow: "hidden",
  },
  ampmBtn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
  },
});

// ─── Component ────────────────────────────────────────────────────────────────

export default function AdvisorSchedule() {
  const { user } = useAuth();
  const advisorNetid = user?.userId;
  const { theme } = useTheme();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isWide = width >= 900;

  const todayKey = toDateKey(new Date());

  // ── Calendar state ──────────────────────────────────────────────
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [visibleMonth, setVisibleMonth] = useState(() => {
    const t = new Date();
    return new Date(t.getFullYear(), t.getMonth(), 1);
  });
  const [selectedDate, setSelectedDate] = useState(todayKey);

  // ── Add Free Slot modal ─────────────────────────────────────────
  const [showSlotModal, setShowSlotModal] = useState(false);
  const [slotStart, setSlotStart] = useState("09:00");
  const [slotEnd, setSlotEnd] = useState("10:00");
  const [savingSlot, setSavingSlot] = useState(false);

  // ── Add Meeting modal ───────────────────────────────────────────
  const [showMeetingModal, setShowMeetingModal] = useState(false);
  const [meetStart, setMeetStart] = useState("09:00");
  const [meetEnd, setMeetEnd] = useState("10:00");
  const [advisees, setAdvisees] = useState<Advisee[]>([]);
  const [loadingAdvisees, setLoadingAdvisees] = useState(false);
  const [selectedAdvisee, setSelectedAdvisee] = useState<Advisee | null>(null);
  const [adviseeSearch, setAdviseeSearch] = useState("");
  const [savingMeeting, setSavingMeeting] = useState(false);

  // ── Weekly Schedule modal ───────────────────────────────────────
  const [showWeeklyModal, setShowWeeklyModal] = useState(false);
  const [weeklySlots, setWeeklySlots] = useState<WeeklySlot[]>([]);
  const [loadingWeekly, setLoadingWeekly] = useState(false);
  const [weeklyAddDay, setWeeklyAddDay] = useState<number | null>(null);
  const [weeklyNewStart, setWeeklyNewStart] = useState("09:00");
  const [weeklyNewEnd, setWeeklyNewEnd] = useState("10:00");
  const [weeklyEditId, setWeeklyEditId] = useState<number | null>(null);
  const [weeklyEditStart, setWeeklyEditStart] = useState("09:00");
  const [weeklyEditEnd, setWeeklyEditEnd] = useState("10:00");

  // ── Fetch calendar slots ────────────────────────────────────────
  const fetchSchedule = useCallback(async (showLoader = true) => {
    if (!advisorNetid) { setLoading(false); return; }
    try {
      if (showLoader) setLoading(true);
      setRefreshing(true);
      const res = await fetch(`${API_BASE}/api/schedule/${advisorNetid}`);
      if (!res.ok) throw new Error(`${res.status}`);
      const data: BackendSlot[] = await res.json();

      const mapped: Meeting[] = data
        .map((slot) => {
          if (!slot.slotDate || !slot.startTime || !slot.endTime) return null;
          const s = (slot.status ?? "OPEN").toUpperCase();
          return {
            id: String(slot.id),
            rawDate: slot.slotDate,
            startTime: slot.startTime,
            endTime: slot.endTime,
            student:
              s === "OPEN" && !slot.studentId ? "Available slot" : slot.studentName ?? "Unassigned",
            netid: slot.studentNetid ?? "",
            status: s,
            hasStudent: Boolean(slot.studentId || slot.studentNetid),
          } as Meeting;
        })
        .filter((x): x is Meeting => x !== null)
        .sort((a, b) =>
          `${a.rawDate}T${a.startTime}`.localeCompare(`${b.rawDate}T${b.startTime}`)
        );

      setMeetings(mapped);
    } catch (err) {
      console.error("Error fetching schedule:", err);
      Alert.alert("Error", "Could not load schedule.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [advisorNetid]);

  useEffect(() => { fetchSchedule(true); }, [advisorNetid]);
  useFocusEffect(useCallback(() => { fetchSchedule(false); }, [advisorNetid]));

  // ── Derived calendar data ───────────────────────────────────────
  const meetingCountByDate = useMemo(() => {
    const map: Record<string, number> = {};
    for (const m of meetings) map[m.rawDate] = (map[m.rawDate] ?? 0) + 1;
    return map;
  }, [meetings]);

  const selectedDayMeetings = useMemo(
    () => meetings.filter((m) => m.rawDate === selectedDate),
    [meetings, selectedDate]
  );

  const monthGrid = useMemo(() => getMonthGrid(visibleMonth), [visibleMonth]);

  // ── Calendar navigation ─────────────────────────────────────────
  const prevMonth = () =>
    setVisibleMonth((p) => new Date(p.getFullYear(), p.getMonth() - 1, 1));
  const nextMonth = () =>
    setVisibleMonth((p) => new Date(p.getFullYear(), p.getMonth() + 1, 1));

  const handleDayPress = (dateKey: string) => {
    setSelectedDate(dateKey);
    const d = parseDateKeyLocal(dateKey);
    setVisibleMonth(new Date(d.getFullYear(), d.getMonth(), 1));
  };

  // ── Slot actions ────────────────────────────────────────────────
  const handleMeetingPress = (meeting: Meeting) => {
    if (meeting.status !== "BOOKED" || !meeting.hasStudent || !meeting.netid) return;
    router.push({
      pathname: "/advisees/advisee-details",
      params: { netid: meeting.netid, name: meeting.student, mode: "profile", from: "schedule" },
    });
  };

  const handleDeleteSlot = (meeting: Meeting) => {
    const isBooked = meeting.status === "BOOKED";
    const title = isBooked ? "Cancel meeting" : "Delete slot";
    const message = isBooked
        ? `Cancel the meeting with ${meeting.student} on ${formatDateLabel(meeting.rawDate)} at ${formatRange(meeting.startTime, meeting.endTime)}?`
        : `Remove the ${formatRange(meeting.startTime, meeting.endTime)} open slot on ${formatDateLabel(meeting.rawDate)}?`;
    const confirmLabel = isBooked ? "Cancel meeting" : "Delete";

    // 1. We extract the actual delete logic into a reusable helper
    const executeDelete = async () => {
      try {
        const token = await getToken();
        const res = await fetch(`${API_BASE}/api/schedule/slots/${meeting.id}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          setMeetings((prev) => prev.filter((m) => m.id !== meeting.id));
        } else {
          const errText = await res.text();
          Platform.OS === "web" ? window.alert(errText) : Alert.alert("Error", errText);
        }
      } catch {
        const networkErr = "Could not reach the server.";
        Platform.OS === "web" ? window.alert(networkErr) : Alert.alert("Error", networkErr);
      }
    };

    // 2. We trigger the correct popup based on the platform!
    if (Platform.OS === "web") {
      // Use standard web confirmation
      const userConfirmed = window.confirm(`${title}\n\n${message}`);
      if (userConfirmed) {
        executeDelete();
      }
    } else {
      // Use native mobile alerts
      Alert.alert(title, message, [
        { text: "Keep", style: "cancel" },
        {
          text: confirmLabel,
          style: "destructive",
          onPress: executeDelete,
        },
      ]);
    }
  };
  // ── Save free slot ──────────────────────────────────────────────
  const handleSaveSlot = async () => {
    if (slotEnd <= slotStart) {
      Alert.alert("Invalid time", "End time must be after start time.");
      return;
    }
    setSavingSlot(true);
    try {
      const token = await getToken();
      const res = await fetch(`${API_BASE}/api/schedule/slots`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ slotDate: selectedDate, startTime: slotStart, endTime: slotEnd }),
      });
      if (res.ok) {
        setShowSlotModal(false);
        setSlotStart("09:00");
        setSlotEnd("10:00");
        await fetchSchedule(false);
      } else {
        Alert.alert("Error", await res.text());
      }
    } catch {
      Alert.alert("Error", "Could not reach the server.");
    } finally {
      setSavingSlot(false);
    }
  };

  // ── Student search for meeting modal ───────────────────────────
  const openMeetingModal = () => {
    setShowMeetingModal(true);
    setSelectedAdvisee(null);
    setAdviseeSearch("");
    setAdvisees([]);
    setMeetStart("09:00");
    setMeetEnd("10:00");
  };

  // Debounced live search — fires 350 ms after the user stops typing
  useEffect(() => {
    if (!showMeetingModal) return;
    const trimmed = adviseeSearch.trim();
    if (!trimmed) {
      setAdvisees([]);
      setLoadingAdvisees(false);
      return;
    }
    setLoadingAdvisees(true);
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(
          `${API_BASE}/api/advisor/students/search?query=${encodeURIComponent(trimmed)}`
        );
        if (res.ok) {
          const data = await res.json();
          setAdvisees(
            (data as any[]).map((a) => ({
              id: a.id,
              netid: a.netid,
              fullName: a.fullName ?? a.full_name ?? a.netid,
            }))
          );
        }
      } catch {
        /* silently fail */
      } finally {
        setLoadingAdvisees(false);
      }
    }, 350);
    return () => clearTimeout(timer);
  }, [adviseeSearch, showMeetingModal]);

  // ── Save direct meeting ─────────────────────────────────────────
  const handleSaveMeeting = async () => {
    if (!selectedAdvisee) {
      Alert.alert("No student selected", "Please select an advisee for this meeting.");
      return;
    }
    if (meetEnd <= meetStart) {
      Alert.alert("Invalid time", "End time must be after start time.");
      return;
    }
    setSavingMeeting(true);
    try {
      const token = await getToken();
      const res = await fetch(`${API_BASE}/api/schedule/slots`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          slotDate: selectedDate,
          startTime: meetStart,
          endTime: meetEnd,
          studentNetid: selectedAdvisee.netid,
        }),
      });
      if (res.ok) {
        setShowMeetingModal(false);
        await fetchSchedule(false);
      } else {
        Alert.alert("Error", await res.text());
      }
    } catch {
      Alert.alert("Error", "Could not reach the server.");
    } finally {
      setSavingMeeting(false);
    }
  };

  // ── Weekly template ─────────────────────────────────────────────
  const openWeeklyModal = async () => {
    setShowWeeklyModal(true);
    setWeeklyAddDay(null);
    setLoadingWeekly(true);
    try {
      const res = await fetch(`${API_BASE}/api/schedule/weekly/${advisorNetid}`);
      if (res.ok) setWeeklySlots(await res.json());
    } catch { /* silently fail */ }
    finally { setLoadingWeekly(false); }
  };

  const handleAddWeeklySlot = async (day: number) => {
    if (weeklyNewEnd <= weeklyNewStart) {
      Alert.alert("Invalid time", "End time must be after start time.");
      return;
    }
    try {
      const token = await getToken();
      const res = await fetch(`${API_BASE}/api/schedule/weekly`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ dayOfWeek: day, startTime: weeklyNewStart, endTime: weeklyNewEnd }),
      });
      if (res.ok) {
        const saved = await res.json();
        setWeeklySlots((prev) => [...prev, saved]);
        setWeeklyAddDay(null);
        setWeeklyNewStart("09:00");
        setWeeklyNewEnd("10:00");
        if (saved.slotsCreated > 0) {
          Alert.alert("Added", `${saved.slotsCreated} slot(s) added to your calendar over the next 90 days.`);
          await fetchSchedule(false);
        }
      } else {
        Alert.alert("Error", await res.text());
      }
    } catch {
      Alert.alert("Error", "Could not reach the server.");
    }
  };

  const handleUpdateWeeklySlot = async (id: number) => {
    if (weeklyEditEnd <= weeklyEditStart) {
      Alert.alert("Invalid time", "End time must be after start time.");
      return;
    }
    try {
      const token = await getToken();
      const res = await fetch(`${API_BASE}/api/schedule/weekly/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ startTime: weeklyEditStart, endTime: weeklyEditEnd }),
      });
      if (res.ok) {
        const data = await res.json();
        setWeeklySlots((prev) =>
          prev.map((s) => s.id === id ? { ...s, startTime: weeklyEditStart, endTime: weeklyEditEnd } : s)
        );
        setWeeklyEditId(null);
        Alert.alert("Updated", `Weekly slot updated. ${data.updatedInCalendar} upcoming open slot(s) rescheduled.`);
        await fetchSchedule(false);
      } else {
        Alert.alert("Error", await res.text());
      }
    } catch {
      Alert.alert("Error", "Could not reach the server.");
    }
  };

  const handleDeleteWeeklySlot = async (id: number) => {
    try {
      const token = await getToken();
      const res = await fetch(`${API_BASE}/api/schedule/weekly/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setWeeklySlots((prev) => prev.filter((s) => s.id !== id));
        if (data.removedFromCalendar > 0) {
          Alert.alert("Removed", `${data.removedFromCalendar} upcoming open slot(s) removed from your calendar.`);
          await fetchSchedule(false);
        }
      } else {
        Alert.alert("Error", await res.text());
      }
    } catch {
      Alert.alert("Error", "Could not reach the server.");
    }
  };

  // ── Loading screen ──────────────────────────────────────────────
  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background, justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator size="large" color={theme.primary} />
        <Text style={{ color: theme.textSecondary, marginTop: 10 }}>Loading calendar...</Text>
      </View>
    );
  }

  // ── Render ──────────────────────────────────────────────────────
  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>

      {/* ── Add Free Slot Modal ───────────────────────────────────── */}
      <Modal visible={showSlotModal} transparent animationType="fade" onRequestClose={() => setShowSlotModal(false)}>
        <View style={styles.overlay}>
          <View style={[styles.modalCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>Add Availability</Text>
            <Text style={[styles.modalSub, { color: theme.textSecondary }]}>{formatDateLabel(selectedDate)}</Text>

            <AdvisorTimePicker label="Start Time" value={slotStart} onChange={setSlotStart} theme={theme} />
            <AdvisorTimePicker label="End Time" value={slotEnd} onChange={setSlotEnd} theme={theme} />

            <View style={styles.modalBtns}>
              <TouchableOpacity style={[styles.modalBtn, { borderColor: theme.border, backgroundColor: theme.background }]} onPress={() => setShowSlotModal(false)}>
                <Text style={{ color: theme.text, fontWeight: "600" }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalBtn, { backgroundColor: theme.primary, borderColor: theme.primary }]} onPress={handleSaveSlot} disabled={savingSlot}>
                {savingSlot ? <ActivityIndicator size="small" color={theme.background} /> : <Text style={{ color: theme.background, fontWeight: "700" }}>Save</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Add Meeting Modal ─────────────────────────────────────── */}
      <Modal visible={showMeetingModal} transparent animationType="fade" onRequestClose={() => setShowMeetingModal(false)}>
        <View style={styles.overlay}>
          <View style={[styles.modalCard, { backgroundColor: theme.card, borderColor: theme.border, maxHeight: "85%" }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>Schedule Meeting</Text>
            <Text style={[styles.modalSub, { color: theme.textSecondary }]}>{formatDateLabel(selectedDate)}</Text>

            <AdvisorTimePicker label="Start Time" value={meetStart} onChange={setMeetStart} theme={theme} />
            <AdvisorTimePicker label="End Time" value={meetEnd} onChange={setMeetEnd} theme={theme} />

            <Text style={[styles.fieldLabel, { color: theme.textSecondary, marginBottom: 6 }]}>Student</Text>
            <TextInput
              style={[styles.searchInput, { color: theme.text, borderColor: theme.border, backgroundColor: theme.background }]}
              value={adviseeSearch} onChangeText={setAdviseeSearch}
              placeholder="Search by name or NetID…" placeholderTextColor={theme.textSecondary}
            />

            {loadingAdvisees ? (
              <ActivityIndicator color={theme.primary} style={{ marginVertical: 12 }} />
            ) : (
              <ScrollView style={styles.adviseeList} nestedScrollEnabled keyboardShouldPersistTaps="handled">
                {adviseeSearch.trim() === "" ? (
                  <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                    Type a name or NetID to search students.
                  </Text>
                ) : advisees.length === 0 ? (
                  <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                    No students found for "{adviseeSearch}".
                  </Text>
                ) : (
                  advisees.map((a) => {
                    const selected = selectedAdvisee?.id === a.id;
                    return (
                      <TouchableOpacity
                        key={a.id}
                        style={[
                          styles.adviseeRow,
                          {
                            borderColor: selected ? theme.primary : theme.border,
                            backgroundColor: selected ? `${theme.primary}18` : theme.background,
                          },
                        ]}
                        onPress={() => setSelectedAdvisee(selected ? null : a)}
                        activeOpacity={0.85}
                      >
                        <View style={[styles.adviseeRadio, { borderColor: selected ? theme.primary : theme.textSecondary }]}>
                          {selected && <View style={[styles.adviseeRadioFill, { backgroundColor: theme.primary }]} />}
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.adviseeName, { color: theme.text }]}>{a.fullName}</Text>
                          <Text style={[styles.adviseeNetid, { color: theme.textSecondary }]}>{a.netid}</Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })
                )}
              </ScrollView>
            )}

            <View style={styles.modalBtns}>
              <TouchableOpacity style={[styles.modalBtn, { borderColor: theme.border, backgroundColor: theme.background }]} onPress={() => setShowMeetingModal(false)}>
                <Text style={{ color: theme.text, fontWeight: "600" }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalBtn, { backgroundColor: theme.primary, borderColor: theme.primary }]} onPress={handleSaveMeeting} disabled={savingMeeting}>
                {savingMeeting ? <ActivityIndicator size="small" color={theme.background} /> : <Text style={{ color: theme.background, fontWeight: "700" }}>Schedule</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Weekly Schedule Modal ─────────────────────────────────── */}
      <Modal visible={showWeeklyModal} transparent animationType="slide" onRequestClose={() => setShowWeeklyModal(false)}>
        <View style={styles.overlay}>
          <View style={[styles.weeklyCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            {/* Header */}
            <View style={styles.weeklyHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>Weekly Schedule</Text>
              <TouchableOpacity onPress={() => setShowWeeklyModal(false)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Ionicons name="close" size={22} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>
            <Text style={[styles.modalSub, { color: theme.textSecondary, marginBottom: 8 }]}>
              Changes automatically sync to your calendar 90 days ahead. Booked slots are never modified.
            </Text>

            {loadingWeekly ? (
              <ActivityIndicator color={theme.primary} style={{ marginVertical: 20 }} />
            ) : (
              <ScrollView style={styles.weeklyScroll} showsVerticalScrollIndicator={false}>
                {DAY_NAMES.map((dayName, idx) => {
                  const dow = idx + 1;
                  const daySlots = weeklySlots.filter((s) => s.dayOfWeek === dow);
                  const isAdding = weeklyAddDay === dow;

                  return (
                    <View key={dow} style={[styles.weeklyDayRow, { borderColor: theme.border }]}>
                      <View style={styles.weeklyDayHeader}>
                        <Text style={[styles.weeklyDayName, { color: theme.text }]}>{dayName}</Text>
                        {!isAdding && (
                          <TouchableOpacity
                            onPress={() => {
                              setWeeklyEditId(null);
                              setWeeklyAddDay(dow);
                              setWeeklyNewStart("09:00");
                              setWeeklyNewEnd("10:00");
                            }}
                            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                          >
                            <Ionicons name="add-circle-outline" size={18} color={theme.primary} />
                          </TouchableOpacity>
                        )}
                      </View>

                      {daySlots.map((ws) => {
                        const isEditing = weeklyEditId === ws.id;
                        return (
                          <View key={ws.id}>
                            {isEditing ? (
                              <View style={[styles.weeklyInlineForm, { borderWidth: 1, borderColor: theme.primary, borderRadius: 10, padding: 10, marginBottom: 4 }]}>
                                <AdvisorTimePicker label="Start Time" value={weeklyEditStart} onChange={setWeeklyEditStart} theme={theme} />
                                <AdvisorTimePicker label="End Time" value={weeklyEditEnd} onChange={setWeeklyEditEnd} theme={theme} />
                                <View style={styles.inlineBtns}>
                                  <TouchableOpacity onPress={() => setWeeklyEditId(null)} style={[styles.inlineBtn, { borderColor: theme.border }]}>
                                    <Text style={{ color: theme.textSecondary, fontSize: 12 }}>Cancel</Text>
                                  </TouchableOpacity>
                                  <TouchableOpacity onPress={() => handleUpdateWeeklySlot(ws.id)} style={[styles.inlineBtn, { backgroundColor: theme.primary, borderColor: theme.primary }]}>
                                    <Text style={{ color: theme.background, fontWeight: "700", fontSize: 12 }}>Save</Text>
                                  </TouchableOpacity>
                                </View>
                              </View>
                            ) : (
                              <View style={[styles.weeklySlotChip, { backgroundColor: theme.background, borderColor: theme.border }]}>
                                <Text style={[styles.weeklySlotTime, { color: theme.text }]}>
                                  {formatRange(ws.startTime, ws.endTime)}
                                </Text>
                                <View style={{ flexDirection: "row", gap: 12, alignItems: "center" }}>
                                  <TouchableOpacity
                                    onPress={() => {
                                      setWeeklyAddDay(null);
                                      setWeeklyEditId(ws.id);
                                      setWeeklyEditStart(ws.startTime.substring(0, 5));
                                      setWeeklyEditEnd(ws.endTime.substring(0, 5));
                                    }}
                                    hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                                  >
                                    <Ionicons name="pencil-outline" size={14} color={theme.primary} />
                                  </TouchableOpacity>
                                  <TouchableOpacity onPress={() => handleDeleteWeeklySlot(ws.id)} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
                                    <Ionicons name="trash-outline" size={14} color={theme.textSecondary} />
                                  </TouchableOpacity>
                                </View>
                              </View>
                            )}
                          </View>
                        );
                      })}

                      {isAdding && (
                        <View style={styles.weeklyInlineForm}>
                          <AdvisorTimePicker label="Start Time" value={weeklyNewStart} onChange={setWeeklyNewStart} theme={theme} />
                          <AdvisorTimePicker label="End Time" value={weeklyNewEnd} onChange={setWeeklyNewEnd} theme={theme} />
                          <View style={styles.inlineBtns}>
                            <TouchableOpacity onPress={() => setWeeklyAddDay(null)} style={[styles.inlineBtn, { borderColor: theme.border }]}>
                              <Text style={{ color: theme.textSecondary, fontSize: 12 }}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => handleAddWeeklySlot(dow)} style={[styles.inlineBtn, { backgroundColor: theme.primary, borderColor: theme.primary }]}>
                              <Text style={{ color: theme.background, fontWeight: "700", fontSize: 12 }}>Add</Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      )}

                      {daySlots.length === 0 && !isAdding && (
                        <Text style={[styles.noSlotsText, { color: theme.textSecondary }]}>No recurring slots</Text>
                      )}
                    </View>
                  );
                })}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* ── Main calendar layout ──────────────────────────────────── */}
      <View style={styles.screenInner}>
        <View style={[styles.mainRow, !isWide && styles.mainColumn]}>

          {/* Left pane — calendar grid */}
          <View style={[styles.leftPane, !isWide && styles.fullPane]}>
            <View style={styles.headerRow}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.header, { color: theme.text }]}>Advising Calendar</Text>
                <Text style={{ color: theme.textSecondary, marginTop: 2 }}>
                  Manage your availability and meetings.
                </Text>
              </View>

              <TouchableOpacity
                onPress={openWeeklyModal}
                style={[styles.weeklyBtn, { borderColor: theme.primary }]}
                activeOpacity={0.85}
              >
                <Ionicons name="repeat" size={14} color={theme.primary} />
                <Text style={[styles.weeklyBtnText, { color: theme.primary }]}>Weekly</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => fetchSchedule(false)}
                style={[styles.iconButton, { borderColor: theme.border, backgroundColor: theme.card }]}
                activeOpacity={0.85}
              >
                <Ionicons name={refreshing ? "sync" : "refresh"} size={15} color={theme.text} />
              </TouchableOpacity>
            </View>

            <View style={[styles.sectionCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <View style={styles.monthHeader}>
                <TouchableOpacity onPress={prevMonth} style={styles.monthArrow} activeOpacity={0.85}>
                  <Ionicons name="chevron-back" size={16} color={theme.text} />
                </TouchableOpacity>
                <Text style={[styles.monthTitle, { color: theme.text }]}>{formatMonthYear(visibleMonth)}</Text>
                <TouchableOpacity onPress={nextMonth} style={styles.monthArrow} activeOpacity={0.85}>
                  <Ionicons name="chevron-forward" size={16} color={theme.text} />
                </TouchableOpacity>
              </View>

              <View style={styles.weekdayRow}>
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
                  <Text key={d} style={[styles.weekdayText, { color: theme.textSecondary }]}>{d}</Text>
                ))}
              </View>

              <View style={styles.grid}>
                {monthGrid.map((day) => {
                  const isSelected = day.dateKey === selectedDate;
                  const isToday = day.dateKey === todayKey;
                  const count = meetingCountByDate[day.dateKey] ?? 0;
                  return (
                    <TouchableOpacity
                      key={day.dateKey}
                      activeOpacity={0.85}
                      onPress={() => handleDayPress(day.dateKey)}
                      style={[
                        styles.dayCell,
                        { backgroundColor: isSelected ? theme.primary : "transparent", borderColor: isSelected ? theme.primary : "transparent" },
                      ]}
                    >
                      <Text style={[styles.dayNumber, { color: isSelected ? theme.background : day.isCurrentMonth ? theme.text : theme.textSecondary, opacity: day.isCurrentMonth ? 1 : 0.45 }]}>
                        {day.dayNumber}
                      </Text>
                      {isToday && !isSelected && (
                        <View style={[styles.todayOutline, { borderColor: theme.primary }]} />
                      )}
                      {count > 0 && (
                        <View style={[styles.dot, { backgroundColor: isSelected ? theme.background : theme.primary, opacity: day.isCurrentMonth ? 1 : 0.6 }]} />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </View>

          {/* Right pane — day agenda */}
          <View style={[styles.rightPane, !isWide && styles.fullPane]}>
            <View style={styles.agendaHeader}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.agendaTitle, { color: theme.text }]} numberOfLines={1}>
                  {formatDateLabel(selectedDate)}
                </Text>
                <Text style={{ color: theme.textSecondary, fontSize: 12, marginTop: 2 }}>
                  {selectedDayMeetings.length} slot{selectedDayMeetings.length === 1 ? "" : "s"}
                </Text>
              </View>

              <View style={styles.agendaActions}>
                <TouchableOpacity
                  style={[styles.addBtn, { backgroundColor: theme.card, borderColor: theme.border }]}
                  onPress={() => setShowSlotModal(true)}
                  activeOpacity={0.85}
                >
                  <Ionicons name="add" size={14} color={theme.text} />
                  <Text style={[styles.addBtnText, { color: theme.text }]}>Free slot</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.addBtn, { backgroundColor: theme.primary, borderColor: theme.primary }]}
                  onPress={openMeetingModal}
                  activeOpacity={0.85}
                >
                  <Ionicons name="people" size={14} color={theme.background} />
                  <Text style={[styles.addBtnText, { color: theme.background }]}>Meeting</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={[styles.meetingPanel, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <ScrollView style={styles.meetingScroll} contentContainerStyle={{ paddingBottom: 10 }} showsVerticalScrollIndicator={false}>
                {selectedDayMeetings.length === 0 ? (
                  <View style={styles.emptyState}>
                    <Ionicons name="calendar-outline" size={24} color={theme.textSecondary} style={{ marginBottom: 6 }} />
                    <Text style={[styles.emptyTitle, { color: theme.text }]}>No slots yet</Text>
                    <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                      Add a free slot or schedule a meeting with an advisee.
                    </Text>
                  </View>
                ) : (
                  selectedDayMeetings.map((meeting) => {
                    const sc = statusColors(meeting.status);
                    const isOpen = meeting.status === "OPEN";

                    return (
                      <View
                        key={meeting.id}
                        style={[styles.meetingCard, { backgroundColor: theme.background, borderColor: theme.border }]}
                      >
                        {/* Top row: time + status pill + delete */}
                        <View style={styles.meetingTopRow}>
                          <Text style={[styles.meetingTime, { color: theme.text }]}>
                            {formatRange(meeting.startTime, meeting.endTime)}
                          </Text>
                          <View style={styles.meetingTopRight}>
                            <View style={[styles.statusPill, { backgroundColor: sc.bg, borderColor: sc.border }]}>
                              <Text style={[styles.statusText, { color: sc.text }]}>{statusLabel(meeting.status)}</Text>
                            </View>
                            <Pressable
                              onPress={() => handleDeleteSlot(meeting)}
                              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                            >
                              <Ionicons name="trash-outline" size={16} color={theme.textSecondary} />
                            </Pressable>
                          </View>
                        </View>

                        {/* Student info — tappable only for BOOKED */}
                        {meeting.hasStudent ? (
                          <TouchableOpacity onPress={() => handleMeetingPress(meeting)} activeOpacity={0.85}>
                            <Text style={[styles.meetingStudent, { color: theme.text }]}>{meeting.student}</Text>
                            {meeting.netid ? (
                              <Text style={styles.meetingMeta}>NetID: {meeting.netid}</Text>
                            ) : null}
                          </TouchableOpacity>
                        ) : (
                          <Text style={[styles.meetingStudent, { color: theme.textSecondary }]}>{meeting.student}</Text>
                        )}
                      </View>
                    );
                  })
                )}
              </ScrollView>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1 },
  screenInner: { flex: 1, padding: 14, gap: 12 },

  mainRow: { flex: 1, flexDirection: "row", gap: 12, minHeight: 0 },
  mainColumn: { flexDirection: "column" },
  leftPane: { flex: 1.05, minWidth: 0 },
  rightPane: { flex: 0.95, minWidth: 0 },
  fullPane: { flex: undefined, width: "100%" },

  headerRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 10 },
  header: { fontSize: 20, fontWeight: "700" },

  weeklyBtn: {
    flexDirection: "row", alignItems: "center", gap: 4,
    paddingHorizontal: 10, paddingVertical: 7, borderRadius: 10, borderWidth: 1,
  },
  weeklyBtnText: { fontSize: 12, fontWeight: "600" },

  iconButton: {
    width: 36, height: 36, borderWidth: 1, borderRadius: 10,
    alignItems: "center", justifyContent: "center",
  },

  sectionCard: { borderWidth: 1, borderRadius: 14, padding: 8 },
  monthHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 6 },
  monthArrow: { width: 30, height: 30, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  monthTitle: { fontSize: 16, fontWeight: "700" },

  weekdayRow: { flexDirection: "row", marginBottom: 4 },
  weekdayText: { width: `${100 / 7}%`, textAlign: "center", fontSize: 10, fontWeight: "600" },

  grid: { flexDirection: "row", flexWrap: "wrap" },
  dayCell: {
    width: `${100 / 7}%`, aspectRatio: 1, alignItems: "center", justifyContent: "center",
    borderRadius: 8, borderWidth: 1, marginBottom: 2, position: "relative", paddingVertical: 1,
  },
  dayNumber: { fontSize: 12, fontWeight: "600" },
  dot: { width: 5, height: 5, borderRadius: 999, marginTop: 4 },
  todayOutline: { position: "absolute", inset: 4, borderWidth: 1, borderRadius: 8 },

  agendaHeader: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 8, marginBottom: 10 },
  agendaTitle: { fontSize: 14, fontWeight: "700", marginBottom: 2 },
  agendaActions: { flexDirection: "row", gap: 6 },
  addBtn: {
    flexDirection: "row", alignItems: "center", gap: 4,
    paddingHorizontal: 10, paddingVertical: 7, borderRadius: 10, borderWidth: 1,
  },
  addBtnText: { fontSize: 12, fontWeight: "700" },

  meetingPanel: { flex: 1, borderWidth: 1, borderRadius: 14, padding: 12, minHeight: 0 },
  meetingScroll: { flex: 1 },

  meetingCard: { borderWidth: 1, borderRadius: 12, padding: 12, marginBottom: 10 },
  meetingTopRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 8 },
  meetingTopRight: { flexDirection: "row", alignItems: "center", gap: 8 },
  meetingTime: { fontSize: 15, fontWeight: "700" },
  meetingStudent: { fontSize: 15, fontWeight: "600", marginTop: 8 },
  meetingMeta: { marginTop: 3, fontSize: 13, color: "#6B7280" },

  statusPill: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  statusText: { fontSize: 11, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.5 },

  emptyState: { padding: 18, alignItems: "center", marginTop: 2 },
  emptyTitle: { fontSize: 15, fontWeight: "700" },
  emptyText: { marginTop: 3, textAlign: "center", fontSize: 13 },

  // Shared modal pieces
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", alignItems: "center", justifyContent: "center", padding: 20 },
  modalCard: { width: "100%", maxWidth: 420, borderWidth: 1, borderRadius: 16, padding: 20, gap: 14 },
  modalTitle: { fontSize: 18, fontWeight: "700" },
  modalSub: { fontSize: 13, marginTop: -8 },
  timeRow: { flexDirection: "row", alignItems: "flex-end", gap: 8 },
  timeField: { flex: 1, gap: 4 },
  timeSep: { fontSize: 18, fontWeight: "300", paddingBottom: 10 },
  fieldLabel: { fontSize: 11, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.4 },
  timeInput: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 16, textAlign: "center" },
  modalBtns: { flexDirection: "row", gap: 10, marginTop: 4 },
  modalBtn: { flex: 1, borderWidth: 1, borderRadius: 10, paddingVertical: 12, alignItems: "center", justifyContent: "center" },

  // Meeting modal — student picker
  searchInput: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 9, fontSize: 14, marginBottom: 6 },
  adviseeList: { maxHeight: 200 },
  adviseeRow: { flexDirection: "row", alignItems: "center", gap: 10, borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, marginBottom: 6 },
  adviseeRadio: { width: 18, height: 18, borderRadius: 9, borderWidth: 2, alignItems: "center", justifyContent: "center" },
  adviseeRadioFill: { width: 8, height: 8, borderRadius: 4 },
  adviseeName: { fontSize: 14, fontWeight: "600" },
  adviseeNetid: { fontSize: 12, marginTop: 1 },

  // Weekly modal
  weeklyCard: { width: "100%", maxWidth: 460, maxHeight: "90%", borderWidth: 1, borderRadius: 16, padding: 20 },
  weeklyHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 },
  weeklyScroll: { flex: 1 },
  weeklyDayRow: { borderBottomWidth: 1, paddingVertical: 10 },
  weeklyDayHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 },
  weeklyDayName: { fontSize: 14, fontWeight: "700" },
  weeklySlotChip: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderWidth: 1, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, marginBottom: 4 },
  weeklySlotTime: { fontSize: 13 },
  noSlotsText: { fontSize: 12, fontStyle: "italic" },
  weeklyInlineForm: { marginTop: 6, gap: 6 },
  inlineBtns: { flexDirection: "row", gap: 8 },
  inlineBtn: { flex: 1, borderWidth: 1, borderRadius: 8, paddingVertical: 7, alignItems: "center" },

});
