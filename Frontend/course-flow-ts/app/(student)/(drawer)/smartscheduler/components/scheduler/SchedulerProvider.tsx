import React, {
    createContext,
    useCallback,
    useContext,
    useMemo,
    useState,
    useEffect,
    type ReactNode,
  } from "react"
  import type {
    BlockedTime,
    Course,
    Day,
    GeneratedSchedule,
    ScheduleEntry,
    Section,
  } from "../../lib/scheduler-types"
  import type { ChatbotPayload } from "../../lib/chatbot-types"
  import { generateSchedules } from "../../lib/schedule-generator"
  import { fetchCourses } from "../../lib/api"

  const VALID_DAYS = new Set<string>(["Mon", "Tue", "Wed", "Thu", "Fri"])

  function parseHHMM(time: string): number {
    const [h, m] = time.split(":").map(Number)
    return h + m / 60
  }
  
  export interface SavedSchedule {
    id: string
    name: string
    entries: ScheduleEntry[]
    savedAt: number
  }

  interface SchedulerState {
    courses: Course[]
    selectedEntries: ScheduleEntry[]
    blockedTimes: BlockedTime[]
    generatedSchedules: GeneratedSchedule[]
    activeScheduleIndex: number
    isGenerating: boolean
    view: "builder" | "results" | "saved"
    searchQuery: string
    expandedCourseId: string | null
    isLoadingCourses: boolean
    courseError: string | null
    academicPeriod: string
    savedSchedules: SavedSchedule[]
  }
  
  interface SchedulerActions {
    setSearchQuery: (query: string) => void
    setExpandedCourseId: (id: string | null) => void
    addSection: (course: Course, section: Section) => void
    removeSection: (courseId: string, sectionId: string) => void
    addAllSectionsForCourse: (course: Course) => void
    removeAllSectionsForCourse: (courseId: string) => void
    addBlockedTime: (blocked: BlockedTime) => void
    removeBlockedTime: (id: string) => void
    doesSectionConflictWithBlocked: (section: Section) => boolean
    generateAllSchedules: () => void
    setActiveScheduleIndex: (index: number) => void
    toggleBookmark: (scheduleId: string) => void
    setView: (view: "builder" | "results" | "saved") => void
    clearAll: () => void
    setAcademicPeriod: (period: string) => void
    loadFromChatbotPayload: (payload: ChatbotPayload) => void
    saveNamedSchedule: (name: string) => void
  }
  
  const SchedulerContext = createContext<
  (SchedulerState & SchedulerActions) | null
