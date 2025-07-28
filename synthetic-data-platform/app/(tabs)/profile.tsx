import { logout } from '@/store/authSlice';
import { router } from 'expo-router';
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Button } from 'react-native-paper';

export default function ProfileScreen() {
    const handleLogout = () => {
        logout();
        router.replace('/(auth)/login');
    };

    return (
        <View style={styles.container}>
            <Text variant="headlineMedium">Profile Screen</Text>
            <Button 
                mode="contained" 
                onPress={handleLogout}
                style={styles.logoutButton}
            >
                Logout
            </Button>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    logoutButton: {
        marginTop: 20,
    },
});