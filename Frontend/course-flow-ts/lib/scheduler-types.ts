export type Day = "Mon" | "Tue" | "Wed" | "Thu" | "Fri"

export interface TimeSlot {
  day: Day
  startHour: number // 8 = 8:00 AM, 8.5 = 8:30 AM, etc.
  endHour: number
}

export interface Section {
  id: string
  sectionCode: string
  instructor: string
  slots: TimeSlot[]
  capacity: number
  enrolled: number
}

export interface Course {
  id: string
  code: string
  name: string
  department: string
  credits: number
  sections: Section[]
}

export interface BlockedTime {
  id: string
  day: Day
  startHour: number
  endHour: number
}

export interface ScheduleEntry {
  course: Course
  section: Section
}

export interface GeneratedSchedule {
  id: string
  entries: ScheduleEntry[]
  bookmarked: boolean
}
