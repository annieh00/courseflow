export type CourseType =
  | "required"
  | "SE Elective"
  | "SPPLM Elective"
  | "Open Elective"
  | "Gen Ed"
  | "Senior Design"

export interface Course {
  code: string
  title: string
  credits: number
  type: CourseType
  isEngrBasic?: boolean
  prerequisites?: string[]
  corequisites?: string[]
}

export interface ChooseOneGroup {
  id: string
  label: string
  courses: Course[]
}

// New: a Gen Ed search slot — rendered as GenEdSearchCard
export interface GenEdSlot {
  id: string          // unique per slot, e.g. "gen-ed-slot-4"
  label?: string      // optional override label, defaults to "Gen Ed Elective"
}
export interface OpenElectiveSlot {
  id: string
  label?: string
}

export type SemesterItem =
  | { kind: "course"; course: Course }
  | { kind: "chooseOne"; chooseOne: ChooseOneGroup }
  | { kind: "genEd"; genEd: GenEdSlot }   
  | { kind: "openElective"; openElective: OpenElectiveSlot }  


export interface Semester {
  number: number
  label?: string
  items: SemesterItem[]
}

export interface DegreeProgram {
  program: string
  institution: string
  totalCredits: number
  semesters: Semester[]
  academicYear?: string
}

// ================= ELECTIVES =================

const SE_ELECTIVES: Course[] = [
  { code: "S E 4220", title: "Cloud Computing", credits: 3, type: "SE Elective" },
  { code: "S E 4300", title: "Machine Learning for Software Engineers", credits: 3, type: "SE Elective" },
  { code: "S E 4250", title: "Mobile Application Development", credits: 3, type: "SE Elective" },
  { code: "S E 4210", title: "Cybersecurity for Software Engineers", credits: 3, type: "SE Elective" },
  { code: "S E 4310", title: "DevOps & Continuous Delivery", credits: 3, type: "SE Elective" },
  { code: "S E 4350", title: "Web Application Development", credits: 3, type: "SE Elective" },
  { code: "S E 4400", title: "Data Engineering", credits: 3, type: "SE Elective" },
]

const SPPLM_ELECTIVES: Course[] = [
  { code: "CPRE 4300", title: "Embedded Systems", credits: 3, type: "SPPLM Elective" },
  { code: "COMS 4720", title: "Computer Graphics", credits: 3, type: "SPPLM Elective" },
  { code: "COMS 4740", title: "Artificial Intelligence", credits: 3, type: "SPPLM Elective" },
  { code: "COMS 4770", title: "Bioinformatics", credits: 3, type: "SPPLM Elective" },
  { code: "MATH 3170", title: "Linear Algebra", credits: 3, type: "SPPLM Elective" },
  { code: "STAT 4300", title: "Probability & Statistics for CS", credits: 3, type: "SPPLM Elective" },
]

const OPEN_ELECTIVES: Course[] = [
  { code: "MGMT 3100", title: "Principles of Management", credits: 3, type: "Open Elective" },
  { code: "ECON 1010", title: "Principles of Microeconomics", credits: 3, type: "Open Elective" },
  { code: "PSYCH 1010", title: "Intro to Psychology", credits: 3, type: "Open Elective" },
  { code: "MUS 1020", title: "Music Appreciation", credits: 3, type: "Open Elective" },
  { code: "PHIL 2300", title: "Ethics in Technology", credits: 3, type: "Open Elective" },
  { code: "KIN 2050", title: "Wellness & Physical Activity", credits: 2, type: "Open Elective" },
]

// ================= DEGREE PROGRAM =================

