import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from "react"
import AsyncStorage from "@react-native-async-storage/async-storage"
import type { DegreeProgram, Course } from "./degree-programs"

const STORAGE_KEY = "degree-flowchart-progress"

export type CourseStatus = "default" | "in-progress" | "completed"

interface FlowchartState {
  selectedProgram: string | null
  completedCourses: Set<string>
  inProgressCourses: Set<string>
  chooseOneSelections: Record<string, string>
  semesterOverrides: Record<string, number>
  hasSeenOnboarding: boolean
  lastSaved: string | null
}

// Added setters to the interface so the Screen can update state from the DB
interface FlowchartContextType extends FlowchartState {
  setSelectedProgram: (programId: string) => void
  setCompletedCourses: React.Dispatch<React.SetStateAction<Set<string>>>
  setInProgressCourses: React.Dispatch<React.SetStateAction<Set<string>>>
  toggleCourseCompletion: (courseCode: string) => void
  cycleCourseStatus: (courseCode: string) => void
  getCourseStatus: (courseCode: string) => CourseStatus
  isCourseCompleted: (courseCode: string) => boolean
  isCourseInProgress: (courseCode: string) => boolean
  moveCourseToSemester: (courseCode: string, targetSemester: number) => void
  selectChooseOne: (groupId: string, courseCode: string) => void
  getChooseOneSelection: (groupId: string) => string | null
  isChooseOneGroupFulfilled: (groupId: string) => boolean
  getCompletedCredits: (program: DegreeProgram) => number
  getRemainingCredits: (program: DegreeProgram) => number
  getProgressPercent: (program: DegreeProgram) => number
  getUncompletedCourses: (program: DegreeProgram) => Course[]
  getInProgressCourses: (program: DegreeProgram) => Course[]
  arePrerequisitesMet: (course: Course) => boolean
  markOnboardingSeen: () => void
  saveProgress: () => Promise<void>
  loadProgress: () => Promise<boolean>
  resetProgress: () => Promise<void>
}

const FlowchartContext = createContext<FlowchartContextType | null>(null)

export function useFlowchart() {
  const ctx = useContext(FlowchartContext)
  if (!ctx) throw new Error("useFlowchart must be used within FlowchartProvider")
  return ctx
}

