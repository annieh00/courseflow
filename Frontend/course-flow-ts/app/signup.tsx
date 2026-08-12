import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Modal,
    Animated,
    Easing,
    ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../auth/AuthContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useWindowDimensions, Platform } from 'react-native';
import { authAPI } from '../services/api';

export default function SignupScreen() {
    const router = useRouter();
   // const { setPendingVerification } = useAuth();
    const { width } = useWindowDimensions();

    const [netId, setNetId] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // Verification modal states
    const [showVerificationModal, setShowVerificationModal] = useState(false);
    const [verificationCode, setVerificationCode] = useState(['', '', '', '', '', '']);
    const [verificationError, setVerificationError] = useState('');
    const [isVerifying, setIsVerifying] = useState(false);
    const inputRefs = useRef<TextInput[]>([]);
    const slideAnim = useState(new Animated.Value(20))[0];

    // ✅ Password validation
    const validatePassword = (pwd: string) => {
        const noSpaces = !/\s/.test(pwd);
        const hasNumber = /\d/.test(pwd);
        const hasSymbol = /[!@#$%^&*(),.?":{}|<>]/.test(pwd);
        return pwd.length >= 8 && noSpaces && hasNumber && hasSymbol;
    };

    const handleSignup = async () => {
        setError('');

        const netidRegex = /^[A-Za-z0-9]+$/;
        if (!netidRegex.test(netId)) {
            setError('Not a valid Net-ID.');
            return;
        }

        if (!validatePassword(password)) {
            setError('Password must be ≥8 chars, include a number, symbol, and no spaces.');
            return;
        }

        if (password !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }

        setIsLoading(true);
        try {
            const response = await authAPI.signup({
                netId,
                password,
                confirmPassword,
            });

            if (response.success) {
                // Reset verification states when showing modal
                setVerificationError('');
                setVerificationCode(['', '', '', '', '', '']);
                setShowVerificationModal(true);
            } else {
                if (response.message.includes('already exists and is verified')) {
                    setError('An account with this NetID already exists. Please log in instead.');
                } else if (response.message.includes('Verification code already sent')) {
                    // Show verification modal for existing unverified users
                    setVerificationError('');
                    setVerificationCode(['', '', '', '', '', '']);
                    setShowVerificationModal(true);
                } else {
                    setError(response.message);
                }
            }
        } catch (err) {
            setError('Signup failed. Please check your connection and try again.');
            console.error('Signup error:', err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        const isComplete = verificationCode.every(digit => digit !== '') && verificationCode.length === 6;

        if (isComplete && !isVerifying && !verificationError) {
            // Small delay to ensure user can see all digits are entered
            const timer = setTimeout(() => {
                handleVerify();
            }, 300); // 300ms delay so user can see the complete code

            return () => clearTimeout(timer);
        }
    }, [verificationCode, isVerifying, verificationError]); // Only auto-submit when these dependencies change

    const handleCodeChange = (text: string, index: number) => {
        if (/^\d?$/.test(text)) {
            const newCode = [...verificationCode];
            newCode[index] = text;
            setVerificationCode(newCode);

            // Clear errors when user starts typing
            if (verificationError) {
                setVerificationError('');
            }

            // Move to next input automatically
            if (text && index < 5) {
                inputRefs.current[index + 1]?.focus();
            }
        }
    };
    const handleKeyPress = (e: any, index: number) => {
        if (e.nativeEvent.key === 'Backspace' && !verificationCode[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    const handleVerify = async () => {
        const code = verificationCode.join('');

        // Basic validation
        if (code.length < 6) {
            setVerificationError('Please enter all 6 digits.');
            return;
        }

        setIsVerifying(true);
        setVerificationError('');

        try {
            //console.log('Sending verification request:', { netId, code });
            const response = await authAPI.verify({
                netId,
                code
            });

            //console.log('Verification response:', response);

            if (response.success) {
                // Success - close modal and redirect to login
                setShowVerificationModal(false);

                // Redirect to login with success message
                router.push({
                    pathname: '/login',
                    params: { message: 'Account verified successfully! Please log in.' }
                });
            } else {
                // More specific error messages based on backend response
                if (response.message.includes('Invalid') || response.message.includes('invalid')) {
                    setVerificationError('Invalid verification code. Please try again.');
                } else if (response.message.includes('expired')) {
                    setVerificationError('Verification code has expired. Please request a new one.');
                } else {
                    setVerificationError('Verification failed. Please try again.');
                }

                // Clear the code on error
                setVerificationCode(['', '', '', '', '', '']);
                // Focus first input
                setTimeout(() => {
                    inputRefs.current[0]?.focus();
                }, 100);
            }
        } catch (err: any) {
            console.error('Verification error:', err);
            // More specific error message
            setVerificationError('Verification failed. Please try again.');
            // Clear the code on error
            setVerificationCode(['', '', '', '', '', '']);
            // Focus first input
            setTimeout(() => {
                inputRefs.current[0]?.focus();
            }, 100);
        } finally {
            setIsVerifying(false);
        }
    };

    const closeVerificationModal = () => {
        setShowVerificationModal(false);
        setVerificationError('');
        setVerificationCode(['', '', '', '', '', '']);
    };

    useEffect(() => {
        if (showVerificationModal) {
            slideAnim.setValue(20);
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 250,
                easing: Easing.out(Easing.ease),
                useNativeDriver: true,
            }).start();

            // Focus first input when modal opens
            setTimeout(() => {
                inputRefs.current[0]?.focus();
            }, 300);
        }
    }, [showVerificationModal]);

    return (
        <SafeAreaView style={styles.container}>
            <Text style={styles.title}>Create an Account</Text>

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <TextInput
                style={styles.input}
                placeholder="Iowa State Net-ID"
                placeholderTextColor="#666"
                value={netId}
                onChangeText={setNetId}
                autoCapitalize="none"
            />
            <TextInput
                style={styles.input}
                placeholder="Password"
                placeholderTextColor="#666"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
            />
            <TextInput
                style={styles.input}
                placeholder="Confirm Password"
                placeholderTextColor="#666"
                secureTextEntry
                value={confirmPassword}
                onChangeText={setConfirmPassword}
            />

            <TouchableOpacity
                style={[styles.signupButton, isLoading && styles.buttonDisabled]}
                onPress={handleSignup}
                disabled={isLoading}
            >
                {isLoading ? <ActivityIndicator color="white" /> : <Text style={styles.signupButtonText}>Sign Up</Text>}
            </TouchableOpacity>

            <TouchableOpacity onPress={() => router.push('/login')}>
                <Text style={styles.backText}>Already have an account? Log in</Text>
            </TouchableOpacity>

            {/* ✅ Verification Modal */}
            <Modal
                visible={showVerificationModal}
                animationType="none"
                transparent={true}
                onRequestClose={closeVerificationModal}
            >
                <View style={styles.modalOverlay}>
                    <Animated.View style={[styles.modalContainer, { transform: [{ translateY: slideAnim }] }]}>
                        <Text style={styles.modalTitle}>Verify Your Account</Text>
                        <Text style={styles.modalSubtitle}>
                            Enter the 6-digit code sent to {netId}@iastate.edu
                        </Text>

                        {/* Verification Error Message */}
                        {verificationError ? (
                            <Text style={styles.verificationErrorText}>{verificationError}</Text>
                        ) : null}

                        <View style={styles.codeInputContainer}>
                            {verificationCode.map((digit, index) => (
                                <TextInput
                                    key={index}
                                    ref={(el) => {
                                        if (el) inputRefs.current[index] = el;
                                    }}
                                    style={[
                                        styles.codeInput,
                                        verificationError && styles.codeInputError
                                    ]}
                                    keyboardType="number-pad"
                                    maxLength={1}
                                    value={digit}
                                    onChangeText={(text) => handleCodeChange(text, index)}
                                    onKeyPress={(e) => handleKeyPress(e, index)}
                                    editable={!isVerifying}
                                    selectTextOnFocus={!isVerifying}
                                />
                            ))}
                        </View>

                        <TouchableOpacity
                            style={[
                                styles.verifyButton,
                                isVerifying && styles.buttonDisabled
                            ]}
                            onPress={handleVerify}
                            disabled={isVerifying}
                        >
                            {isVerifying ? (
                                <ActivityIndicator color="white" />
                            ) : (
                                <Text style={styles.verifyButtonText}>Verify</Text>
                            )}
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.cancelButton}
                            onPress={closeVerificationModal}
                            disabled={isVerifying}
                        >
                            <Text style={styles.cancelButtonText}>
                                {isVerifying ? 'Please wait...' : 'Cancel'}
                            </Text>
                        </TouchableOpacity>
                    </Animated.View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f5f5f5', padding: 32, justifyContent: 'center' },
    title: { fontSize: 32, fontWeight: 'bold', color: '#C8102E', textAlign: 'center', marginBottom: 24 },
    input: {
        borderWidth: 2,
        borderColor: '#C8102E',
        padding: 16,
        marginBottom: 12,
        borderRadius: 12,
        fontSize: 16,
        backgroundColor: 'white',
    },
    signupButton: {
        backgroundColor: '#C8102E',
        padding: 18,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 8,
    },
    signupButtonText: { color: 'white', fontSize: 18, fontWeight: 'bold' },
    buttonDisabled: { opacity: 0.6 },
    backText: { marginTop: 20, textAlign: 'center', color: '#C8102E', fontSize: 16 },
    errorText: {
        color: '#E03C31',
        textAlign: 'center',
        marginBottom: 16,
        fontWeight: '500',
        backgroundColor: '#FFE5E5',
        padding: 12,
        borderRadius: 8,
    },

    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContainer: {
        width: Platform.OS === 'web' ? '60%' : '90%',
        maxWidth: 500,
        backgroundColor: 'white',
        borderRadius: 14,
        paddingVertical: 24,
        paddingHorizontal: 20,
        alignItems: 'center',
        elevation: 5,
        shadowColor: '#000',
        shadowOpacity: 0.15,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 3 },
    },
    modalTitle: { fontSize: 22, fontWeight: 'bold', color: '#C8102E', textAlign: 'center', marginBottom: 8 },
    modalSubtitle: { fontSize: 16, color: '#666', textAlign: 'center', marginBottom: 20 },

    // Verification Error
    verificationErrorText: {
        color: '#E03C31',
        textAlign: 'center',
        marginBottom: 16,
        fontWeight: '500',
        backgroundColor: '#FFE5E5',
        padding: 12,
        borderRadius: 8,
        width: '100%',
    },

    // Code Input
    codeInputContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 10,
        marginBottom: 20,
        width: '100%',
    },
    codeInput: {
        borderWidth: 2,
        borderColor: '#C8102E',
        borderRadius: 10,
        width: 45,
        height: 55,
        textAlign: 'center',
        fontSize: 20,
        backgroundColor: 'white',
        marginHorizontal: 2,
    },
    codeInputError: {
        borderColor: '#E03C31',
        backgroundColor: '#FFE5E5',
    },

    // Buttons
    verifyButton: {
        backgroundColor: '#C8102E',
        paddingVertical: 14,
        borderRadius: 10,
        alignItems: 'center',
        width: '95%',
        marginTop: 12,
    },
    verifyButtonText: { color: 'white', fontSize: 16, fontWeight: '600' },
    cancelButton: {
        backgroundColor: '#ccc',
        paddingVertical: 14,
        borderRadius: 10,
        alignItems: 'center',
        width: '95%',
        marginTop: 10,
    },
    cancelButtonText: { color: '#333', fontSize: 16, fontWeight: '600' },
});