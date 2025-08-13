import React, { useState, useEffect } from 'react';
import { View, ScrollView, Alert } from 'react-native';
import { Text, TextInput, Button, ActivityIndicator } from 'react-native-paper';
import { router } from 'expo-router';
import { authService } from '@/services/api/authService';

interface ProfileData {
  full_name: string;
  organization: string;
  usage_purpose: string;
}

export default function EditProfileScreen() {
  const [profile, setProfile] = useState<ProfileData>({
    full_name: '',
    organization: '',
    usage_purpose: ''
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
   
  // Load current profile data
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const currentProfile = await authService.getProfile();
        setProfile({
          full_name: currentProfile.full_name || '',
          organization: currentProfile.organization || '',
          usage_purpose: currentProfile.usage_purpose || ''
        });
      } catch (error) {
        console.error('Error loading profile:', error);
        Alert.alert('Error', 'Failed to load profile data');
      } finally {
        setIsLoading(false);
      }
    };

    loadProfile();
  }, []);

  const handleSubmit = async () => {
    if (!profile.full_name.trim()) {
      Alert.alert('Validation Error', 'Full name is required');
      return;
    }

    setIsSubmitting(true);
    try {
      await authService.updateProfile(profile);
      Alert.alert('Success', 'Profile updated successfully', [
        { text: 'OK', onPress: () =>  router.push('/(tabs)/profile')  }
      ]);
    // Redirect to profile page after successful update
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', 'Failed to update profile');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 p-4 bg-gray-50">
      <View className="mb-6">
        <Text className="text-lg font-bold mb-4">Edit Profile</Text>
        
        <View className="mb-4">
          <Text className="mb-2 font-medium">Full Name</Text>
          <TextInput
            mode="outlined"
            value={profile.full_name}
            onChangeText={(text) => setProfile({...profile, full_name: text})}
            placeholder="Enter your full name"
          />
        </View>

        <View className="mb-4">
          <Text className="mb-2 font-medium">Organization</Text>
          <TextInput
            mode="outlined"
            value={profile.organization}
            onChangeText={(text) => setProfile({...profile, organization: text})}
            placeholder="Enter your organization"
          />
        </View>

        <View className="mb-6">
          <Text className="mb-2 font-medium">Usage Purpose</Text>
          <TextInput
            mode="outlined"
            value={profile.usage_purpose}
            onChangeText={(text) => setProfile({...profile, usage_purpose: text})}
            placeholder="Describe how you'll use this app"
            multiline
            numberOfLines={3}
          />
        </View>

        <Button
          mode="contained"
          onPress={handleSubmit}
          loading={isSubmitting}
          disabled={isSubmitting}
          className="rounded-lg py-2"
        >
          Save Changes
        </Button>
      </View>
    </ScrollView>
  );
}