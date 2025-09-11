import React from 'react';
import { View } from 'react-native';
import AdminDashboard from '../components/AdminDashboard';

const AdminScreen: React.FC = () => {
  return (
    <View className="flex-1">
      <AdminDashboard />
    </View>
  );
};

export default AdminScreen;
