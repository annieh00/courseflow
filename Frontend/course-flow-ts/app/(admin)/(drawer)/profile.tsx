import React, { useState, useEffect, useCallback } from 'react';
import {
    View, Text, StyleSheet, Image, TextInput, TouchableOpacity,
    ScrollView, Alert, Pressable, ActivityIndicator, RefreshControl, Modal, FlatList, Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import Cropper from 'react-easy-crop'; // ✅ Web Cropper
import getCroppedImg from '../../../utils/cropImage'; // ✅ Your Helper Utility

import { useTheme } from "../../../components/ThemeContext";
import CustomDrawerContent from "../../../components/CustomDrawer";
import { profileAPI } from '../../../services/api';
import { useAuth } from '../../../auth/AuthContext';

const ALL_MAJORS = ["Computer Science", "Computer Engineering", "Software Engineering", "Data Science", "Cyber Security", "Electrical Engineering", "Mechanical Engineering", "Civil Engineering", "Biology", "Psychology", "Business Analytics", "Accounting", "Finance", "Undecided"];
const ALL_MINORS = ["Mathematics", "Statistics", "Philosophy", "Digital Media", "General Business", "Entrepreneurship", "Economics", "None"];
const CURRENT_YEAR = new Date().getFullYear();
const GRAD_YEARS = Array.from({length: 7}, (_, i) => String(CURRENT_YEAR + i));

export default function ProfileScreen() {
    const { theme } = useTheme();
    const { user } = useAuth();

    const [fullProfile, setFullProfile] = useState<any>(null);
    const [bio, setBio] = useState('');

    // --- Image States ---
    const [tempPhoto, setTempPhoto] = useState(''); // Valid Base64 ready to save

    // --- Web Cropper States ---
    const [imageForCrop, setImageForCrop] = useState<string | null>(null);
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
    const [showWebCropper, setShowWebCropper] = useState(false);

    // --- Academic States ---
    const [editMajors, setEditMajors] = useState<string[]>([]);
    const [editMinors, setEditMinors] = useState<string[]>([]);
    const [editGradYear, setEditGradYear] = useState('');

    const [isEditingBio, setIsEditingBio] = useState(false);
    const [isEditingAcademic, setIsEditingAcademic] = useState(false);

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // Modal State
    const [modalVisible, setModalVisible] = useState(false);
    const [modalType, setModalType] = useState<'major' | 'minor' | 'year'>('major');
    const [searchText, setSearchText] = useState('');

    const loadProfile = async () => {
        try {
            const data = await profileAPI.getProfile();
            setFullProfile(data);
            resetForm(data);
        } catch (err) {
            console.error('Error fetching profile:', err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const resetForm = (data: any) => {
        setBio(data.bio ?? '');
        setTempPhoto(data.photoUrl ?? '');
        setEditMajors(data.majors || []);
        setEditMinors(data.minors || []);
        setEditGradYear(data.graduationYear || '');
    };

    useEffect(() => {
        loadProfile();
    }, []);

    const onRefresh = () => {
        setRefreshing(true);
        loadProfile();
    };

    const pickImage = async () => {
        const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permissionResult.granted) {
            Alert.alert("Permission Required", "Access to photos is needed.");
            return;
        }

        // Mobile: Use Native Cropper (allowsEditing: true)
        // Web: Use Custom Modal (allowsEditing: false)
        const isWeb = Platform.OS === 'web';

        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'], // Updated syntax for Expo 50+
            allowsEditing: !isWeb,
            aspect: [1, 1],
            quality: 0.5,
            base64: true,
        });

        if (!result.canceled && result.assets && result.assets.length > 0) {
            const asset = result.assets[0];

            if (isWeb) {
                // WEB: Send URI to Custom Cropper
                setImageForCrop(asset.uri);
                setShowWebCropper(true);
            } else {
                // MOBILE: Already cropped, set Base64
                const base64Img = `data:image/jpeg;base64,${asset.base64}`;
                setTempPhoto(base64Img);
            }
        }
    };

    // ✅ WEB: Capture crop data
    const onCropComplete = useCallback((croppedArea: any, croppedAreaPixels: any) => {
        setCroppedAreaPixels(croppedAreaPixels);
    }, []);

    // ✅ WEB: Process the crop using the Helper Utility
    const saveWebCrop = async () => {
        try {
            if (imageForCrop && croppedAreaPixels) {
                const croppedImageBase64 = await getCroppedImg(imageForCrop, croppedAreaPixels);
                if (croppedImageBase64) {
                    setTempPhoto(croppedImageBase64);
                    setShowWebCropper(false);
                    setImageForCrop(null);
                }
            }
        } catch (e) {
            console.error("Crop error:", e);
            Alert.alert("Error", "Could not crop image.");
        }
    };

    // --- Save Actions ---
    const cancelBio = () => {
        setBio(fullProfile?.bio ?? '');
        setTempPhoto(fullProfile?.photoUrl ?? '');
        setIsEditingBio(false);
    };

    const saveBio = async () => {
        try {
            await profileAPI.updateProfile({
                bio,
                photoUrl: tempPhoto
            });
            setIsEditingBio(false);
            setFullProfile((prev: any) => ({ ...prev, bio, photoUrl: tempPhoto }));
            Alert.alert('Success', 'Profile updated!');
        } catch (err) {
            Alert.alert('Error', 'Failed to save profile.');
        }
    };

    const cancelAcademic = () => {
        setEditMajors(fullProfile?.majors || []);
        setEditMinors(fullProfile?.minors || []);
        setEditGradYear(fullProfile?.graduationYear || '');
        setIsEditingAcademic(false);
    };

    const saveAcademic = async () => {
        try {
            await profileAPI.updateProfile({
                majors: editMajors,
                minors: editMinors,
                graduationYear: editGradYear
            });
            setIsEditingAcademic(false);
            setFullProfile((prev: any) => ({
                ...prev,
                majors: editMajors,
                minors: editMinors,
                graduationYear: editGradYear
            }));
            Alert.alert('Success', 'Academic info updated!');
        } catch (err) {
            Alert.alert('Error', 'Failed to save academic info.');
        }
    };

    // --- Modal Logic ---
    const openModal = (type: 'major' | 'minor' | 'year') => {
        setModalType(type);
        setSearchText('');
        setModalVisible(true);
    };

    const toggleSelection = (item: string) => {
        if (modalType === 'year') {
            setEditGradYear(item);
            setModalVisible(false);
            return;
        }
        const list = modalType === 'major' ? editMajors : editMinors;
        const setList = modalType === 'major' ? setEditMajors : setEditMinors;

        if (list.includes(item)) {
            setList(prev => prev.filter(i => i !== item));
        } else {
            setList(prev => [...prev, item]);
        }
    };

    const getFilteredList = () => {
        if (modalType === 'year') return GRAD_YEARS;
        const list = modalType === 'major' ? ALL_MAJORS : ALL_MINORS;
        return list.filter(item => item.toLowerCase().includes(searchText.toLowerCase()));
    };

    const styles = createStyles(theme);

    if (loading) {
        return (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color={theme.text} />
            </View>
        );
    }

    const displayMajors = fullProfile?.majors?.length > 0 ? fullProfile.majors.join(", ") : "Undeclared";
    const displayMinors = fullProfile?.minors?.length > 0 ? fullProfile.minors.join(", ") : "None";

    // Reusable Header Component
    const SectionHeader = ({ title, isEditing, onEdit, onSave, onCancel }: any) => (
        <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>{title}</Text>
            {isEditing ? (
                <View style={styles.actionButtonRow}>
                    <TouchableOpacity onPress={onCancel} style={styles.cancelBtn}>
                        <Text style={styles.cancelText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={onSave} style={styles.saveBtn}>
                        <Text style={styles.saveText}>Save</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <TouchableOpacity onPress={onEdit} style={styles.iconEditBtn}>
                    <Ionicons name="pencil" size={16} color={theme.primary} />
                    <Text style={styles.iconEditText}>Edit</Text>
                </TouchableOpacity>
            )}
        </View>
    );


  const roleLabel =
    user?.role === "advisor"
      ? "Advisor"
      : user?.role === "admin"
      ? "Admin"
      : "Student";

    return (
        <View style={{flex: 1}}>
            <ScrollView
                style={styles.container}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            >
                {/* --- HEADER (Bio & Photo) --- */}
                <View style={styles.card}>
                    <SectionHeader
                        title={`Profile`}
                        isEditing={isEditingBio}
                        onEdit={() => setIsEditingBio(true)}
                        onSave={saveBio}
                        onCancel={cancelBio}
                    />

                    <View style={styles.headerContent}>
                        <View style={styles.infoContainer}>
                            <Text style={styles.name}>
                                {fullProfile?.name || user?.name || 'Student Name'}
                            </Text>
                            <Text style={styles.email}>
                                {fullProfile?.email || user?.email || 'student@iastate.edu'}
                            </Text>

                            <Text style={styles.bioLabel}>Bio:</Text>
                            {isEditingBio ? (
                                <TextInput
                                    style={styles.bioInput}
                                    value={bio}
                                    onChangeText={setBio}
                                    multiline
                                    placeholder="Write something about yourself..."
                                    placeholderTextColor={theme.textSecondary}
                                />
                            ) : (
                                <Text style={styles.bioText}>{bio || 'No bio yet.'}</Text>
                            )}
                        </View>

                        {/* Image Click Area */}
                        <Pressable
                            onPress={isEditingBio ? pickImage : undefined}
                            style={({pressed}) => [
                                styles.profileImageContainer,
                                isEditingBio && styles.profileImageEditable,
                                pressed && isEditingBio && { opacity: 0.8 }
                            ]}
                        >
                            <Image
                                source={{ uri: tempPhoto || fullProfile?.photoUrl || 'https://via.placeholder.com/240' }}
                                style={styles.profileImage}
                            />
                            {isEditingBio && (
                                <View style={styles.cameraOverlay}>
                                    <Ionicons name="camera" size={20} color="#fff" />
                                </View>
                            )}
                        </Pressable>
                    </View>
                </View>

                {/* --- ACADEMIC INFO CARD --- */}
                <View style={[styles.card, styles.academicCard]}>
                    <SectionHeader
                        title="Academic Info"
                        isEditing={isEditingAcademic}
                        onEdit={() => setIsEditingAcademic(true)}
                        onSave={saveAcademic}
                        onCancel={cancelAcademic}
                    />

                    {/* Majors */}
                    <View style={styles.row}>
                        <Text style={styles.label}>Majors:</Text>
                        {isEditingAcademic ? (
                            <TouchableOpacity onPress={() => openModal('major')} style={styles.editSelector}>
                                <Text style={styles.valueEdit}>
                                    {editMajors.length > 0 ? editMajors.join(", ") : "Select..."}
                                </Text>
                            </TouchableOpacity>
                        ) : (
                            <Text style={styles.value}>{displayMajors}</Text>
                        )}
                    </View>

                    {/* Minors */}
                    <View style={styles.row}>
                        <Text style={styles.label}>Minors:</Text>
                        {isEditingAcademic ? (
                            <TouchableOpacity onPress={() => openModal('minor')} style={styles.editSelector}>
                                <Text style={styles.valueEdit}>
                                    {editMinors.length > 0 ? editMinors.join(", ") : "Select..."}
                                </Text>
                            </TouchableOpacity>
                        ) : (
                            <Text style={styles.value}>{displayMinors}</Text>
                        )}
                    </View>

                    {/* Grad Year */}
                    <View style={styles.row}>
                        <Text style={styles.label}>Graduation:</Text>
                        {isEditingAcademic ? (
                            <TouchableOpacity onPress={() => openModal('year')} style={styles.editSelector}>
                                <Text style={styles.valueEdit}>{editGradYear || "Select..."}</Text>
                            </TouchableOpacity>
                        ) : (
                            <Text style={styles.value}>{fullProfile?.graduationYear || "Unknown"}</Text>
                        )}
                    </View>
                </View>
            </ScrollView>

            {/* --- SELECTION MODAL --- */}
            <Modal visible={modalVisible} animationType="slide" presentationStyle="pageSheet">
                <SafeAreaView style={styles.modalContainer}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>
                            Select {modalType === 'year' ? 'Year' : modalType === 'major' ? 'Major' : 'Minor'}
                        </Text>
                        <TouchableOpacity onPress={() => setModalVisible(false)}>
                            <Text style={styles.closeText}>Done</Text>
                        </TouchableOpacity>
                    </View>

                    {modalType !== 'year' && (
                        <TextInput
                            style={styles.searchInput}
                            placeholder="Search..."
                            value={searchText}
                            onChangeText={setSearchText}
                        />
                    )}

                    <FlatList
                        data={getFilteredList()}
                        keyExtractor={item => item}
                        renderItem={({item}) => {
                            const isSelected = modalType === 'year'
                                ? editGradYear === item
                                : (modalType === 'major' ? editMajors : editMinors).includes(item);

                            return (
                                <TouchableOpacity
                                    style={[styles.listItem, isSelected && styles.selectedItem]}
                                    onPress={() => toggleSelection(item)}
                                >
                                    <Text style={[styles.listText, isSelected && styles.selectedText]}>{item}</Text>
                                    {isSelected && <Text style={styles.checkmark}>✓</Text>}
                                </TouchableOpacity>
                            );
                        }}
                    />
                </SafeAreaView>
            </Modal>

            {/* ✅ WEB-ONLY CROPPER MODAL */}
            {Platform.OS === 'web' && showWebCropper && (
                <Modal visible={true} transparent={true} animationType="fade">
                    <View style={styles.webCropContainer}>
                        <View style={styles.cropperWrapper}>
                            <Cropper
                                image={imageForCrop || ''}
                                crop={crop}
                                zoom={zoom}
                                aspect={1} // Square
                                onCropChange={setCrop}
                                onCropComplete={onCropComplete}
                                onZoomChange={setZoom}
                                cropShape="round" // Circle Mask
                            />
                        </View>

                        <View style={styles.cropControls}>
                            <Text style={{color: 'white', marginBottom: 10}}>Zoom</Text>
                            {/* Standard HTML Slider for React Native Web */}
                            <input
                                type="range"
                                value={zoom}
                                min={1}
                                max={3}
                                step={0.1}
                                aria-labelledby="Zoom"
                                onChange={(e: any) => setZoom(Number(e.target.value))}
                                style={{width: '80%', marginBottom: 20}}
                            />

                            <View style={styles.cropButtons}>
                                <TouchableOpacity
                                    style={[styles.modalBtn, styles.cancelBtnOutline, {backgroundColor: 'white'}]}
                                    onPress={() => setShowWebCropper(false)}
                                >
                                    <Text>Cancel</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.modalBtn, styles.confirmBtn]}
                                    onPress={saveWebCrop}
                                >
                                    <Text style={styles.btnTextWhite}>Crop & Save</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </Modal>
            )}
        </View>
    );
}

