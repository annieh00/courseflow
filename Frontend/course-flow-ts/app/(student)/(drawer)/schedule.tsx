import React, { useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
  Modal,
  Platform,
} from "react-native";
import { useFocusEffect } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useTheme } from "../../../components/ThemeContext";
import { useAuth } from "../../../auth/AuthContext";

const API_BASE = (process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:8080/api").replace(/\/api\/?$/, "");

// ─── Types ────────────────────────────────────────────────────────────────────

type Slot = {
  id: number;
  advisorId: number;
  advisorNetid: string;
  advisorName: string;
  slotDate: string;
  startTime: string;
  endTime: string;
  status: string;
};

type Tab = "myAdvisor" | "otherAdvisors" | "appointments";

type CalendarDay = { dateKey: string; dayNumber: number; isCurrentMonth: boolean };

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toDateKey(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function parseDateKeyLocal(dateKey: string) {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function formatMonthYear(date: Date) {
  return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

function formatTime(t: string) {
  const [h, m] = t.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const hour = h % 12 || 12;
  return `${hour}:${String(m).padStart(2, "0")} ${ampm}`;
}

function formatDate(dateStr: string) {
  const [year, month, day] = dateStr.split("-").map(Number);
  const d = new Date(year, month - 1, day);
  return d.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function groupByDate(slots: Slot[]): { date: string; slots: Slot[] }[] {
  const map: Record<string, Slot[]> = {};
  for (const slot of slots) {
    if (!map[slot.slotDate]) map[slot.slotDate] = [];
    map[slot.slotDate].push(slot);
  }
  return Object.entries(map)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, slots]) => ({ date, slots }));
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

function generateStartTimes(slotStart: string, slotEnd: string): string[] {
  const [sh, sm] = slotStart.split(":").map(Number);
  const [eh, em] = slotEnd.split(":").map(Number);
  const startMins = sh * 60 + sm;
  const endMins = eh * 60 + em;
  const result: string[] = [];
  for (let m = startMins; m < endMins - 14; m += 15) {
    const h = Math.floor(m / 60);
    const min = m % 60;
    result.push(`${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}`);
  }
  return result;
}

function generateEndTimes(selectedStart: string, slotEnd: string): string[] {
  const [sh, sm] = selectedStart.split(":").map(Number);
  const [eh, em] = slotEnd.split(":").map(Number);
  const startMins = sh * 60 + sm + 15;
  const endMins = eh * 60 + em;
  const result: string[] = [];
  for (let m = startMins; m <= endMins; m += 15) {
    const h = Math.floor(m / 60);
    const min = m % 60;
    result.push(`${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}`);
  }
  return result;
}

function minutesBetween(start: string, end: string): number {
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  return eh * 60 + em - (sh * 60 + sm);
}

// ─── Booking Modal ────────────────────────────────────────────────────────────

type BookingModalProps = {
  slot: Slot | null;
  onClose: () => void;
  onConfirm: (slot: Slot, windowStart: string, windowEnd: string) => void;
  confirming: boolean;
  theme: any;
};

function BookingModal({ slot, onClose, onConfirm, confirming, theme }: BookingModalProps) {
  const s = modalStyles(theme);

  const startTimes = useMemo(
    () => (slot ? generateStartTimes(slot.startTime, slot.endTime) : []),
    [slot]
  );

  const [selectedStart, setSelectedStart] = useState("");
  const [selectedEnd, setSelectedEnd] = useState("");

  const endTimes = useMemo(
    () => (selectedStart ? generateEndTimes(selectedStart, slot?.endTime ?? "") : []),
    [selectedStart, slot]
  );

  const handleSelectStart = (t: string) => {
    setSelectedStart(t);
    setSelectedEnd("");
  };

  const duration = selectedStart && selectedEnd ? minutesBetween(selectedStart, selectedEnd) : 0;
  const canConfirm = !!selectedStart && !!selectedEnd && !confirming;

  if (!slot) return null;

  return (
    <Modal visible={!!slot} transparent animationType="fade" onRequestClose={onClose}>
      <View style={s.overlay}>
        <View style={s.card}>
          <Text style={s.title}>Book Appointment</Text>
          <Text style={s.subtitle}>{formatDate(slot.slotDate)}</Text>
          <Text style={s.advisorLabel}>
            Advisor: <Text style={s.advisorName}>{slot.advisorName || slot.advisorNetid}</Text>
          </Text>
          <Text style={s.availableLabel}>
            Available:{" "}
            <Text style={s.availableTime}>
              {formatTime(slot.startTime)} – {formatTime(slot.endTime)}
            </Text>
          </Text>

          <View style={s.divider} />

          <Text style={s.sectionLabel}>Select Start Time</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.chipScroll}>
            <View style={s.chipRow}>
              {startTimes.map((t) => (
                <TouchableOpacity
                  key={t}
                  style={[s.chip, selectedStart === t && s.chipSelected]}
                  onPress={() => handleSelectStart(t)}
                >
                  <Text style={[s.chipText, selectedStart === t && s.chipTextSelected]}>
                    {formatTime(t)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          {selectedStart !== "" && (
            <>
              <Text style={[s.sectionLabel, { marginTop: 14 }]}>Select End Time</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.chipScroll}>
                <View style={s.chipRow}>
                  {endTimes.map((t) => (
                    <TouchableOpacity
                      key={t}
                      style={[s.chip, selectedEnd === t && s.chipSelected]}
                      onPress={() => setSelectedEnd(t)}
                    >
                      <Text style={[s.chipText, selectedEnd === t && s.chipTextSelected]}>
                        {formatTime(t)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </>
          )}

          {duration > 0 && (
            <View style={s.durationRow}>
              <Text style={s.durationText}>
                {formatTime(selectedStart)} – {formatTime(selectedEnd)}{"  "}({duration} min)
              </Text>
            </View>
          )}

          <View style={s.divider} />

          <View style={s.btnRow}>
            <TouchableOpacity style={[s.btn, s.btnCancel]} onPress={onClose} disabled={confirming}>
              <Text style={[s.btnText, { color: theme.textSecondary }]}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.btn, s.btnConfirm, !canConfirm && s.btnDisabled]}
              onPress={() => canConfirm && onConfirm(slot, selectedStart, selectedEnd)}
              disabled={!canConfirm}
            >
              {confirming ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={[s.btnText, { color: "#fff" }]}>Confirm Booking</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ─── Mini Calendar ────────────────────────────────────────────────────────────

type MiniCalendarProps = {
  appointments: Slot[];
  selectedDate: string;
  onSelectDate: (dateKey: string) => void;
  theme: any;
};

function MiniCalendar({ appointments, selectedDate, onSelectDate, theme }: MiniCalendarProps) {
  const todayKey = toDateKey(new Date());
  const [visibleMonth, setVisibleMonth] = useState(() => {
    const t = new Date();
    return new Date(t.getFullYear(), t.getMonth(), 1);
  });

  const monthGrid = useMemo(() => getMonthGrid(visibleMonth), [visibleMonth]);

  const apptCountByDate = useMemo(() => {
    const map: Record<string, number> = {};
    for (const a of appointments) map[a.slotDate] = (map[a.slotDate] ?? 0) + 1;
    return map;
  }, [appointments]);

  const cs = calStyles(theme);

  return (
    <View style={cs.container}>
      {/* Month navigation */}
      <View style={cs.monthHeader}>
        <TouchableOpacity
          style={cs.arrow}
          onPress={() => setVisibleMonth((p) => new Date(p.getFullYear(), p.getMonth() - 1, 1))}
        >
          <Ionicons name="chevron-back" size={16} color={theme.text} />
        </TouchableOpacity>
        <Text style={cs.monthTitle}>{formatMonthYear(visibleMonth)}</Text>
        <TouchableOpacity
          style={cs.arrow}
          onPress={() => setVisibleMonth((p) => new Date(p.getFullYear(), p.getMonth() + 1, 1))}
        >
          <Ionicons name="chevron-forward" size={16} color={theme.text} />
        </TouchableOpacity>
      </View>

      {/* Weekday labels */}
      <View style={cs.weekRow}>
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
          <Text key={d} style={cs.weekLabel}>{d}</Text>
        ))}
      </View>

      {/* Day grid */}
      <View style={cs.grid}>
        {monthGrid.map((day) => {
          const isSelected = day.dateKey === selectedDate;
          const isToday = day.dateKey === todayKey;
          const count = apptCountByDate[day.dateKey] ?? 0;
          return (
            <TouchableOpacity
              key={day.dateKey}
              style={[
                cs.dayCell,
                isSelected && { backgroundColor: theme.primary, borderColor: theme.primary },
              ]}
              onPress={() => onSelectDate(day.dateKey)}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  cs.dayNumber,
                  {
                    color: isSelected
                      ? theme.background
                      : day.isCurrentMonth
                      ? theme.text
                      : theme.textSecondary,
                    opacity: day.isCurrentMonth ? 1 : 0.35,
                  },
                ]}
              >
                {day.dayNumber}
              </Text>
              {isToday && !isSelected && (
                <View style={[cs.todayRing, { borderColor: theme.primary }]} />
              )}
              {count > 0 && (
                <View
                  style={[
                    cs.dot,
                    {
                      backgroundColor: isSelected ? theme.background : theme.primary,
                      opacity: day.isCurrentMonth ? 1 : 0.5,
                    },
                  ]}
                />
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function StudentSchedule() {
  const { theme } = useTheme();
  const { user } = useAuth();

  const [tab, setTab] = useState<Tab>("myAdvisor");
  const [myAdvisorSlots, setMyAdvisorSlots] = useState<Slot[]>([]);
  const [otherSlots, setOtherSlots] = useState<Slot[]>([]);
  const [appointments, setAppointments] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(false);

  const [bookingSlot, setBookingSlot] = useState<Slot | null>(null);
  const [confirming, setConfirming] = useState(false);

  // Calendar state — used only in My Appointments tab
  const [selectedDate, setSelectedDate] = useState(() => toDateKey(new Date()));

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem("accessToken");
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      };

      const [myRes, otherRes, apptRes] = await Promise.all([
        fetch(`${API_BASE}/api/schedule/student/open-slots`, { headers }),
        fetch(`${API_BASE}/api/schedule/student/other-advisor-slots`, { headers }),
        fetch(`${API_BASE}/api/schedule/student/appointments`, { headers }),
      ]);

      if (myRes.ok) setMyAdvisorSlots(await myRes.json());
      if (otherRes.ok) setOtherSlots(await otherRes.json());
      if (apptRes.ok) setAppointments(await apptRes.json());
    } catch {
      // leave existing data on network error
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData])
  );

  // ─── Confirm Booking ────────────────────────────────────────────

  const handleConfirmBooking = async (slot: Slot, windowStart: string, windowEnd: string) => {
    setConfirming(true);
    try {
      const token = await AsyncStorage.getItem("accessToken");
      const res = await fetch(`${API_BASE}/api/schedule/${slot.id}/book-window`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ windowStart, windowEnd }),
      });

      if (!res.ok) {
        Alert.alert("Error", (await res.text()) || "Failed to book appointment.");
        return;
      }

      setBookingSlot(null);
      Alert.alert(
        "Booked!",
        `Your meeting on ${formatDate(slot.slotDate)} from ${formatTime(windowStart)} to ${formatTime(windowEnd)} has been booked.`
      );
      fetchData();
      setTab("appointments");
    } catch {
      Alert.alert("Error", "Network error. Please try again.");
    } finally {
      setConfirming(false);
    }
  };

  // ─── Cancel Appointment ─────────────────────────────────────────

  const handleCancel = (slot: Slot) => {
    const doCancel = async () => {
      try {
        const token = await AsyncStorage.getItem("accessToken");
        const res = await fetch(`${API_BASE}/api/schedule/student/appointments/${slot.id}`, {
          method: "DELETE",
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (!res.ok) {
          Alert.alert("Error", (await res.text()) || "Failed to cancel appointment.");
          return;
        }
        Alert.alert("Cancelled", "Your appointment has been cancelled.");
        fetchData();
      } catch {
        Alert.alert("Error", "Network error. Please try again.");
      }
    };

    if (Platform.OS === "web") {
      if (window.confirm(`Cancel your meeting on ${formatDate(slot.slotDate)} at ${formatTime(slot.startTime)}?`)) {
        doCancel();
      }
    } else {
      Alert.alert(
        "Cancel Appointment",
        `Cancel your meeting on ${formatDate(slot.slotDate)} at ${formatTime(slot.startTime)}?`,
        [
          { text: "No", style: "cancel" },
          { text: "Yes, Cancel", style: "destructive", onPress: doCancel },
        ]
      );
    }
  };

  // ─── Render ─────────────────────────────────────────────────────

  const s = styles(theme);

  const activeSlots =
    tab === "myAdvisor" ? myAdvisorSlots : tab === "otherAdvisors" ? otherSlots : appointments;

  const grouped = groupByDate(tab === "appointments" ? appointments : activeSlots);
  const selectedDayAppts = useMemo(
    () => appointments.filter((a) => a.slotDate === selectedDate),
    [appointments, selectedDate]
  );

  const emptyMessage =
    tab === "myAdvisor"
      ? "Your advisor has no open slots yet."
      : tab === "otherAdvisors"
      ? "No open slots from other advisors right now."
      : "You have no upcoming appointments.";

  return (
    <View style={s.container}>
      {/* Tab bar */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.tabBar}>
        {(
          [
            { key: "myAdvisor", label: "My Advisor" },
            { key: "otherAdvisors", label: "Other Advisors" },
            {
              key: "appointments",
              label: `My Appointments${appointments.length > 0 ? ` (${appointments.length})` : ""}`,
            },
          ] as { key: Tab; label: string }[]
        ).map(({ key, label }) => (
          <TouchableOpacity
            key={key}
            style={[s.tabBtn, tab === key && s.tabBtnActive]}
            onPress={() => setTab(key)}
          >
            <Text style={[s.tabText, tab === key && s.tabTextActive]}>{label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {loading ? (
        <View style={s.centered}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      ) : tab === "appointments" ? (
        /* ── My Appointments: calendar + day list ─────────────────── */
        <ScrollView style={s.flex1} contentContainerStyle={s.apptScroll}>
          {/* Calendar */}
          <MiniCalendar
            appointments={appointments}
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
            theme={theme}
          />

          {/* Selected day header */}
          <View style={s.dayHeaderRow}>
            <Text style={s.dayHeaderText}>{formatDate(selectedDate)}</Text>
            <Text style={s.dayHeaderCount}>
              {selectedDayAppts.length} appointment{selectedDayAppts.length !== 1 ? "s" : ""}
            </Text>
          </View>

          {/* Appointments for selected day */}
          {selectedDayAppts.length === 0 ? (
            <View style={s.dayEmpty}>
              <Ionicons name="calendar-outline" size={28} color={theme.textSecondary} />
              <Text style={s.dayEmptyText}>No appointments on this day.</Text>
            </View>
          ) : (
            selectedDayAppts.map((slot) => (
              <View key={slot.id} style={s.card}>
                <View style={s.cardLeft}>
                  <Text style={s.timeText}>
                    {formatTime(slot.startTime)} – {formatTime(slot.endTime)}
                  </Text>
                  <Text style={s.advisorText}>{slot.advisorName || slot.advisorNetid}</Text>
                </View>
                <TouchableOpacity style={[s.actionBtn, s.cancelBtn]} onPress={() => handleCancel(slot)}>
                  <Text style={s.actionBtnText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            ))
          )}

          {/* Upcoming appointments not on selected day */}
          {(() => {
            const rest = grouped.filter((g) => g.date !== selectedDate);
            if (rest.length === 0) return null;
            return (
              <>
                <Text style={s.upcomingLabel}>All Upcoming</Text>
                {rest.map(({ date, slots }) => (
                  <View key={date} style={s.dateSection}>
                    <TouchableOpacity onPress={() => setSelectedDate(date)}>
                      <Text style={s.dateHeader}>{formatDate(date)}</Text>
                    </TouchableOpacity>
                    {slots.map((slot) => (
                      <View key={slot.id} style={s.card}>
                        <View style={s.cardLeft}>
                          <Text style={s.timeText}>
                            {formatTime(slot.startTime)} – {formatTime(slot.endTime)}
                          </Text>
                          <Text style={s.advisorText}>{slot.advisorName || slot.advisorNetid}</Text>
                        </View>
                        <TouchableOpacity
                          style={[s.actionBtn, s.cancelBtn]}
                          onPress={() => handleCancel(slot)}
                        >
                          <Text style={s.actionBtnText}>Cancel</Text>
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                ))}
              </>
            );
          })()}
        </ScrollView>
      ) : activeSlots.length === 0 ? (
        /* ── Empty state for available slot tabs ──────────────────── */
        <View style={s.centered}>
          <Text style={s.emptyText}>{emptyMessage}</Text>
        </View>
      ) : tab === "myAdvisor" ? (
        /* ── My Advisor: advisor banner + date-grouped slots ──────── */
        <ScrollView style={s.flex1} contentContainerStyle={s.scroll}>
          {myAdvisorSlots.length > 0 && (
            <View style={[s.advisorBanner, { backgroundColor: `${theme.primary}15`, borderColor: `${theme.primary}40` }]}>
              <Ionicons name="person-circle-outline" size={20} color={theme.primary} />
              <View style={{ flex: 1 }}>
                <Text style={[s.advisorBannerLabel, { color: theme.primary }]}>Booking with your advisor</Text>
                <Text style={[s.advisorBannerName, { color: theme.text }]}>
                  {myAdvisorSlots[0].advisorName || myAdvisorSlots[0].advisorNetid}
                </Text>
              </View>
            </View>
          )}
          {grouped.map(({ date, slots }) => (
            <View key={date} style={s.dateSection}>
              <Text style={s.dateHeader}>{formatDate(date)}</Text>
              {slots.map((slot) => (
                <View key={slot.id} style={s.card}>
                  <View style={s.cardLeft}>
                    <Text style={s.timeText}>
                      {formatTime(slot.startTime)} – {formatTime(slot.endTime)}
                    </Text>
                  </View>
                  <TouchableOpacity style={[s.actionBtn, s.bookBtn]} onPress={() => setBookingSlot(slot)}>
                    <Text style={s.actionBtnText}>Book</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          ))}
        </ScrollView>
      ) : (
        /* ── Other Advisors: grouped by advisor, then by date ─────── */
        <ScrollView style={s.flex1} contentContainerStyle={s.scroll}>
          {(() => {
            // Group by advisor
            const byAdvisor: Record<string, { name: string; netid: string; slots: Slot[] }> = {};
            for (const slot of otherSlots) {
              const key = String(slot.advisorId);
              if (!byAdvisor[key]) byAdvisor[key] = { name: slot.advisorName, netid: slot.advisorNetid, slots: [] };
              byAdvisor[key].slots.push(slot);
            }
            return Object.values(byAdvisor).map((advisor) => (
              <View key={advisor.netid} style={s.advisorSection}>
                <View style={[s.advisorBanner, { backgroundColor: `${theme.primary}15`, borderColor: `${theme.primary}40` }]}>
                  <Ionicons name="person-circle-outline" size={20} color={theme.primary} />
                  <View style={{ flex: 1 }}>
                    <Text style={[s.advisorBannerLabel, { color: theme.primary }]}>Advisor</Text>
                    <Text style={[s.advisorBannerName, { color: theme.text }]}>
                      {advisor.name || advisor.netid}
                    </Text>
                  </View>
                </View>
                {groupByDate(advisor.slots).map(({ date, slots }) => (
                  <View key={date} style={s.dateSection}>
                    <Text style={s.dateHeader}>{formatDate(date)}</Text>
                    {slots.map((slot) => (
                      <View key={slot.id} style={s.card}>
                        <View style={s.cardLeft}>
                          <Text style={s.timeText}>
                            {formatTime(slot.startTime)} – {formatTime(slot.endTime)}
                          </Text>
                        </View>
                        <TouchableOpacity style={[s.actionBtn, s.bookBtn]} onPress={() => setBookingSlot(slot)}>
                          <Text style={s.actionBtnText}>Book</Text>
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                ))}
              </View>
            ));
          })()}
        </ScrollView>
      )}

      <BookingModal
        slot={bookingSlot}
        onClose={() => setBookingSlot(null)}
        onConfirm={handleConfirmBooking}
        confirming={confirming}
        theme={theme}
      />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = (theme: any) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.background },
    flex1: { flex: 1 },
    tabBar: { flexGrow: 0, flexShrink: 0, borderBottomWidth: 1, borderBottomColor: theme.border },
    tabBtn: { paddingHorizontal: 18, paddingVertical: 14 },
    tabBtnActive: { borderBottomWidth: 3, borderBottomColor: theme.primary },
    tabText: { fontSize: 13, fontWeight: "500", color: theme.textSecondary },
    tabTextActive: { color: theme.primary, fontWeight: "700" },
    centered: { flex: 1, justifyContent: "center", alignItems: "center", padding: 32 },
    emptyText: { fontSize: 15, color: theme.textSecondary, textAlign: "center" },
    scroll: { padding: 16, paddingBottom: 40 },
    apptScroll: { padding: 16, paddingBottom: 40 },
    dateSection: { marginBottom: 20 },
    dateHeader: {
      fontSize: 14,
      fontWeight: "700",
      color: theme.text,
      marginBottom: 8,
      paddingBottom: 6,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    card: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      backgroundColor: theme.card,
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 10,
      padding: 14,
      marginBottom: 8,
    },
    cardLeft: { flex: 1, marginRight: 12 },
    timeText: { fontSize: 15, fontWeight: "600", color: theme.text, marginBottom: 3 },
    advisorText: { fontSize: 13, color: theme.textSecondary },
    actionBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, minWidth: 64, alignItems: "center" },
    bookBtn: { backgroundColor: theme.primary },
    cancelBtn: { backgroundColor: theme.danger },
    actionBtnText: { color: "#fff", fontWeight: "600", fontSize: 13 },
    // Appointments view
    dayHeaderRow: { marginTop: 16, marginBottom: 8 },
    dayHeaderText: { fontSize: 15, fontWeight: "700", color: theme.text },
    dayHeaderCount: { fontSize: 12, color: theme.textSecondary, marginTop: 2 },
    dayEmpty: { alignItems: "center", paddingVertical: 20, gap: 8 },
    dayEmptyText: { fontSize: 14, color: theme.textSecondary },
    upcomingLabel: {
      fontSize: 13,
      fontWeight: "700",
      color: theme.textSecondary,
      textTransform: "uppercase",
      letterSpacing: 0.5,
      marginTop: 24,
      marginBottom: 12,
    },
    advisorBanner: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      borderWidth: 1,
      borderRadius: 12,
      paddingHorizontal: 14,
      paddingVertical: 12,
      marginBottom: 16,
    },
    advisorBannerLabel: { fontSize: 11, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.4 },
    advisorBannerName: { fontSize: 15, fontWeight: "700", marginTop: 1 },
    advisorSection: { marginBottom: 8 },
  });

const calStyles = (theme: any) =>
  StyleSheet.create({
    container: {
      backgroundColor: theme.card,
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 14,
      padding: 12,
    },
    monthHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 },
    arrow: { width: 28, height: 28, borderRadius: 8, alignItems: "center", justifyContent: "center" },
    monthTitle: { fontSize: 15, fontWeight: "700", color: theme.text },
    weekRow: { flexDirection: "row", marginBottom: 4 },
    weekLabel: {
      width: `${100 / 7}%`,
      textAlign: "center",
      fontSize: 10,
      fontWeight: "600",
      color: theme.textSecondary,
    },
    grid: { flexDirection: "row", flexWrap: "wrap" },
    dayCell: {
      width: `${100 / 7}%`,
      aspectRatio: 1,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 8,
      borderWidth: 1,
      borderColor: "transparent",
      marginBottom: 2,
      position: "relative",
    },
    dayNumber: { fontSize: 12, fontWeight: "600" },
    todayRing: { position: "absolute", inset: 2, borderWidth: 1, borderRadius: 8 },
    dot: { width: 5, height: 5, borderRadius: 3, marginTop: 2 },
  });

const modalStyles = (theme: any) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.5)",
      justifyContent: "center",
      alignItems: "center",
      padding: 20,
    },
    card: {
      backgroundColor: theme.card,
      borderRadius: 16,
      padding: 20,
      width: "100%",
      maxWidth: 480,
    },
    title: { fontSize: 18, fontWeight: "700", color: theme.text, marginBottom: 4 },
    subtitle: { fontSize: 14, color: theme.textSecondary, marginBottom: 6 },
    advisorLabel: { fontSize: 13, color: theme.textSecondary, marginBottom: 2 },
    advisorName: { color: theme.text, fontWeight: "600" },
    availableLabel: { fontSize: 13, color: theme.textSecondary },
    availableTime: { color: theme.primary, fontWeight: "600" },
    divider: { height: 1, backgroundColor: theme.border, marginVertical: 14 },
    sectionLabel: { fontSize: 13, fontWeight: "600", color: theme.text, marginBottom: 8 },
    chipScroll: { flexGrow: 0 },
    chipRow: { flexDirection: "row", gap: 8, paddingBottom: 4 },
    chip: {
      paddingHorizontal: 12,
      paddingVertical: 7,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: theme.border,
      backgroundColor: theme.background,
    },
    chipSelected: { backgroundColor: theme.primary, borderColor: theme.primary },
    chipText: { fontSize: 13, color: theme.text },
    chipTextSelected: { color: "#fff", fontWeight: "600" },
    durationRow: {
      marginTop: 12,
      padding: 10,
      backgroundColor: theme.background,
      borderRadius: 8,
      alignItems: "center",
    },
    durationText: { fontSize: 14, fontWeight: "600", color: theme.primary },
    btnRow: { flexDirection: "row", gap: 10 },
    btn: { flex: 1, paddingVertical: 12, borderRadius: 10, alignItems: "center" },
    btnCancel: { backgroundColor: theme.background, borderWidth: 1, borderColor: theme.border },
    btnConfirm: { backgroundColor: theme.primary },
    btnDisabled: { opacity: 0.4 },
    btnText: { fontSize: 14, fontWeight: "600" },
  });
