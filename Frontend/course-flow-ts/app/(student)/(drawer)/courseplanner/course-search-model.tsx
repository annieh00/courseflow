import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  Keyboard,
  TouchableWithoutFeedback
} from 'react-native';
import { Search, Plus, X, ChevronDown } from "lucide-react-native";
import { SUBJECTS } from './contants'; 

const courseLevels = [
  { label: 'Any Level', value: '' },
  { label: '1000', value: '1000' },
  { label: '2000', value: '2000' },
  { label: '3000', value: '3000' },
  { label: '4000', value: '4000' },
  { label: '5000', value: '5000' },
  { label: '6000', value: '6000' },
];

interface CourseSearchModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddCourse: (course: any) => void; 
  semesterName: string;
  theme: any;
}

export function CourseSearchModal({ open, onOpenChange, onAddCourse, semesterName, theme }: CourseSearchModalProps) {
  const [subject, setSubject] = useState("");
  const [courseNumber, setCourseNumber] = useState("");
  const [level, setLevel] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const [showSubjectList, setShowSubjectList] = useState(false);
  const [showLevelList, setShowLevelList] = useState(false);
  const [subjectSearch, setSubjectSearch] = useState("");

  const filteredSubjects = (SUBJECTS || []).filter(s => 
    s.label.toLowerCase().includes(subjectSearch.toLowerCase()) || 
    s.value.toLowerCase().includes(subjectSearch.toLowerCase())
  );

  const handleSearch = async () => {
    if (!subject) {
      Alert.alert("Required", "Please select a subject to search.");
      return;
    }
    
    Keyboard.dismiss();
    setLoading(true);
    setHasSearched(true);
    setShowSubjectList(false);
    setShowLevelList(false);

    try {
      const params = new URLSearchParams();
      params.append('subject', subject);
      if (courseNumber) params.append('courseNum', courseNumber);
      if (level) params.append('level', level);

      const isLocal = typeof window === 'undefined' || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      const apiUrl = isLocal ? 'http://localhost:8080/api' : 'https://sdmay26-48.ece.iastate.edu/api';
      const response = await fetch(`${apiUrl}/courses/search?${params.toString()}`);
      if (!response.ok) throw new Error("Server error");
      const data = await response.json();
      setSearchResults(data);
    } catch (error) {
      console.error("Search error:", error);
      Alert.alert("Error", "Could not connect to the course database.");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setSubject("");
    setCourseNumber("");
    setLevel("");
    setSearchResults([]);
    setHasSearched(false);
    setShowLevelList(false);
    setShowSubjectList(false);
    onOpenChange(false);
  };

  return (
    <Modal visible={open} animationType="fade" transparent={true} onRequestClose={handleClose}>
      <TouchableWithoutFeedback onPress={handleClose}>
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
            <View style={[styles.centeredModal, { backgroundColor: theme.background, borderColor: theme.border }]}>
              <KeyboardAvoidingView 
                behavior={Platform.OS === "ios" ? "padding" : undefined} 
                style={{ flex: 1 }}
              >
                <View style={styles.modalHeader}>
                  <Text style={[styles.modalTitle, { color: theme.textSecondary }]}>Search Courses</Text>
                  <TouchableOpacity onPress={handleClose}><X size={22} color={theme.textSecondary} /></TouchableOpacity>
                </View>

                <View style={styles.innerContent}>
                  <View style={styles.staticContent}>
                    <Text style={[styles.label, { color: theme.text }]}>Find Classes</Text>
                    <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Adding to {semesterName}</Text>

                    <Text style={[styles.fieldLabel, { color: theme.text }]}>Subject</Text>
                    <View style={{ zIndex: 1001 }}>
                      <TouchableOpacity 
                        style={[styles.dropdownTrigger, { borderColor: theme.border, backgroundColor: theme.card }]}
                        onPress={() => {
                            setShowSubjectList(!showSubjectList);
                            setShowLevelList(false);
                        }}
                      >
                        <Text style={{ color: subject ? theme.text : theme.textSecondary + '80' }}>
                          {subject ? SUBJECTS.find(s => s.value === subject)?.label : "Select Subject"}
                        </Text>
                        <ChevronDown size={18} color={theme.textSecondary} />
                      </TouchableOpacity>

                      {showSubjectList && (
                        <View style={[styles.dropdownList, { backgroundColor: theme.card, borderColor: theme.border }]}>
                          <TextInput 
                            style={[styles.searchFilterInput, { color: theme.text, borderBottomColor: theme.border }]}
                            placeholder="Type to filter..."
                            placeholderTextColor={theme.textSecondary + '80'}
                            value={subjectSearch}
                            onChangeText={setSubjectSearch}
                            autoFocus={true}
                          />
                          <FlatList
                            data={filteredSubjects}
                            keyExtractor={(item) => item.value}
                            style={{ maxHeight: 150 }}
                            nestedScrollEnabled={true}
                            renderItem={({ item }) => (
                              <TouchableOpacity 
                                style={styles.option} 
                                onPress={() => { setSubject(item.value); setShowSubjectList(false); setSubjectSearch(""); }}
                              >
                                <Text style={{ color: theme.text }}>{item.value} - {item.label}</Text>
                              </TouchableOpacity>
                            )}
                          />
                        </View>
                      )}
                    </View>

                    <View style={[styles.gridRow, { zIndex: 1000 }]}>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.fieldLabel, { color: theme.text }]}>Course #</Text>
                        <TextInput 
                          style={[styles.smallInput, { borderColor: theme.border, color: theme.text, backgroundColor: theme.card }]}
                          placeholder="e.g. 101"
                          placeholderTextColor={theme.textSecondary + '80'}
                          value={courseNumber}
                          onChangeText={setCourseNumber}
                          keyboardType="numeric"
                        />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.fieldLabel, { color: theme.text }]}>Level</Text>
                        <TouchableOpacity 
                          style={[styles.dropdownTrigger, { borderColor: theme.border, backgroundColor: theme.card }]}
                          onPress={() => {
                              setShowLevelList(!showLevelList);
                              setShowSubjectList(false);
                          }}
                        >
                          <Text style={{ color: theme.text, fontSize: 12 }} numberOfLines={1}>
                            {level ? courseLevels.find(l => l.value === level)?.label : "Any Level"}
                          </Text>
                          <ChevronDown size={14} color={theme.textSecondary} />
                        </TouchableOpacity>
                        
                        {showLevelList && (
                          <View style={[styles.dropdownList, { backgroundColor: theme.card, borderColor: theme.border, top: 55 }]}>
                            <FlatList
                                data={courseLevels}
                                keyExtractor={(item) => item.value}
                                style={{ maxHeight: 150 }}
                                nestedScrollEnabled={true}
                                renderItem={({ item }) => (
                                    <TouchableOpacity 
                                        style={styles.option} 
                                        onPress={() => { setLevel(item.value); setShowLevelList(false); }}
                                    >
                                        <Text style={{ color: theme.text }}>{item.label}</Text>
                                    </TouchableOpacity>
                                )}
                            />
                          </View>
                        )}
                      </View>
                    </View>

                    <TouchableOpacity 
                      style={[styles.primaryButton, { backgroundColor: !subject ? theme.textSecondary : theme.primary, marginTop: 15 }]} 
                      onPress={handleSearch}
                      disabled={!subject || loading}
                    >
                      {loading ? <ActivityIndicator color="#fff" /> : (
                        <>
                          <Search size={18} color="#fff" style={{marginRight: 8}} />
                          <Text style={styles.primaryButtonText}>Search Classes</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  </View>

                  {(searchResults.length > 0 || hasSearched || loading) && (
                    <View style={styles.resultsWrapper}>
                      <FlatList
                        data={searchResults}
                        keyExtractor={(item, index) => item.id?.toString() || index.toString()}
                        contentContainerStyle={{ paddingBottom: 20 }}
                        showsVerticalScrollIndicator={true}
                        renderItem={({ item }) => (
                          <View style={[styles.courseCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
                            <View style={{ flex: 1 }}>
                              <Text style={[styles.courseCode, { color: theme.text }]}>
                                {item.coursenum || item.courseNum}
                              </Text>
                              <Text style={{ color: theme.textSecondary, fontSize: 12 }}>{item.courseName}</Text>
                            </View>
                            <TouchableOpacity 
                              style={[styles.addButton, { backgroundColor: theme.primary }]} 
                              onPress={() => onAddCourse(item)}
                            >
                              <Plus size={16} color="#fff" />
                            </TouchableOpacity>
                          </View>
                        )}
                        ListEmptyComponent={hasSearched && !loading ? <Text style={styles.emptyText}>No courses found.</Text> : null}
                      />
                    </View>
                  )}
                </View>
              </KeyboardAvoidingView>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: { 
    flex: 1, 
    backgroundColor: 'rgba(0,0,0,0.5)', 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  centeredModal: { 
    width: '90%', 
    maxWidth: 450, 
    minHeight: 450, 
    maxHeight: '75%', 
    borderRadius: 30, 
    padding: 24, 
    borderWidth: 1,
    flexDirection: 'column',
    overflow: 'visible' // Changed from hidden so dropdowns can overflow the modal if needed
  },
  innerContent: {
    flex: 1,
    width: '100%',
  },
  staticContent: {
    flexShrink: 0,
    marginBottom: 10,
    zIndex: 10, // Keep filters above results
  },
  resultsWrapper: {
    flex: 1, 
    marginTop: 10,
    zIndex: 1,
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  modalTitle: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },
  label: { fontSize: 22, fontWeight: '800' },
  inputLabel: { fontSize: 13, marginBottom: 15 },
  fieldLabel: { fontSize: 13, fontWeight: '600', marginBottom: 6, marginTop: 10 },
  dropdownTrigger: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12, borderWidth: 2, borderRadius: 12, height: 50 },
  dropdownList: { position: 'absolute', top: 55, width: '100%', borderRadius: 12, borderWidth: 2, zIndex: 10000, elevation: 10, padding: 5 },
  searchFilterInput: { padding: 12, borderBottomWidth: 1, fontSize: 14, marginBottom: 5, minHeight: 45 },
  option: { padding: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#eee' },
  gridRow: { flexDirection: 'row', gap: 12 },
  smallInput: { borderWidth: 2, borderRadius: 12, padding: 12, height: 50, fontSize: 14 },
  primaryButton: { flexDirection: 'row', paddingVertical: 14, borderRadius: 12, alignItems: 'center', justifyContent: 'center', minHeight: 50 },
  primaryButtonText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  courseCard: { padding: 14, borderRadius: 16, borderWidth: 1, marginBottom: 10, flexDirection: 'row', alignItems: 'center' },
  courseCode: { fontSize: 14, fontWeight: '700', marginBottom: 2 },
  addButton: { padding: 8, borderRadius: 10 },
  emptyText: { textAlign: 'center', marginTop: 20, color: '#666', fontSize: 14 }
});