const createStyles = (theme: any) => StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.background },
    card: { backgroundColor: theme.card, padding: 20, marginHorizontal: 0, borderBottomWidth: 1, borderBottomColor: theme.border },
    academicCard: { marginTop: 15 },
    sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
    sectionTitle: { fontSize: 20, fontWeight: '700', color: theme.text },
    headerContent: { flexDirection: 'row', justifyContent: 'space-between' },
    infoContainer: { flex: 1, paddingRight: 10 },
    name: { fontSize: 22, fontWeight: '700', color: theme.text },
    email: { fontSize: 16, color: theme.textSecondary, marginTop: 4 },
    bioLabel: { marginTop: 12, fontSize: 14, color: theme.textSecondary, fontWeight: '600' },
    bioText: { marginTop: 4, fontSize: 14, color: theme.text, lineHeight: 20 },
    bioInput: { marginTop: 4, color: theme.text, backgroundColor: theme.background, padding: 10, borderRadius: 8, minHeight: 60, textAlignVertical: 'top' },

    // Image Styles
    profileImageContainer: { width: 90, height: 90, borderRadius: 45, overflow: 'hidden', position: 'relative' },
    profileImage: { width: '100%', height: '100%', backgroundColor: theme.border },
    profileImageEditable: { borderWidth: 2, borderColor: theme.primary, opacity: 0.9 },
    cameraOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 30, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' },

    actionButtonRow: { flexDirection: 'row', gap: 12 },
    iconEditBtn: { flexDirection: 'row', alignItems: 'center', padding: 4 },
    iconEditText: { color: theme.primary, fontWeight: '600', fontSize: 15, marginLeft: 6 },
    cancelBtn: { paddingVertical: 6, paddingHorizontal: 12 },
    cancelText: { color: theme.textSecondary, fontWeight: '600', fontSize: 15 },
    saveBtn: { backgroundColor: theme.primary, paddingVertical: 6, paddingHorizontal: 12, borderRadius: 6 },
    saveText: { color: '#fff', fontWeight: '600', fontSize: 15 },

    row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 0.5, borderBottomColor: theme.border },
    label: { fontSize: 15, color: theme.textSecondary },
    value: { fontSize: 15, fontWeight: '500', color: theme.text, maxWidth: '70%', textAlign: 'right' },
    editSelector: { backgroundColor: theme.background, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 6, borderWidth: 1, borderColor: theme.border, minWidth: 120, alignItems: 'flex-end' },
    valueEdit: { fontSize: 14, color: theme.text },

    modalContainer: { flex: 1, backgroundColor: '#fff' },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#eee' },
    modalTitle: { fontSize: 18, fontWeight: 'bold', textTransform: 'capitalize' },
    closeText: { color: '#007AFF', fontSize: 16, fontWeight: '600' },
    searchInput: { backgroundColor: '#f0f0f0', borderRadius: 10, padding: 12, margin: 16, fontSize: 16 },
    listItem: { padding: 16, borderBottomWidth: 1, borderBottomColor: '#eee', flexDirection: 'row', justifyContent: 'space-between' },
    selectedItem: { backgroundColor: '#FFF5F5' },
    listText: { fontSize: 16 },
    selectedText: { color: '#C8102E', fontWeight: '600' },
    checkmark: { color: '#C8102E', fontSize: 18, fontWeight: 'bold' },

    // Web Cropper Styles
    webCropContainer: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'black', zIndex: 9999 },
    cropperWrapper: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 120 },
    cropControls: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 120, backgroundColor: '#333', alignItems: 'center', padding: 10 },
    cropButtons: { flexDirection: 'row', gap: 20 },
    modalBtn: { paddingVertical: 10, paddingHorizontal: 20, borderRadius: 8 },
    cancelBtnOutline: { borderWidth: 1, borderColor: '#ccc' },
    confirmBtn: { backgroundColor: '#C8102E' },
    btnTextWhite: { color: '#fff', fontWeight: 'bold' }
});