import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { TextInput, Button, Text } from 'react-native-paper';
import { authService } from '@/services/api/authService';
import { router } from 'expo-router';

export default function RegisterScreen() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [username, setUsername] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleRegister = async () => {
        try {
            setLoading(true);
            setError('');
            
            await authService.signup({
                email,
                password,
                username,
            });

            // Redirection après inscription réussie
            router.replace('/(tabs)/home');
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Une erreur est survenue');
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <Text variant="headlineMedium" style={styles.title}>
                Créer un compte
            </Text>
            
            <TextInput
                label="Nom d'utilisateur"
                value={username}
                onChangeText={setUsername}
                mode="outlined"
                style={styles.input}
            />

            <TextInput
                label="Email"
                value={email}
                onChangeText={setEmail}
                mode="outlined"
                style={styles.input}
                keyboardType="email-address"
                autoCapitalize="none"
            />
            
            <TextInput
                label="Mot de passe"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                mode="outlined"
                style={styles.input}
            />
            
            {error ? <Text style={styles.error}>{error}</Text> : null}
            
            <Button
                mode="contained"
                onPress={handleRegister}
                loading={loading}
                style={styles.button}
                disabled={loading}>
                S'inscrire
            </Button>
            
            <Button
                mode="text"
                onPress={() => router.push('/login')}
                style={styles.linkButton}>
                Déjà un compte ? Se connecter
            </Button>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        justifyContent: 'center',
    },
    title: {
        marginBottom: 30,
        textAlign: 'center',
    },
    input: {
        marginBottom: 15,
    },
    button: {
        marginTop: 10,
    },
    linkButton: {
        marginTop: 20,
    },
    error: {
        color: 'red',
        marginBottom: 10,
    },
});