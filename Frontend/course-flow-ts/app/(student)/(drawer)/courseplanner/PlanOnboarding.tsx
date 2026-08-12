"use client";

import React, { useState } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, Modal, TextInput, Dimensions, ScrollView, ActivityIndicator, Alert 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GraduationCap, Plus, ChevronLeft, X, ChevronDown } from "lucide-react-native";
import { useAuth } from "../../../../auth/AuthContext";

const { width } = Dimensions.get('window');

interface OnboardingProps {
  theme: any;
  onPlanCreated: (details: any) => void;
}

export const PlanOnboarding = ({ theme, onPlanCreated }: OnboardingProps) => {
  const [showCreateModal, setShowCreateModal] = useState(false);

  return (
    <SafeAreaView style={[styles.mainContainer, { backgroundColor: theme.background }]}>
      <View style={styles.welcomeContainer}>
        <View style={[styles.iconCircle, { backgroundColor: theme.primary + '20' }]}>
          <GraduationCap size={48} color={theme.primary} />
        </View>

        <Text style={[styles.title, { color: theme.text, textAlign: 'center' }]}>
          Academic Plan Builder
        </Text>

        <Text style={[styles.subtitle, { color: theme.textSecondary, textAlign: 'center' }]}>
          Create your personalized multi-year academic plan to stay on track.
        </Text>

        <TouchableOpacity 
          style={[styles.primaryButton, { backgroundColor: theme.primary }]}
          onPress={() => setShowCreateModal(true)}
        >
          <Plus size={20} color="#fff" />
          <Text style={styles.primaryButtonText}>Create Plan Now</Text>
        </TouchableOpacity>
      </View>

      <CreatePlanModal 
        visible={showCreateModal} 
        onClose={() => setShowCreateModal(false)}
        onConfirm={(details: any) => {
          setShowCreateModal(false);
          onPlanCreated(details);
        }}
        theme={theme}
      />
    </SafeAreaView>
  );
};

function CreatePlanModal({ visible, onClose, onConfirm, theme }: any) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [planName, setPlanName] = useState('');

  const handleCreate = async () => {
    if (!user) {
      Alert.alert("Error", "No user session found.");
      return;
    }

    if (!planName.trim()) {
      Alert.alert("Required", "Please give your plan a name.");
      return;
    }
  
    const currentId = user.userId || (user.attributes && user.attributes.netid);
    
    try {
      setLoading(true);
      const isLocal = typeof window === 'undefined' || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      const apiUrl = isLocal ? 'http://localhost:8080/api' : 'https://sdmay26-48.ece.iastate.edu/api';
      const response = await fetch(`${apiUrl}/coursePlan/${currentId}/addPlan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan_name: planName.trim(),
          years: 4, // Default to 4
          list_of_courses: [] 
        }),
      });

      if (response.ok) {
        const result = await response.json();
        onConfirm(result);
      } else {
        Alert.alert("Error", "Failed to create plan.");
      }
    } catch (error) {
      Alert.alert("Network Error", "Unable to connect to the server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="fade" transparent={true}>
      <View style={styles.modalOverlay}>
        <View style={[styles.centeredModal, { backgroundColor: theme.background }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: theme.textSecondary }]}>New Plan</Text>
            <TouchableOpacity onPress={onClose} disabled={loading}>
              <X size={22} color={theme.textSecondary} />
            </TouchableOpacity>
          </View>

          <View style={styles.stepContent}>
            <Text style={[styles.label, { color: theme.text }]}>Plan Details</Text>
            <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>What should we call your plan?</Text>
            <TextInput 
              style={[styles.input, { color: theme.text, borderColor: theme.border || '#ccc' }]}
              value={planName}
              onChangeText={setPlanName}
              placeholder="e.g. My 4-Year Journey"
              placeholderTextColor={theme.textSecondary + '80'}
              editable={!loading}
              autoFocus
            />
          </View>

          <TouchableOpacity 
            style={[styles.modalButton, { backgroundColor: loading ? theme.textSecondary : theme.primary }]} 
            onPress={handleCreate}
            disabled={loading}
          >
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryButtonText}>Create Plan</Text>}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  mainContainer: { flex: 1 },
  welcomeContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  iconCircle: { padding: 20, borderRadius: 50, marginBottom: 20 },
  title: { fontSize: 26, fontWeight: '800', marginBottom: 10 },
  subtitle: { fontSize: 15, lineHeight: 22, marginBottom: 30 },
  primaryButton: { flexDirection: 'row', paddingVertical: 14, paddingHorizontal: 28, borderRadius: 12, alignItems: 'center' },
  primaryButtonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20 },
  centeredModal: { width: '100%', maxWidth: 400, borderRadius: 30, padding: 24, borderWidth: 1 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  headerIconButton: { padding: 4 },
  modalTitle: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },
  stepContent: { marginBottom: 20 },
  label: { fontSize: 24, fontWeight: '800', marginBottom: 4 },
  subLabel: { fontSize: 15, color: '#666', marginBottom: 20 },
  inputLabel: { fontSize: 13, fontWeight: '600', marginBottom: 8, marginTop: 10 },
  dropdownContainer: { width: '100%' },
  dropdownTrigger: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderWidth: 2, borderRadius: 16 },
  dropdownValue: { fontSize: 16, fontWeight: '600' },
  dropdownListContainer: { marginTop: 8, borderWidth: 2, borderRadius: 16, overflow: 'hidden', position: 'absolute', top: 60, width: '100%', zIndex: 10 },
  dropdownScrollView: { maxHeight: 200 },
  dropdownOption: { padding: 16, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#eee', height: 50, justifyContent: 'center' },
  optionText: { fontSize: 16 },
  input: { borderWidth: 2, borderRadius: 16, padding: 15, fontSize: 16 },
  modalButton: { paddingVertical: 18, borderRadius: 16, alignItems: 'center', minHeight: 60, justifyContent: 'center' },
});