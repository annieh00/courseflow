export interface Course {
  code: string
  name: string
  credits: number
  category: 'engr-basic' | 'se-core' | 'se-elective' | 'spl-elective' | 'ge-elective' | ''
  prerequisites: string[]
  corequisites: string[]
}

export const courses: Course[] = [
  // Year 1 - Fall
  { code: 'MATH 1650', name: 'Calc 1', credits: 4, category: 'engr-basic', prerequisites: [], corequisites: [] },
  { code: 'SE 1010', name: 'Orientation', credits: 0, category: 'engr-basic', prerequisites: [], corequisites: [] },
  { code: 'SE 1850', name: 'SE Prob', credits: 3, category: 'engr-basic', prerequisites: [], corequisites: ['MATH 1650'] },
  { code: 'CHEM 1670 (or) 1770', name: 'Engr Chem', credits: 4, category: 'engr-basic', prerequisites: [], corequisites: [] },
  { code: 'ECON 1010 (or) 1020 (or) 1030 (or) IE 3050', name: 'Economics / Engr Econ', credits: 3, category: '', prerequisites: [], corequisites: [] },
  { code: 'LIB 1600', name: 'Lib Instruction', credits: 1, category: 'engr-basic', prerequisites: [], corequisites: [] },

  // Year 1 - Spring
  { code: 'MATH 1660', name: 'Calc 2', credits: 4, category: 'engr-basic', prerequisites: ['MATH 1650'], corequisites: [] },
  { code: 'PHYS 2310 & PHYS 2310L', name: 'Class Phys 1', credits: 5, category: 'engr-basic', prerequisites: [], corequisites: ['MATH 1660'] },
  { code: 'SE 1660', name: 'SE Careers', credits: 0, category: '', prerequisites: ['SE 1010'], corequisites: [] },
  { code: 'COMS 2270', name: 'Intro Program', credits: 4, category: '', prerequisites: [], corequisites: ['MATH 1430 or higher'] },
  { code: 'ENGL 1500', name: 'Crit Think & Com', credits: 3, category: 'engr-basic', prerequisites: [], corequisites: [] },

  // Year 2 - Fall
  { code: 'MATH 2670', name: 'Diff Eq/Lap', credits: 4, category: '', prerequisites: ['MATH 1660'], corequisites: [] },
  { code: 'SPCM 2120', name: 'Pub Speak', credits: 3, category: '', prerequisites: [], corequisites: [] },
  { code: 'CPRE 2810', name: 'Digital Logic', credits: 4, category: 'se-core', prerequisites: [], corequisites: ['MATH 1660'] },
  { code: 'COMS 2280', name: 'Data Struct', credits: 3, category: '', prerequisites: ['COMS 2270', 'MATH 1650'], corequisites: [] },
  { code: 'ENGL 2500', name: 'Elect Comp', credits: 3, category: '', prerequisites: ['ENGL 1500'], corequisites: [] },

  // Year 2 - Spring
  { code: 'GEN ED Elective', name: 'General Education Elective', credits: 3, category: 'ge-elective', prerequisites: [], corequisites: [] },
  { code: 'MATH 2070 (or) 2650 (or) 3040 (or) 3140 (or) 3170', name: 'Math Elective', credits: 3, category: '', prerequisites: ['MATH 1660'], corequisites: [] },
  { code: 'CPRE 2880 (or) COMS 3270', name: 'Emb. Sys I (or) Adv Prog', credits: 4, category: 'se-core', prerequisites: ['CPRE 2810', 'COMS 2270'], corequisites: [] },
  { code: 'CPRE 3100 (or) COMS 2300', name: 'Fnd Cpr Engr (or) Discrete Comp', credits: 3, category: 'se-core', prerequisites: ['COMS 2280', 'MATH 1660'], corequisites: [] },
  { code: 'SE 3190', name: 'Soft Con', credits: 3, category: 'se-core', prerequisites: ['COMS 2280'], corequisites: [] },

  // Year 3 - Fall
  { code: 'GEN ED Elective (2)', name: 'General Education Elective', credits: 3, category: 'ge-elective', prerequisites: [], corequisites: [] },
  { code: 'CPRE 3810 (or) COMS 3210', name: 'Computer Org (or) Computer Arch', credits: 4, category: 'se-core', prerequisites: ['CPRE 2880'], corequisites: [] },
  { code: 'COMS 3110', name: 'Algor Anlys', credits: 3, category: 'se-core', prerequisites: ['COMS 2280', 'COMS 2300', 'MATH 1660'], corequisites: [] },
  { code: 'SE 3090', name: 'Soft Dev', credits: 3, category: 'se-core', prerequisites: ['SE 3190'], corequisites: [] },
  { code: 'COMS 3630', name: 'DBMS', credits: 3, category: 'se-core', prerequisites: ['COMS 2280'], corequisites: [] },

  // Year 3 - Spring
  { code: 'GEN ED Elective (3)', name: 'General Education Elective', credits: 3, category: 'ge-elective', prerequisites: [], corequisites: [] },
  { code: 'CPRE 3080 (or) COMS 3520', name: 'Oper Sys', credits: 4, category: 'se-core', prerequisites: ['CPRE 3810', 'COMS 3110'], corequisites: [] },
  { code: 'SE 3170', name: 'Intro Soft Test', credits: 3, category: 'se-core', prerequisites: ['SE 3090', 'COMS 2300'], corequisites: [] },
  { code: 'SE 3390', name: 'Soft Arch', credits: 3, category: 'se-core', prerequisites: ['SE 3090'], corequisites: [] },
  { code: 'ENGL 3140 (or) 3090', name: 'Tech Comm', credits: 3, category: '', prerequisites: ['ENGL 2500'], corequisites: [] },

  // Year 4 - Fall
  { code: 'SE Elective (1)', name: 'Software Engineering Elective', credits: 3, category: 'se-elective', prerequisites: [], corequisites: [] },
  { code: 'SPPLM Elective (1)', name: 'Supplementary Elective', credits: 3, category: 'spl-elective', prerequisites: [], corequisites: [] },
  { code: 'STAT 3300', name: 'Prob & Stat', credits: 3, category: '', prerequisites: ['MATH 1660'], corequisites: [] },
  { code: 'SE 4210', name: 'Security', credits: 3, category: 'se-core', prerequisites: ['SE 3090'], corequisites: [] },
  { code: 'SE 4910', name: 'Sr Design 1', credits: 3, category: '', prerequisites: ['SE 3090', 'SE 3170', 'SE 3190', 'SE 3390'], corequisites: [] },

  // Year 4 - Spring
  { code: 'Open Elective', name: 'Open Elective', credits: 3, category: '', prerequisites: [], corequisites: [] },
  { code: 'SE Elective (2)', name: 'Software Engineering Elective', credits: 3, category: 'se-elective', prerequisites: [], corequisites: [] },
  { code: 'SE Elective (3)', name: 'Software Engineering Elective', credits: 3, category: 'se-elective', prerequisites: [], corequisites: [] },
  { code: 'SPPLM Elective (2)', name: 'Supplementary Elective', credits: 3, category: 'spl-elective', prerequisites: [], corequisites: [] },
  { code: 'SPPLM Elective (3)', name: 'Supplementary Elective', credits: 3, category: 'spl-elective', prerequisites: [], corequisites: [] },
  { code: 'SE 4920', name: 'Sr Design 2', credits: 2, category: '', prerequisites: ['SE 4910'], corequisites: [] },
]