>(null)
  
  export function useScheduler() {
    const ctx = useContext(SchedulerContext)
    if (!ctx) throw new Error("useScheduler must be used within SchedulerProvider")
    return ctx
  }
  
  export function SchedulerProvider({ children }: { children: ReactNode }) {
    const [courses, setCourses] = useState<Course[]>([])
    const [isLoadingCourses, setIsLoadingCourses] = useState(false)
    const [courseError, setCourseError] = useState<string | null>(null)
    const [academicPeriod, setAcademicPeriod] = useState("Spring 2026")
  
    const [selectedEntries, setSelectedEntries] = useState<ScheduleEntry[]>([])
    const [blockedTimes, setBlockedTimes] = useState<BlockedTime[]>([])
    const [generatedSchedules, setGeneratedSchedules] = useState<GeneratedSchedule[]>([])
    const [activeScheduleIndex, setActiveScheduleIndex] = useState(0)
    const [isGenerating, setIsGenerating] = useState(false)
    const [view, setView] = useState<"builder" | "results" | "saved">("builder")
    const [searchQuery, setSearchQuery] = useState("")
    const [expandedCourseId, setExpandedCourseId] = useState<string | null>(null)
    const [savedSchedules, setSavedSchedules] = useState<SavedSchedule[]>([])
  
    // Re-fetch whenever academicPeriod or searchQuery changes
    useEffect(() => {
      let cancelled = false
      setIsLoadingCourses(true)
      setCourseError(null)
  
      fetchCourses(academicPeriod, searchQuery || undefined)
        .then((data) => {
          if (!cancelled) setCourses(data)
        })
        .catch((err) => {
          if (!cancelled) setCourseError(err.message)
        })
        .finally(() => {
          if (!cancelled) setIsLoadingCourses(false)
        })
  
      return () => {
        cancelled = true
      }
    }, [academicPeriod, searchQuery])
  
    const addSection = useCallback(
      (course: Course, section: Section) => {
        setSelectedEntries((prev) => {
          const exists = prev.some(
            (e) => e.course.id === course.id && e.section.id === section.id
          )
          if (exists) return prev
          for (const slot of section.slots) {
            for (const block of blockedTimes) {
              if (
                slot.day === block.day &&
                slot.startHour < block.endHour &&
                block.startHour < slot.endHour
              ) {
                return prev
              }
            }
          }
          return [...prev, { course, section }]
        })
      },
      [blockedTimes]
    )
  
    const removeSection = useCallback((courseId: string, sectionId: string) => {
      setSelectedEntries((prev) =>
        prev.filter(
          (e) => !(e.course.id === courseId && e.section.id === sectionId)
        )
      )
    }, [])
  
    const addAllSectionsForCourse = useCallback(
      (course: Course) => {
        setSelectedEntries((prev) => {
          let next = [...prev]
          for (const section of course.sections) {
            const exists = next.some(
              (e) => e.course.id === course.id && e.section.id === section.id
            )
            if (exists) continue
            if (section.enrolled >= section.capacity) continue
            let blocked = false
            for (const slot of section.slots) {
              for (const block of blockedTimes) {
                if (
                  slot.day === block.day &&
                  slot.startHour < block.endHour &&
                  block.startHour < slot.endHour
                ) {
                  blocked = true
                  break
                }
              }
              if (blocked) break
            }
            if (!blocked) {
              next = [...next, { course, section }]
            }
          }
          return next
        })
      },
      [blockedTimes]
    )
  
    const removeAllSectionsForCourse = useCallback((courseId: string) => {
      setSelectedEntries((prev) => prev.filter((e) => e.course.id !== courseId))
    }, [])
  
    const doesSectionConflictWithBlocked = useCallback(
      (section: Section): boolean => {
        for (const slot of section.slots) {
          for (const block of blockedTimes) {
            if (
              slot.day === block.day &&
              slot.startHour < block.endHour &&
              block.startHour < slot.endHour
            ) {
              return true
            }
          }
        }
        return false
      },
      [blockedTimes]
    )
  
    const addBlockedTime = useCallback((blocked: BlockedTime) => {
      setBlockedTimes((prev) => [...prev, blocked])
      setSelectedEntries((prev) =>
        prev.filter((entry) => {
          for (const slot of entry.section.slots) {
            if (
              slot.day === blocked.day &&
              slot.startHour < blocked.endHour &&
              blocked.startHour < slot.endHour
            ) {
              return false
            }
          }
          return true
        })
      )
    }, [])
  
    const removeBlockedTime = useCallback((id: string) => {
      setBlockedTimes((prev) => prev.filter((b) => b.id !== id))
    }, [])
  
    const generateAllSchedules = useCallback(() => {
      setIsGenerating(true)
      setTimeout(() => {
        const schedules = generateSchedules(selectedEntries, blockedTimes)
        setGeneratedSchedules(schedules)
        setActiveScheduleIndex(0)
        setIsGenerating(false)
        if (schedules.length > 0) {
          setView("results")
        }
      }, 100)
    }, [selectedEntries, blockedTimes])
  
    const toggleBookmark = useCallback((scheduleId: string) => {
      setGeneratedSchedules((prev) =>
        prev.map((s) =>
          s.id === scheduleId ? { ...s, bookmarked: !s.bookmarked } : s
        )
      )
    }, [])
  
    const clearAll = useCallback(() => {
      setSelectedEntries([])
      setBlockedTimes([])
      setGeneratedSchedules([])
      setActiveScheduleIndex(0)
      setView("builder")
      setSearchQuery("")
      setExpandedCourseId(null)
    }, [])

    const loadFromChatbotPayload = useCallback((payload: ChatbotPayload) => {
      const newCourses: Course[] = payload.courses.map(c => ({
        id: c.code,
        code: c.code,
        name: c.name,
        department: c.code.split(" ")[0] ?? c.code,
        credits: parseInt(c.credits, 10) || 0,
        sections: c.sections.map(s => ({
          id: String(s.id),
          sectionCode: s.sectionNum,
          instructor: s.instructor,
          capacity: s.capacity,
          enrolled: 0,
          slots: s.meetings
            .filter(m => VALID_DAYS.has(m.day) && m.start !== "N/A" && m.end !== "N/A")
            .map(m => ({
              day: m.day as Day,
              startHour: parseHHMM(m.start),
              endHour: parseHHMM(m.end),
            })),
        })),
      }))

      const newBlocked: BlockedTime[] = payload.blockedTimes.map((bt, i) => ({
        id: `chatbot-blocked-${i}`,
        day: bt.day as Day,
        startHour: parseHHMM(bt.start),
        endHour: parseHHMM(bt.end),
      }))

      const newEntries: ScheduleEntry[] = []
      for (const course of newCourses) {
        for (const section of course.sections) {
          if (section.slots.length > 0) {
            newEntries.push({ course, section })
          }
        }
      }

      setCourses(newCourses)
      setBlockedTimes(newBlocked)
      setSelectedEntries(newEntries)
      setGeneratedSchedules([])
      setActiveScheduleIndex(0)
      setView("builder")
    }, [])

    const saveNamedSchedule = useCallback((name: string) => {
      const active = generatedSchedules[activeScheduleIndex]
      if (!active) return
      const entry: SavedSchedule = {
        id: `saved-${Date.now()}`,
        name,
        entries: active.entries,
        savedAt: Date.now(),
      }
      setSavedSchedules((prev) => [...prev, entry])
    }, [generatedSchedules, activeScheduleIndex])

    const value = useMemo(
      () => ({
        courses,
        isLoadingCourses,
        courseError,
        academicPeriod,
        setAcademicPeriod,
        selectedEntries,
        blockedTimes,
        generatedSchedules,
        activeScheduleIndex,
        isGenerating,
        view,
        searchQuery,
        expandedCourseId,
        setSearchQuery,
        setExpandedCourseId,
        addSection,
        removeSection,
        addAllSectionsForCourse,
        removeAllSectionsForCourse,
        addBlockedTime,
        removeBlockedTime,
        doesSectionConflictWithBlocked,
        generateAllSchedules,
        setActiveScheduleIndex,
        toggleBookmark,
        setView,
        clearAll,
        loadFromChatbotPayload,
        savedSchedules,
        saveNamedSchedule,
      }),
      [
        courses,
        isLoadingCourses,
        courseError,
        academicPeriod,
        selectedEntries,
        blockedTimes,
        generatedSchedules,
        activeScheduleIndex,
        isGenerating,
        view,
        searchQuery,
        expandedCourseId,
        addSection,
        removeSection,
        addAllSectionsForCourse,
        removeAllSectionsForCourse,
        addBlockedTime,
        removeBlockedTime,
        doesSectionConflictWithBlocked,
        generateAllSchedules,
        toggleBookmark,
        clearAll,
        loadFromChatbotPayload,
        savedSchedules,
        saveNamedSchedule,
      ]
    )
  
    return (
      <SchedulerContext.Provider value={value}>
        {children}
      </SchedulerContext.Provider>
    )
  }