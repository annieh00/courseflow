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

import { useTheme } from '../../../components/ThemeContext';
import CustomDrawerContent from "../../../components/CustomDrawer";
import { profileAPI } from '../../../services/api';
import { useAuth } from '../../../auth/AuthContext';

import { useDegrees } from '../../../auth/DegreeContext';

const CURRENT_YEAR = new Date().getFullYear();
const GRAD_YEARS = Array.from({length: 7}, (_, i) => String(CURRENT_YEAR + i));
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

export default function ProfileScreen() {
    const { theme } = useTheme();
    const { user } = useAuth();

    const { majors, minors, getDegreeName, isLoadingDegrees } = useDegrees();

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

    // --- Academic States (These store IDs, e.g., "SE") ---
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

        const isWeb = Platform.OS === 'web';

        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: !isWeb,
            aspect: [1, 1],
            quality: 0.5,
            base64: true,
        });

        if (!result.canceled && result.assets && result.assets.length > 0) {
            const asset = result.assets[0];

            if (isWeb) {
                setImageForCrop(asset.uri);
                setShowWebCropper(true);
            } else {
                const base64Img = `data:image/jpeg;base64,${asset.base64}`;
                setTempPhoto(base64Img);
            }
        }
    };

    const onCropComplete = useCallback((croppedArea: any, croppedAreaPixels: any) => {
        setCroppedAreaPixels(croppedAreaPixels);
    }, []);

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

    const toggleSelection = (itemId: string) => {
        if (modalType === 'year') {
            setEditGradYear(itemId);
            setModalVisible(false);
            return;
        }
        const list = modalType === 'major' ? editMajors : editMinors;
        const setList = modalType === 'major' ? setEditMajors : setEditMinors;

        if (list.includes(itemId)) {
            setList(prev => prev.filter(i => i !== itemId));
        } else {
            setList(prev => [...prev, itemId]);
        }
    };

    // 🚨 3. Update filter logic to check object names instead of raw strings
    const getFilteredList = () => {
        if (modalType === 'year') {
            return GRAD_YEARS.filter(y => y.includes(searchText));
        }
        const list = modalType === 'major' ? majors : minors;
        return list.filter(item => item.name.toLowerCase().includes(searchText.toLowerCase()));
    };

    const styles = createStyles(theme);

    // 🚨 4. Wait for both the profile AND the global degrees context to finish loading
    if (loading || isLoadingDegrees) {
        return (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color={theme.text} />
            </View>
        );
    }

    // 🚨 5. Map the saved IDs (e.g., "SE") to human-readable names
    const displayMajors = fullProfile?.majors?.length > 0
        ? fullProfile.majors.map((id: string) => getDegreeName(id)).join(", ")
        : "Undeclared";

    const displayMinors = fullProfile?.minors?.length > 0
        ? fullProfile.minors.map((id: string) => getDegreeName(id)).join(", ")
        : "None";

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

    const profileName = fullProfile?.name || user?.name || 'Student Name';
    const profileEmail = fullProfile?.email || user?.email || 'student@iastate.edu';
    const profilePhoto = tempPhoto || fullProfile?.photoUrl || 'https://via.placeholder.com/240';

    const InfoTile = ({ icon, label, value, editable, onPress }: any) => (
        <TouchableOpacity
            activeOpacity={editable ? 0.8 : 1}
            onPress={editable ? onPress : undefined}
            style={styles.detailTile}
        >
            <View style={styles.tileIcon}>
                <Ionicons name={icon} size={19} color={palette.red} />
            </View>
            <Text style={styles.tileLabel}>{label}</Text>
            <Text style={editable ? styles.tileValueEdit : styles.tileValue}>{value}</Text>
        </TouchableOpacity>
    );

    return (
        <View style={{flex: 1}}>
            <ScrollView
                style={styles.container}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            >
                <View style={styles.hero}>
                    <View style={styles.heroOrbLarge} />
                    <View style={styles.heroOrbSmall} />
                    <Text style={styles.heroKicker}>CourseFlow Profile</Text>
                    <Text style={styles.heroName}>{profileName}</Text>
                    <Text style={styles.heroNetid}>@{user?.userId || fullProfile?.netid || 'student'}</Text>
                </View>

                <View style={styles.identityCard}>
                    <Pressable
                        onPress={isEditingBio ? pickImage : undefined}
                        style={({pressed}) => [
                            styles.avatarWrap,
                            isEditingBio && styles.profileImageEditable,
                            pressed && isEditingBio && { opacity: 0.86 }
                        ]}
                    >
                        <Image source={{ uri: profilePhoto }} style={styles.profileImage} />
                        {isEditingBio && (
                            <View style={styles.cameraOverlay}>
                                <Ionicons name="camera" size={18} color="#fff" />
                            </View>
                        )}
                    </Pressable>
                    <View style={styles.identityText}>
                        <Text style={styles.identityName}>{profileName}</Text>
                        <Text style={styles.identitySubtext}>{profileEmail}</Text>
                    </View>
                    <View style={styles.selfMark}>
                        <Ionicons name="person" size={18} color="#fff" />
                    </View>
                </View>

                <View style={styles.storyCard}>
                    <SectionHeader
                        title="Shared Profile"
                        isEditing={isEditingBio}
                        onEdit={() => setIsEditingBio(true)}
                        onSave={saveBio}
                        onCancel={cancelBio}
                    />
                    {isEditingBio ? (
                        <TextInput
                            style={styles.bioInput}
                            value={bio}
                            onChangeText={setBio}
                            multiline
                            placeholder="Write something about yourself..."
                            placeholderTextColor={palette.muted}
                        />
                    ) : (
                        <Text style={styles.bioText}>{bio || 'No bio yet. Give future you a little lore.'}</Text>
                    )}
                </View>

                <View style={styles.academicActionsCard}>
                    <SectionHeader
                        title="Academic Info"
                        isEditing={isEditingAcademic}
                        onEdit={() => setIsEditingAcademic(true)}
                        onSave={saveAcademic}
                        onCancel={cancelAcademic}
                    />
                    <Text style={styles.helperText}>
                        {isEditingAcademic
                            ? "Tap the academic tiles below to update your major, minor, or graduation year."
                            : "Your academic info is visible on your profile and helps classmates recognize your program path."}
                    </Text>
                </View>

                <View style={styles.detailGrid}>
                    <InfoTile
                        icon="school-outline"
                        label="Majors"
                        value={
                            isEditingAcademic
                                ? (editMajors.length > 0 ? editMajors.map(id => getDegreeName(id)).join(", ") : "Select...")
                                : displayMajors
                        }
                        editable={isEditingAcademic}
                        onPress={() => openModal('major')}
                    />
                    <InfoTile
                        icon="ribbon-outline"
                        label="Minors"
                        value={
                            isEditingAcademic
                                ? (editMinors.length > 0 ? editMinors.map(id => getDegreeName(id)).join(", ") : "Select...")
                                : displayMinors
                        }
                        editable={isEditingAcademic}
                        onPress={() => openModal('minor')}
                    />
                    <InfoTile
                        icon="calendar-clear-outline"
                        label="Graduation"
                        value={isEditingAcademic ? (editGradYear || "Select...") : (fullProfile?.graduationYear || "Unknown")}
                        editable={isEditingAcademic}
                        onPress={() => openModal('year')}
                    />
                    <InfoTile
                        icon="mail-outline"
                        label="Contact"
                        value={profileEmail}
                    />
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

                    <FlatList<any>
                        data={getFilteredList()}
                        // 🚨 Reverted to .id
                        keyExtractor={item => modalType === 'year' ? (item as string) : (item as any).id}
                        renderItem={({item}) => {
                            const isYear = modalType === 'year';
                            // 🚨 Reverted to .id
                            const itemId = isYear ? (item as string) : (item as any).id;
                            const itemName = isYear ? (item as string) : (item as any).name;

                            const isSelected = isYear
                                ? editGradYear === itemId
                                : (modalType === 'major' ? editMajors : editMinors).includes(itemId);

                            return (
                                <TouchableOpacity
                                    style={[styles.listItem, isSelected && styles.selectedItem]}
                                    onPress={() => toggleSelection(itemId)}
                                >
                                    <Text style={[styles.listText, isSelected && styles.selectedText]}>{itemName}</Text>
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
    container: { flex: 1, backgroundColor: palette.background },
    hero: {
        backgroundColor: palette.red,
        paddingHorizontal: 22,
        paddingTop: 34,
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
        overflow: 'hidden',
        position: 'relative',
    },
    identityText: { flex: 1, marginLeft: 14 },
    identityName: { color: palette.ink, fontSize: 20, fontWeight: '900' },
    identitySubtext: { color: palette.muted, fontSize: 13, marginTop: 4 },
    selfMark: {
        width: 38,
        height: 38,
        borderRadius: 19,
        backgroundColor: palette.red,
        alignItems: 'center',
        justifyContent: 'center',
    },
    storyCard: {
        backgroundColor: palette.cream,
        marginHorizontal: 18,
        marginTop: 18,
        padding: 20,
        borderRadius: 28,
        borderWidth: 1,
        borderColor: palette.border,
    },
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
    tileValueEdit: { color: palette.red, fontSize: 15, fontWeight: '900', lineHeight: 20, marginTop: 6 },
    academicActionsCard: {
        backgroundColor: '#F3E2D8',
        marginHorizontal: 18,
        marginTop: 16,
        marginBottom: 28,
        padding: 18,
        borderRadius: 24,
        borderWidth: 1,
        borderColor: palette.border,
    },
    helperText: { color: palette.muted, fontSize: 13, lineHeight: 19 },
    card: { backgroundColor: palette.cream, padding: 20, marginHorizontal: 18, borderRadius: 24, borderWidth: 1, borderColor: palette.border },
    academicCard: { marginTop: 15 },
    sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
    sectionTitle: { fontSize: 20, fontWeight: '900', color: palette.ink },
    headerContent: { flexDirection: 'row', justifyContent: 'space-between' },
    infoContainer: { flex: 1, paddingRight: 10 },
    name: { fontSize: 22, fontWeight: '700', color: palette.ink },
    email: { fontSize: 16, color: palette.muted, marginTop: 4 },
    bioLabel: { marginTop: 12, fontSize: 14, color: palette.muted, fontWeight: '600' },
    bioText: { marginTop: 4, fontSize: 17, color: palette.ink, lineHeight: 26, fontWeight: '600' },
    bioInput: {
        marginTop: 4,
        color: palette.ink,
        backgroundColor: '#fff',
        padding: 14,
        borderRadius: 16,
        minHeight: 120,
        textAlignVertical: 'top',
        borderWidth: 1,
        borderColor: palette.border,
        fontSize: 15,
    },

    // Image Styles
    profileImageContainer: { width: 90, height: 90, borderRadius: 45, overflow: 'hidden', position: 'relative' },
    profileImage: { width: '100%', height: '100%', borderRadius: 21, backgroundColor: palette.redSoft },
    profileImageEditable: { borderWidth: 2, borderColor: palette.red, opacity: 0.96 },
    cameraOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 30, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' },

    actionButtonRow: { flexDirection: 'row', gap: 12 },
    iconEditBtn: { flexDirection: 'row', alignItems: 'center', padding: 4 },
    iconEditText: { color: palette.red, fontWeight: '800', fontSize: 15, marginLeft: 6 },
    cancelBtn: { paddingVertical: 6, paddingHorizontal: 12 },
    cancelText: { color: palette.muted, fontWeight: '700', fontSize: 15 },
    saveBtn: { backgroundColor: palette.red, paddingVertical: 6, paddingHorizontal: 12, borderRadius: 999 },
    saveText: { color: '#fff', fontWeight: '800', fontSize: 15 },

    row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 0.5, borderBottomColor: palette.border },
    label: { fontSize: 15, color: palette.muted },
    value: { fontSize: 15, fontWeight: '500', color: palette.ink, maxWidth: '70%', textAlign: 'right' },
    editSelector: { backgroundColor: '#fff', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 6, borderWidth: 1, borderColor: palette.border, minWidth: 120, alignItems: 'flex-end' },
    valueEdit: { fontSize: 14, color: palette.ink },

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
