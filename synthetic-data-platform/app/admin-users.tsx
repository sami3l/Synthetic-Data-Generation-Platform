import React from 'react';
import { View } from 'react-native';
import UserManagement from '../components/UserManagement';

const AdminUsersScreen: React.FC = () => {
  return (
    <View className="flex-1">
      <UserManagement />
    </View>
  );
};

export default AdminUsersScreen;
