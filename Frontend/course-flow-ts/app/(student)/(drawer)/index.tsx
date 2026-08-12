import { View, Text, StyleSheet, ActivityIndicator, RefreshControl, ScrollView, TouchableOpacity, Image, useWindowDimensions } from "react-native";
import { useTheme } from "../../../components/ThemeContext";
import { useAuth } from "../../../auth/AuthContext";
import PieChart from "../../../components/PieChart";
import ProgressBar from "../../../components/ProgressBar";
import { useState, useEffect, useRef } from "react";
import api, { BadgeEntry, gamificationAPI } from "../../../services/api";
import BadgeCard from "../../../components/BadgeCard";
import BadgeNotification from "../../../components/BadgeNotification";
import Carousel from 'react-native-reanimated-carousel';
import { useRouter } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";

export default function Home() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const { width: windowWidth } = useWindowDimensions();
  const spacing = 0.02;
  
  const [declaredPlans, setDeclaredPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [layoutWidth, setLayoutWidth] = useState(0);
  const [recentBadges, setRecentBadges] = useState<BadgeEntry[]>([]);
  const [pendingNotification, setPendingNotification] = useState<BadgeEntry | null>(null);
  const notificationQueue = useRef<BadgeEntry[]>([]);

  const measuredWidth = layoutWidth || windowWidth;
  const horizontalPadding = measuredWidth < 420 ? 12 : 16;
  const availableWidth = Math.max(measuredWidth - horizontalPadding * 2, 260);
  
  // Update: Removed the 1120px cap so it fills the screen
  const contentWidth = availableWidth; 
  
  const isCompact = contentWidth < 700;
  const panelInnerWidth = Math.max(220, isCompact ? contentWidth - 36 : (contentWidth - 16) / 2 - 36);
  
  // Update: Removed the 420px cap so the carousels expand inside their panels
  const carouselSliderWidth = panelInnerWidth; 

  const checkNotifications = async () => {
    try {
      const notifications = await gamificationAPI.getNotifications();
      if (notifications.length > 0) {
        notificationQueue.current = [...notifications];
        showNextNotification();
      }
    } catch (e) {
      // silent
    }
  };

  const showNextNotification = () => {
    if (notificationQueue.current.length === 0) return;
    const next = notificationQueue.current.shift()!;
    setPendingNotification(next);
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      gamificationAPI.evaluate()
        .then(() => checkNotifications())
        .catch(() => {});

      const [dashRes, badgesRes] = await Promise.all([
        api.get('/user/dashboard'),
        gamificationAPI.getMyBadges().catch(() => [] as BadgeEntry[]),
      ]);

      if (dashRes.data.success) {
        setDeclaredPlans(dashRes.data.data.declaredPlans || []);
      } else {
        setError(dashRes.data.message || 'Failed to fetch dashboard data');
      }

      const earned = badgesRes.filter(b => b.earned);
      setRecentBadges(earned.slice(-3));

      setLoading(false);
      setRefreshing(false);

    } catch (err: any) {
      console.error('Dashboard fetch error:', err);
      setError(err.message || 'Unable to connect to server');
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
  };

  const chartData = declaredPlans.map(plan => ({
    percent: plan.requiredCredits > 0 ? plan.completedCredits / plan.requiredCredits : 0,
    label: plan.programName || plan.programId,
    programId: plan.programId,
    programName: plan.programName,
    degreeType: plan.degreeType,
    completed: plan.completed,
    completedCredits: plan.completedCredits,
    requiredCredits: plan.requiredCredits,
  }));

  const majorsData = chartData.filter(plan => plan.degreeType.toUpperCase() === "MAJOR");
  const minorsData = chartData.filter(plan => plan.degreeType.toUpperCase() === "MINOR");

  const totalProgress = chartData.length > 0
    ? chartData.reduce((sum, chart) => sum + Math.min(chart.percent, 1), 0) / chartData.length
    : 0;
  const completedPrograms = declaredPlans.filter(p => p.completed).length;
  const totalCompletedCredits = chartData.reduce((sum, plan) => sum + plan.completedCredits, 0);
  const totalRequiredCredits = chartData.reduce((sum, plan) => sum + plan.requiredCredits, 0);

  // Dynamically sizes right side of screen depending on declared majors or minors
  const hasMinors = minorsData.length > 0;
  const hasMajors = majorsData.length > 0;
  
  const cardSize = Math.max(190, Math.min(isCompact ? 220 : 250, carouselSliderWidth - 12));
  const chartSize = Math.max(96, Math.min(isCompact ? 116 : 132, cardSize - 96));
  const strokeSize = isCompact ? 14 : 16;
  const percentFontSize = isCompact ? 20 : 22;
  
  // Update: Removed the 940px cap to allow the progress bar to stretch
  const progressWidth = Math.max(180, contentWidth - 36);

  const quickActions = [
    {
      label: "Update Major/Minor",
      icon: "person-circle-outline" as const,
      route: "/profile",
    },
    {
      label: "Plan Semester",
      icon: "calendar-outline" as const,
      route: "/smartscheduler/smartscheduler",
    },
    {
      label: "4-Year Plan",
      icon: "map-outline" as const,
      route: "/courseplanner/courseplanner",
    },
    {
      label: "Degree Requirements",
      icon: "git-network-outline" as const,
      route: "/degreechart",
    },
  ];

  const renderCarouselItem = ({ item }: { item: any }) => {
    const segments = [
      { startAngle: 0, endAngle: 2 * Math.PI, color: "#FFC72C" },
      { 
        startAngle: 0, 
        endAngle: 2 * Math.PI * item.percent - spacing, 
        color: item.completed ? "#4CAF50" : theme.primary 
      },
    ];
    
    return (
      <View style={[
        styles.carouselCard,
        {
          width: cardSize,
          height: cardSize,
          backgroundColor: theme.card,
          borderColor: theme.border,
        },
      ]}>
        <View style={{ width: chartSize, height: chartSize, justifyContent: "center", alignItems: "center" }}>
          <PieChart size={chartSize} strokeWidth={strokeSize} segments={segments} />
          <View style={[StyleSheet.absoluteFillObject, { justifyContent: "center", alignItems: "center" }]} pointerEvents="none">
            <Text style={{ fontSize: percentFontSize, fontWeight: "bold", color: theme.text }}>
              {Math.round(item.percent * 100)}%
            </Text>
          </View>
        </View>
        <Text style={[styles.chartLabel, { color: theme.text }]} numberOfLines={1}>
          {item.label}
        </Text>
        <Text style={[styles.degreeTypeText, { color: theme.primary }]}>
          {item.degreeType}
        </Text>
        <Text style={[styles.creditText, { color: theme.textSecondary }]}>
          {item.completedCredits}/{item.requiredCredits} credits
        </Text>
      </View>
    );
  };

  if (loading) return <View style={[styles.center, { backgroundColor: theme.background }]}><ActivityIndicator color={theme.primary} /></View>;
  if (error) return <View style={[styles.center, { backgroundColor: theme.background }]}><Text style={{ color: theme.text }}>{error}</Text></View>;

  const roleLabel = user?.role === "advisor" ? "Advisor" : user?.role === "admin" ? "Admin" : "Student";
  const greetingName = user?.name || roleLabel;

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <BadgeNotification
        badge={pendingNotification}
        onDone={() => {
          setPendingNotification(null);
          setTimeout(showNextNotification, 400);
        }}
      />
      <ScrollView
        style={[styles.container, { backgroundColor: theme.background }]}
        onLayout={(event) => setLayoutWidth(event.nativeEvent.layout.width)}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingHorizontal: horizontalPadding,
            paddingTop: horizontalPadding,
          },
        ]}
      >
        <View style={[styles.page, { maxWidth: contentWidth }]}>
          <View style={[
            styles.hero,
            {
              backgroundColor: theme.primary,
              flexDirection: isCompact ? "column" : "row",
              alignItems: isCompact ? "flex-start" : "center",
            },
          ]}>
            <View style={styles.heroCopy}>
              <Text style={[styles.eyebrow, { color: theme.background }]}>Student Dashboard</Text>
              <Text style={[styles.greetingText, { color: theme.background }]}>Hi, {greetingName}</Text>
              <Text style={[styles.summaryText, { color: theme.background }]}>
                {completedPrograms} of {declaredPlans.length} programs completed
              </Text>
            </View>
            <Image
              source={require('../../../assets/images/Cy_Logo.png')}
              style={[styles.logo, isCompact && styles.logoCompact]}
              resizeMode="contain"
            />
          </View>

          <View style={styles.statsRow}>
            <View style={[
              styles.statCard,
              {
                backgroundColor: theme.card,
                borderColor: theme.border,
                minWidth: isCompact ? 0 : 150,
                width: isCompact ? "100%" : undefined,
              },
            ]}>
              <Ionicons name="school-outline" size={20} color={theme.primary} />
              <Text style={[styles.statValue, { color: theme.text }]}>{declaredPlans.length}</Text>
              <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Programs</Text>
            </View>
            <View style={[
              styles.statCard,
              {
                backgroundColor: theme.card,
                borderColor: theme.border,
                minWidth: isCompact ? 0 : 150,
                width: isCompact ? "100%" : undefined,
              },
            ]}>
              <Ionicons name="checkmark-circle-outline" size={20} color={theme.primary} />
              <Text style={[styles.statValue, { color: theme.text }]}>{Math.round(totalProgress * 100)}%</Text>
              <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Overall</Text>
            </View>
            <View style={[
              styles.statCard,
              {
                backgroundColor: theme.card,
                borderColor: theme.border,
                minWidth: isCompact ? 0 : 150,
                width: isCompact ? "100%" : undefined,
              },
            ]}>
              <Ionicons name="ribbon-outline" size={20} color={theme.primary} />
              <Text style={[styles.statValue, { color: theme.text }]}>{totalCompletedCredits}</Text>
              <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Credits Earned</Text>
            </View>
          </View>

          <View style={[styles.progressPanel, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={styles.sectionHeader}>
              <View>
                <Text style={[styles.sectionTitle, { color: theme.text }]}>Degree Progress</Text>
                <Text style={[styles.sectionSubtitle, { color: theme.textSecondary }]}>
                  {totalCompletedCredits}/{totalRequiredCredits} credits completed
                </Text>
              </View>
              <Text style={[styles.progressPercent, { color: theme.primary }]}>
                {Math.round(totalProgress * 100)}%
              </Text>
            </View>
            <ProgressBar
              progress={totalProgress}
              width={progressWidth}
              height={18}
              completedColor={theme.primary}
              remainingColor="#FFC72C"
              showPercentage={false}
            />
          </View>

          <View style={styles.dashboardGrid}>
            <View style={[
              styles.panel,
              {
                backgroundColor: theme.card,
                borderColor: theme.border,
                minWidth: isCompact ? 0 : 310,
                width: isCompact ? "100%" : undefined,
              },
            ]}>
              <View style={styles.sectionHeader}>
                <View>
                  <Text style={[styles.sectionTitle, { color: theme.text }]}>Quick Actions</Text>
                  <Text style={[styles.sectionSubtitle, { color: theme.textSecondary }]}>Jump back into planning</Text>
                </View>
              </View>
              <View style={styles.actionGrid}>
                {quickActions.map((action) => (
                  <TouchableOpacity
                    key={action.label}
                    style={[styles.actionTile, { backgroundColor: theme.background, borderColor: theme.border }]}
                    onPress={() => router.push(action.route as any)}
                  >
                    <View style={[styles.actionIcon, { backgroundColor: `${theme.primary}18` }]}>
                      <Ionicons name={action.icon} size={20} color={theme.primary} />
                    </View>
                    <Text style={[styles.actionText, { color: theme.text }]}>{action.label}</Text>
                    <Ionicons name="chevron-forward" size={16} color={theme.textSecondary} />
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={[
              styles.panel,
              {
                backgroundColor: theme.card,
                borderColor: theme.border,
                minWidth: isCompact ? 0 : 310,
                width: isCompact ? "100%" : undefined,
              },
            ]}>
              <View style={styles.sectionHeader}>
                <View>
                  <Text style={[styles.sectionTitle, { color: theme.text }]}>Declared Programs</Text>
                  <Text style={[styles.sectionSubtitle, { color: theme.textSecondary }]}>Majors and minors at a glance</Text>
                </View>
              </View>

              {declaredPlans.length === 0 ? (
                <View style={styles.emptyState}>
                  <Ionicons name="albums-outline" size={30} color={theme.textSecondary} />
                  <Text style={[styles.emptyText, { color: theme.textSecondary }]}>No plans declared yet.</Text>
                </View>
              ) : (
                <>
                  {hasMajors ? (
                    <>
                      <Text style={[styles.carouselTitle, { color: theme.text }]}>Majors</Text>
                      <Carousel
                        loop={false}
                        width={cardSize + 12}
                        height={cardSize + 4}
                        data={majorsData}
                        renderItem={renderCarouselItem}
                        style={{ width: carouselSliderWidth }}
                      />
                    </>
                  ) : (
                    <Text style={[styles.fallbackText, { color: theme.textSecondary }]}>No declared major</Text>
                  )}

                  {hasMinors && (
                    <>
                      <Text style={[styles.carouselTitle, { color: theme.text, marginTop: 18 }]}>Minors</Text>
                      <Carousel
                        loop={false}
                        width={cardSize + 12}
                        height={cardSize + 4}
                        data={minorsData}
                        renderItem={renderCarouselItem}
                        style={{ width: carouselSliderWidth }}
                      />
                    </>
                  )}
                </>
              )}
            </View>
          </View>

          {/* Badge Widget */}
          <View style={[styles.badgeWidget, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={styles.badgeWidgetHeader}>
              <View>
                <Text style={[styles.badgeWidgetTitle, { color: theme.text }]}>Recent Badges</Text>
                <Text style={[styles.badgeWidgetSubtitle, { color: theme.textSecondary }]}>
                  Complete milestones to earn more!
                </Text>
              </View>
              <TouchableOpacity 
                style={styles.viewAllButton}
                onPress={() => router.push('/trophyroom')}
              >
                <Text style={[styles.badgeWidgetLink, { color: theme.primary }]}>View All</Text>
                <Ionicons name="arrow-forward" size={14} color={theme.primary} />
              </TouchableOpacity>
            </View>
            {recentBadges.length === 0 ? (
              <View style={styles.badgeWidgetEmpty}>
                <Ionicons name="trophy-outline" size={40} color={theme.textSecondary} />
                <Text style={[styles.badgeWidgetEmptyText, { color: theme.textSecondary }]}>
                  No badges yet. Complete programs to earn badges!
                </Text>
              </View>
            ) : (
              <View style={styles.badgeWidgetRow}>
                {recentBadges.map(b => (
                  <BadgeCard key={b.key} badge={b} size="small" onPress={() => router.push('/trophyroom')} />
                ))}
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
    alignItems: "center",
  },
  page: {
    width: "100%",
    gap: 16,
    overflow: "hidden",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  hero: {
    width: "100%",
    minHeight: 170,
    borderRadius: 8,
    padding: 22,
    overflow: "hidden",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  heroCopy: {
    flex: 1,
    paddingRight: 12,
  },
  eyebrow: {
    fontSize: 12,
    fontWeight: "800",
    opacity: 0.82,
    textTransform: "uppercase",
    marginBottom: 10,
  },
  greetingText: {
    fontSize: 32,
    fontWeight: "800",
    lineHeight: 38,
  },
  summaryText: {
    fontSize: 15,
    marginTop: 8,
    opacity: 0.88,
  },
  logo: {
    width: 118,
    height: 118,
    opacity: 0.95,
  },
  logoCompact: {
    width: 82,
    height: 82,
    marginTop: 14,
    alignSelf: "flex-end",
  },
  statsRow: {
    width: "100%",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: 150,
    borderWidth: 1,
    borderRadius: 8,
    padding: 16,
    gap: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: "800",
  },
  statLabel: {
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  progressPanel: {
    width: "100%",
    borderWidth: 1,
    borderRadius: 8,
    padding: 18,
    gap: 14,
  },
  dashboardGrid: {
    width: "100%",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
    alignItems: "flex-start",
  },
  panel: {
    flex: 1,
    maxWidth: "100%",
    minWidth: 310,
    borderWidth: 1,
    borderRadius: 8,
    padding: 18,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
  },
  sectionSubtitle: {
    fontSize: 13,
    marginTop: 3,
  },
  actionGrid: {
    gap: 10,
  },
  actionTile: {
    minHeight: 58,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  actionIcon: {
    width: 38,
    height: 38,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  actionText: {
    flex: 1,
    fontSize: 14,
    fontWeight: "700",
  },
  carouselTitle: {
    fontSize: 13,
    fontWeight: "800",
    textTransform: "uppercase",
    marginBottom: 10,
  },
  carouselCard: {
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 5,
  },
  chartLabel: {
    marginTop: 14,
    fontSize: 17,
    fontWeight: "800",
    textAlign: "center",
  },
  degreeTypeText: {
    marginTop: 3,
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  creditText: {
    marginTop: 6,
    fontSize: 12,
    fontWeight: "600",
  },
  fallbackText: {
    fontSize: 14,
    paddingVertical: 18,
  },
  progressPercent: {
    fontSize: 22,
    fontWeight: "800",
  },
  emptyState: {
    minHeight: 170,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  emptyText: {
    fontSize: 14,
    textAlign: "center",
  },
  // Badge Widget Styles
  badgeWidget: {
    width: "100%",
    borderWidth: 1,
    borderRadius: 8,
    padding: 18,
    marginTop: 8,
  },
  badgeWidgetHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  badgeWidgetTitle: {
    fontSize: 18,
    fontWeight: "800",
  },
  badgeWidgetSubtitle: {
    fontSize: 13,
    marginTop: 3,
  },
  viewAllButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
  },
  badgeWidgetLink: {
    fontSize: 13,
    fontWeight: "700",
  },
  badgeWidgetEmpty: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 32,
    gap: 12,
  },
  badgeWidgetEmptyText: {
    fontSize: 14,
    textAlign: "center",
  },
  badgeWidgetRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    justifyContent: "flex-start",
  },
});