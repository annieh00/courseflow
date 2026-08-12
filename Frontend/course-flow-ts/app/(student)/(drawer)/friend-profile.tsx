import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { BadgeEntry, CoursePlan, CoursePlanCourse, coursePlanAPI, gamificationAPI } from '../../../services/api';
import { useDegrees } from '../../../auth/DegreeContext';

const safeParseList = (value: string | string[] | undefined) => {
  try {
    const raw = Array.isArray(value) ? value[0] : value;
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
  } catch {
    return [];
  }
};

type Mode = 'profile' | 'plans' | 'badges';

const palette = {
  red: '#A71930',
  redDark: '#68111F',
  redSoft: '#F8E8EB',
  cream: '#FFF9F2',
  background: '#F6EFE7',
  gold: '#F2C14E',
  ink: '#241015',
  muted: '#735F64',
  border: 'rgba(167,25,48,0.14)',
};

const termLabel = (semester: string) => {
  const lower = semester?.toLowerCase() || '';
  if (lower.includes('fall')) return 'Fall';
  if (lower.includes('spring')) return 'Spring';
  if (lower.includes('summer')) return 'Summer';
  return semester || 'Term';
};

type SemesterData = {
  id: string;
  name: string;
  courses: CoursePlanCourse[];
};

type YearData = {
  yearNumber: number;
  fall: SemesterData;
  spring: SemesterData;
};

const groupCoursesByYear = (courses: CoursePlanCourse[]): YearData[] => {
  const years: Record<number, YearData> = {};

  for (let i = 1; i <= 4; i++) {
    years[i] = {
      yearNumber: i,
      fall: { id: `fall-${i}`, name: `Fall Year ${i}`, courses: [] },
      spring: { id: `spring-${i}`, name: `Spring Year ${i}`, courses: [] },
    };
  }

  courses.forEach((course) => {
    const year = course.year ?? 1;
    if (!years[year]) {
      years[year] = {
        yearNumber: year,
        fall: { id: `fall-${year}`, name: `Fall Year ${year}`, courses: [] },
        spring: { id: `spring-${year}`, name: `Spring Year ${year}`, courses: [] },
      };
    }

    const term = course.semester?.toLowerCase() || '';
    if (term.includes('fall')) years[year].fall.courses.push(course);
    else years[year].spring.courses.push(course);
  });

  return Object.values(years)
    .filter((year) => year.fall.courses.length > 0 || year.spring.courses.length > 0)
    .sort((a, b) => a.yearNumber - b.yearNumber);
};