export function FlowchartProvider({ children }: { children: ReactNode }) {
  const [selectedProgram, setSelectedProgramState] = useState<string | null>(null)
  const [completedCourses, setCompletedCourses] = useState<Set<string>>(new Set())
  const [inProgressCourses, setInProgressCourses] = useState<Set<string>>(new Set())
  const [chooseOneSelections, setChooseOneSelections] = useState<Record<string, string>>({})
  const [semesterOverrides, setSemesterOverrides] = useState<Record<string, number>>({})
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState(false)
  const [lastSaved, setLastSaved] = useState<string | null>(null)

  useEffect(() => {
    ;(async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY)
        if (stored) {
          const data = JSON.parse(stored)
          if (data.selectedProgram) setSelectedProgramState(data.selectedProgram)
          if (data.completedCourses) setCompletedCourses(new Set(data.completedCourses))
          if (data.inProgressCourses) setInProgressCourses(new Set(data.inProgressCourses))
          if (data.chooseOneSelections) setChooseOneSelections(data.chooseOneSelections)
          if (data.semesterOverrides) setSemesterOverrides(data.semesterOverrides)
          if (data.hasSeenOnboarding) setHasSeenOnboarding(data.hasSeenOnboarding)
          if (data.lastSaved) setLastSaved(data.lastSaved)
        }
      } catch {
        // Ignore parse errors
      }
    })()
  }, [])

  const setSelectedProgram = useCallback((programId: string) => {
    setSelectedProgramState(programId)
  }, [])

  const getCourseStatus = useCallback(
    (courseCode: string): CourseStatus => {
      if (completedCourses.has(courseCode)) return "completed"
      if (inProgressCourses.has(courseCode)) return "in-progress"
      return "default"
    },
    [completedCourses, inProgressCourses]
  )

  const cycleCourseStatus = useCallback((courseCode: string) => {
    const isCompleted = completedCourses.has(courseCode)
    const isInProgress = inProgressCourses.has(courseCode)

    if (!isInProgress && !isCompleted) {
      setInProgressCourses((prev) => new Set([...prev, courseCode]))
    } else if (isInProgress && !isCompleted) {
      setInProgressCourses((prev) => { const s = new Set(prev); s.delete(courseCode); return s })
      setCompletedCourses((prev) => new Set([...prev, courseCode]))
    } else {
      setCompletedCourses((prev) => { const s = new Set(prev); s.delete(courseCode); return s })
      setInProgressCourses((prev) => { const s = new Set(prev); s.delete(courseCode); return s })
    }
  }, [completedCourses, inProgressCourses])

  const toggleCourseCompletion = useCallback((courseCode: string) => {
    setCompletedCourses((prev) => {
      const next = new Set(prev)
      if (next.has(courseCode)) {
        next.delete(courseCode)
      } else {
        next.add(courseCode)
      }
      return next
    })
    setInProgressCourses((prev) => {
      const next = new Set(prev)
      next.delete(courseCode)
      return next
    })
  }, [])

  const isCourseCompleted = useCallback(
    (courseCode: string) => completedCourses.has(courseCode),
    [completedCourses]
  )

  const isCourseInProgress = useCallback(
    (courseCode: string) => inProgressCourses.has(courseCode),
    [inProgressCourses]
  )

  const moveCourseToSemester = useCallback((courseCode: string, targetSemester: number) => {
    setSemesterOverrides((prev) => ({ ...prev, [courseCode]: targetSemester }))
  }, [])

  const selectChooseOne = useCallback((groupId: string, courseCode: string) => {
    setChooseOneSelections((prev) => ({ ...prev, [groupId]: courseCode }))
  }, [])

  const getChooseOneSelection = useCallback(
    (groupId: string) => chooseOneSelections[groupId] ?? null,
    [chooseOneSelections]
  )

  const isChooseOneGroupFulfilled = useCallback(
    (groupId: string) => {
      const selectedCode = chooseOneSelections[groupId]
      return selectedCode ? completedCourses.has(selectedCode) : false
    },
    [chooseOneSelections, completedCourses]
  )

  const getCompletedCredits = useCallback(
    (program: DegreeProgram) => {
      let total = 0
      const counted = new Set<string>()
      for (const sem of program.semesters) {
        for (const item of sem.items) {
          if (item.kind === "course" && item.course) {
            if (completedCourses.has(item.course.code) && !counted.has(item.course.code)) {
              total += item.course.credits
              counted.add(item.course.code)
            }
          } else if (item.kind === "chooseOne" && item.chooseOne) {
            const selected = chooseOneSelections[item.chooseOne.id]
            if (selected && completedCourses.has(selected)) {
              const c = item.chooseOne.courses.find((cc) => cc.code === selected)
              if (c && !counted.has(c.code)) {
                total += c.credits
                counted.add(c.code)
              }
            }
          }
        }
      }
      return total
    },
    [completedCourses, chooseOneSelections]
  )

  const getRemainingCredits = useCallback(
    (program: DegreeProgram) => Math.max(0, program.totalCredits - getCompletedCredits(program)),
    [getCompletedCredits]
  )

  const getProgressPercent = useCallback(
    (program: DegreeProgram) => {
      const completed = getCompletedCredits(program)
      return Math.round((completed / program.totalCredits) * 100)
    },
    [getCompletedCredits]
  )

  const getUncompletedCourses = useCallback(
    (program: DegreeProgram) => {
      const uncompleted: Course[] = []
      for (const sem of program.semesters) {
        for (const item of sem.items) {
          if (item.kind === "course" && item.course) {
            if (
              !completedCourses.has(item.course.code) &&
              !inProgressCourses.has(item.course.code)
            ) {
              uncompleted.push(item.course)
            }
          } else if (item.kind === "chooseOne" && item.chooseOne) {
            if (!isChooseOneGroupFulfilled(item.chooseOne.id)) {
              const selected = chooseOneSelections[item.chooseOne.id]
              const courseToShow = selected
                ? item.chooseOne.courses.find((c) => c.code === selected)
                : item.chooseOne.courses[0]
              if (courseToShow && !inProgressCourses.has(courseToShow.code)) {
                uncompleted.push(courseToShow)
              }
            }
          }
        }
      }
      return uncompleted
    },
    [completedCourses, inProgressCourses, isChooseOneGroupFulfilled, chooseOneSelections]
  )

  const getInProgressCourses = useCallback(
    (program: DegreeProgram) => {
      const result: Course[] = []
      const seen = new Set<string>()
      for (const sem of program.semesters) {
        for (const item of sem.items) {
          if (item.kind === "course" && item.course) {
            if (inProgressCourses.has(item.course.code) && !seen.has(item.course.code)) {
              result.push(item.course)
              seen.add(item.course.code)
            }
          } else if (item.kind === "chooseOne" && item.chooseOne) {
            for (const c of item.chooseOne.courses) {
              if (inProgressCourses.has(c.code) && !seen.has(c.code)) {
                result.push(c)
                seen.add(c.code)
              }
            }
          }
        }
      }
      return result
    },
    [inProgressCourses]
  )

  const arePrerequisitesMet = useCallback(
    (course: Course) => {
      if (!course.prerequisites || course.prerequisites.length === 0) return true
      return course.prerequisites.every((pre) => completedCourses.has(pre))
    },
    [completedCourses]
  )

  const markOnboardingSeen = useCallback(() => {
    setHasSeenOnboarding(true)
  }, [])

  const saveProgress = useCallback(async () => {
    const timestamp = new Date().toISOString()
    const data = {
      selectedProgram,
      completedCourses: Array.from(completedCourses),
      inProgressCourses: Array.from(inProgressCourses),
      chooseOneSelections,
      semesterOverrides,
      hasSeenOnboarding: true,
      lastSaved: timestamp,
    }
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    setLastSaved(timestamp)
  }, [selectedProgram, completedCourses, inProgressCourses, chooseOneSelections])

  const loadProgress = useCallback(async (): Promise<boolean> => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY)
      if (!stored) return false
      const data = JSON.parse(stored)
      if (data.selectedProgram) setSelectedProgramState(data.selectedProgram)
      if (data.completedCourses) setCompletedCourses(new Set(data.completedCourses))
      if (data.inProgressCourses) setInProgressCourses(new Set(data.inProgressCourses))
      if (data.chooseOneSelections) setChooseOneSelections(data.chooseOneSelections)
      if (data.semesterOverrides) setSemesterOverrides(data.semesterOverrides)
      if (data.lastSaved) setLastSaved(data.lastSaved)
      return true
    } catch {
      return false
    }
  }, [])

  const resetProgress = useCallback(async () => {
    setCompletedCourses(new Set())
    setInProgressCourses(new Set())
    setChooseOneSelections({})
    setSemesterOverrides({})
    setLastSaved(null)
    await AsyncStorage.removeItem(STORAGE_KEY)
  }, [])

  return (
    <FlowchartContext.Provider
      value={{
        selectedProgram,
        completedCourses,
        inProgressCourses,
        chooseOneSelections,
        semesterOverrides,
        hasSeenOnboarding,
        lastSaved,
        setSelectedProgram,
        setCompletedCourses,
        setInProgressCourses,
        moveCourseToSemester,
        toggleCourseCompletion,
        cycleCourseStatus,
        getCourseStatus,
        isCourseCompleted,
        isCourseInProgress,
        selectChooseOne,
        getChooseOneSelection,
        isChooseOneGroupFulfilled,
        getCompletedCredits,
        getRemainingCredits,
        getProgressPercent,
        getUncompletedCourses,
        getInProgressCourses,
        arePrerequisitesMet,
        markOnboardingSeen,
        saveProgress,
        loadProgress,
        resetProgress,
      }}
    >
      {children}
    </FlowchartContext.Provider>
  )
}