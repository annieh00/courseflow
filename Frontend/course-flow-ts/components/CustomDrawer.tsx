import React from 'react';
import { View, Text, Pressable, Image, StyleSheet } from 'react-native';
import { DrawerContentScrollView, DrawerItemList } from '@react-navigation/drawer';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { useAuth } from '../auth/AuthContext';
import { useTheme } from './ThemeContext';

export default function CustomDrawerContent(props: any) {
    const { bottom } = useSafeAreaInsets();
    const router = useRouter();
    const { logout } = useAuth();
    const { theme } = useTheme();

    const handleLogout = () => {
        console.log('User logged out');

        // 1. Close the drawer first
        props.navigation.closeDrawer();

        // 2. Wait 200ms for the close animation to settle
        // This prevents the "GO_BACK was not handled" error
        setTimeout(async () => {
            await logout();
            router.replace('/login'); // Explicitly go to login
        }, 200);
    };

    return (
        <View style={{ flex: 1, backgroundColor: theme.background }}>
            <DrawerContentScrollView {...props} scrollEnabled={false}>
                <View style={{ padding: 20 }}>
                    <Image
                        style={{ height: 35, tintColor: theme.primary }}
                        resizeMode="contain"
                        source={require('../assets/images/logo.png')}
                    />
                </View>
                <DrawerItemList {...props} />
            </DrawerContentScrollView>

            <Pressable
                onPress={handleLogout}
                style={[
                    styles.logoutButton,
                    {
                        backgroundColor: theme.card,
                        borderTopColor: theme.border,
                        paddingBottom: bottom + 10,
                    },
                ]}
            >
                <Ionicons name="log-out-outline" size={22} color={theme.danger} />
                <Text style={[styles.logoutText, { color: theme.danger }]}>Logout</Text>
            </Pressable>
        </View>
    );
}

const styles = StyleSheet.create({
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 15,
        paddingHorizontal: 20,
        borderTopWidth: 1,
    },
    logoutText: {
        marginLeft: 10,
        fontSize: 16,
        fontWeight: 'bold',
    },
});