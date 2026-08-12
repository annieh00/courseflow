import type {
    BlockedTime,
    Day,
    GeneratedSchedule,
    ScheduleEntry,
    Section,
  } from "./scheduler-types"
  
  function slotsOverlap(
    a: { day: Day; startHour: number; endHour: number },
    b: { day: Day; startHour: number; endHour: number }
  ): boolean {
    if (a.day !== b.day) return false
    return a.startHour < b.endHour && b.startHour < a.endHour
  }
  
  function sectionConflictsWithBlocked(
    section: Section,
    blocked: BlockedTime[]
  ): boolean {
    for (const slot of section.slots) {
      for (const block of blocked) {
        if (slotsOverlap(slot, block)) return true
      }
    }
    return false
  }
  
  function sectionsConflict(a: Section, b: Section): boolean {
    for (const slotA of a.slots) {
      for (const slotB of b.slots) {
        if (slotsOverlap(slotA, slotB)) return true
      }
    }
    return false
  }
  
  export function generateSchedules(
    selectedEntries: ScheduleEntry[],
    blockedTimes: BlockedTime[],
    maxResults: number = 50
  ): GeneratedSchedule[] {
    const courseMap = new Map<string, ScheduleEntry[]>()
    for (const entry of selectedEntries) {
      const key = entry.course.id
      if (!courseMap.has(key)) courseMap.set(key, [])
      courseMap.get(key)!.push(entry)
    }
  
    const courseGroups = Array.from(courseMap.values())
    const results: GeneratedSchedule[] = []
    let scheduleCounter = 0
  
    function backtrack(index: number, current: ScheduleEntry[]) {
      if (results.length >= maxResults) return
      if (index === courseGroups.length) {
        scheduleCounter++
        results.push({
          id: `schedule-${scheduleCounter}`,
          entries: [...current],
          bookmarked: false,
        })
        return
      }
  
      const group = courseGroups[index]
      for (const entry of group) {
        if (sectionConflictsWithBlocked(entry.section, blockedTimes)) continue
  
        let hasConflict = false
        for (const chosen of current) {
          if (sectionsConflict(entry.section, chosen.section)) {
            hasConflict = true
            break
          }
        }
        if (hasConflict) continue
  
        current.push(entry)
        backtrack(index + 1, current)
        current.pop()
      }
    }
  
    backtrack(0, [])
    return results
  }