export default function FriendProfileScreen() {
  const router = useRouter();
  const { getDegreeName } = useDegrees();
  const styles = useMemo(() => createStyles(), []);
  const [mode, setMode] = useState<Mode>('profile');
  const [plans, setPlans] = useState<CoursePlan[]>([]);
  const [activePlanId, setActivePlanId] = useState<number | null>(null);
  const [plansLoading, setPlansLoading] = useState(false);
  const [badges, setBadges] = useState<BadgeEntry[]>([]);
  const [badgesLoading, setBadgesLoading] = useState(false);
  const params = useLocalSearchParams<{
    id?: string;
    netid?: string;
    name?: string;
    email?: string;
    photoUrl?: string;
    bio?: string;
    majors?: string;
    minors?: string;
    graduationYear?: string;
  }>();

  const friendUserId = params.id ? parseInt(params.id, 10) : null;
  const name = params.name || 'Friend';
  const netid = params.netid || 'unknown';
  const email = params.email || `${netid}@iastate.edu`;
  const photoUrl = params.photoUrl || '';
  const bio = params.bio || '';
  const majors = safeParseList(params.majors);
  const minors = safeParseList(params.minors);
  const graduationYear = params.graduationYear || 'Not shared';
  const formatDegrees = (degreeIds: string[]) =>
    degreeIds.filter(Boolean).map((id) => getDegreeName(id)).join(', ');
  const majorLabel = majors.length ? formatDegrees(majors) : 'Exploring';
  const minorLabel = minors.length ? formatDegrees(minors) : 'None listed';
  const displayBio = bio || 'No bio shared yet. Some people keep the lore locked until office hours.';

  useEffect(() => {
    const loadPlans = async () => {
      if (!netid || netid === 'unknown') return;

      try {
        setPlansLoading(true);
        const data = await coursePlanAPI.getUserPlans(netid);
        const safePlans = Array.isArray(data) ? data : [];
        setPlans(safePlans);
        setActivePlanId((previous) => previous ?? safePlans[0]?.plan_id ?? null);
      } catch (error) {
        console.error('Error loading friend plans:', error);
        setPlans([]);
      } finally {
        setPlansLoading(false);
      }
    };

    loadPlans();
  }, [netid]);

  useEffect(() => {
    if (!friendUserId) return;
    const loadBadges = async () => {
      try {
        setBadgesLoading(true);
        const data = await gamificationAPI.getBadgesForUser(friendUserId);
        setBadges(Array.isArray(data) ? data : []);
      } catch {
        setBadges([]);
      } finally {
        setBadgesLoading(false);
      }
    };
    loadBadges();
  }, [friendUserId]);

  const goBackToFriends = () => {
    router.replace('/(student)/(drawer)/friends');
  };

  const headerLeft = () => (
    <TouchableOpacity
      onPress={goBackToFriends}
      style={{ paddingHorizontal: 8, flexDirection: 'row', alignItems: 'center' }}
      hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
    >
      <Ionicons name="chevron-back" size={22} color="#fff" />
      <Text style={{ marginLeft: 2, fontWeight: '700', color: '#fff' }}>Back</Text>
    </TouchableOpacity>
  );

  const avatarSource = photoUrl
    ? { uri: photoUrl }
    : { uri: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=C8102E&color=fff` };

  const Chip = ({ icon, text }: { icon: keyof typeof Ionicons.glyphMap; text: string }) => (
    <View style={styles.chip}>
      <Ionicons name={icon} size={14} color={palette.red} />
      <Text style={styles.chipText}>{text}</Text>
    </View>
  );

  const DetailTile = ({ icon, label, value }: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string }) => (
    <View style={styles.detailTile}>
      <View style={styles.tileIcon}>
        <Ionicons name={icon} size={19} color={palette.red} />
      </View>
      <Text style={styles.tileLabel}>{label}</Text>
      <Text style={styles.tileValue}>{value}</Text>
    </View>
  );

  const activePlan = plans.find((plan) => plan.plan_id === activePlanId) ?? plans[0];
  const activeCourses = activePlan?.list_of_courses ?? [];
  const planData = groupCoursesByYear(activeCourses);

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Friend Profile',
          headerStyle: { backgroundColor: palette.red },
          headerTintColor: '#fff',
          headerTitleStyle: { color: '#fff', fontWeight: 'bold' },
          headerShadowVisible: false,
          headerLeft,
        }}
      />

      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          <View style={styles.heroOrbLarge} />
          <View style={styles.heroOrbSmall} />

          <Text style={styles.heroKicker}>CourseFlow Friend</Text>
          <Text style={styles.heroName}>{name}</Text>
          <Text style={styles.heroNetid}>@{netid}</Text>
        </View>

        <View style={styles.identityCard}>
          <View style={styles.avatarWrap}>
            <Image source={avatarSource} style={styles.avatar} />
          </View>
          <View style={styles.identityText}>
            <Text style={styles.identityName}>{name}</Text>
            <Text style={styles.identitySubtext}>{email}</Text>
          </View>
          <View style={styles.friendMark}>
            <Ionicons name="people" size={18} color="#fff" />
          </View>
        </View>

        <View style={styles.tabRail}>
          <TouchableOpacity
            style={[styles.tabButton, mode === 'profile' && styles.activeTabButton]}
            onPress={() => setMode('profile')}
          >
            <Text style={[styles.tabText, mode === 'profile' && styles.activeTabText]}>Profile</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabButton, mode === 'plans' && styles.activeTabButton]}
            onPress={() => setMode('plans')}
          >
            <Text style={[styles.tabText, mode === 'plans' && styles.activeTabText]}>Plans</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabButton, mode === 'badges' && styles.activeTabButton]}
            onPress={() => setMode('badges')}
          >
            <Text style={[styles.tabText, mode === 'badges' && styles.activeTabText]}>Badges</Text>
          </TouchableOpacity>
        </View>

        {mode === 'profile' ? (
          <>
        <View style={styles.chipRow}>
          <Chip icon="school-outline" text={majorLabel} />
          <Chip icon="calendar-outline" text={`Class of ${graduationYear}`} />
        </View>

        <View style={styles.storyCard}>
          <View style={styles.sectionHeadingRow}>
            <Text style={styles.sectionEyebrow}>Shared Profile</Text>
            <Ionicons name="sparkles-outline" size={18} color={palette.red} />
          </View>
          <Text style={styles.bioText}>{displayBio}</Text>
        </View>


        <View style={styles.detailGrid}>
          <DetailTile icon="school-outline" label="Major" value={majorLabel} />
          <DetailTile icon="ribbon-outline" label="Minor" value={minorLabel} />
          <DetailTile icon="calendar-clear-outline" label="Graduation" value={graduationYear} />
          <DetailTile icon="mail-outline" label="Contact" value={email} />
        </View>

          </>
        ) : mode === 'badges' ? (
          <View style={styles.badgesArea}>
            <View style={styles.plansHeaderCard}>
              <Text style={styles.sectionEyebrow}>Achievements</Text>
              <Text style={styles.plansTitle}>{name.split(' ')[0] || 'Friend'}'s earned badges</Text>
            </View>

            {badgesLoading ? (
              <View style={styles.loadingPlansCard}>
                <ActivityIndicator color={palette.red} />
                <Text style={styles.loadingPlansText}>Loading badges...</Text>
              </View>
            ) : badges.filter(b => b.earned).length === 0 ? (
              <View style={styles.emptyPlansCard}>
                <Ionicons name="trophy-outline" size={28} color={palette.red} />
                <Text style={styles.emptyPlansTitle}>No badges yet</Text>
                <Text style={styles.emptyPlansText}>This friend hasn't unlocked any badges yet.</Text>
              </View>
            ) : (
              <View style={styles.badgeGrid}>
                {badges.filter(b => b.earned).map((badge) => (
                  <View key={badge.key} style={styles.badgeTile}>
                    <Ionicons name={badge.icon as any} size={36} color={palette.red} />
                    <Text style={styles.badgeName} numberOfLines={2}>{badge.name}</Text>
                    <Text style={styles.badgeDesc} numberOfLines={3}>{badge.description}</Text>
                    {badge.earnedDate && (
                      <Text style={styles.badgeDate}>
                        {new Date(badge.earnedDate).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}
                      </Text>
                    )}
                  </View>
                ))}
              </View>
            )}
          </View>
        ) : (
          <View style={styles.plansArea}>
            <View style={styles.plansHeaderCard}>
              <Text style={styles.sectionEyebrow}>Read-only Course Plans</Text>
              <Text style={styles.plansTitle}>{name.split(' ')[0] || 'Friend'}'s academic roadmap</Text>
              <Text style={styles.plansSubtitle}>
                Friends can view saved plans, but editing, notes, and advisor messaging stay advisor-only.
              </Text>
            </View>

            {plansLoading ? (
              <View style={styles.loadingPlansCard}>
                <ActivityIndicator color={palette.red} />
                <Text style={styles.loadingPlansText}>Loading saved plans...</Text>
              </View>
            ) : plans.length === 0 ? (
              <View style={styles.emptyPlansCard}>
                <Ionicons name="map-outline" size={28} color={palette.red} />
                <Text style={styles.emptyPlansTitle}>No shared plans yet</Text>
                <Text style={styles.emptyPlansText}>When this friend saves a course plan, it will appear here.</Text>
              </View>
            ) : (
              <>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.planPicker}>
                  {plans.map((plan) => {
                    const selected = plan.plan_id === activePlan?.plan_id;
                    return (
                      <TouchableOpacity
                        key={plan.plan_id}
                        style={[styles.planPill, selected && styles.activePlanPill]}
                        onPress={() => setActivePlanId(plan.plan_id)}
                      >
                        <Text style={[styles.planPillText, selected && styles.activePlanPillText]}>
                          {plan.plan_name || `Plan ${plan.plan_id}`}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>

                <View style={styles.planSummaryCard}>
                  <View>
                    <Text style={styles.planSummaryLabel}>Selected Plan</Text>
                    <Text style={styles.planSummaryTitle}>{activePlan?.plan_name || 'Course Plan'}</Text>
                  </View>
                  <View style={styles.creditBadge}>
                    <Text style={styles.creditNumber}>{activePlan?.total_credits ?? 0}</Text>
                    <Text style={styles.creditLabel}>credits</Text>
                  </View>
                </View>

                {planData.length === 0 ? (
                  <View style={styles.emptyPlansCard}>
                    <Ionicons name="albums-outline" size={28} color={palette.red} />
                    <Text style={styles.emptyPlansTitle}>This plan is empty</Text>
                    <Text style={styles.emptyPlansText}>No courses have been added to this plan yet.</Text>
                  </View>
                ) : (
                  planData.map((year) => (
                    <View key={year.yearNumber} style={styles.yearBlock}>
                      <Text style={styles.yearTitle}>Year {year.yearNumber}</Text>
                      <View style={styles.semesterGrid}>
                        {[year.fall, year.spring].map((semester, index) => (
                          <View key={semester.id} style={styles.semesterCard}>
                            <View style={styles.semesterHeader}>
                              <Text style={styles.semesterTitle}>{index === 0 ? 'Fall' : 'Spring'}</Text>
                              <Text style={styles.semesterSub}>
                                {semester.courses.length} course{semester.courses.length === 1 ? '' : 's'}
                              </Text>
                            </View>

                            {semester.courses.length === 0 ? (
                              <View style={styles.emptySemesterBox}>
                                <Text style={styles.emptySemesterText}>No courses added yet.</Text>
                              </View>
                            ) : (
                              semester.courses.map((course, courseIndex) => (
                                <View key={`${semester.id}-${course.code}-${courseIndex}`} style={styles.courseChip}>
                                  <View style={styles.courseChipTopRow}>
                                    <Text style={styles.courseChipCode}>{course.code}</Text>
                                    <View style={[styles.courseBadge, course.taken && styles.courseTakenBadge]}>
                                      <Text style={[styles.courseBadgeText, course.taken && styles.courseTakenBadgeText]}>
                                        {course.taken ? 'Done' : 'Planned'}
                                      </Text>
                                    </View>
                                  </View>
                                  <Text style={styles.courseChipName}>{course.name}</Text>
                                  <Text style={styles.courseChipMeta}>
                                    {termLabel(course.semester)} | {course.credits} credit{course.credits === 1 ? '' : 's'}
                                  </Text>
                                </View>
                              ))
                            )}
                          </View>
                        ))}
                      </View>
                    </View>
                  ))
                )}
              </>
            )}
          </View>
        )}

      </ScrollView>
    </>
  );
}

const createStyles = () => StyleSheet.create({
  container: { flex: 1, backgroundColor: palette.background },
  content: { paddingBottom: 34 },
  hero: {
    backgroundColor: palette.red,
    paddingHorizontal: 22,
    paddingTop: 26,
    paddingBottom: 92,
    overflow: 'hidden',
  },
  heroOrbLarge: {
    position: 'absolute',
    width: 210,
    height: 210,
    borderRadius: 105,
    backgroundColor: 'rgba(242,193,78,0.24)',
    right: -68,
    top: -52,
  },
  heroOrbSmall: {
    position: 'absolute',
    width: 116,
    height: 116,
    borderRadius: 58,
    backgroundColor: 'rgba(255,255,255,0.10)',
    left: -32,
    bottom: 20,
  },
  heroKicker: {
    color: palette.gold,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginTop: 20,
  },
  heroName: { color: '#fff', fontSize: 40, lineHeight: 44, fontWeight: '900', maxWidth: 330, marginTop: 8 },
  heroNetid: { color: 'rgba(255,255,255,0.76)', fontSize: 16, marginTop: 8, fontWeight: '700' },
  identityCard: {
    marginHorizontal: 18,
    marginTop: -58,
    backgroundColor: palette.cream,
    borderRadius: 28,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: palette.redDark,
    shadowOpacity: 0.16,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 12 },
    elevation: 5,
    borderWidth: 1,
    borderColor: palette.border,
  },
  avatarWrap: {
    width: 82,
    height: 82,
    borderRadius: 25,
    backgroundColor: palette.gold,
    padding: 4,
    transform: [{ rotate: '-3deg' }],
  },
  avatar: { width: '100%', height: '100%', borderRadius: 21, backgroundColor: palette.redSoft },
  identityText: { flex: 1, marginLeft: 14 },
  identityName: { color: palette.ink, fontSize: 20, fontWeight: '900' },
  identitySubtext: { color: palette.muted, fontSize: 13, marginTop: 4 },
  friendMark: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: palette.red,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabRail: {
    marginHorizontal: 18,
    marginTop: 18,
    backgroundColor: '#EADCD0',
    borderRadius: 999,
    padding: 5,
    flexDirection: 'row',
  },
  tabButton: {
    flex: 1,
    borderRadius: 999,
    paddingVertical: 11,
    alignItems: 'center',
  },
  activeTabButton: {
    backgroundColor: palette.cream,
    shadowColor: palette.redDark,
    shadowOpacity: 0.10,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 2,
  },
  tabText: { color: palette.red, fontSize: 13, fontWeight: '900', letterSpacing: 0.5 },
  activeTabText: { color: palette.ink },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    paddingHorizontal: 18,
    marginTop: 18,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9E8B6',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: palette.border,
  },
  chipText: { color: palette.red, fontSize: 12, fontWeight: '900', marginLeft: 6 },
  storyCard: {
    backgroundColor: palette.cream,
    marginHorizontal: 18,
    marginTop: 16,
    padding: 20,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: palette.border,
  },
  sectionHeadingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionEyebrow: { color: palette.red, fontSize: 12, fontWeight: '900', letterSpacing: 1.1, textTransform: 'uppercase' },
  bioText: { color: palette.ink, fontSize: 17, lineHeight: 26, fontWeight: '600' },
  detailGrid: {
    paddingHorizontal: 18,
    marginTop: 16,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  detailTile: {
    width: '48%',
    minHeight: 142,
    backgroundColor: palette.cream,
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: palette.border,
    justifyContent: 'space-between',
  },
  tileIcon: {
    width: 38,
    height: 38,
    borderRadius: 14,
    backgroundColor: palette.redSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tileLabel: {
    color: palette.muted,
    fontSize: 11,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginTop: 14,
  },
  tileValue: { color: palette.ink, fontSize: 15, fontWeight: '900', lineHeight: 20, marginTop: 6 },
  guardrailCard: {
    marginHorizontal: 18,
    marginTop: 16,
    backgroundColor: '#F3E2D8',
    borderRadius: 24,
    padding: 16,
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: palette.border,
  },
  guardrailIcon: {
    width: 42,
    height: 42,
    borderRadius: 16,
    backgroundColor: palette.gold,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  guardrailTitle: { color: palette.ink, fontSize: 15, fontWeight: '900', marginBottom: 3 },
  permissionsNote: { color: palette.muted, fontSize: 13, lineHeight: 19 },
  plansArea: { marginTop: 16 },
  badgesArea: { marginTop: 16 },
  badgeGrid: {
    marginHorizontal: 18,
    marginTop: 16,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  badgeTile: {
    width: '47%',
    backgroundColor: palette.cream,
    borderRadius: 20,
    padding: 14,
    borderWidth: 1,
    borderColor: palette.border,
    alignItems: 'center',
  },
  badgeTileLocked: {
    opacity: 0.45,
    backgroundColor: '#EDE8E4',
  },
  badgeIcon: { marginBottom: 8 },
  badgeName: { color: palette.ink, fontSize: 13, fontWeight: '900', textAlign: 'center', marginBottom: 4 },
  badgeNameLocked: { color: palette.muted },
  badgeDesc: { color: palette.muted, fontSize: 11, textAlign: 'center', lineHeight: 15 },
  badgeDescLocked: { color: '#999' },
  badgeDate: { color: palette.red, fontSize: 10, fontWeight: '800', marginTop: 6 },
  lockedBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 6 },
  lockedText: { color: palette.muted, fontSize: 10, fontWeight: '700' },
  plansHeaderCard: {
    backgroundColor: palette.cream,
    marginHorizontal: 18,
    padding: 20,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: palette.border,
  },
  plansTitle: { color: palette.ink, fontSize: 24, fontWeight: '900', marginTop: 8 },
  plansSubtitle: { color: palette.muted, fontSize: 14, lineHeight: 20, marginTop: 8 },
  loadingPlansCard: {
    marginHorizontal: 18,
    marginTop: 16,
    backgroundColor: palette.cream,
    borderRadius: 24,
    padding: 22,
    alignItems: 'center',
  },
  loadingPlansText: { color: palette.muted, marginTop: 10, fontWeight: '700' },
  emptyPlansCard: {
    marginHorizontal: 18,
    marginTop: 16,
    backgroundColor: palette.cream,
    borderRadius: 24,
    padding: 22,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: palette.border,
  },
  emptyPlansTitle: { color: palette.ink, fontSize: 17, fontWeight: '900', marginTop: 10 },
  emptyPlansText: { color: palette.muted, fontSize: 13, textAlign: 'center', lineHeight: 19, marginTop: 5 },
  planPicker: { paddingHorizontal: 18, paddingTop: 16, gap: 10 },
  planPill: {
    backgroundColor: palette.cream,
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: palette.border,
  },
  activePlanPill: { backgroundColor: palette.red, borderColor: palette.red },
  planPillText: { color: palette.red, fontSize: 13, fontWeight: '900' },
  activePlanPillText: { color: '#fff' },
  planSummaryCard: {
    marginHorizontal: 18,
    marginTop: 14,
    backgroundColor: palette.ink,
    borderRadius: 26,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  planSummaryLabel: { color: 'rgba(255,255,255,0.60)', fontSize: 11, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.8 },
  planSummaryTitle: { color: '#fff', fontSize: 21, fontWeight: '900', marginTop: 5, maxWidth: 220 },
  creditBadge: { backgroundColor: palette.gold, borderRadius: 18, paddingHorizontal: 14, paddingVertical: 10, alignItems: 'center' },
  creditNumber: { color: palette.red, fontSize: 22, fontWeight: '900' },
  creditLabel: { color: palette.red, fontSize: 10, fontWeight: '900', textTransform: 'uppercase' },
  yearBlock: {
    marginHorizontal: 18,
    marginTop: 24,
  },
  yearTitle: {
    color: palette.ink,
    fontSize: 18,
    fontWeight: '900',
    marginBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: palette.border,
    paddingBottom: 8,
  },
  semesterGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  semesterCard: {
    flex: 1,
    minHeight: 170,
    backgroundColor: palette.cream,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: palette.border,
    padding: 13,
  },
  semesterHeader: {
    marginBottom: 10,
  },
  semesterTitle: {
    color: palette.ink,
    fontSize: 15,
    fontWeight: '900',
  },
  semesterSub: {
    color: palette.muted,
    fontSize: 12,
    marginTop: 3,
    fontWeight: '700',
  },
  emptySemesterBox: {
    minHeight: 76,
    borderRadius: 14,
    backgroundColor: palette.redSoft,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  emptySemesterText: {
    color: palette.muted,
    fontSize: 12,
    textAlign: 'center',
    fontWeight: '700',
  },
  courseChip: {
    paddingVertical: 9,
    borderTopWidth: 1,
    borderTopColor: palette.border,
  },
  courseChipTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  courseChipCode: { color: palette.ink, fontSize: 14, fontWeight: '900' },
  courseChipName: { color: '#4F3A40', fontSize: 12, marginTop: 3, lineHeight: 16 },
  courseChipMeta: { color: palette.muted, fontSize: 11, marginTop: 3, fontWeight: '700' },
  courseBadge: { backgroundColor: '#FFF0C9', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5 },
  courseTakenBadge: { backgroundColor: '#DCFCE7' },
  courseBadgeText: { color: palette.red, fontSize: 11, fontWeight: '900', textTransform: 'uppercase' },
  courseTakenBadgeText: { color: '#166534' },
});

