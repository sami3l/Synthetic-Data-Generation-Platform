import React from 'react';
import { View } from 'react-native';
import AdminActionLogs from '../components/AdminActionLogs';

const AdminLogsScreen: React.FC = () => {
  return (
    <View className="flex-1">
      <AdminActionLogs />
    </View>
  );
};

export default AdminLogsScreen;
