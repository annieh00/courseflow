export type ChatAction =
  | "CONFIRM_PROGRAM"
  | "CONVERSATION"
  | "COMPLETE"
  | "ERROR"
  | "RESET"
  | "END"

export interface ChatMessage {
  id: string
  role: "user" | "bot"
  text: string
}

export interface ChatPayloadMeeting {
  day: string
  start: string
  end: string
}

export interface ChatPayloadSection {
  id: number
  sectionNum: string
  instructor: string
  capacity: number
  meetings: ChatPayloadMeeting[]
}

export interface ChatPayloadCourse {
  code: string
  name: string
  credits: string
  sections: ChatPayloadSection[]
}

export interface ChatbotPayload {
  academicPeriod: string
  registrationStatus: "Full-time" | "Part-time"
  targetCredits: number
  blockedTimes: Array<{ day: string; start: string; end: string }>
  courses: ChatPayloadCourse[]
}

export interface ChatbotResponse {
  message: string
  action: ChatAction
  quickReplies: string[]
  payload: ChatbotPayload | null
}
