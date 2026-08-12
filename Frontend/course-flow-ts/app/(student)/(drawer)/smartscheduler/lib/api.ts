import type { ApiSection, Course, Section } from "./scheduler-types"
import type { ApiCourse } from "./scheduler-types"
import { isValidDay } from "./scheduler-constants"

const BASE_URL = (process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:8080/api").replace(/\/api\/?$/, "")

/** Convert "9:30 AM" → 9.5, "10:45 AM" → 10.75, etc. */
function parseTimeToHour(time: string): number {
  const [rawTime, period] = time.split(" ")
  const [hStr, mStr] = rawTime.split(":")
  let h = parseInt(hStr, 10)
  const m = parseInt(mStr, 10)
  if (period === "PM" && h !== 12) h += 12
  if (period === "AM" && h === 12) h = 0
  return h + m / 60
}

function normalizeSection(apiSection: ApiSection, index: number): Section {
  // Filter out N/A meetings (async/online sections have no real time slot)
  const validSlots = apiSection.meetings
    .filter((m) => isValidDay(m.day) && m.start !== "N/A" && m.end !== "N/A")
    .map((m) => ({
      day: m.day as import("./scheduler-types").Day,
      startHour: parseTimeToHour(m.start),
      endHour: parseTimeToHour(m.end),
    }))

  return {
    id: String(apiSection.id),
    sectionCode: String(index + 1),   // API has no sectionCode, use 1-based index
    instructor: apiSection.instructor,
    slots: validSlots,
    capacity: apiSection.capacity,
    enrolled: 0,   // API doesn't provide enrolled count
  }
}

function normalizeCourse(apiCourse: ApiCourse): Course {
  return {
    id: String(apiCourse.id),
    code: apiCourse.code,
    name: apiCourse.name,
    department: apiCourse.department,
    credits: parseInt(apiCourse.credits, 10) || 0,
    sections: apiCourse.sections.map((s, i) => normalizeSection(s, i)),
  }
}

export async function fetchCourses(
    academicPeriod: string,
    search?: string
  ): Promise<Course[]> {
    const encoded = encodeURIComponent(academicPeriod)
  
    const url = search
      ? `${BASE_URL}/api/courses/${encoded}?search=${encodeURIComponent(search)}`
      : `${BASE_URL}/api/courses/${encoded}`
  
    // 🔍 LOG WHAT YOU'RE SEARCHING
    console.log("=== FETCH COURSES DEBUG ===")
    console.log("Academic Period:", academicPeriod)
    console.log("Search Query:", search)
    console.log("Final URL:", url)
  
    const res = await fetch(url)
  
    // 🔍 LOG RESPONSE STATUS
    console.log("Response Status:", res.status)
  
    if (!res.ok) throw new Error(`Failed to fetch courses: ${res.status}`)
  
    const data: ApiCourse[] = await res.json()
  
    // 🔍 LOG RAW DATA FROM BACKEND
    console.log("Raw API Data:", data)
  
    const normalized = data.map(normalizeCourse)
  
    // 🔍 LOG FINAL TRANSFORMED DATA
    console.log("Normalized Courses:", normalized)
  
    return normalized
  }