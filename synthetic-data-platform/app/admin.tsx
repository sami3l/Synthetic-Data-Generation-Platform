import React from 'react';
import { View } from 'react-native';
import AdminDashboard from '../components/AdminDashboard';

export default function AdminPage() {
  return (
    <View className="flex-1 bg-gray-50">
      <View className="flex-1 p-6 max-w-7xl mx-auto">
        <AdminDashboard />
      </View>
    </View>
  );
}
