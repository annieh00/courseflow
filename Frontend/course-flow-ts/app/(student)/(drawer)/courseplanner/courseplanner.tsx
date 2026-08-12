import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View, Text, TextInput, ScrollView, StyleSheet, SafeAreaView,
  ActivityIndicator, TouchableOpacity, Modal, Pressable,
} from 'react-native';
import {
  Plus, Trash2, AlertTriangle, X, ChevronDown, Check,
  ArrowLeftRight, Search, BookOpen, ChevronRight, ShieldCheck,
} from "lucide-react-native";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../../../../components/ThemeContext';
import { PlanOnboarding } from './PlanOnboarding';
import { useAuth } from "../../../../auth/AuthContext";
import { CourseSearchModal } from './course-search-model';
import { PlannerTutorial } from './PlannerTutorial';

const _isLocal = typeof window === 'undefined' || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const _API_URL = _isLocal ? 'http://localhost:8080/api' : 'https://sdmay26-48.ece.iastate.edu/api';

/* =======================
   INTERFACES
======================= */
interface Course {
  id?: string;
  year: number | null;
  semester: string;
  code: string;
  name: string;
  credits: number;
  taken: boolean;
  programLabels?: string[];
}

interface Plan {
  plan_id: number;
  plan_name: string;
  list_of_courses: Course[];
}

interface DeclaredProgram {
  programId: string;
  programName: string;
  degreeType: string;
  completedCredits: number;
  requiredCredits: number;
}

interface RequirementCourse {
  courseNumber: string;
  courseTitle: string;
  credits: string;
  requirementType: string;
  groupId?: string | null;
}

interface RequirementRule {
  ruleId: number;
  categoryName: string;
  groupId: string;
  requiredCredits: number;
}

interface PrereqGroupViolation {
  options: string[];
  coreq: boolean;
}

interface PlanViolation {
  courseCode: string;
  courseName: string;
  missingGroups: PrereqGroupViolation[];
}

interface SemesterData { id: string; name: string; courses: Course[]; }
interface YearData {
  yearNumber: number;
  fall: SemesterData;
  spring: SemesterData;
  summer: SemesterData;
  winter: SemesterData;
}

/* =======================
   CONSTANTS
======================= */
const PROGRAM_COLORS = ['#7C3AED', '#2563EB', '#059669', '#D97706', '#DC2626'];

// Built dynamically in the component based on startSemester preference
const ALL_TERMS_FALL_START = ['Fall', 'Winter', 'Spring', 'Summer'];
const ALL_TERMS_SPRING_START = ['Spring', 'Summer', 'Fall', 'Winter'];

const CATEGORY_NAMES: Record<string, string> = {
  SOFTWARE_ENGINEERING_CORE: 'SE Core',
  SOFTWARE_ENGINEERING_ELECTIVE: 'SE Elective',
  SUPPLEMENTAL_ELECTIVE: 'Supplemental Elective',
  ENGINEERING_BASIC_PROGRAM: 'Engineering Basics',
  MATH_AND_PHYSICAL_SCIENCE: 'Math & Physical Science',
  GENERAL_EDUCATION: 'General Education',
  OPEN_ELECTIVE: 'Open Elective',
  SENIOR_DESIGN: 'Senior Design',
  COMPUTER_ENGINEERING_CORE: 'CprE Core',
  CPRE_TECHNICAL_ELECTIVE: 'CprE Technical Elective',
  TECHNICAL_ELECTIVE: 'Technical Elective',
  CYBER_SECURITY_ENGINEERING_CORE: 'CyBE Core',
  CYBER_SECURITY_ELECTIVE: 'CyBE Elective',
  CYBER_SECURITY_MINOR_CORE: 'Cybersecurity Core',
  CYBER_SECURITY_MINOR_ELECTIVE: 'Cybersecurity Elective',
  ENGR_SALES_MINOR_CORE: 'Engineering Sales Core',
  BME_MINOR_CORE: 'BME Core',
  BME_MINOR_ENGR_INTRO_ELECTIVE: 'BME Intro Elective',
  BME_MINOR_ADV_ENGR_ELECTIVE: 'BME Advanced Elective',
  BME_MINOR_PROFESSIONAL_ELECTIVE: 'BME Professional Elective',
  ENERGY_SYSTEMS_MINOR_CORE: 'Energy Systems Core',
  ENERGY_SYSTEMS_MINOR_ELECTIVE: 'Energy Systems Elective',
  INTERNATIONAL_PERSPECTIVES: 'International Perspectives',
  US_CULTURES_AND_COMMUNITIES: 'US Cultures & Communities',
  COMMUNICATION_PROFICIENCY: 'Communication Proficiency',
  AEROSPACE_ENGINEERING_CORE: 'AERE Core',
  MECHANICAL_ENGINEERING_CORE: 'ME Core',
  ME_FOUNDATIONS: 'ME Foundations',
  MATERIALS_ENGINEERING_CORE: 'MatE Core',
  CONSTRUCTION_ENGINEERING_CORE: 'ConE Core',
};

const formatCategory = (cat: string): string =>
  CATEGORY_NAMES[cat] ?? cat.split('_').map(w => w.charAt(0) + w.slice(1).toLowerCase()).join(' ');

const formatGroupName = (group: string): string => {
  if (!group || group === 'NONE') return 'General courses';
  return group.replace(/_CHOICE$/, '').split('_')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
};

/* =======================
   HELPERS
======================= */
const makeEmptyYear = (i: number): YearData => ({
  yearNumber: i,
  fall:   { id: `f-${i}`,  name: `Fall Year ${i}`,   courses: [] },
  spring: { id: `s-${i}`,  name: `Spring Year ${i}`,  courses: [] },
  summer: { id: `su-${i}`, name: `Summer Year ${i}`,  courses: [] },
  winter: { id: `w-${i}`,  name: `Winter Year ${i}`,  courses: [] },
});

const groupCoursesByYear = (courses: Course[], numYears: number): YearData[] => {
  const years: Record<number, YearData> = {};
  for (let i = 1; i <= numYears; i++) years[i] = makeEmptyYear(i);

  (courses ?? []).forEach(course => {
    const y = course.year as number;
    if (!years[y]) years[y] = makeEmptyYear(y);
    const term = course.semester?.toLowerCase() || "";
    if (term.includes('fall'))        years[y].fall.courses.push(course);
    else if (term.includes('spring')) years[y].spring.courses.push(course);
    else if (term.includes('summer')) years[y].summer.courses.push(course);
    else if (term.includes('winter')) years[y].winter.courses.push(course);
  });

  return Object.values(years).sort((a, b) => a.yearNumber - b.yearNumber);
};

const programColor = (label: string | undefined, programs: DeclaredProgram[]): string => {
  if (!label) return '#94A3B8';
  const idx = programs.findIndex(p => label.startsWith(p.programId));
  return idx >= 0 ? PROGRAM_COLORS[idx % PROGRAM_COLORS.length] : '#94A3B8';
};

const filterCourses = (courses: RequirementCourse[], query: string): RequirementCourse[] => {
  if (!query.trim()) return courses;
  const q = query.toLowerCase();
  return courses.filter(c =>
    c.courseNumber.toLowerCase().includes(q) ||
    c.courseTitle.toLowerCase().includes(q)
  );
};

