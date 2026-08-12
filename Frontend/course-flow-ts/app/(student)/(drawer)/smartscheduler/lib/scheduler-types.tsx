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

export interface ApiMeeting {
    day: string   // "Mon" | "Tue" | ... | "N/A"
    start: string // "9:30 AM" | "N/A"
    end: string   // "10:45 AM" | "N/A"
  }
  
  export interface ApiSection {
    id: number
    instructor: string
    capacity: number
    meetings: ApiMeeting[]
  }
  
  export interface ApiCourse {
    id: number
    code: string
    name: string
    department: string
    credits: string   // note: string in the API, e.g. "3"
    sections: ApiSection[]
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