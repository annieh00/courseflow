import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  FlatList, ActivityIndicator, Modal, ScrollView, Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '../auth/AuthContext';
import api from '../services/api';
import {
  GraduationCap, BookOpen, Calendar, Check, Search, X, Shield,
} from 'lucide-react-native';

const THEME = '#C8102E';
const THEME_LIGHT = '#FFF0F0';
const CURRENT_YEAR = new Date().getFullYear();
const GRAD_YEARS = Array.from({ length: 7 }, (_, i) => String(CURRENT_YEAR + i));

interface DegreeOption {
  id: string;
  name: string;
  type: 'MAJOR' | 'MINOR';
}

export default function OnboardingScreen() {
  const router = useRouter();
  const { logout, user, completeOnboarding } = useAuth();

  const [step, setStep] = useState(0); // 0=welcome 1=majors 2=minors 3=year
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingPrograms, setIsLoadingPrograms] = useState(true);

  const [availableMajors, setAvailableMajors] = useState<DegreeOption[]>([]);
  const [availableMinors, setAvailableMinors] = useState<DegreeOption[]>([]);
  const [selectedMajors, setSelectedMajors] = useState<string[]>([]);
  const [selectedMinors, setSelectedMinors] = useState<string[]>([]);
  const [gradYear, setGradYear] = useState('');
  const [profileVisible, setProfileVisible] = useState(true);

  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerType, setPickerType] = useState<'major' | 'minor'>('major');
  const [searchText, setSearchText] = useState('');
  const [formError, setFormError] = useState('');

  const firstName = user?.name ? user.name.split(' ')[0] : 'Student';

  useEffect(() => {
    api.get<DegreeOption[]>('/degree/available')
      .then(res => {
        setAvailableMajors(res.data.filter(d => d.type === 'MAJOR'));
        setAvailableMinors(res.data.filter(d => d.type === 'MINOR'));
      })
      .catch(console.error)
      .finally(() => setIsLoadingPrograms(false));
  }, []);

  const handleLogout = async () => {
    await logout();
    router.replace('/login');
  };

  const handleNext = () => {
    if (step === 1 && selectedMajors.length === 0) {
      setFormError('Please select at least one major.');
      return;
    }
    setFormError('');
    setStep(s => s + 1);
  };

  const handleSubmit = async () => {
    if (!gradYear) {
      setFormError('Please select a graduation year.');
      return;
    }
    setIsLoading(true);
    setFormError('');
    try {
      await api.post('/auth/onboard', {
        majors: selectedMajors,
        minors: selectedMinors,
        graduationYear: gradYear,
      });
      if (user?.userId) {
        await api.patch(`/settings/${user.userId}`, { profileVisible }).catch(() => {});
      }
      await completeOnboarding();
    } catch {
      setFormError('Failed to save. Please check your connection.');
    } finally {
      setIsLoading(false);
    }
  };

  const openPicker = (type: 'major' | 'minor') => {
    setPickerType(type);
    setSearchText('');
    setPickerOpen(true);
  };

  const toggleItem = (id: string) => {
    if (pickerType === 'major') {
      setSelectedMajors(prev =>
        prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
      );
    } else {
      setSelectedMinors(prev =>
        prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
      );
    }
  };

  const getNameForId = (id: string, type: 'major' | 'minor') => {
    const list = type === 'major' ? availableMajors : availableMinors;
    return list.find(d => d.id === id)?.name ?? id;
  };

  const pickerItems = pickerType === 'major' ? availableMajors : availableMinors;
  const pickerSelected = pickerType === 'major' ? selectedMajors : selectedMinors;
  const filtered = pickerItems.filter(d =>
    d.name.toLowerCase().includes(searchText.toLowerCase())
  );

  const renderCard = () => {
    if (step === 0) {
      return (
        <>
          <View style={styles.iconContainer}>
            <GraduationCap size={48} color={THEME} strokeWidth={1.5} />
          </View>
          <Text style={styles.cardTitle}>Welcome to CourseFlow!</Text>
          <Text style={styles.cardSubtitle}>
            Hi {firstName}! Let's set up your academic profile so we can personalize your degree experience.
          </Text>
          <TouchableOpacity style={styles.primaryBtn} onPress={() => setStep(1)}>
            <Text style={styles.primaryBtnText}>Get Started →</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleLogout}>
            <Text style={styles.logoutLink}>Log out</Text>
          </TouchableOpacity>
        </>
      );
    }

    if (step === 1) {
      return (
        <>
          <View style={styles.iconContainer}>
            <BookOpen size={40} color={THEME} strokeWidth={1.5} />
          </View>
          <Text style={styles.cardTitle}>What's your major?</Text>
          <Text style={styles.cardSubtitle}>Select all that apply. You can update this later in your profile.</Text>

          {selectedMajors.length > 0 && (
            <View style={styles.chipsRow}>
              {selectedMajors.map(id => (
                <View key={id} style={styles.chip}>
                  <Text style={styles.chipText}>{getNameForId(id, 'major')}</Text>
                  <TouchableOpacity
                    onPress={() => setSelectedMajors(prev => prev.filter(x => x !== id))}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <X size={12} color={THEME} strokeWidth={2.5} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}

          <TouchableOpacity
            style={[styles.pickerBtn, isLoadingPrograms && styles.disabledBtn]}
            onPress={() => openPicker('major')}
            disabled={isLoadingPrograms}
          >
            {isLoadingPrograms ? (
              <ActivityIndicator size="small" color={THEME} />
            ) : (
              <Text style={styles.pickerBtnText}>
                {selectedMajors.length === 0 ? '+ Choose major(s)' : '+ Add another major'}
              </Text>
            )}
          </TouchableOpacity>

          {formError ? <Text style={styles.errorText}>{formError}</Text> : null}

          <View style={styles.actions}>
            <TouchableOpacity style={styles.backBtn} onPress={() => { setFormError(''); setStep(0); }}>
              <Text style={styles.backBtnText}>← Back</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.nextBtn} onPress={handleNext}>
              <Text style={styles.nextBtnText}>Next →</Text>
            </TouchableOpacity>
          </View>
        </>
      );
    }

    if (step === 2) {
      return (
        <>
          <View style={[styles.iconContainer, { backgroundColor: '#F8FAFC' }]}>
            <BookOpen size={40} color="#64748B" strokeWidth={1.5} />
          </View>
          <Text style={styles.cardTitle}>Any minors?</Text>
          <Text style={styles.cardSubtitle}>Optional — you can always add or remove minors later from your profile.</Text>

          {selectedMinors.length > 0 && (
            <View style={styles.chipsRow}>
              {selectedMinors.map(id => (
                <View key={id} style={styles.chip}>
                  <Text style={styles.chipText}>{getNameForId(id, 'minor')}</Text>
                  <TouchableOpacity
                    onPress={() => setSelectedMinors(prev => prev.filter(x => x !== id))}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <X size={12} color={THEME} strokeWidth={2.5} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}

          <TouchableOpacity
            style={[styles.pickerBtn, isLoadingPrograms && styles.disabledBtn]}
            onPress={() => openPicker('minor')}
            disabled={isLoadingPrograms}
          >
            {isLoadingPrograms ? (
              <ActivityIndicator size="small" color={THEME} />
            ) : (
              <Text style={styles.pickerBtnText}>
                {selectedMinors.length === 0 ? '+ Choose minor(s)' : '+ Add another minor'}
              </Text>
            )}
          </TouchableOpacity>

          <View style={styles.actions}>
            <TouchableOpacity style={styles.backBtn} onPress={() => setStep(1)}>
              <Text style={styles.backBtnText}>← Back</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.nextBtn} onPress={() => { setFormError(''); setStep(3); }}>
              <Text style={styles.nextBtnText}>
                {selectedMinors.length === 0 ? 'Skip →' : 'Next →'}
              </Text>
            </TouchableOpacity>
          </View>
        </>
      );
    }

    if (step === 3) {
      return (
        <>
          <View style={styles.iconContainer}>
            <Calendar size={40} color={THEME} strokeWidth={1.5} />
          </View>
          <Text style={styles.cardTitle}>When do you graduate?</Text>
          <Text style={styles.cardSubtitle}>Select your expected graduation year.</Text>

          <View style={styles.yearGrid}>
            {GRAD_YEARS.map(yr => (
              <TouchableOpacity
                key={yr}
                style={[styles.yearBtn, gradYear === yr && styles.yearBtnSelected]}
                onPress={() => { setGradYear(yr); setFormError(''); }}
              >
                <Text style={[styles.yearBtnText, gradYear === yr && styles.yearBtnTextSelected]}>
                  {yr}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {formError ? <Text style={styles.errorText}>{formError}</Text> : null}

          <View style={styles.actions}>
            <TouchableOpacity style={styles.backBtn} onPress={() => setStep(2)}>
              <Text style={styles.backBtnText}>← Back</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.nextBtn, !gradYear && styles.disabledBtn]}
              onPress={() => { setFormError(''); setStep(4); }}
              disabled={!gradYear}
            >
              <Text style={styles.nextBtnText}>Next →</Text>
            </TouchableOpacity>
          </View>
        </>
      );
    }

    if (step === 4) {
      return (
        <>
          <View style={styles.iconContainer}>
            <Shield size={40} color={THEME} strokeWidth={1.5} />
          </View>
          <Text style={styles.cardTitle}>Privacy</Text>
          <Text style={styles.cardSubtitle}>
            Control who can see your profile. You can change this anytime in Settings.
          </Text>

          <View style={styles.visibilityRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.visibilityLabel}>Public Profile</Text>
              <Text style={styles.visibilitySubtext}>
                {profileVisible
                  ? 'Other students can find and view your profile.'
                  : 'Your profile is hidden from other students.'}
              </Text>
            </View>
            <Switch
              value={profileVisible}
              onValueChange={setProfileVisible}
              trackColor={{ false: '#E2E8F0', true: THEME }}
              thumbColor="#fff"
            />
          </View>

          {formError ? <Text style={styles.errorText}>{formError}</Text> : null}

          <View style={styles.actions}>
            <TouchableOpacity style={styles.backBtn} onPress={() => setStep(3)}>
              <Text style={styles.backBtnText}>← Back</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.nextBtn, isLoading && styles.disabledBtn]}
              onPress={handleSubmit}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.nextBtnText}>Complete Setup</Text>
              )}
            </TouchableOpacity>
          </View>
        </>
      );
    }

    return null;
  };

  return (
    <View style={styles.screen}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={styles.center}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.card}>
            {renderCard()}

            {step > 0 && (
              <View style={styles.dots}>
                {[1, 2, 3, 4].map(i => (
                  <View key={i} style={[styles.dot, i === step && styles.dotActive]} />
                ))}
              </View>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>

      {/* Picker bottom sheet */}
      <Modal visible={pickerOpen} transparent animationType="slide">
        <View style={styles.pickerOverlay}>
          <View style={styles.pickerSheet}>
            <View style={styles.pickerHeader}>
              <Text style={styles.pickerTitle}>
                Select {pickerType === 'major' ? 'Major(s)' : 'Minor(s)'}
              </Text>
              <TouchableOpacity onPress={() => setPickerOpen(false)}>
                <Text style={styles.pickerDone}>Done</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.searchContainer}>
              <Search size={16} color="#94A3B8" strokeWidth={2} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search..."
                placeholderTextColor="#94A3B8"
                value={searchText}
                onChangeText={setSearchText}
                autoFocus
              />
            </View>

            <FlatList
              data={filtered}
              keyExtractor={item => item.id}
              renderItem={({ item }) => {
                const isSelected = pickerSelected.includes(item.id);
                return (
                  <TouchableOpacity
                    style={[styles.pickerItem, isSelected && styles.pickerItemSelected]}
                    onPress={() => toggleItem(item.id)}
                  >
                    <Text style={[styles.pickerItemText, isSelected && styles.pickerItemTextSelected]}>
                      {item.name}
                    </Text>
                    {isSelected && <Check size={18} color={THEME} strokeWidth={2.5} />}
                  </TouchableOpacity>
                );
              }}
              keyboardShouldPersistTaps="handled"
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#0F172A' },
  safeArea: { flex: 1 },
  center: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    paddingVertical: 40,
  },

  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 28,
    width: '100%',
    maxWidth: 420,
    alignItems: 'center',
    gap: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.3,
    shadowRadius: 24,
    elevation: 10,
  },

  iconContainer: {
    backgroundColor: THEME_LIGHT,
    padding: 20,
    borderRadius: 20,
    marginBottom: 4,
  },
  cardTitle: { fontSize: 22, fontWeight: '700', color: '#1E293B', textAlign: 'center' },
  cardSubtitle: { fontSize: 14, color: '#64748B', textAlign: 'center', lineHeight: 21 },

  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, width: '100%' },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: THEME_LIGHT, borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 7,
    borderWidth: 1, borderColor: '#FECACA',
  },
  chipText: { fontSize: 13, color: THEME, fontWeight: '600' },

  pickerBtn: {
    width: '100%', borderWidth: 1.5, borderColor: THEME, borderStyle: 'dashed',
    borderRadius: 12, paddingVertical: 14, alignItems: 'center',
  },
  pickerBtnText: { color: THEME, fontSize: 14, fontWeight: '600' },

  disabledBtn: { opacity: 0.45 },

  errorText: {
    color: '#DC2626', fontSize: 13, textAlign: 'center',
    backgroundColor: '#FEF2F2', padding: 10, borderRadius: 10, width: '100%',
  },

  actions: { flexDirection: 'row', gap: 10, width: '100%' },
  backBtn: {
    flex: 1, paddingVertical: 14, borderRadius: 12,
    borderWidth: 1, borderColor: '#E2E8F0', alignItems: 'center',
  },
  backBtnText: { fontSize: 14, color: '#64748B', fontWeight: '500' },
  nextBtn: { flex: 1, backgroundColor: THEME, borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  nextBtnText: { fontSize: 14, color: '#FFFFFF', fontWeight: '700' },

  primaryBtn: {
    width: '100%', backgroundColor: THEME, borderRadius: 12,
    paddingVertical: 16, alignItems: 'center',
  },
  primaryBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },

  yearGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 10,
    width: '100%', justifyContent: 'center',
  },
  yearBtn: {
    paddingHorizontal: 20, paddingVertical: 13, borderRadius: 12,
    borderWidth: 1, borderColor: '#E2E8F0', backgroundColor: '#F8FAFC',
    minWidth: 90, alignItems: 'center',
  },
  yearBtnSelected: { backgroundColor: THEME, borderColor: THEME },
  yearBtnText: { fontSize: 15, color: '#475569', fontWeight: '600' },
  yearBtnTextSelected: { color: '#FFFFFF' },

  dots: { flexDirection: 'row', gap: 8, marginTop: 6 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#E2E8F0' },
  dotActive: { width: 24, backgroundColor: THEME },

  logoutLink: { fontSize: 13, color: '#94A3B8', marginTop: -4 },

  visibilityRow: {
    flexDirection: 'row', alignItems: 'center', width: '100%',
    backgroundColor: '#F8FAFC', borderRadius: 14, padding: 16,
    borderWidth: 1, borderColor: '#E2E8F0', gap: 12,
  },
  visibilityLabel: { fontSize: 15, fontWeight: '700', color: '#1E293B', marginBottom: 4 },
  visibilitySubtext: { fontSize: 13, color: '#64748B', lineHeight: 18 },

  // Picker bottom sheet
  pickerOverlay: {
    flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.55)', justifyContent: 'flex-end',
  },
  pickerSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    maxHeight: '72%',
    paddingBottom: 24,
  },
  pickerHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 20, borderBottomWidth: 1, borderBottomColor: '#F1F5F9',
  },
  pickerTitle: { fontSize: 18, fontWeight: '700', color: '#1E293B' },
  pickerDone: { color: THEME, fontSize: 16, fontWeight: '600' },
  searchContainer: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#F8FAFC', borderRadius: 12,
    paddingHorizontal: 14, margin: 16, marginBottom: 8,
    borderWidth: 1, borderColor: '#E2E8F0',
  },
  searchInput: { flex: 1, fontSize: 15, color: '#1E293B', paddingVertical: 12 },
  pickerItem: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 16,
    borderBottomWidth: 1, borderBottomColor: '#F1F5F9',
  },
  pickerItemSelected: { backgroundColor: THEME_LIGHT },
  pickerItemText: { fontSize: 15, color: '#1E293B', flex: 1 },
  pickerItemTextSelected: { color: THEME, fontWeight: '600' },
});
