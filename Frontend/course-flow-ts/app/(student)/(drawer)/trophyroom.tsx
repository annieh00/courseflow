import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../components/ThemeContext';
import { BadgeEntry, BadgeSummary, gamificationAPI } from '../../../services/api';
import BadgeCard from '../../../components/BadgeCard';

const CATEGORIES = ['All', 'Onboarding', 'Academic', 'Scheduling'];

export default function TrophyRoom() {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const [badges, setBadges] = useState<BadgeEntry[]>([]);
  const [summary, setSummary] = useState<BadgeSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedBadge, setSelectedBadge] = useState<BadgeEntry | null>(null);

  const load = useCallback(async () => {
    try {
      const [b, s] = await Promise.all([gamificationAPI.getMyBadges(), gamificationAPI.getSummary()]);
      setBadges(b);
      setSummary(s);
    } catch (e) {
      console.error('Trophy room load error:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const onRefresh = () => { setRefreshing(true); load(); };

  const filtered = selectedCategory === 'All'
    ? badges
    : badges.filter(b => b.category === selectedCategory);

  const earnedCount = badges.filter(b => b.earned).length;

  const levelBarWidth = summary
    ? Math.min(summary.progressToNextLevel, 1)
    : 0;

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={styles.content}
      >
        {/* Hero */}
        <View style={[styles.hero, { backgroundColor: theme.primary }]}>
          <View style={styles.heroOrbA} />
          <View style={styles.heroOrbB} />
          <Text style={styles.heroEyebrow}>CourseFlow</Text>
          <Text style={styles.heroTitle}>Trophy Room</Text>
          <Text style={styles.heroSub}>Earn badges by hitting academic milestones and exploring the app.</Text>
          <View style={styles.heroStats}>
            <View style={styles.heroStat}>
              <Text style={styles.heroStatNum}>{earnedCount}</Text>
              <Text style={styles.heroStatLabel}>Earned</Text>
            </View>
            <View style={[styles.heroStat, styles.heroStatRight]}>
              <Text style={styles.heroStatNum}>{badges.length - earnedCount}</Text>
              <Text style={styles.heroStatLabel}>Locked</Text>
            </View>
          </View>
        </View>

        {/* Level card */}
        {summary && (
          <View style={[styles.levelCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={styles.levelRow}>
              <View>
                <Text style={[styles.levelLabel, { color: theme.textSecondary }]}>Your Rank</Text>
                <Text style={[styles.levelTitle, { color: theme.text }]}>{summary.levelLabel}</Text>
              </View>
              <View style={[styles.levelBadge, { backgroundColor: theme.primary }]}>
                <Text style={styles.levelBadgeNum}>{summary.level}</Text>
              </View>
            </View>
            <View style={[styles.barTrack, { backgroundColor: theme.border }]}>
              <View style={[styles.barFill, { width: `${levelBarWidth * 100}%` as any, backgroundColor: theme.primary }]} />
            </View>
            <Text style={[styles.barHint, { color: theme.textSecondary }]}>
              {summary.totalBadges} / {summary.nextLevelAt} badges to next level
            </Text>
          </View>
        )}

        {/* Category tabs */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabs}>
          {CATEGORIES.map(cat => (
            <TouchableOpacity
              key={cat}
              style={[styles.tab, selectedCategory === cat && { backgroundColor: theme.primary }]}
              onPress={() => setSelectedCategory(cat)}
            >
              <Text style={[styles.tabText, { color: selectedCategory === cat ? '#fff' : theme.text }]}>
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Badge grid */}
        <View style={styles.grid}>
          {filtered.map(badge => (
            <BadgeCard key={badge.key} badge={badge} size="xl" onPress={setSelectedBadge} />
          ))}
        </View>
      </ScrollView>

      {/* Badge detail modal */}
      <Modal transparent visible={Boolean(selectedBadge)} animationType="fade" onRequestClose={() => setSelectedBadge(null)}>
        <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={() => setSelectedBadge(null)}>
          <TouchableOpacity activeOpacity={1} style={[styles.sheet, { backgroundColor: theme.card, borderColor: theme.border }]}>
            {selectedBadge && (
              <>
                <View style={[styles.sheetHandle, { backgroundColor: theme.border }]} />
                <View style={[
                  styles.sheetIcon,
                  { backgroundColor: selectedBadge.earned ? theme.primary : theme.background }
                ]}>
                  <Ionicons
                    name={(selectedBadge.earned ? selectedBadge.icon : 'lock-closed-outline') as keyof typeof Ionicons.glyphMap}
                    size={38}
                    color={selectedBadge.earned ? '#fff' : theme.textSecondary}
                  />
                </View>
                <Text style={[styles.sheetCategory, { color: theme.primary }]}>{selectedBadge.category}</Text>
                <Text style={[styles.sheetName, { color: theme.text }]}>{selectedBadge.name}</Text>
                <Text style={[styles.sheetDesc, { color: theme.textSecondary }]}>{selectedBadge.description}</Text>
                {selectedBadge.earned && selectedBadge.earnedDate && (
                  <View style={[styles.sheetDateRow, { backgroundColor: theme.background, borderColor: theme.border }]}>
                    <Ionicons name="checkmark-circle" size={16} color={theme.primary} />
                    <Text style={[styles.sheetDate, { color: theme.textSecondary }]}>
                      Earned {new Date(selectedBadge.earnedDate).toLocaleDateString()}
                    </Text>
                  </View>
                )}
                {!selectedBadge.earned && (
                  <View style={[styles.sheetDateRow, { backgroundColor: theme.background, borderColor: theme.border }]}>
                    <Ionicons name="lock-closed-outline" size={16} color={theme.textSecondary} />
                    <Text style={[styles.sheetDate, { color: theme.textSecondary }]}>Not yet earned</Text>
                  </View>
                )}
              </>
            )}
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const createStyles = (theme: any) => StyleSheet.create({
  content: { paddingBottom: 40 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  hero: {
    paddingHorizontal: 22,
    paddingTop: 28,
    paddingBottom: 32,
    overflow: 'hidden',
  },
  heroOrbA: {
    position: 'absolute', width: 200, height: 200, borderRadius: 100,
    backgroundColor: 'rgba(255,255,255,0.08)', right: -60, top: -60,
  },
  heroOrbB: {
    position: 'absolute', width: 120, height: 120, borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.06)', left: -30, bottom: 10,
  },
  heroEyebrow: { color: 'rgba(255,255,255,0.7)', fontSize: 11, fontWeight: '900', letterSpacing: 1.2, textTransform: 'uppercase' },
  heroTitle: { color: '#fff', fontSize: 38, fontWeight: '900', marginTop: 6 },
  heroSub: { color: 'rgba(255,255,255,0.8)', fontSize: 14, lineHeight: 20, marginTop: 8, maxWidth: 280 },
  heroStats: { flexDirection: 'row', marginTop: 20 },
  heroStat: { alignItems: 'center', marginRight: 24 },
  heroStatRight: { marginRight: 0 },
  heroStatNum: { color: '#fff', fontSize: 28, fontWeight: '900' },
  heroStatLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 12, fontWeight: '700', textTransform: 'uppercase' },
  levelCard: {
    margin: 16,
    padding: 18,
    borderRadius: 22,
    borderWidth: 1,
  },
  levelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  levelLabel: { fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.8 },
  levelTitle: { fontSize: 20, fontWeight: '900', marginTop: 4 },
  levelBadge: { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  levelBadgeNum: { color: '#fff', fontSize: 22, fontWeight: '900' },
  barTrack: { height: 8, borderRadius: 999, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 999 },
  barHint: { fontSize: 12, fontWeight: '700', marginTop: 8 },
  tabs: { paddingHorizontal: 16, paddingBottom: 4, gap: 8 },
  tab: {
    borderRadius: 999, paddingHorizontal: 16, paddingVertical: 8,
    backgroundColor: 'transparent', borderWidth: 1, borderColor: 'transparent',
  },
  tabText: { fontSize: 13, fontWeight: '800' },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 16,
    marginTop: 8,
  },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet: {
    borderTopLeftRadius: 30, borderTopRightRadius: 30,
    padding: 24, alignItems: 'center',
    borderTopWidth: 1,
  },
  sheetHandle: { width: 44, height: 5, borderRadius: 999, marginBottom: 20 },
  sheetIcon: { width: 80, height: 80, borderRadius: 26, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  sheetCategory: { fontSize: 11, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1 },
  sheetName: { fontSize: 24, fontWeight: '900', marginTop: 6, textAlign: 'center' },
  sheetDesc: { fontSize: 15, textAlign: 'center', marginTop: 10, lineHeight: 22 },
  sheetDateRow: {
    flexDirection: 'row', alignItems: 'center', marginTop: 18,
    borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8,
    borderWidth: 1, gap: 6,
  },
  sheetDate: { fontSize: 13, fontWeight: '700' },
});
