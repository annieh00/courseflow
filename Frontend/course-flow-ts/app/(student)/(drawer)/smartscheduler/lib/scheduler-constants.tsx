import type { Day } from "./scheduler-types"

export const DAYS: Day[] = ["Mon", "Tue", "Wed", "Thu", "Fri"]
export const DAY_LABELS: Record<Day, string> = {
  Mon: "Monday",
  Tue: "Tuesday",
  Wed: "Wednesday",
  Thu: "Thursday",
  Fri: "Friday",
}
export const START_HOUR = 8
export const END_HOUR = 20
export const HOURS = Array.from(
  { length: END_HOUR - START_HOUR },
  (_, i) => START_HOUR + i
)

export function formatHour(hour: number): string {
  const h = Math.floor(hour)
  const m = (hour - h) * 60
  const period = h >= 12 ? "PM" : "AM"
  const displayH = h > 12 ? h - 12 : h === 0 ? 12 : h
  return m > 0
    ? `${displayH}:${String(Math.round(m)).padStart(2, "0")} ${period}`
    : `${displayH}:00 ${period}`
}
export function isValidDay(day: string): day is Day {
    return ["Mon", "Tue", "Wed", "Thu", "Fri"].includes(day)
  }
// Light-mode color palette — pairs of bg/text with good contrast
export const CLASS_COLORS: { bg: string; text: string }[] = [
  { bg: "rgba(200,16,46,0.1)",   text: "#9B0E25" },  // Cardinal
  { bg: "rgba(241,190,72,0.22)", text: "#92600A" },  // Gold
  { bg: "rgba(29,78,216,0.1)",   text: "#1D4ED8" },  // Blue
  { bg: "rgba(21,128,61,0.1)",   text: "#15803D" },  // Green
  { bg: "rgba(124,58,237,0.1)",  text: "#7C3AED" },  // Purple
  { bg: "rgba(234,88,12,0.1)",   text: "#C2410C" },  // Orange
  { bg: "rgba(200,16,46,0.17)",  text: "#7B0B1F" },  // Cardinal (deeper)
  { bg: "rgba(241,190,72,0.3)",  text: "#78490B" },  // Gold (deeper)
]
