import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme, lightTheme, darkTheme } from '../../../components/ThemeContext';
import { useAuth } from '../../../auth/AuthContext';
import api from '../../../services/api';

const ABOUT_URL = 'https://sdmay26-48.sd.ece.iastate.edu/';

export default function SettingsScreen() {
  const { isDarkMode, toggleDarkMode } = useTheme();
  const [profileVisibility, setProfileVisibility] = useState(true);
  const theme = isDarkMode ? darkTheme : lightTheme;
  const { user, logout } = useAuth();
  const router = useRouter();

  const initials = user?.name
    ? user.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
    : '?';

  const roleLabel =
    user?.role === 'advisor' ? 'Advisor' :
    user?.role === 'admin'   ? 'Admin'   : 'Student';

  useEffect(() => {
    if (!user?.userId) return;
    api.get(`/settings/${user.userId}`)
      .then(res => {
        if (res.data.profileVisible !== undefined) setProfileVisibility(res.data.profileVisible);
      })
      .catch(() => {});
  }, [user?.userId]);

  const patchSetting = (key: string, value: boolean) => {
    if (!user?.userId) return;
    api.patch(`/settings/${user.userId}`, { [key]: value }).catch(() => {});
  };

  const handleLogout = async () => {
    await logout();
    router.replace('/login');
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]} contentContainerStyle={styles.content}>

      {/* Hero */}
      <View style={[styles.hero, { backgroundColor: theme.primary }]}>
        <View style={styles.heroOrb} />
        <View style={styles.heroOrbSmall} />
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
        <Text style={styles.heroName}>{user?.name ?? 'Student'}</Text>
        <Text style={styles.heroEmail}>{user?.email ?? ''}</Text>
        <View style={styles.roleBadge}>
          <Text style={styles.roleBadgeText}>{roleLabel}</Text>
        </View>
      </View>

      {/* APPEARANCE */}
      <View style={styles.sectionLabel}>
        <Text style={[styles.sectionLabelText, { color: theme.textSecondary }]}>APPEARANCE</Text>
      </View>
      <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <View style={styles.row}>
          <View style={[styles.iconWrap, { backgroundColor: isDarkMode ? '#2C2C2E' : '#F0E6F6' }]}>
            <Ionicons name="moon-outline" size={18} color={theme.primary} />
          </View>
          <Text style={[styles.rowLabel, { color: theme.text }]}>Dark Mode</Text>
          <Switch
            value={isDarkMode}
            onValueChange={toggleDarkMode}
            trackColor={{ false: theme.border, true: theme.primary }}
            thumbColor="#fff"
          />
        </View>
      </View>

      {/* ACCOUNT */}
      <View style={styles.sectionLabel}>
        <Text style={[styles.sectionLabelText, { color: theme.textSecondary }]}>ACCOUNT</Text>
      </View>
      <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <View style={[styles.row, styles.rowBorder, { borderColor: theme.border }]}>
          <View style={[styles.iconWrap, { backgroundColor: isDarkMode ? '#2C2C2E' : '#FFF0F0' }]}>
            <Ionicons name="person-outline" size={18} color={theme.primary} />
          </View>
          <View style={styles.rowInfo}>
            <Text style={[styles.rowMeta, { color: theme.textSecondary }]}>Name</Text>
            <Text style={[styles.rowLabel, { color: theme.text }]}>{user?.name ?? '—'}</Text>
          </View>
        </View>
        <View style={[styles.row, styles.rowBorder, { borderColor: theme.border }]}>
          <View style={[styles.iconWrap, { backgroundColor: isDarkMode ? '#2C2C2E' : '#FFF0F0' }]}>
            <Ionicons name="mail-outline" size={18} color={theme.primary} />
          </View>
          <View style={styles.rowInfo}>
            <Text style={[styles.rowMeta, { color: theme.textSecondary }]}>Email</Text>
            <Text style={[styles.rowLabel, { color: theme.text }]}>{user?.email ?? '—'}</Text>
          </View>
        </View>
        <View style={styles.ssoNote}>
          <Ionicons name="logo-google" size={13} color={theme.textSecondary} />
          <Text style={[styles.ssoNoteText, { color: theme.textSecondary }]}>
            Account info is managed by Google SSO and cannot be edited here. Contact Information Technology Services to request a change.
          </Text>
        </View>
      </View>

      {/* PRIVACY */}
      <View style={styles.sectionLabel}>
        <Text style={[styles.sectionLabelText, { color: theme.textSecondary }]}>PRIVACY</Text>
      </View>
      <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <View style={styles.row}>
          <View style={[styles.iconWrap, { backgroundColor: isDarkMode ? '#2C2C2E' : '#FFF0F0' }]}>
            <Ionicons name="eye-outline" size={18} color={theme.primary} />
          </View>
          <View style={styles.rowInfo}>
            <Text style={[styles.rowLabel, { color: theme.text }]}>Public Profile</Text>
            <Text style={[styles.rowMeta, { color: theme.textSecondary }]}>
              {profileVisibility ? 'Visible to other students' : 'Hidden from other students'}
            </Text>
          </View>
          <Switch
            value={profileVisibility}
            onValueChange={(v) => { setProfileVisibility(v); patchSetting('profileVisible', v); }}
            trackColor={{ false: theme.border, true: theme.primary }}
            thumbColor="#fff"
          />
        </View>
      </View>

      {/* ABOUT */}
      <View style={styles.sectionLabel}>
        <Text style={[styles.sectionLabelText, { color: theme.textSecondary }]}>ABOUT</Text>
      </View>
      <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <TouchableOpacity
          style={[styles.row, styles.rowBorder, { borderColor: theme.border }]}
          onPress={() => Linking.openURL(ABOUT_URL)}
          activeOpacity={0.7}
        >
          <View style={[styles.iconWrap, { backgroundColor: isDarkMode ? '#2C2C2E' : '#FFF0F0' }]}>
            <Ionicons name="globe-outline" size={18} color={theme.primary} />
          </View>
          <Text style={[styles.rowLabel, { color: theme.text }]}>About CourseFlow</Text>
          <Ionicons name="open-outline" size={17} color={theme.textSecondary} />
        </TouchableOpacity>
        <View style={styles.row}>
          <View style={[styles.iconWrap, { backgroundColor: isDarkMode ? '#2C2C2E' : '#FFF0F0' }]}>
            <Ionicons name="information-circle-outline" size={18} color={theme.primary} />
          </View>
          <Text style={[styles.rowLabel, { color: theme.text }]}>App Version</Text>
          <Text style={[styles.rowValue, { color: theme.textSecondary }]}>1.0.0</Text>
        </View>
      </View>

      {/* LOGOUT */}
      <TouchableOpacity
        style={[styles.logoutButton, { borderColor: theme.danger }]}
        onPress={handleLogout}
        activeOpacity={0.8}
      >
        <Ionicons name="log-out-outline" size={20} color={theme.danger} />
        <Text style={[styles.logoutText, { color: theme.danger }]}>Log Out</Text>
      </TouchableOpacity>

      <View style={styles.footer} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingBottom: 40 },

  hero: {
    alignItems: 'center',
    paddingTop: 48,
    paddingBottom: 36,
    paddingHorizontal: 24,
    overflow: 'hidden',
  },
  heroOrb: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(255,255,255,0.08)',
    top: -80,
    right: -60,
  },
  heroOrbSmall: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.06)',
    bottom: -30,
    left: -30,
  },
  avatarCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  avatarText: {
    color: '#fff',
    fontSize: 30,
    fontWeight: '800',
    letterSpacing: 1,
  },
  heroName: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '800',
    textAlign: 'center',
  },
  heroEmail: {
    color: 'rgba(255,255,255,0.72)',
    fontSize: 14,
    marginTop: 4,
    textAlign: 'center',
  },
  roleBadge: {
    marginTop: 12,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.30)',
  },
  roleBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },

  sectionLabel: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 8,
  },
  sectionLabelText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.8,
  },

  card: {
    marginHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 12,
  },
  rowBorder: {
    borderBottomWidth: 1,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowInfo: {
    flex: 1,
    gap: 2,
  },
  rowLabel: {
    fontSize: 15,
    fontWeight: '600',
    flex: 1,
  },
  rowMeta: {
    fontSize: 12,
    fontWeight: '500',
  },
  rowValue: {
    fontSize: 15,
    fontWeight: '500',
  },

  ssoNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  ssoNoteText: {
    fontSize: 12,
    flex: 1,
    lineHeight: 17,
  },

  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 16,
    marginTop: 28,
    paddingVertical: 15,
    borderRadius: 16,
    borderWidth: 1.5,
    gap: 8,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '700',
  },
  footer: { height: 20 },
});