export const degreePrograms: Record<string, DegreeProgram> = {
  "SE": {
    program: "Software Engineering",
    institution: "Iowa State University",
    totalCredits: 125,
    academicYear: "2025-2026",
    semesters: [
      {
        number: 1,
        label: "Fall - Year 1",
        items: [
          { kind: "course", course: { code: "MATH 1650", title: "Calculus I", credits: 4, type: "required", isEngrBasic: true } },
          { kind: "course", course: { code: "SE 1010", title: "Software Engineering Orientation", credits: 0, type: "required", isEngrBasic: true } },
          { kind: "course", course: { code: "SE 1850", title: "Problem Solving in Software Engineering", credits: 3, type: "required", isEngrBasic: true } },
          {
            kind: "chooseOne",
            chooseOne: {
              id: "choose-chem-chem",
              label: "Choose One",
              courses: [
                { code: "CHEM 1670", title: "General Chemistry for Engineering Students", credits: 4, type: "required", isEngrBasic: true },
                { code: "CHEM 1770", title: "General Chemistry 1", credits: 4, type: "required", isEngrBasic: true },
              ],
            },
          },
          {
            kind: "chooseOne",
            chooseOne: {
              id: "choose-econ-econ",
              label: "Choose One",
              courses: [
                { code: "ECON 1010", title: "Principles of Microeconomics", credits: 3, type: "required" },
                { code: "ECON 1020", title: "Principles of Macroeconomics", credits: 3, type: "required" },
                { code: "IE 3050", title: "Engineering Economic Analysis", credits: 3, type: "required" },
              ],
            },
          },
          { kind: "course", course: { code: "LIB 1600", title: "Introduction to College Level Research", credits: 0, type: "required" } },
        ],
      },

      {
        number: 2,
        label: "Spring - Year 1",
        items: [
          { kind: "course", course: { code: "MATH 1660", title: "Calculus II", credits: 4, type: "required", prerequisites: ["MATH 1650"], isEngrBasic: true } },
          { kind: "course", course: { code: "PHYS 2310 & 2310L", title: "Introduction to Classical Physics I & Lab", credits: 5, type: "required", isEngrBasic: true } },
          { kind: "course", course: { code: "SE 1660", title: "Careers in Software Engineering", credits: 0, type: "required" } },
          { kind: "course", course: { code: "COMS 2270", title: "Object-Oriented Programming", credits: 4, type: "required", prerequisites: ["SE 1850"] } },
          { kind: "course", course: { code: "ENGL 1500", title: "Critical Thinking and Communication", credits: 3, type: "required" } },
        ],
      },

      {
        number: 3,
        label: "Fall - Year 2",
        items: [
          { kind: "course", course: { code: "MATH 2670", title: "Elementary Differential Equations", credits: 4, type: "required", prerequisites: ["MATH 1660"] } },
          { kind: "course", course: { code: "SPCM 2120", title: "Fundamentals of Public Speaking", credits: 3, type: "required" } },
          { kind: "course", course: { code: "CPRE 2810", title: "Digital Logic", credits: 4, type: "required" } },
          { kind: "course", course: { code: "COMS 2280", title: "Introduction to Data Structures", credits: 3, type: "required", prerequisites: ["COMS 2270, MATH 1650"] } },
          { kind: "course", course: { code: "ENGL 2500", title: "Written, Oral, Visual & Electronic Composition", credits: 3, type: "required", prerequisites: ["ENGL 1500"] } },
        ],
      },

      {
        number: 4,
        label: "Spring - Year 2",
        items: [
          // ← Gen Ed search slot (replaces the old placeholder course)
          { kind: "genEd", genEd: { id: "gen-ed-slot-4", label: "Gen Ed Elective" } },
          {
            kind: "chooseOne",
            chooseOne: {
              id: "choose-math",
              label: "Choose One",
              courses: [
                { code: "MATH 2070", title: "Matrices and Linear Algebra", credits: 3, type: "required" },
                { code: "MATH 2650", title: "Calculus III", credits: 3, type: "required" },
                { code: "MATH 3040", title: "Combinatorics", credits: 3, type: "required" },
                { code: "MATH 3140", title: "Graph Theory", credits: 3, type: "required" },
                { code: "MATH 3170", title: "Theory of Linear Algebra", credits: 3, type: "required" },
              ],
            },
          },
          {
            kind: "chooseOne",
            chooseOne: {
              id: "choose-cpre-coms4",
              label: "Choose One",
              courses: [
                { code: "CPRE 2880", title: "Embedded Systems I: Introduction", credits: 4, type: "required", prerequisites: ["CPRE 2810"] },
                { code: "COMS 3270", title: "Advanced Programming Techniques", credits: 3, type: "required", prerequisites: ["COMS 2280"] },
              ],
            },
          },
          {
            kind: "chooseOne",
            chooseOne: {
              id: "choose-cpre-coms2",
              label: "Choose One",
              courses: [
                { code: "CPRE 3100", title: "Theoretical Foundations of Computer Engineering", credits: 3, type: "required", prerequisites: ["COMS 228"] },
                { code: "COMS 2300", title: "Discrete Computational Structures", credits: 3, type: "required", prerequisites: ["COMS 2270"] },
              ],
            },
          },
          { kind: "course", course: { code: "SE 3190", title: "Construction of User Interfaces", credits: 3, type: "required", prerequisites: ["COMS 3190"] } },
        ],
      },

      {
        number: 5,
        label: "Fall - Year 3",
        items: [
          // ← Gen Ed search slot
          { kind: "genEd", genEd: { id: "gen-ed-slot-5", label: "Gen Ed Elective" } },
          {
            kind: "chooseOne",
            chooseOne: {
              id: "choose-cpre-coms3",
              label: "Choose One",
              courses: [
                { code: "CPRE 3810", title: "Computer Organization and Assembly Level Programming", credits: 4, type: "required", prerequisites: ["CPRE 2880"] },
                { code: "COMS 3210", title: "Introduction to Computer Architecture and Machine-Level Programming", credits: 3, type: "required", prerequisites: ["COMS 2280", "MATH 1650", "COMS 2300 or CPRE 2810", "ENGL 2500"] },
              ],
            },
          },
          { kind: "course", course: { code: "COMS 3110", title: "Introduction to the Design and Analysis of Algorithms", credits: 3, type: "required", prerequisites: ["COMS 2300 or CPRE 3100 and Minimum of C- in COMS 2280, ENGL 1500, and MATH 1660"] } },
          { kind: "course", course: { code: "SE 3090", title: "Software Development Practices", credits: 3, type: "required", prerequisites: ["Minimum of C- in COMS 2280; MATH 1650"] } },
          { kind: "course", course: { code: "COMS 3630", title: "Introduction to Database Management Systems", credits: 3, type: "required", prerequisites: ["ENGL 2500", "Minimum of C- in COMS 2280 and MATH 1650"] } },
        ],
      },

      {
        number: 6,
        label: "Spring - Year 3",
        items: [
          // ← Gen Ed search slot
          { kind: "genEd", genEd: { id: "gen-ed-slot-6", label: "Gen Ed Elective" } },
          {
            kind: "chooseOne",
            chooseOne: {
              id: "choose-cpre-coms",
              label: "Choose One",
              courses: [
                { code: "CPRE 3080", title: "Operating Systems: Principles and Practice", credits: 4, type: "required", prerequisites: ["CPRE 3810 or COMS 3210"] },
                { code: "COMS 3520", title: "Introduction to Operating Systems", credits: 3, type: "required", prerequisites: ["COMS 3210 or CPRE 3810", "COMS 3270 or CPRE 2880", "ENGL 2500"] },
              ],
            },
          },
          { kind: "course", course: { code: "SE 3170", title: "Introduction to Software Testing", credits: 3, type: "required", prerequisites: ["COMS 2300 or CPRE 3100", "COMS 3090 or SE 3090"] } },
          { kind: "course", course: { code: "SE 3390", title: "Software Architecture and Design", credits: 3, type: "required", prerequisites: ["SE 3190"] } },
          {
            kind: "chooseOne",
            chooseOne: {
              id: "choose-engl",
              label: "Choose One",
              courses: [
                { code: "ENGL 3140", title: "Technical Communication", credits: 3, type: "required", prerequisites: ["ENGL 2500 and Junior Classification"] },
                { code: "ENGL 3190", title: "Studies in Language Use", credits: 3, type: "required", prerequisites: ["ENGL 2500"] },
              ],
            },
          },
        ],
      },

      {
        number: 7,
        label: "Fall - Year 4",
        items: [
          { kind: "chooseOne", chooseOne: { id: "se-electives-2", label: "Choose one SE Elective", courses: SE_ELECTIVES } },
          { kind: "chooseOne", chooseOne: { id: "spplm-electives-2", label: "Choose one SPPLM Elective", courses: SPPLM_ELECTIVES } },
          { kind: "course", course: { code: "STAT 3300", title: "Probability and Statistics for Computer Science", credits: 3, type: "required", prerequisites: ["MATH 1660"] } },
          { kind: "course", course: { code: "SE 4210", title: "Software Analysis and Verification for Safety and Security", credits: 3, type: "required", prerequisites: ["COMS 2300 or CPRE 3100", "and COMS 3090 or SE 3090", "or Graduate Standing"] } },
          { kind: "course", course: { code: "SE 4910", title: "Senior Design Project I and Professionalism", credits: 3, type: "required", prerequisites: ["One of: ENGL 3090, ENGL 3140, ENGL 3140H", "SE 3390 and SE 3170", "Credit or enrollment in COMS 3520 or CPRE 3080"] } },
        ],
      },

      {
        number: 8,
        label: "Spring - Year 4",
        items: [
          { kind: "openElective", openElective: { id: "open-elective-slot-8", label: "Open Elective" } },
          { kind: "chooseOne", chooseOne: { id: "se-electives-3", label: "Choose one SE Elective", courses: SE_ELECTIVES } },
          { kind: "chooseOne", chooseOne: { id: "se-electives-4", label: "Choose one SE Elective", courses: SE_ELECTIVES } },
          { kind: "chooseOne", chooseOne: { id: "spplm-electives-3", label: "Choose one SPPLM Elective", courses: SPPLM_ELECTIVES } },
          { kind: "chooseOne", chooseOne: { id: "spplm-electives-4", label: "Choose one SPPLM Elective", courses: SPPLM_ELECTIVES } },
          { kind: "course", course: { code: "SE 4920", title: "Senior Design Project II", credits: 2, type: "required", prerequisites: ["SE 4910"] } },
        ],
      },
    ],
  },
}