/* =======================
   MAIN COMPONENT
======================= */
export default function CoursePlanner() {
  const { theme } = useTheme();
  const { user, accessToken } = useAuth();

  const [allPlans, setAllPlans] = useState<Plan[]>([]);
  const [activePlanId, setActivePlanId] = useState<number | null>(null);
  const [editedName, setEditedName] = useState('');
  const [planData, setPlanData] = useState<YearData[]>([]);
  const [hasExistingPlan, setHasExistingPlan] = useState(false);
  const [loading, setLoading] = useState(true);
  const [declaredPrograms, setDeclaredPrograms] = useState<DeclaredProgram[]>([]);
  const [activeSemester, setActiveSemester] = useState<{ year: number; term: string; name: string } | null>(null);

  // Plan UI
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Add flow
  const [showAddChoice, setShowAddChoice] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Requirements browser
  const [showRequirementsBrowser, setShowRequirementsBrowser] = useState(false);
  const [browseProgram, setBrowseProgram] = useState<DeclaredProgram | null>(null);
  const [requirementsData, setRequirementsData] = useState<Record<string, RequirementCourse[]>>({});
  const [requirementRules, setRequirementRules] = useState<RequirementRule[]>([]);
  const [requirementsLoading, setRequirementsLoading] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [browserSearch, setBrowserSearch] = useState('');

  // Move course
  const [movingCourse, setMovingCourse] = useState<Course | null>(null);
  const [showMoveModal, setShowMoveModal] = useState(false);

  // Semester preference
  const [startSemester, setStartSemester] = useState<'Fall' | 'Spring'>('Fall');

  // Expanded summer/winter per year (e.g. "summer-1", "winter-2")
  const [expandedSeasons, setExpandedSeasons] = useState<Set<string>>(new Set());

  // Dynamic year count (per plan, persisted)
  const [numYears, setNumYears] = useState(4);

  // Prereq validation
  const [planViolations, setPlanViolations] = useState<PlanViolation[]>([]);
  const [overriddenWarnings, setOverriddenWarnings] = useState<Set<string>>(new Set());
  const [warningCourse, setWarningCourse] = useState<PlanViolation | null>(null);
  const [showWarningSheet, setShowWarningSheet] = useState(false);

  // Flowchart completion status (shared with flowchart page)
  const [completedCourseCodes, setCompletedCourseCodes] = useState<Set<string>>(new Set());
  const [inProgressCourseCodes, setInProgressCourseCodes] = useState<Set<string>>(new Set());
  const [importCourseDetails, setImportCourseDetails] = useState<
    { code: string; name: string; credits: number; status: 'completed' | 'in-progress' }[]
  >([]);
  const [showImportModal, setShowImportModal] = useState(false);

  /* ---------- derived ---------- */
  const allCoursesFlat = useMemo(() =>
    planData.flatMap(y => [...y.fall.courses, ...y.spring.courses, ...y.summer.courses, ...y.winter.courses]),
    [planData]
  );

  const totalCredits = useMemo(() =>
    allCoursesFlat.reduce((acc, c) => acc + (Number(c.credits) || 0), 0),
    [allCoursesFlat]
  );

  const perProgramCredits = useMemo(() => {
    const map: Record<string, number> = {};
    allCoursesFlat.forEach(c => {
      (c.programLabels ?? []).forEach(label => {
        map[label] = (map[label] || 0) + (Number(c.credits) || 0);
      });
    });
    return map;
  }, [allCoursesFlat]);

  const coursesInPlan = useMemo(() => {
    const codes = new Set<string>();
    allCoursesFlat.forEach(c => codes.add(c.code));
    return codes;
  }, [allCoursesFlat]);

  // Move modal options ordered by starting semester preference
  const semestersOptions = useMemo(() => {
    const order = startSemester === 'Fall' ? ALL_TERMS_FALL_START : ALL_TERMS_SPRING_START;
    const opts: { year: number; term: string; label: string }[] = [];
    for (let y = 1; y <= numYears; y++) {
      order.forEach(term => opts.push({ year: y, term, label: `Year ${y} — ${term}` }));
    }
    return opts;
  }, [startSemester, numYears]);

  const completedCreditsInPlan = useMemo(() =>
    allCoursesFlat
      .filter(c => completedCourseCodes.has(c.code))
      .reduce((acc, c) => acc + (Number(c.credits) || 0), 0),
    [allCoursesFlat, completedCourseCodes]
  );

  // courseCode → violation (only for non-overridden)
  const violationMap = useMemo(() => {
    const map: Record<string, PlanViolation> = {};
    planViolations.forEach(v => {
      if (!overriddenWarnings.has(`${activePlanId}:${v.courseCode}`)) {
        map[v.courseCode] = v;
      }
    });
    return map;
  }, [planViolations, overriddenWarnings, activePlanId]);

  // Map (categoryName::groupId) → requiredCredits
  const ruleMap = useMemo(() => {
    const map: Record<string, number> = {};
    requirementRules.forEach(r => { map[`${r.categoryName}::${r.groupId}`] = r.requiredCredits; });
    return map;
  }, [requirementRules]);

  const getCategoryTotal = (cat: string) =>
    requirementRules.filter(r => r.categoryName === cat).reduce((s, r) => s + r.requiredCredits, 0);

  // Auto-expand categories that have search matches
  const categoriesWithMatches = useMemo(() => {
    if (!browserSearch.trim()) return new Set<string>();
    const matches = new Set<string>();
    Object.entries(requirementsData).forEach(([cat, courses]) => {
      if (filterCourses(courses, browserSearch).length > 0) matches.add(cat);
    });
    return matches;
  }, [requirementsData, browserSearch]);

  /* ---------- data fetching ---------- */
  const fetchDeclaredPrograms = async () => {
    if (!accessToken) return;
    try {
      const res = await fetch(`${_API_URL}/user/dashboard`, {
        headers: { 'Authorization': `Bearer ${accessToken}` },
      });
      const data = await res.json();
      if (data.success && data.data?.declaredPlans) setDeclaredPrograms(data.data.declaredPlans);
    } catch (_) {}
  };

  const fetchAllPlans = async (targetId?: number) => {
    const userId = user?.userId || user?.attributes?.netid;
    if (!userId) return;
    setLoading(true);
    try {
      const response = await fetch(`${_API_URL}/coursePlan/${userId}/plans`);
      const plans: Plan[] = await response.json();
      setAllPlans(plans);
      if (Array.isArray(plans) && plans.length > 0) {
        let planToLoad: Plan;
        if (targetId) planToLoad = plans.find(p => p.plan_id === targetId) || plans[plans.length - 1];
        else if (activePlanId) planToLoad = plans.find(p => p.plan_id === activePlanId) || plans[0];
        else planToLoad = [...plans].sort((a, b) => b.plan_id - a.plan_id)[0];
        loadPlanIntoView(planToLoad);
        setHasExistingPlan(true);
      } else {
        setHasExistingPlan(false);
      }
    } catch (_) { setHasExistingPlan(false); }
    finally { setLoading(false); }
  };

  const fetchRequirements = async (programId: string) => {
    setRequirementsLoading(true);
    setRequirementsData({});
    setRequirementRules([]);
    setBrowserSearch('');
    setExpandedCategories(new Set());
    try {
      const [structuredRes, creditsRes] = await Promise.all([
        fetch(`${_API_URL}/degree/${programId}/structured`),
        fetch(`${_API_URL}/degree/${programId}/credits`),
      ]);
      const [structured, credits] = await Promise.all([structuredRes.json(), creditsRes.json()]);
      setRequirementsData(structured);
      setRequirementRules(credits);
    } catch (_) {}
    finally { setRequirementsLoading(false); }
  };

  const fetchViolations = useCallback(async (planId: number, semester?: 'Fall' | 'Spring') => {
    const ss = semester ?? startSemester;
    try {
      const res = await fetch(`${_API_URL}/coursePlan/${planId}/validate?startSemester=${ss}`);
      if (res.ok) setPlanViolations(await res.json());
      else setPlanViolations([]);
    } catch (_) { setPlanViolations([]); }
  }, [startSemester]);

  const fetchTranscript = useCallback(async () => {
    if (!accessToken) return;
    try {
      const res = await fetch(`${_API_URL}/user/courses/details`, {
        headers: { 'Authorization': `Bearer ${accessToken}` },
      });
      const data = await res.json();
      if (data.success) {
        const completed = (data.data.completedCourses || []) as { code: string; name: string; credits: number }[];
        const inProgress = (data.data.inProgressCourses || []) as { code: string; name: string; credits: number }[];
        setCompletedCourseCodes(new Set(completed.map(c => c.code)));
        setInProgressCourseCodes(new Set(inProgress.map(c => c.code)));
        setImportCourseDetails([
          ...completed.map(c => ({ ...c, status: 'completed' as const })),
          ...inProgress.map(c => ({ ...c, status: 'in-progress' as const })),
        ]);
      }
    } catch (_) {}
  }, [accessToken]);

  const toggleCourseStatus = useCallback(async (courseCode: string) => {
    if (!accessToken) return;
    const newCompleted = new Set(completedCourseCodes);
    const newInProgress = new Set(inProgressCourseCodes);
    const isCompleted = newCompleted.has(courseCode);
    const isInProgress = newInProgress.has(courseCode);

    if (!isInProgress && !isCompleted) {
      newInProgress.add(courseCode);
    } else if (isInProgress) {
      newInProgress.delete(courseCode);
      newCompleted.add(courseCode);
    } else {
      newCompleted.delete(courseCode);
    }

    setCompletedCourseCodes(newCompleted);
    setInProgressCourseCodes(newInProgress);
    try {
      await fetch(`${_API_URL}/user/courses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${accessToken}` },
        body: JSON.stringify({
          courseNumbers: Array.from(newCompleted),
          inProgressCourseNumbers: Array.from(newInProgress),
        }),
      });
      fetchTranscript();
    } catch (_) {}
  }, [accessToken, completedCourseCodes, inProgressCourseCodes, fetchTranscript]);

  const loadOverrides = useCallback(async (planId: number) => {
    try {
      const raw = await AsyncStorage.getItem(`prereqOverrides_${planId}`);
      setOverriddenWarnings(raw ? new Set(JSON.parse(raw)) : new Set());
    } catch (_) { setOverriddenWarnings(new Set()); }
  }, []);

  const loadStartSemester = useCallback(async () => {
    try {
      const raw = await AsyncStorage.getItem('startSemesterPreference');
      if (raw === 'Spring' || raw === 'Fall') setStartSemester(raw);
    } catch (_) {}
  }, []);

  const saveStartSemester = async (val: 'Fall' | 'Spring') => {
    setStartSemester(val);
    try { await AsyncStorage.setItem('startSemesterPreference', val); } catch (_) {}
    if (activePlanId) fetchViolations(activePlanId, val);
  };

  const saveOverride = async (planId: number, courseCode: string) => {
    const key = `${planId}:${courseCode}`;
    const next = new Set(overriddenWarnings);
    next.add(key);
    setOverriddenWarnings(next);
    try {
      await AsyncStorage.setItem(`prereqOverrides_${planId}`, JSON.stringify([...next]));
    } catch (_) {}
  };

  const loadNumYears = async (planId: number, courses: Course[]): Promise<number> => {
    const maxFromCourses = courses.length > 0 ? Math.max(...courses.map(c => c.year ?? 0)) : 0;
    const floor = Math.max(4, maxFromCourses);
    try {
      const raw = await AsyncStorage.getItem(`planYears_${planId}`);
      return raw ? Math.max(parseInt(raw), floor) : floor;
    } catch (_) { return floor; }
  };

  const saveNumYears = async (planId: number, n: number) => {
    setNumYears(n);
    try { await AsyncStorage.setItem(`planYears_${planId}`, String(n)); } catch (_) {}
  };

  const loadPlanIntoView = async (plan: Plan) => {
    const courses = plan.list_of_courses || [];
    const years = await loadNumYears(plan.plan_id, courses);
    setNumYears(years);
    setActivePlanId(plan.plan_id);
    setEditedName(plan.plan_name);
    setPlanData(groupCoursesByYear(courses, years));
    setIsDropdownOpen(false);
    fetchViolations(plan.plan_id);
    loadOverrides(plan.plan_id);
  };

  useEffect(() => {
    loadStartSemester();
    if (user) { fetchAllPlans(); fetchDeclaredPrograms(); }
  }, [user]);

  useEffect(() => {
    if (accessToken) fetchTranscript();
  }, [accessToken]);

  /* ---------- mutations ---------- */
  const executeDelete = async () => {
    if (!activePlanId) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`${_API_URL}/coursePlan/${activePlanId}/delete`, { method: 'DELETE' });
      if (res.ok) { setShowDeleteModal(false); setActivePlanId(null); fetchAllPlans(); }
    } catch (_) {}
    finally { setIsDeleting(false); }
  };

  const addCourseToActivePlan = async (code: string, name: string, credits: number) => {
    if (!activeSemester || !activePlanId) return;
    const dto = { code, name, semester: activeSemester.term, year: activeSemester.year, credits, taken: false };
    const planId = activePlanId;
    try {
      const res = await fetch(`${_API_URL}/coursePlan/${planId}/addCourse`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dto),
      });
      if (res.ok) {
        const updated = await res.json();
        setPlanData(groupCoursesByYear(updated.list_of_courses, numYears));
        setAllPlans(prev => prev.map(p => p.plan_id === planId ? updated : p));
        fetchViolations(planId);
      }
    } catch (_) {}
  };

  const handleAddCourseToPlan = async (courseData: any) => {
    await addCourseToActivePlan(
      courseData.coursenum || courseData.courseNum || courseData.code,
      courseData.courseName || courseData.name,
      parseInt(courseData.credits) || 3,
    );
    setIsSearchOpen(false);
  };

  const handleAddFromRequirements = async (course: RequirementCourse) => {
    setShowRequirementsBrowser(false);
    await addCourseToActivePlan(course.courseNumber, course.courseTitle, parseInt(course.credits) || 3);
  };

  const handleRemoveCourse = async (courseCode: string) => {
    if (!activePlanId) return;
    const planId = activePlanId;
    try {
      const res = await fetch(
        `${_API_URL}/coursePlan/${planId}/removeCourse?courseCode=${courseCode}`,
        { method: 'PUT' }
      );
      if (res.ok) {
        const updated = await res.json();
        setPlanData(groupCoursesByYear(updated.list_of_courses, numYears));
        setAllPlans(prev => prev.map(p => p.plan_id === planId ? updated : p));
        fetchViolations(planId);
      }
    } catch (_) {}
  };

  const handleMoveCourse = async (targetYear: number, targetTerm: string) => {
    if (!movingCourse || !activePlanId) return;
    const planId = activePlanId;
    try {
      const res = await fetch(
        `${_API_URL}/coursePlan/${planId}/moveCourse?courseCode=${encodeURIComponent(movingCourse.code)}&targetYear=${targetYear}&targetSemester=${targetTerm}`,
        { method: 'PUT' }
      );
      if (res.ok) {
        const updated = await res.json();
        setPlanData(groupCoursesByYear(updated.list_of_courses, numYears));
        setAllPlans(prev => prev.map(p => p.plan_id === planId ? updated : p));
        fetchViolations(planId);
      }
    } catch (_) {}
    finally { setMovingCourse(null); setShowMoveModal(false); }
  };

  const handleAddYear = () => {
    const next = numYears + 1;
    if (activePlanId) saveNumYears(activePlanId, next);
    else setNumYears(next);
    setPlanData(prev => [...prev, makeEmptyYear(next)]);
  };

  const handleRemoveLastYear = () => {
    if (numYears <= 1) return;
    const prev = numYears - 1;
    if (activePlanId) saveNumYears(activePlanId, prev);
    else setNumYears(prev);
    setPlanData(current => current.filter(y => y.yearNumber <= prev));
  };

  const openAddCourse = (year: number, term: string, name: string) => {
    setActiveSemester({ year, term, name });
    if (declaredPrograms.length > 0) setShowAddChoice(true);
    else setIsSearchOpen(true);
  };

  const openRequirementsBrowser = (prog: DeclaredProgram) => {
    setShowAddChoice(false);
    setBrowseProgram(prog);
    fetchRequirements(prog.programId);
    setShowRequirementsBrowser(true);
  };

  const toggleSeason = (key: string) => {
    setExpandedSeasons(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  const toggleCategory = (cat: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      next.has(cat) ? next.delete(cat) : next.add(cat);
      return next;
    });
  };

  /* ---------- loading / empty ---------- */
  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  if (!hasExistingPlan) {
    return <PlanOnboarding theme={theme} onPlanCreated={(newId?: number) => fetchAllPlans(newId)} />;
  }

  const browseColor = browseProgram
    ? PROGRAM_COLORS[declaredPrograms.findIndex(p => p.programId === browseProgram.programId) % PROGRAM_COLORS.length]
    : '#7C3AED';

  /* ---------- render ---------- */
  return (
    <SafeAreaView style={[styles.mainContainer, { backgroundColor: theme.background }]}>
      <PlannerTutorial />

      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <View style={styles.titleContainer}>
          <TouchableOpacity style={styles.dropdownTrigger} onPress={() => setIsDropdownOpen(true)}>
            <Text style={[styles.title, { color: theme.text }]} numberOfLines={1}>{editedName}</Text>
            <ChevronDown size={20} color={theme.textSecondary} style={{ marginLeft: 6 }} />
          </TouchableOpacity>
          <Text style={[styles.creditBadge, { color: theme.danger || '#ff4444' }]}>
            {totalCredits} CR PLANNED{completedCreditsInPlan > 0 ? ` · ${completedCreditsInPlan} DONE` : ''}
          </Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={() => { setActivePlanId(null); setHasExistingPlan(false); }} style={styles.iconBtn}>
            <Plus size={26} color={theme.primary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setShowDeleteModal(true)} style={styles.iconBtn}>
            <Trash2 size={22} color={theme.danger || '#ff4444'} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Programs strip */}
      {declaredPrograms.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.programStripScroll} contentContainerStyle={styles.programStrip}>
          {declaredPrograms.map((prog, idx) => {
            const label = `${prog.programId} (${prog.degreeType})`;
            const color = PROGRAM_COLORS[idx % PROGRAM_COLORS.length];
            const plannedCr = perProgramCredits[label] || 0;
            return (
              <View key={label} style={[styles.programChip, { borderColor: color, backgroundColor: color + '15' }]}>
                <View style={[styles.programDot, { backgroundColor: color }]} />
                <View style={{ flexShrink: 1 }}>
                  <Text style={[styles.programChipName, { color }]} numberOfLines={1}>{prog.programName || prog.programId}</Text>
                  <Text style={[styles.programChipType, { color: theme.textSecondary }]} numberOfLines={1}>
                    {prog.degreeType} · {plannedCr}/{prog.requiredCredits} cr
                  </Text>
                </View>
              </View>
            );
          })}
        </ScrollView>
      )}

      {/* Starting semester toggle */}
      <View style={[styles.startSemRow, { borderBottomColor: theme.border }]}>
        <Text style={[styles.startSemLabel, { color: theme.textSecondary }]}>Starts in:</Text>
        <View style={[styles.startSemToggle, { backgroundColor: theme.card, borderColor: theme.border }]}>
          {(['Fall', 'Spring'] as const).map(opt => (
            <TouchableOpacity
              key={opt}
              style={[styles.startSemOpt, startSemester === opt && { backgroundColor: theme.primary }]}
              onPress={() => saveStartSemester(opt)}
            >
              <Text style={[styles.startSemOptText, { color: startSemester === opt ? '#fff' : theme.textSecondary }]}>{opt}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Plan selector */}
      <Modal visible={isDropdownOpen} transparent animationType="fade">
        <Pressable style={styles.modalOverlay} onPress={() => setIsDropdownOpen(false)}>
          <View style={[styles.dropdownMenu, { backgroundColor: theme.card }]}>
            <Text style={[styles.dropdownHeader, { color: theme.textSecondary }]}>Switch Plan</Text>
            {allPlans.map((plan) => (
              <TouchableOpacity key={plan.plan_id} style={styles.dropdownItem} onPress={() => loadPlanIntoView(plan)}>
                <Text style={[styles.dropdownItemText, { color: activePlanId === plan.plan_id ? theme.primary : theme.text }]}>
                  {plan.plan_name}
                </Text>
                {activePlanId === plan.plan_id && <Check size={18} color={theme.primary} />}
              </TouchableOpacity>
            ))}
          </View>
        </Pressable>
      </Modal>

      {/* Semester grid */}
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {planData.map((year) => {
          const primarySems: { sem: SemesterData; term: string }[] =
            startSemester === 'Fall'
              ? [{ sem: year.fall, term: 'Fall' }, { sem: year.spring, term: 'Spring' }]
              : [{ sem: year.spring, term: 'Spring' }, { sem: year.fall, term: 'Fall' }];

          const summerKey = `summer-${year.yearNumber}`;
          const winterKey = `winter-${year.yearNumber}`;
          const showSummer = expandedSeasons.has(summerKey);
          const showWinter = expandedSeasons.has(winterKey);
          const hasExtraCourses = year.summer.courses.length > 0 || year.winter.courses.length > 0;

          const isLastYear = year.yearNumber === numYears;
          const yearIsEmpty =
            year.fall.courses.length === 0 && year.spring.courses.length === 0 &&
            year.summer.courses.length === 0 && year.winter.courses.length === 0;

          return (
            <View key={year.yearNumber} style={styles.yearSection}>
              <View style={[styles.yearLabelRow, { borderBottomColor: theme.border }]}>
                <Text style={[styles.yearLabel, { color: theme.text }]}>Year {year.yearNumber}</Text>
                {isLastYear && yearIsEmpty && numYears > 1 && (
                  <TouchableOpacity onPress={handleRemoveLastYear} style={styles.removeYearBtn}>
                    <Text style={[styles.removeYearText, { color: theme.danger || '#ff4444' }]}>Remove year</Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Primary semesters (Fall + Spring) */}
              <View style={styles.semesterGrid}>
                {primarySems.map(({ sem, term }) => (
                  <View key={sem.id} style={[styles.semesterCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
                    <Text style={[styles.semTitle, { color: theme.text }]}>{term}</Text>
                    <View style={styles.courseList}>
                      {sem.courses.map((course, cIdx) => (
                        <CourseItem
                          key={cIdx}
                          course={course}
                          violation={violationMap[course.code]}
                          declaredPrograms={declaredPrograms}
                          theme={theme}
                          completedCourseCodes={completedCourseCodes}
                          inProgressCourseCodes={inProgressCourseCodes}
                          onToggleStatus={toggleCourseStatus}
                          onWarn={(v) => { setWarningCourse(v); setShowWarningSheet(true); }}
                          onMove={() => { setMovingCourse(course); setShowMoveModal(true); }}
                          onRemove={() => handleRemoveCourse(course.code)}
                        />
                      ))}
                      <TouchableOpacity
                        style={[styles.addCourseBtn, { borderColor: theme.border }]}
                        onPress={() => openAddCourse(year.yearNumber, term, sem.name)}
                      >
                        <Plus size={14} color={theme.textSecondary} />
                        <Text style={{ color: theme.textSecondary, marginLeft: 4, fontSize: 12 }}>Add</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>

              {/* Summer / Winter toggles */}
              <View style={styles.extrasRow}>
                {(['Summer', 'Winter'] as const).map(season => {
                  const key = `${season.toLowerCase()}-${year.yearNumber}`;
                  const isOpen = expandedSeasons.has(key);
                  const semData = season === 'Summer' ? year.summer : year.winter;
                  const hasCourses = semData.courses.length > 0;
                  const accentColor = season === 'Summer' ? '#F59E0B' : '#3B82F6';
                  return (
                    <TouchableOpacity
                      key={key}
                      style={[styles.extrasToggle, { borderColor: isOpen ? accentColor : theme.border, backgroundColor: isOpen ? accentColor + '10' : theme.card }]}
                      onPress={() => toggleSeason(key)}
                    >
                      <Text style={[styles.extrasToggleText, { color: isOpen ? accentColor : theme.textSecondary }]}>
                        {isOpen ? '−' : '+'} {season}
                        {hasCourses && !isOpen ? ` (${semData.courses.length})` : ''}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Summer / Winter cards side-by-side (matching Fall/Spring width) */}
              {(expandedSeasons.has(summerKey) || expandedSeasons.has(winterKey)) && (
                <View style={[styles.semesterGrid, { marginTop: 10 }]}>
                  {(['Summer', 'Winter'] as const).map(season => {
                    const key = `${season.toLowerCase()}-${year.yearNumber}`;
                    if (!expandedSeasons.has(key)) return <View key={key} style={{ width: '48%' }} />;
                    const semData = season === 'Summer' ? year.summer : year.winter;
                    const accentColor = season === 'Summer' ? '#F59E0B' : '#3B82F6';
                    return (
                      <View key={key} style={[styles.semesterCard, { backgroundColor: theme.card, borderColor: accentColor + '70' }]}>
                        <Text style={[styles.semTitle, { color: accentColor }]}>{season}</Text>
                        <View style={styles.courseList}>
                          {semData.courses.map((course, cIdx) => (
                            <CourseItem
                              key={cIdx}
                              course={course}
                              violation={violationMap[course.code]}
                              declaredPrograms={declaredPrograms}
                              theme={theme}
                              completedCourseCodes={completedCourseCodes}
                              inProgressCourseCodes={inProgressCourseCodes}
                              onToggleStatus={toggleCourseStatus}
                              onWarn={(v) => { setWarningCourse(v); setShowWarningSheet(true); }}
                              onMove={() => { setMovingCourse(course); setShowMoveModal(true); }}
                              onRemove={() => handleRemoveCourse(course.code)}
                            />
                          ))}
                          <TouchableOpacity
                            style={[styles.addCourseBtn, { borderColor: accentColor + '60' }]}
                            onPress={() => openAddCourse(year.yearNumber, season, semData.name)}
                          >
                            <Plus size={14} color={accentColor} />
                            <Text style={{ color: accentColor, marginLeft: 4, fontSize: 12 }}>Add</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    );
                  })}
                </View>
              )}
            </View>
          );
        })}

        {/* Add Year button */}
        <TouchableOpacity
          style={[styles.addYearBtn, { borderColor: theme.border }]}
          onPress={handleAddYear}
        >
          <Plus size={16} color={theme.primary} />
          <Text style={[styles.addYearText, { color: theme.primary }]}>Add Year {numYears + 1}</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* ── Add choice sheet ── */}
      <Modal visible={showAddChoice} transparent animationType="slide">
        <Pressable style={styles.overlay} onPress={() => setShowAddChoice(false)}>
          <Pressable style={[styles.sheet, { backgroundColor: theme.card }]} onPress={() => {}}>
            <View style={[styles.sheetHandle, { backgroundColor: theme.border }]} />
            <Text style={[styles.sheetTitle, { color: theme.text }]}>Add to {activeSemester?.name}</Text>
            <TouchableOpacity
              style={[styles.choiceRow, { backgroundColor: theme.background }]}
              onPress={() => { setShowAddChoice(false); setIsSearchOpen(true); }}
            >
              <View style={[styles.choiceIcon, { backgroundColor: (theme.primary || '#F59E0B') + '20' }]}>
                <Search size={18} color={theme.primary || '#F59E0B'} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.choiceLabel, { color: theme.text }]}>Search for any course</Text>
                <Text style={[styles.choiceSub, { color: theme.textSecondary }]}>Find by code or name</Text>
              </View>
              <ChevronRight size={18} color={theme.textSecondary} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.choiceRow, { backgroundColor: theme.background }]}
              onPress={() => { setShowAddChoice(false); setShowImportModal(true); }}
            >
              <View style={[styles.choiceIcon, { backgroundColor: '#16A34A20' }]}>
                <Check size={18} color="#16A34A" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.choiceLabel, { color: theme.text }]}>Add completed course (from flowchart)</Text>
                <Text style={[styles.choiceSub, { color: theme.textSecondary }]}>
                  {importCourseDetails.length > 0
                    ? `${importCourseDetails.length} course${importCourseDetails.length === 1 ? '' : 's'} tracked in flowchart`
                    : 'No courses marked in flowchart yet'}
                </Text>
              </View>
              <ChevronRight size={18} color={theme.textSecondary} />
            </TouchableOpacity>
            {declaredPrograms.length > 0 && (
              <>
                <Text style={[styles.choiceDivider, { color: theme.textSecondary }]}>— or browse by requirement —</Text>
                {declaredPrograms.map((prog, idx) => {
                  const color = PROGRAM_COLORS[idx % PROGRAM_COLORS.length];
                  return (
                    <TouchableOpacity key={prog.programId} style={[styles.choiceRow, { backgroundColor: theme.background }]} onPress={() => openRequirementsBrowser(prog)}>
                      <View style={[styles.choiceIcon, { backgroundColor: color + '20' }]}>
                        <BookOpen size={18} color={color} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.choiceLabel, { color: theme.text }]}>{prog.programName}</Text>
                        <Text style={[styles.choiceSub, { color: theme.textSecondary }]}>{prog.degreeType} requirements</Text>
                      </View>
                      <ChevronRight size={18} color={theme.textSecondary} />
                    </TouchableOpacity>
                  );
                })}
              </>
            )}
            <TouchableOpacity style={[styles.cancelRow, { backgroundColor: theme.background }]} onPress={() => setShowAddChoice(false)}>
              <Text style={[styles.cancelText, { color: theme.textSecondary }]}>Cancel</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      {/* ── Requirements browser ── */}
      <Modal visible={showRequirementsBrowser} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={[styles.browserContainer, { backgroundColor: theme.background }]}>

          {/* Browser header */}
          <View style={[styles.browserHeader, { borderBottomColor: theme.border }]}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.browserTitle, { color: theme.text }]} numberOfLines={1}>
                {browseProgram?.programName || 'Requirements'}
              </Text>
              <Text style={[styles.browserSub, { color: theme.textSecondary }]}>
                Adding to {activeSemester?.name} · tap a course to add
              </Text>
            </View>
            <TouchableOpacity onPress={() => setShowRequirementsBrowser(false)} style={styles.closeBtn}>
              <X size={22} color={theme.text} />
            </TouchableOpacity>
          </View>

          {/* Search bar */}
          <View style={[styles.searchBar, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Search size={15} color={theme.textSecondary} />
            <TextInput
              style={[styles.searchInput, { color: theme.text }]}
              placeholder="Filter by code or name…"
              placeholderTextColor={theme.textSecondary}
              value={browserSearch}
              onChangeText={setBrowserSearch}
              autoCorrect={false}
              autoCapitalize="none"
              clearButtonMode="while-editing"
            />
            {browserSearch.length > 0 && (
              <TouchableOpacity onPress={() => setBrowserSearch('')}>
                <X size={14} color={theme.textSecondary} />
              </TouchableOpacity>
            )}
          </View>

          {requirementsLoading ? (
            <View style={styles.center}><ActivityIndicator size="large" color={browseColor} /></View>
          ) : Object.keys(requirementsData).length === 0 ? (
            <View style={styles.center}>
              <Text style={[styles.emptyText, { color: theme.textSecondary }]}>No requirements data found.</Text>
            </View>
          ) : (
            <ScrollView contentContainerStyle={styles.browserScroll} keyboardShouldPersistTaps="handled">
              {Object.entries(requirementsData).map(([category, allCourses]) => {
                const totalRequired = getCategoryTotal(category);
                const isExpanded = expandedCategories.has(category) || categoriesWithMatches.has(category);

                // Split courses into sub-groups
                const coursesByGroup: Record<string, RequirementCourse[]> = {};
                allCourses.forEach(c => {
                  const gid = c.groupId || 'NONE';
                  if (!coursesByGroup[gid]) coursesByGroup[gid] = [];
                  coursesByGroup[gid].push(c);
                });
                const noneGroup = coursesByGroup['NONE'] || [];
                const choiceGroups = Object.entries(coursesByGroup).filter(([g]) => g !== 'NONE');

                // Hide category if search is active and no matches
                if (browserSearch.trim() && !categoriesWithMatches.has(category)) return null;

                // Credits planned in this category
                const plannedInCat = allCourses
                  .filter(c => coursesInPlan.has(c.courseNumber))
                  .reduce((s, c) => s + (parseInt(c.credits) || 0), 0);

                return (
                  <View key={category} style={[styles.categoryBlock, { backgroundColor: theme.card, borderColor: theme.border }]}>
                    {/* Category header row */}
                    <TouchableOpacity style={styles.categoryHeader} onPress={() => toggleCategory(category)} activeOpacity={0.75}>
                      <View style={[styles.categoryAccent, { backgroundColor: browseColor }]} />
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.categoryName, { color: theme.text }]}>{formatCategory(category)}</Text>
                        <View style={styles.categoryMetaRow}>
                          {totalRequired > 0 && (
                            <View style={[styles.creditPill, { backgroundColor: browseColor + '18', borderColor: browseColor + '40' }]}>
                              <Text style={[styles.creditPillText, { color: browseColor }]}>
                                Need {totalRequired} cr
                              </Text>
                            </View>
                          )}
                          {plannedInCat > 0 && (
                            <View style={[styles.creditPill, { backgroundColor: '#16A34A18', borderColor: '#16A34A40' }]}>
                              <Text style={[styles.creditPillText, { color: '#16A34A' }]}>
                                {plannedInCat} planned
                              </Text>
                            </View>
                          )}
                          <Text style={[styles.categoryCourseCount, { color: theme.textSecondary }]}>
                            {allCourses.length} courses
                          </Text>
                        </View>
                      </View>
                      <ChevronRight
                        size={16}
                        color={theme.textSecondary}
                        style={{ transform: [{ rotate: isExpanded ? '90deg' : '0deg' }] }}
                      />
                    </TouchableOpacity>

                    {/* Expanded content */}
                    {isExpanded && (
                      <View style={[styles.expandedContent, { borderTopColor: theme.border }]}>

                        {/* ── Choice buckets (non-NONE groups) ── */}
                        {choiceGroups.map(([groupId, groupCourses]) => {
                          const groupRequired = ruleMap[`${category}::${groupId}`];
                          const filtered = filterCourses(groupCourses, browserSearch);
                          if (browserSearch.trim() && filtered.length === 0) return null;
                          return (
                            <View key={groupId} style={[styles.bucketSection, { borderColor: theme.border }]}>
                              <View style={[styles.bucketHeader, { backgroundColor: browseColor + '10' }]}>
                                <View style={[styles.bucketAccent, { backgroundColor: browseColor }]} />
                                <Text style={[styles.bucketLabel, { color: browseColor }]}>
                                  {groupRequired
                                    ? `Choose ${groupRequired} credits — ${formatGroupName(groupId)}`
                                    : `Choose one — ${formatGroupName(groupId)}`}
                                </Text>
                              </View>
                              {filtered.map((course, i) => (
                                <CourseRow
                                  key={`${course.courseNumber}-${i}`}
                                  course={course}
                                  inPlan={coursesInPlan.has(course.courseNumber)}
                                  onAdd={() => handleAddFromRequirements(course)}
                                  theme={theme}
                                  accentColor={browseColor}
                                />
                              ))}
                            </View>
                          );
                        })}

                        {/* ── NONE (general pool) ── */}
                        {noneGroup.length > 0 && (() => {
                          const filtered = filterCourses(noneGroup, browserSearch);
                          const noneGroupRequired = ruleMap[`${category}::NONE`];
                          const displayedCourses = filtered.slice(0, 100);
                          const hasMore = filtered.length > 100;

                          return (
                            <View style={choiceGroups.length > 0 ? [styles.bucketSection, { borderColor: theme.border }] : undefined}>
                              {choiceGroups.length > 0 && (
                                <View style={[styles.bucketHeader, { backgroundColor: theme.border + '30' }]}>
                                  <View style={[styles.bucketAccent, { backgroundColor: theme.textSecondary }]} />
                                  <Text style={[styles.bucketLabel, { color: theme.textSecondary }]}>
                                    {noneGroupRequired
                                      ? `Pick ${noneGroupRequired} credits — General courses`
                                      : 'General courses'}
                                  </Text>
                                </View>
                              )}

                              <>
                                {displayedCourses.map((course, i) => (
                                  <CourseRow
                                    key={`${course.courseNumber}-${i}`}
                                    course={course}
                                    inPlan={coursesInPlan.has(course.courseNumber)}
                                    onAdd={() => handleAddFromRequirements(course)}
                                    theme={theme}
                                    accentColor={browseColor}
                                  />
                                  ))}
                                  {hasMore && (
                                    <Text style={[styles.showMoreNote, { color: theme.textSecondary }]}>
                                      Showing 100 of {filtered.length} — use search to narrow results
                                    </Text>
                                  )}
                                </>
                            </View>
                          );
                        })()}
                      </View>
                    )}
                  </View>
                );
              })}
            </ScrollView>
          )}
        </SafeAreaView>
      </Modal>

      {/* ── Move course modal ── */}
      <Modal visible={showMoveModal} transparent animationType="slide">
        <Pressable style={styles.overlay} onPress={() => { setShowMoveModal(false); setMovingCourse(null); }}>
          <Pressable style={[styles.sheet, { backgroundColor: theme.card }]} onPress={() => {}}>
            <View style={[styles.sheetHandle, { backgroundColor: theme.border }]} />
            <Text style={[styles.sheetTitle, { color: theme.text }]}>Move "{movingCourse?.code}"</Text>
            <Text style={[styles.sheetSub, { color: theme.textSecondary }]}>Select a semester</Text>
            <ScrollView style={{ maxHeight: 320 }} showsVerticalScrollIndicator={false}>
              {semestersOptions.map((opt) => {
                const isCurrent = movingCourse?.year === opt.year &&
                  movingCourse?.semester?.toLowerCase().includes(opt.term.toLowerCase());
                return (
                  <TouchableOpacity
                    key={opt.label}
                    style={[styles.semRow, { backgroundColor: theme.background }, isCurrent && { borderWidth: 1.5, borderColor: theme.primary }]}
                    onPress={() => handleMoveCourse(opt.year, opt.term)}
                  >
                    <Text style={[styles.semRowLabel, { color: theme.text }, isCurrent && { color: theme.primary, fontWeight: '700' }]}>{opt.label}</Text>
                    {isCurrent && <Text style={[styles.semRowCurrent, { color: theme.primary }]}>Current</Text>}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
            <TouchableOpacity style={[styles.cancelRow, { backgroundColor: theme.background }]} onPress={() => { setShowMoveModal(false); setMovingCourse(null); }}>
              <Text style={[styles.cancelText, { color: theme.textSecondary }]}>Cancel</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      {/* ── Delete modal ── */}
      <Modal visible={showDeleteModal} transparent animationType="fade">
        <View style={styles.centeredOverlay}>
          <View style={[styles.centeredModal, { backgroundColor: theme.card }]}>
            <View style={[styles.modalHeader, { borderBottomColor: theme.border }]}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>Delete Plan</Text>
              <TouchableOpacity onPress={() => setShowDeleteModal(false)}><X size={22} color={theme.text} /></TouchableOpacity>
            </View>
            <View style={styles.modalBody}>
              <View style={[styles.warningBanner, { backgroundColor: (theme.danger || '#ff4444') + '15' }]}>
                <AlertTriangle size={22} color={theme.danger || '#ff4444'} />
                <Text style={[styles.warningText, { color: theme.danger || '#ff4444' }]}>Permanent Action</Text>
              </View>
              <Text style={[styles.descriptionText, { color: theme.text }]}>
                Delete <Text style={{ fontWeight: "700" }}>"{editedName}"</Text>?
              </Text>
            </View>
            <View style={styles.centeredFooter}>
              <TouchableOpacity style={[styles.cancelBtn, { borderColor: theme.border }]} onPress={() => setShowDeleteModal(false)}>
                <Text style={{ color: theme.text }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.confirmDeleteBtn, { backgroundColor: theme.danger || "#ff4444" }]} onPress={executeDelete}>
                {isDeleting ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.confirmBtnText}>Delete</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Prereq warning sheet ── */}
      <Modal visible={showWarningSheet} transparent animationType="slide">
        <Pressable style={styles.overlay} onPress={() => setShowWarningSheet(false)}>
          <Pressable style={[styles.sheet, { backgroundColor: theme.card }]} onPress={() => {}}>
            <View style={[styles.sheetHandle, { backgroundColor: theme.border }]} />
            <View style={styles.warningSheetHeader}>
              <AlertTriangle size={20} color="#F59E0B" />
              <Text style={[styles.sheetTitle, { color: theme.text, marginBottom: 0 }]}>
                Prerequisite Warning
              </Text>
            </View>
            <Text style={[styles.warningSheetCourse, { color: theme.textSecondary }]}>
              {warningCourse?.courseCode} — {warningCourse?.courseName}
            </Text>
            <ScrollView style={{ maxHeight: 260 }} showsVerticalScrollIndicator={false}>
              {warningCourse?.missingGroups.map((group, gi) => (
                <View key={gi} style={[styles.missingGroupRow, { backgroundColor: theme.background, borderColor: theme.border }]}>
                  {group.options.length === 1 ? (
                    <Text style={[styles.missingGroupText, { color: theme.text }]}>
                      {group.coreq ? 'Co-req missing: ' : 'Prerequisite missing: '}
                      <Text style={{ fontWeight: '800', color: '#F59E0B' }}>{group.options[0]}</Text>
                    </Text>
                  ) : (
                    <>
                      <Text style={[styles.missingGroupText, { color: theme.text }]}>
                        {group.coreq ? 'Need at least one co-req:' : 'Need at least one prerequisite:'}
                      </Text>
                      {group.options.map(opt => (
                        <Text key={opt} style={[styles.missingGroupOption, { color: '#F59E0B' }]}>· {opt}</Text>
                      ))}
                    </>
                  )}
                </View>
              ))}
            </ScrollView>
            <View style={[styles.overrideBox, { backgroundColor: '#F59E0B10', borderColor: '#F59E0B40' }]}>
              <Text style={[styles.overrideNote, { color: theme.textSecondary }]}>
                If you have an exemption or advisor approval, you can override this warning.
              </Text>
            </View>
            <TouchableOpacity
              style={[styles.overrideBtn, { borderColor: '#F59E0B' }]}
              onPress={() => {
                if (warningCourse && activePlanId) {
                  saveOverride(activePlanId, warningCourse.courseCode);
                  setShowWarningSheet(false);
                }
              }}
            >
              <ShieldCheck size={16} color="#F59E0B" />
              <Text style={[styles.overrideBtnText, { color: '#F59E0B' }]}>Override / I have an exemption</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.cancelRow, { backgroundColor: theme.background }]} onPress={() => setShowWarningSheet(false)}>
              <Text style={[styles.cancelText, { color: theme.textSecondary }]}>Dismiss</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      {/* ── Import from flowchart modal ── */}
      <Modal visible={showImportModal} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={[styles.browserContainer, { backgroundColor: theme.background }]}>
          <View style={[styles.browserHeader, { borderBottomColor: theme.border }]}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.browserTitle, { color: theme.text }]}>Add from Flowchart</Text>
              <Text style={[styles.browserSub, { color: theme.textSecondary }]}>
                Adding to {activeSemester?.name} · tap a course to add
              </Text>
            </View>
            <TouchableOpacity onPress={() => setShowImportModal(false)} style={styles.closeBtn}>
              <X size={22} color={theme.text} />
            </TouchableOpacity>
          </View>

          {importCourseDetails.length === 0 ? (
            <View style={styles.center}>
              <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                No courses marked in the flowchart yet.{'\n'}Open the Degree Flowchart page to mark classes.
              </Text>
            </View>
          ) : (
            <ScrollView contentContainerStyle={[styles.browserScroll, { gap: 0 }]}>
              {importCourseDetails.map((course, i) => {
                const inPlan = coursesInPlan.has(course.code);
                const isCompleted = course.status === 'completed';
                const statusColor = isCompleted ? '#16A34A' : '#F59E0B';
                const statusLabel = isCompleted ? 'Completed' : 'In Progress';
                return (
                  <TouchableOpacity
                    key={i}
                    style={[
                      styles.reqCourseRow,
                      { borderBottomColor: theme.border },
                      inPlan && { backgroundColor: '#16A34A08' },
                    ]}
                    onPress={() => {
                      if (!inPlan) {
                        addCourseToActivePlan(course.code, course.name, course.credits);
                        setShowImportModal(false);
                      }
                    }}
                    activeOpacity={inPlan ? 1 : 0.7}
                  >
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Text style={[styles.reqCourseCode, { color: inPlan ? '#16A34A' : theme.text }]}>
                          {course.code}
                        </Text>
                        <View style={[styles.importStatusBadge, { backgroundColor: statusColor + '20', borderColor: statusColor + '60' }]}>
                          <Text style={[styles.importStatusText, { color: statusColor }]}>{statusLabel}</Text>
                        </View>
                      </View>
                      <Text style={[styles.reqCourseTitle, { color: theme.textSecondary }]} numberOfLines={1}>
                        {course.name}
                      </Text>
                    </View>
                    <View style={styles.reqCourseRight}>
                      <Text style={[styles.reqCourseCredits, { color: theme.textSecondary }]}>{course.credits} cr</Text>
                      {inPlan ? (
                        <View style={styles.inPlanBadge}><Text style={styles.inPlanText}>✓ In Plan</Text></View>
                      ) : (
                        <View style={[styles.addBtn, { backgroundColor: '#16A34A20', borderColor: '#16A34A' }]}>
                          <Plus size={12} color="#16A34A" />
                        </View>
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}
        </SafeAreaView>
      </Modal>

      <CourseSearchModal
        open={isSearchOpen}
        onOpenChange={setIsSearchOpen}
        onAddCourse={handleAddCourseToPlan}
        semesterName={activeSemester?.name || ""}
        theme={theme}
      />
    </SafeAreaView>
  );
}

/* =======================
   COURSE ITEM (plan grid — extracted to avoid re-renders)
======================= */
function CourseItem({
  course, violation, declaredPrograms, theme,
  completedCourseCodes, inProgressCourseCodes, onToggleStatus,
  onWarn, onMove, onRemove,
}: {
  course: Course;
  violation?: PlanViolation;
  declaredPrograms: DeclaredProgram[];
  theme: any;
  completedCourseCodes: Set<string>;
  inProgressCourseCodes: Set<string>;
  onToggleStatus: (code: string) => void;
  onWarn: (v: PlanViolation) => void;
  onMove: () => void;
  onRemove: () => void;
}) {
  const labels = course.programLabels ?? [];
  const borderColor = labels[0] ? programColor(labels[0], declaredPrograms) : 'transparent';
  const isCompleted = completedCourseCodes.has(course.code);
  const isInProgress = inProgressCourseCodes.has(course.code);

  return (
    <View style={[
      styles.courseItem,
      {
        borderLeftColor: violation ? '#F59E0B' : isCompleted ? '#16A34A' : isInProgress ? '#F59E0B' : borderColor,
        borderLeftWidth: (labels.length > 0 || violation || isCompleted || isInProgress) ? 3 : 0,
        backgroundColor: isCompleted ? '#16A34A08' : isInProgress ? '#F59E0B08' : undefined,
      },
    ]}>
      {/* Status toggle dot */}
      <TouchableOpacity onPress={() => onToggleStatus(course.code)} style={styles.statusBtn} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
        {isCompleted ? (
          <View style={[styles.statusDot, { backgroundColor: '#16A34A' }]}>
            <Check size={8} color="#fff" strokeWidth={3} />
          </View>
        ) : isInProgress ? (
          <View style={[styles.statusDot, { backgroundColor: 'transparent', borderWidth: 2, borderColor: '#F59E0B' }]} />
        ) : (
          <View style={[styles.statusDot, { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: theme.border }]} />
        )}
      </TouchableOpacity>

      <View style={{ flex: 1 }}>
        <View style={styles.courseTopRow}>
          <Text style={[styles.courseCode, { color: isCompleted ? '#16A34A' : theme.text }]}>{course.code}</Text>
          {labels.map(label => {
            const color = programColor(label, declaredPrograms);
            const prog = declaredPrograms.find(p => label.startsWith(p.programId));
            const shortName = prog ? prog.programName.split(' ')[0] : label.split(' (')[0];
            return (
              <View key={label} style={[styles.programBadge, { backgroundColor: color + '20', borderColor: color }]}>
                <Text style={[styles.programBadgeText, { color }]}>{shortName}</Text>
              </View>
            );
          })}
        </View>
        <Text style={[styles.courseName, { color: theme.textSecondary }]} numberOfLines={1}>{course.name}</Text>
      </View>
      <View style={styles.courseActions}>
        {violation && (
          <TouchableOpacity onPress={() => onWarn(violation)} style={styles.actionBtn}>
            <AlertTriangle size={13} color="#F59E0B" />
          </TouchableOpacity>
        )}
        <TouchableOpacity onPress={onMove} style={styles.actionBtn}>
          <ArrowLeftRight size={13} color={theme.textSecondary} />
        </TouchableOpacity>
        <TouchableOpacity onPress={onRemove} style={styles.actionBtn}>
          <Trash2 size={13} color={theme.danger || '#ff4444'} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

/* =======================
   COURSE ROW (requirements browser — extracted to avoid re-renders)
======================= */
function CourseRow({
  course, inPlan, onAdd, theme, accentColor,
}: {
  course: RequirementCourse;
  inPlan: boolean;
  onAdd: () => void;
  theme: any;
  accentColor: string;
}) {
  return (
    <TouchableOpacity
      style={[styles.reqCourseRow, { borderBottomColor: theme.border }, inPlan && { backgroundColor: '#16A34A08' }]}
      onPress={() => !inPlan && onAdd()}
      activeOpacity={inPlan ? 1 : 0.7}
    >
      <View style={{ flex: 1 }}>
        <Text style={[styles.reqCourseCode, { color: inPlan ? '#16A34A' : theme.text }]}>{course.courseNumber}</Text>
        <Text style={[styles.reqCourseTitle, { color: theme.textSecondary }]} numberOfLines={2}>{course.courseTitle}</Text>
      </View>
      <View style={styles.reqCourseRight}>
        <Text style={[styles.reqCourseCredits, { color: theme.textSecondary }]}>{course.credits} cr</Text>
        {inPlan ? (
          <View style={styles.inPlanBadge}><Text style={styles.inPlanText}>✓ In Plan</Text></View>
        ) : (
          <View style={[styles.addBtn, { backgroundColor: accentColor + '20', borderColor: accentColor }]}>
            <Plus size={12} color={accentColor} />
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

/* =======================
   STYLES
======================= */
const styles = StyleSheet.create({
  mainContainer: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { fontSize: 15 },

  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 18, borderBottomWidth: 1 },
  titleContainer: { flex: 1 },
  dropdownTrigger: { flexDirection: 'row', alignItems: 'center' },
  title: { fontSize: 22, fontWeight: '800', maxWidth: '85%' },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  iconBtn: { padding: 6 },
  creditBadge: { fontSize: 13, fontWeight: '700', marginTop: 2, letterSpacing: 0.5 },

  programStripScroll: { flexGrow: 0, flexShrink: 0 },
  programStrip: { paddingHorizontal: 16, paddingVertical: 10, gap: 10, alignItems: 'center' },
  programChip: { flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1.5, borderRadius: 14, paddingHorizontal: 12, paddingVertical: 8, minWidth: 155, maxWidth: 230 },
  programDot: { width: 9, height: 9, borderRadius: 5, flexShrink: 0 },
  programChipName: { fontSize: 13, fontWeight: '800' },
  programChipType: { fontSize: 11, fontWeight: '500', marginTop: 2 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'flex-start', paddingTop: 80, alignItems: 'center' },
  dropdownMenu: { width: '80%', borderRadius: 12, padding: 8, elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4 },
  dropdownHeader: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase', padding: 10, letterSpacing: 1 },
  dropdownItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 15, borderRadius: 8 },
  dropdownItemText: { fontSize: 16, fontWeight: '600' },

  scrollContent: { padding: 20, paddingBottom: 40 },
  yearSection: { marginBottom: 30 },
  yearLabelRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 15, borderBottomWidth: 1, paddingBottom: 8 },
  yearLabel: { fontSize: 18, fontWeight: '700' },
  removeYearBtn: { paddingVertical: 4, paddingHorizontal: 8 },
  removeYearText: { fontSize: 13, fontWeight: '600' },
  addYearBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 1.5, borderStyle: 'dashed', borderRadius: 12, paddingVertical: 14, marginTop: 4, marginBottom: 10 },
  addYearText: { fontSize: 15, fontWeight: '700' },
  semesterGrid: { flexDirection: 'row', justifyContent: 'space-between' },
  semesterCard: { width: '48%', borderRadius: 12, borderWidth: 1, padding: 12 },
  semTitle: { fontWeight: '700', fontSize: 14, marginBottom: 10 },
  courseList: { gap: 8 },

  courseItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6, paddingLeft: 6, paddingRight: 4, borderRadius: 6 },
  courseTopRow: { flexDirection: 'row', alignItems: 'center', gap: 4, flexWrap: 'wrap' },
  courseCode: { fontSize: 13, fontWeight: '700' },
  courseName: { fontSize: 11, marginTop: 1 },
  programBadge: { borderWidth: 1, borderRadius: 4, paddingHorizontal: 5, paddingVertical: 2 },
  programBadgeText: { fontSize: 9, fontWeight: '700', letterSpacing: 0.2 },
  courseActions: { flexDirection: 'row', gap: 4, alignItems: 'center' },
  actionBtn: { padding: 4 },
  addCourseBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderStyle: 'dashed', borderRadius: 8, paddingVertical: 6, marginTop: 5 },

  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  sheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 36 },
  sheetHandle: { width: 44, height: 5, borderRadius: 3, alignSelf: 'center', marginBottom: 20 },
  sheetTitle: { fontSize: 17, fontWeight: '800', marginBottom: 4 },
  sheetSub: { fontSize: 13, marginBottom: 16 },

  choiceRow: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 14, padding: 14, marginBottom: 8 },
  choiceIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  choiceLabel: { fontSize: 15, fontWeight: '700' },
  choiceSub: { fontSize: 12, marginTop: 1 },
  choiceDivider: { fontSize: 11, textAlign: 'center', marginVertical: 12, letterSpacing: 0.3 },
  cancelRow: { marginTop: 8, paddingVertical: 14, alignItems: 'center', borderRadius: 12 },
  cancelText: { fontSize: 15, fontWeight: '700' },

  semRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 13, paddingHorizontal: 14, borderRadius: 12, marginBottom: 6 },
  semRowLabel: { fontSize: 14, fontWeight: '600', flex: 1 },
  semRowCurrent: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },

  // Requirements browser
  browserContainer: { flex: 1 },
  browserHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, gap: 12 },
  browserTitle: { fontSize: 18, fontWeight: '800' },
  browserSub: { fontSize: 12, marginTop: 2 },
  closeBtn: { padding: 4 },

  searchBar: { flexDirection: 'row', alignItems: 'center', gap: 8, marginHorizontal: 16, marginVertical: 10, paddingHorizontal: 12, paddingVertical: 9, borderRadius: 12, borderWidth: 1 },
  searchInput: { flex: 1, fontSize: 14 },

  browserScroll: { padding: 12, gap: 10, paddingBottom: 40 },

  categoryBlock: { borderRadius: 14, borderWidth: 1, overflow: 'hidden' },
  categoryHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14 },
  categoryAccent: { width: 4, alignSelf: 'stretch', borderRadius: 2, minHeight: 32 },
  categoryName: { fontSize: 14, fontWeight: '700' },
  categoryMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4, flexWrap: 'wrap' },
  categoryCourseCount: { fontSize: 11 },
  creditPill: { borderWidth: 1, borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2 },
  creditPillText: { fontSize: 11, fontWeight: '700' },

  expandedContent: { borderTopWidth: 1 },

  bucketSection: { borderTopWidth: 1 },
  bucketHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 14, paddingVertical: 9 },
  bucketAccent: { width: 3, height: 14, borderRadius: 2 },
  bucketLabel: { fontSize: 12, fontWeight: '700', letterSpacing: 0.2 },

  reqCourseRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 11, borderBottomWidth: 1, gap: 12 },
  reqCourseCode: { fontSize: 13, fontWeight: '700' },
  reqCourseTitle: { fontSize: 11, marginTop: 2, lineHeight: 15 },
  reqCourseRight: { alignItems: 'flex-end', gap: 4, minWidth: 60 },
  reqCourseCredits: { fontSize: 11 },
  inPlanBadge: { backgroundColor: '#16A34A20', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  inPlanText: { fontSize: 10, fontWeight: '700', color: '#16A34A' },
  addBtn: { width: 24, height: 24, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },

  showMoreNote: { fontSize: 11, textAlign: 'center', paddingVertical: 10, paddingHorizontal: 16 },

  warningSheetHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  warningSheetCourse: { fontSize: 12, marginBottom: 14 },
  missingGroupRow: { borderWidth: 1, borderRadius: 10, padding: 12, marginBottom: 8 },
  missingGroupText: { fontSize: 13 },
  missingGroupOption: { fontSize: 13, fontWeight: '700', marginTop: 4, paddingLeft: 4 },
  overrideBox: { borderWidth: 1, borderRadius: 10, padding: 12, marginTop: 4, marginBottom: 12 },
  overrideNote: { fontSize: 12, lineHeight: 17 },
  overrideBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 1.5, borderRadius: 12, paddingVertical: 12, marginBottom: 8 },
  overrideBtnText: { fontSize: 14, fontWeight: '700' },

  centeredOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  centeredModal: { width: '85%', borderRadius: 16, paddingVertical: 15 },
  centeredFooter: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 15, gap: 10 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12, borderBottomWidth: 1 },
  modalTitle: { fontSize: 18, fontWeight: '700' },
  modalBody: { padding: 20 },
  warningBanner: { flexDirection: 'row', alignItems: 'center', padding: 10, borderRadius: 12, marginBottom: 16 },
  warningText: { marginLeft: 8, fontWeight: '700', fontSize: 12, textTransform: 'uppercase' },
  descriptionText: { fontSize: 15 },
  cancelBtn: { flex: 1, paddingVertical: 12, borderRadius: 12, borderWidth: 1, alignItems: 'center' },
  confirmDeleteBtn: { flex: 1.5, paddingVertical: 12, borderRadius: 12, alignItems: 'center' },
  confirmBtnText: { color: '#fff', fontWeight: '700' },

  // Starting semester toggle
  startSemRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 8, borderBottomWidth: 1, gap: 10 },
  startSemLabel: { fontSize: 12, fontWeight: '600' },
  startSemToggle: { flexDirection: 'row', borderRadius: 10, borderWidth: 1, overflow: 'hidden' },
  startSemOpt: { paddingHorizontal: 14, paddingVertical: 6 },
  startSemOptText: { fontSize: 12, fontWeight: '700' },

  // Summer / Winter extras
  extrasRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  extrasToggle: { width: '48%', alignItems: 'center', paddingVertical: 7, borderRadius: 10, borderWidth: 1 },
  extrasToggleText: { fontSize: 12, fontWeight: '700' },

  // Status dot (completion toggle on each course card)
  statusBtn: { marginRight: 4 },
  statusDot: { width: 15, height: 15, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },

  // Import from flowchart modal
  importStatusBadge: { borderWidth: 1, borderRadius: 5, paddingHorizontal: 5, paddingVertical: 1 },
  importStatusText: { fontSize: 9, fontWeight: '700' },
});