export const semesterLayout: string[][] = [
  // Year 1
  ['MATH 1650', 'SE 1010', 'SE 1850', 'CHEM 1670 (or) 1770', 'ECON 1010 (or) 1020 (or) 1030 (or) IE 3050', 'LIB 1600'], // Fall
  ['MATH 1660', 'PHYS 2310 & PHYS 2310L', 'SE 1660', 'COMS 2270', 'ENGL 1500'], // Spring

  // Year 2
  ['MATH 2670', 'SPCM 2120', 'CPRE 2810', 'COMS 2280', 'ENGL 2500'], // Fall
  ['GEN ED Elective', 'MATH 2070 (or) 2650 (or) 3040 (or) 3140 (or) 3170', 'CPRE 2880 (or) COMS 3270', 'CPRE 3100 (or) COMS 2300', 'SE 3190'], // Spring

  // Year 3
  ['GEN ED Elective (2)', 'CPRE 3810 (or) COMS 3210', 'COMS 3110', 'SE 3090', 'COMS 3630'], // Fall
  ['GEN ED Elective (3)', 'CPRE 3080 (or) COMS 3520', 'SE 3170', 'SE 3390', 'ENGL 3140 (or) 3090'], // Spring

  // Year 4
  ['SE Elective (1)', 'SPPLM Elective (1)', 'STAT 3300', 'SE 4210', 'SE 4910'], // Fall
  ['Open Elective', 'SE Elective (2)', 'SE Elective (3)', 'SPPLM Elective (2)', 'SPPLM Elective (3)', 'SE 4920'], // Spring
]